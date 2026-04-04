import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Sanitize input for PostgREST filter strings
function sanitizeQuery(input: string): string {
  return input.replace(/[%_\\(),.*]/g, "");
}

// GET /api/search?q=query — full-text search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const product = searchParams.get("product");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query parameter 'q' is required (min 2 chars)" }, { status: 400 });
  }

  const supabase = createServerClient();
  const sanitized = sanitizeQuery(q.trim());

  // Full-text search on published documents using websearch
  let query = supabase
    .from("documents")
    .select("id, slug, title, description, doc_type, product")
    .eq("status", "published")
    .textSearch("title", sanitized, { type: "websearch" })
    .limit(limit);

  if (product) query = query.eq("product", sanitizeQuery(product));

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    // Fallback: use sanitized ilike on title + description only
    const safeQ = sanitized.replace(/'/g, "''");
    let fallback = supabase
      .from("documents")
      .select("id, slug, title, description, doc_type, product")
      .eq("status", "published")
      .or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
      .limit(limit);

    if (product) fallback = fallback.eq("product", sanitizeQuery(product));

    const { data: fallbackData, error: fallbackError } = await fallback;
    if (fallbackError) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
    return NextResponse.json({ data: fallbackData || [], count: fallbackData?.length || 0 });
  }

  return NextResponse.json({ data, count: data?.length || 0 });
}
