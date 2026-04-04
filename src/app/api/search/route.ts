import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

function sanitizeQuery(input: string): string {
  return input.replace(/[%_\\(),.*]/g, "").slice(0, 200);
}

// GET /api/search?q=query&product=&limit=&mode=keyword|semantic|hybrid
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

  // Use the search_documents RPC for full-text search with ranking + snippets
  const { data, error } = await supabase.rpc("search_documents", {
    search_query: sanitized,
    filter_product: product || null,
    result_limit: limit,
  });

  if (error) {
    // Fallback to simple ilike if RPC fails (e.g., invalid websearch syntax)
    const safeQ = sanitized.replace(/'/g, "''");
    const { data: fallbackData } = await supabase
      .from("documents")
      .select("id, slug, title, description, doc_type, product")
      .eq("status", "published")
      .or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
      .limit(limit);

    return NextResponse.json({
      data: (fallbackData || []).map((d) => ({ ...d, snippet: null, rank: 0 })),
      count: fallbackData?.length || 0,
    });
  }

  return NextResponse.json({ data: data || [], count: data?.length || 0 });
}
