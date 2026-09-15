import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { buildTree, type FlatDoc } from "@/lib/doc-tree";
import { siteProduct } from "@/lib/site";

// apiant-ai zone: only its own pages. Classic mode keeps the full tree.
function siteRows(rows: FlatDoc[]): FlatDoc[] {
  const scoped = siteProduct();
  return scoped ? rows.filter((r) => r.product === scoped) : rows;
}

export const revalidate = 60;

// GET /api/docs/tree — returns full document hierarchy as nested tree
export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc("get_doc_tree");

  if (error) {
    // Fallback to direct query
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("documents")
      .select("id, slug, title, doc_type, product, parent_id, sort_order")
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    return NextResponse.json({ data: buildTree(siteRows(fallbackData || [])) });
  }

  return NextResponse.json({ data: buildTree(siteRows(data || [])) });
}
