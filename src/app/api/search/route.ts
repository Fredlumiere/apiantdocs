import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/search?q=query — hybrid search (full-text + semantic)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const product = searchParams.get("product");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Full-text search on published documents
  let query = supabase
    .from("documents")
    .select("id, slug, title, description, doc_type, product")
    .eq("status", "published")
    .textSearch("title", q, { type: "websearch" })
    .limit(limit);

  if (product) query = query.eq("product", product);

  const { data, error } = await query;

  if (error) {
    // Fallback to ilike if websearch fails
    let fallback = supabase
      .from("documents")
      .select("id, slug, title, description, doc_type, product")
      .eq("status", "published")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(limit);

    if (product) fallback = fallback.eq("product", product);

    const { data: fallbackData, error: fallbackError } = await fallback;
    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }
    return NextResponse.json({ data: fallbackData, count: fallbackData?.length || 0 });
  }

  return NextResponse.json({ data, count: data?.length || 0 });
}
