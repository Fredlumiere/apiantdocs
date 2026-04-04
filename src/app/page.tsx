import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { PRODUCTS } from "@/lib/constants";

export const revalidate = 60;

export default async function Home() {
  const supabase = createServerClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("slug, title, description, doc_type, product")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .limit(20);

  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">APIANT Docs</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/docs" className="hover:text-zinc-600 dark:hover:text-zinc-300">All Docs</Link>
            <Link href="/api/docs" className="hover:text-zinc-600 dark:hover:text-zinc-300">API</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="max-w-2xl mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">APIANT Documentation</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            The AI-first integration platform. Build automations, connect APIs, and deploy integrations at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PRODUCTS.map((p) => (
            <Link
              key={p.key}
              href={`/docs?product=${p.key}`}
              className="block p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              <h2 className="text-lg font-semibold mb-2">{p.label}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{p.description}</p>
            </Link>
          ))}
        </div>

        {docs && docs.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Recent Documentation</h2>
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
          </div>
        )}
      </main>
    </div>
  );
}
