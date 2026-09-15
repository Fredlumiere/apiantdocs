import { createServerClient } from "@/lib/supabase";
import { scopeToSite } from "@/lib/site-docs";
import { isApiantAiSite, siteOrigin } from "@/lib/site";

export const revalidate = 3600;

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// GET /api/sitemap, public as /docs/sitemap.xml on the apiant.ai site (rewrite
// in next.config.ts). The classic site has no sitemap: there is no rewrite,
// /docs/sitemap.xml stays the doc 404 page, and this handler answers 404.
export async function GET() {
  if (!isApiantAiSite()) {
    return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const supabase = createServerClient();
  const { data } = await scopeToSite(
    supabase.from("documents").select("slug, updated_at").eq("status", "published")
  ).order("sort_order", { ascending: true });

  const origin = siteOrigin();
  const urls = [
    `  <url><loc>${origin}/docs</loc></url>`,
    ...((data || []) as { slug: string; updated_at: string | null }[]).map((d) => {
      const lastmod = d.updated_at ? `<lastmod>${new Date(d.updated_at).toISOString()}</lastmod>` : "";
      return `  <url><loc>${xmlEscape(`${origin}/docs/${d.slug}`)}</loc>${lastmod}</url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
