import { fetchSiteDocs } from "@/lib/site-docs";
import { buildLlmsTxt } from "@/lib/markdown-export";
import { isApiantAiSite, siteName, siteOrigin } from "@/lib/site";

export const revalidate = 60;

// GET /docs/llms.txt — index of every published page in this site's scope,
// in sidebar order, linking to each page's Markdown export.
export async function GET() {
  const { docs, tree } = await fetchSiteDocs();
  const body = buildLlmsTxt(tree, {
    siteName: siteName(),
    summary: isApiantAiSite()
      ? "Documentation for APIANT.ai, the AI-first integration platform. Each link is the Markdown version of a page."
      : "Documentation for APIANT, the AI-first integration platform. Each link is the Markdown version of a page.",
    docsBaseUrl: `${siteOrigin()}/docs`,
    descriptions: new Map(docs.map((d) => [d.slug, d.description])),
  });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
