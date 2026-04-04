import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const revalidate = 60;

interface TreeNode {
  id: string;
  slug: string;
  title: string;
  doc_type: string;
  product: string | null;
  sort_order: number;
  children: TreeNode[];
}

interface FlatDoc {
  id: string;
  slug: string;
  title: string;
  doc_type: string;
  product: string | null;
  parent_id: string | null;
  sort_order: number;
}

function buildTree(docs: FlatDoc[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  const visited = new Set<string>(); // cycle detection

  // Create all nodes
  for (const doc of docs) {
    nodeMap.set(doc.id, {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      doc_type: doc.doc_type,
      product: doc.product,
      sort_order: doc.sort_order,
      children: [],
    });
  }

  // Build tree with cycle detection (max depth 10)
  for (const doc of docs) {
    const node = nodeMap.get(doc.id)!;
    if (doc.parent_id && nodeMap.has(doc.parent_id) && !visited.has(doc.id)) {
      // Check for circular reference
      let current: string | null = doc.parent_id;
      let depth = 0;
      let isCycle = false;
      while (current && depth < 10) {
        if (current === doc.id) { isCycle = true; break; }
        const parent = docs.find((d) => d.id === current);
        current = parent?.parent_id ?? null;
        depth++;
      }

      if (!isCycle) {
        nodeMap.get(doc.parent_id)!.children.push(node);
      } else {
        roots.push(node); // Break cycle by treating as root
      }
    } else {
      roots.push(node);
    }
    visited.add(doc.id);
  }

  // Sort children by sort_order at each level
  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    for (const node of nodes) {
      sortChildren(node.children);
    }
  }
  sortChildren(roots);

  return roots;
}

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

    return NextResponse.json({ data: buildTree(fallbackData || []) });
  }

  return NextResponse.json({ data: buildTree(data || []) });
}
