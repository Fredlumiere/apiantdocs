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
