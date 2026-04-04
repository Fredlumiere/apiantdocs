import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";

// POST /api/chat — RAG chat over documentation
export async function POST(request: NextRequest) {
  const { question, product } = await request.json();

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "Chat not configured" }, { status: 503 });
  }

  const supabase = createServerClient();

  // Step 1: Find relevant documents via full-text search
  let searchQuery = supabase
    .from("documents")
    .select("id, slug, title, body")
    .eq("status", "published")
    .limit(5);

  // Try text search, fall back to ilike
  const { data: docs } = await searchQuery.or(
    `title.ilike.%${question}%,body.ilike.%${question}%`
  );

  if (!docs || docs.length === 0) {
    return NextResponse.json({
      answer: "I couldn't find any relevant documentation for your question. Try rephrasing or browsing the docs directly.",
      citations: [],
    });
  }

  // Step 2: Build context from relevant docs (truncate to fit context window)
  const context = docs
    .map((doc) => {
      const body = doc.body.length > 3000 ? doc.body.slice(0, 3000) + "..." : doc.body;
      return `## ${doc.title} (${doc.slug})\n${body}`;
    })
    .join("\n\n---\n\n");

  // Step 3: Ask Claude with the context
  const anthropic = new Anthropic({ apiKey: anthropicKey });

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
}
