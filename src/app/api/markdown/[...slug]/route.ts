import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { scopeToSite } from "@/lib/site-docs";
import { renderDocMarkdown } from "@/lib/markdown-export";

export const revalidate = 60;

// Mirror the doc page's on-demand ISR: without generateStaticParams a dynamic
// route handler renders on every request (see the note in docs/[...slug]).
export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return [];
}

// GET /api/markdown/<slug>: raw Markdown of one published page in this
// site's scope. Public URL: /docs/<slug>.md (rewritten in middleware.ts).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const supabase = createServerClient();

  const { data } = await scopeToSite(
    supabase
      .from("documents")
      .select("title, description, body")
      .eq("slug", fullSlug)
      .eq("status", "published")
  ).maybeSingle();

  if (!data) {
    return new NextResponse("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(renderDocMarkdown(data), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
