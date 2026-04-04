import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";

export const revalidate = 60;

export default async function DocsIndex({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  const supabase = createServerClient();

  let query = supabase
    .from("documents")
    .select("slug, title, description, doc_type, product")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (product) query = query.eq("product", product);

  const { data: docs } = await query;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 max-w-4xl px-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {product ? `${product.charAt(0).toUpperCase() + product.slice(1)} Documentation` : "All Documentation"}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          {docs?.length || 0} documents
        </p>

        {docs && docs.length > 0 ? (
          <div className="space-y-3">
            {docs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                    {doc.doc_type}
                  </span>
                  {doc.product && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {doc.product}
                    </span>
                  )}
                </div>
                <h3 className="font-medium mt-2">{doc.title}</h3>
                {doc.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{doc.description}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">No published documents yet.</p>
        )}
      </main>
    </div>
  );
}
