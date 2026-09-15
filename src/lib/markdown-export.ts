import { flattenTreeForSidebar, type TreeNode } from "@/lib/doc-tree";

/**
 * Plain-text exports of the docs for LLMs and "copy page": the per-page
 * Markdown served at /docs/<slug>.md and the /docs/llms.txt index
 * (https://llmstxt.org format, modeled on pipedream.com/docs/llms.txt).
 */

/**
 * Slug for a /docs/<slug>.md request, or null when the path is not one.
 * Rejects empty segments and dot segments so the rewrite target is always a
 * well-formed /api/markdown/<slug>.
 */
export function markdownSlugFromPath(pathname: string): string | null {
  const match = /^\/docs\/(.+)\.md$/.exec(pathname);
  if (!match) return null;
  const slug = match[1];
  const segments = slug.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) return null;
  return slug;
}

export interface MarkdownDoc {
  title: string;
  description: string | null;
  body: string | null;
}

/** Markdown document for one page: title, description as a quote, body. */
export function renderDocMarkdown(doc: MarkdownDoc): string {
  const parts = [`# ${doc.title}`];
  const description = doc.description?.trim();
  if (description) parts.push(`> ${description.replace(/\n+/g, " ")}`);
  const body = (doc.body || "").trim();
  if (body) parts.push(body);
  return `${parts.join("\n\n")}\n`;
}

export interface LlmsTxtOptions {
  siteName: string;
  summary: string;
  /** Absolute origin + path prefix for page links, e.g. https://apiant.ai/docs */
  docsBaseUrl: string;
  /** Descriptions keyed by slug. Pages without one get a bare link. */
  descriptions: Map<string, string | null>;
}

/**
 * llms.txt body. Pages are listed flat in sidebar reading order (the same DFS
 * walk prev/next uses), like pipedream.com/docs/llms.txt. Links point at the
 * .md export of each page.
 */
export function buildLlmsTxt(tree: TreeNode[], options: LlmsTxtOptions): string {
  const lines: string[] = [`# ${options.siteName}`, "", `> ${options.summary}`, ""];
  const flat = flattenTreeForSidebar(tree);
  if (flat.length === 0) {
    lines.push("No published pages yet.", "");
    return lines.join("\n");
  }
  for (const node of flat) lines.push(llmsLine(node, options));
  lines.push("");
  return lines.join("\n");
}

function llmsLine(node: TreeNode, options: LlmsTxtOptions): string {
  const description = options.descriptions.get(node.slug)?.trim().replace(/\n+/g, " ");
  const link = `- [${escapeLinkText(node.title)}](${options.docsBaseUrl}/${node.slug}.md)`;
  return description ? `${link}: ${description}` : link;
}

function escapeLinkText(text: string): string {
  return text.replace(/[[\]]/g, (c) => `\\${c}`);
}
