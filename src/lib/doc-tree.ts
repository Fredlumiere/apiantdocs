export interface TreeNode {
  id: string;
  slug: string;
  title: string;
  doc_type: string;
  product: string | null;
  sort_order: number;
  children: TreeNode[];
}

export interface FlatDoc {
  id: string;
  slug: string;
  title: string;
  doc_type: string;
  product: string | null;
  parent_id: string | null;
  sort_order: number;
}

export function buildTree(docs: FlatDoc[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  const visited = new Set<string>();

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

  for (const doc of docs) {
    const node = nodeMap.get(doc.id)!;
    if (doc.parent_id && nodeMap.has(doc.parent_id) && !visited.has(doc.id)) {
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
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
    visited.add(doc.id);
  }

  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    for (const node of nodes) {
      sortChildren(node.children);
    }
  }
  sortChildren(roots);

  return roots;
}

// Sidebar-mirroring constants. Keep in sync with sidebar-tree.tsx so prev/next
// walks the exact same order the reader sees in the sidebar.
const PRODUCT_ORDER = ["getting-started", "platform", "platform-ui", "mcp", "api-apps", "general"];
const ALPHA_PRODUCTS = new Set(["api-apps"]);

// Flatten the full sidebar tree into a DFS-ordered list — the same reading
// order a user gets by clicking through the sidebar top-to-bottom. Used for
// prev/next so the bottom-of-page navigation matches sidebar position.
//
// The full tree must be passed (not a per-product slice) because the sidebar
// can nest cross-product pages under a parent — e.g., the platform-ui page
// "Automations" (slug: automation-editor/key-concepts) is rendered under the
// platform-section parent "The Four Core Objects". A per-product flatten would
// break the prev/next chain across those nesting points.
export function flattenTreeForSidebar(roots: TreeNode[]): TreeNode[] {
  // Group roots by product, mirroring sidebar-tree.tsx's grouping.
  const grouped: Record<string, TreeNode[]> = {};
  for (const node of roots) {
    const key = node.product || "general";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(node);
  }

  // ALPHA_PRODUCTS get root-level alphabetization by title; everything else
  // keeps DB sort_order (already applied by buildTree).
  for (const key of Object.keys(grouped)) {
    if (ALPHA_PRODUCTS.has(key)) {
      grouped[key].sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  // Walk products in pinned order, then any unknowns in their natural order.
  const orderedGroups: TreeNode[][] = [
    ...PRODUCT_ORDER.filter((k) => grouped[k]).map((k) => grouped[k]),
    ...Object.entries(grouped).filter(([k]) => !PRODUCT_ORDER.includes(k)).map(([, v]) => v),
  ];

  const out: TreeNode[] = [];
  function walk(node: TreeNode) {
    out.push(node);
    for (const child of node.children) {
      walk(child);
    }
  }
  for (const group of orderedGroups) {
    for (const node of group) {
      walk(node);
    }
  }
  return out;
}
