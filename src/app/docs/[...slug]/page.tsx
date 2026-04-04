import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Sidebar } from "@/components/sidebar";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const supabase = createServerClient();

  const { data } = await supabase
    .from("documents")
    .select("title, description")
    .eq("slug", fullSlug)
    .eq("status", "published")
    .single();

  if (!data) return { title: "Not Found | APIANT Docs" };

  return {
    title: `${data.title} | APIANT Docs`,
    description: data.description || undefined,
  };
}

export const revalidate = 60;

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const supabase = createServerClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("slug", fullSlug)
    .eq("status", "published")
    .single();

  if (!doc) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar currentSlug={fullSlug} />
      <main className="flex-1 max-w-4xl px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
              {doc.doc_type}
            </span>
            {doc.product && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {doc.product}
              </span>
            )}
            <span className="text-xs text-zinc-500">v{doc.version}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
          {doc.description && (
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{doc.description}</p>
          )}
        </div>
        <MarkdownRenderer content={doc.body} />
      </main>
    </div>
  );
}
