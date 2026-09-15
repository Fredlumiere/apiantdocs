import type { TreeNode } from "@/lib/doc-tree";

/** A top-level docs section: a sidebar tree root and every slug under it. */
export interface DocSection {
  slug: string;
  title: string;
  /** Tab label; shorter than the title where the title is long. */
  label: string;
  /** The root's slug and every descendant's. */
  slugs: string[];
}

/** Short tab labels for long section titles, keyed by the root slug. */
const SHORT_LABELS: Record<string, string> = {
  assistant: "Assistant",
  mcp: "MCP",
  interfaces: "Forms & chat",
  apps: "Apps",
  account: "Account",
};

function collectSlugs(node: TreeNode, out: string[]): string[] {
  out.push(node.slug);
  for (const child of node.children) collectSlugs(child, out);
  return out;
}

/** Sections in sidebar order, one per tree root. */
export function docSections(tree: TreeNode[]): DocSection[] {
  return tree.map((root) => ({
    slug: root.slug,
    title: root.title,
    label: SHORT_LABELS[root.slug] ?? root.title,
    slugs: collectSlugs(root, []),
  }));
}

/** The section whose tree contains this page slug, or null (the docs home, or an unknown slug). */
export function sectionForSlug(sections: DocSection[], slug: string): DocSection | null {
  if (!slug) return null;
  return sections.find((s) => s.slugs.includes(slug)) ?? null;
}

/**
 * Page slug from a pathname: "/docs/automations/triggers" -> "automations/triggers".
 * Decoded, because an on-demand ISR render on Vercel reports a catch-all
 * segment as one encoded segment ("/docs/automations%2Ftriggers").
 */
export function slugFromPathname(pathname: string | null): string {
  let path = pathname || "";
  try {
    path = decodeURIComponent(path);
  } catch {
    // Malformed escape: match on the raw path.
  }
  return path.replace(/^\/docs\/?/, "").replace(/\/$/, "");
}
