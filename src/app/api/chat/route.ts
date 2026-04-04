import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";

// Simple in-memory rate limiter (per-process, resets on deploy)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

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

// Sanitize input for PostgREST filter strings
function sanitizeQuery(input: string): string {
  return input.replace(/[%_\\(),.*]/g, "").slice(0, 500);
}

// POST /api/chat — RAG chat over documentation
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before asking another question." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
    );
  }

  const body = await request.json();
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const product = typeof body.product === "string" ? body.product : undefined;

  if (!question || question.length < 3) {
    return NextResponse.json({ error: "Question is required (min 3 chars)" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "Chat not configured" }, { status: 503 });
  }

  const supabase = createServerClient();
  const sanitized = sanitizeQuery(question);

  // Find relevant documents using sanitized text search
  let searchQuery = supabase
    .from("documents")
    .select("id, slug, title, body")
    .eq("status", "published")
    .textSearch("title", sanitized, { type: "websearch" })
    .limit(5);

  if (product) searchQuery = searchQuery.eq("product", sanitizeQuery(product));

  let { data: docs } = await searchQuery;

  // Fallback to sanitized ilike if websearch returns nothing
  if (!docs || docs.length === 0) {
    const safeQ = sanitized.replace(/'/g, "''");
    const { data: fallbackDocs } = await supabase
      .from("documents")
      .select("id, slug, title, body")
      .eq("status", "published")
      .or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
      .limit(5);
    docs = fallbackDocs;
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({
      answer: "I couldn't find any relevant documentation for your question. Try rephrasing or browsing the docs directly.",
      citations: [],
    });
  }

  // Build context from relevant docs (truncate to fit context window)
  const context = docs
    .map((doc) => {
      const docBody = doc.body.length > 3000 ? doc.body.slice(0, 3000) + "..." : doc.body;
      return `## ${doc.title} (${doc.slug})\n${docBody}`;
    })
    .join("\n\n---\n\n");

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are a helpful documentation assistant for APIANT, an AI-first integration platform. Answer questions based on the provided documentation context. If the context doesn't contain enough information to answer, say so. Always cite which document(s) you're referencing. Be concise and direct.`,
      messages: [
        {
          role: "user",
          content: `Documentation context:\n\n${context}\n\n---\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer =
      message.content[0].type === "text" ? message.content[0].text : "";

    const citations = docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
    }));

    return NextResponse.json({ answer, citations });
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate response. Please try again." }, { status: 500 });
  }
}
