import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import { corsHeaders } from "@/lib/cors";
import { semanticSearch } from "@/lib/embeddings";
import { effectiveProduct, isApiantAiSite } from "@/lib/site";
import { scopeForRequest } from "@/lib/site-docs";

export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 204 }));
}

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

function sanitizeQuery(input: string): string {
  return input
    .replace(/[%_\\;]/g, "")
    .replace(/[(){}[\]]/g, "")
    // Neutralize Postgres websearch_to_tsquery operators. A natural question can
    // contain a leading "-" (read as NOT), quotes (phrase match), or +/~/*/<>
    // that would otherwise exclude or distort results — e.g. pasting a title like
    // "...Appointments - Setup" made "-Setup" exclude the exact page being viewed.
    // Replace these with spaces so keyword search treats them as plain words.
    .replace(/["'<>~*+]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

// POST /api/chat — RAG chat over documentation
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateCheck = checkRateLimit(ip);

  // Purge expired entries to prevent memory leak
  if (rateLimiter.size > 1000) {
    const now = Date.now();
    for (const [key, entry] of rateLimiter) {
      if (now > entry.resetAt) rateLimiter.delete(key);
    }
  }
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before asking another question." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  // apiant-ai site: retrieval is always restricted to product 'apiant-ai'.
  const product = effectiveProduct(typeof body.product === "string" ? body.product : undefined) ?? undefined;

  if (!question || question.length < 3) {
    return NextResponse.json({ error: "Question is required (min 3 chars)" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "Chat not configured" }, { status: 503 });
  }

  const supabase = createServerClient();
  const sanitized = sanitizeQuery(question);

  // Hybrid retrieval: semantic (meaning-based) + full-text (keyword), merged.
  // Semantic gets the raw question (punctuation is fine for embeddings); keyword
  // gets the sanitized query. semanticSearch() returns [] on any failure (e.g.
  // VOYAGE_API_KEY unset or no embeddings yet), so retrieval degrades safely to
  // keyword-only — never worse than the previous behavior.
  const [semantic, keywordRes] = await Promise.all([
    semanticSearch(question, 5, product),
    supabase.rpc("search_documents", {
      search_query: sanitized,
      filter_product: product || null,
      result_limit: 5,
    }),
  ]);
  const keyword = (keywordRes.data as { id: string }[] | null) || [];

  // Ordered, de-duplicated document IDs: semantic hits first (they best capture
  // intent), then any keyword hits not already present.
  const orderedIds: string[] = [];
  for (const s of semantic) {
    if (!orderedIds.includes(s.document_id)) orderedIds.push(s.document_id);
  }
  for (const k of keyword) {
    if (!orderedIds.includes(k.id)) orderedIds.push(k.id);
  }
  if (orderedIds.length === 0) {
    return NextResponse.json({
      answer: "I couldn't find any relevant documentation for your question. Try rephrasing or browsing the docs directly.",
      citations: [],
    });
  }

  // Fetch full body for the candidates (published and in this site's scope),
  // preserving rank order, then keep the top 5. Scoping before the cut means
  // an out-of-scope hit never takes a slot from an in-scope one.
  const { data: fetched } = await scopeForRequest(
    supabase
      .from("documents")
      .select("id, slug, title, body")
      .eq("status", "published")
      .in("id", orderedIds),
    product
  );

  const fullDocs = (orderedIds
    .map((id) => (fetched || []).find((d) => d.id === id))
    .filter(Boolean) as { id: string; slug: string; title: string; body: string }[])
    .slice(0, 5);

  if (!fullDocs || fullDocs.length === 0) {
    return NextResponse.json({
      answer: "I found matching documents but couldn't retrieve their content. Please try again.",
      citations: [],
    });
  }

  // Build context with numbered citations
  const context = fullDocs
    .map((doc, i) => {
      const docBody = doc.body.length > 3000 ? doc.body.slice(0, 3000) + "..." : doc.body;
      return `[${i + 1}] ${doc.title} (slug: ${doc.slug})\n${docBody}`;
    })
    .join("\n\n---\n\n");

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  try {
    const message = await anthropic.messages.create({
      // Anthropic retired claude-sonnet-4-20250514; the API returned not_found
      // and every chat call ended as a 500 (issue #12). Current Sonnet id.
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: `You are a helpful documentation assistant for ${isApiantAiSite() ? "APIANT.ai" : "APIANT"}, an AI-first integration platform. Answer questions based on the provided documentation context. If the context doesn't contain enough information to answer, say so. Cite sources using [1], [2], etc. matching the numbered documents. Be concise and direct.`,
      messages: [
        {
          role: "user",
          content: `Documentation context:\n\n${context}\n\n---\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = message.content[0].type === "text" ? message.content[0].text : "";
    const citations = fullDocs.map((doc, i) => ({
      index: i + 1,
      slug: doc.slug,
      title: doc.title,
    }));

    return NextResponse.json({ answer, citations });
  } catch {
    return NextResponse.json({ error: "Failed to generate response. Please try again." }, { status: 500 });
  }
}
