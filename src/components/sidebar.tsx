import Link from "next/link";
import { createServerClient } from "@/lib/supabase";

interface SidebarDoc {
  slug: string;
  title: string;
  doc_type: string;
  product: string | null;
  parent_id: string | null;
  sort_order: number;
}

export async function Sidebar({ currentSlug }: { currentSlug?: string }) {
  const supabase = createServerClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("slug, title, doc_type, product, parent_id, sort_order")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (!docs || docs.length === 0) {
    return (
      <nav className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-4">
        <p className="text-sm text-zinc-500">No documents yet.</p>
      </nav>
    );
  }

  // Group by product
  const grouped: Record<string, SidebarDoc[]> = {};
  for (const doc of docs) {
    const key = doc.product || "general";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(doc);
  }

  const productLabels: Record<string, string> = {
    platform: "Platform",
    "api-apps": "API Apps",
    mcp: "MCP",
    general: "General",
  };

  return (
    <nav className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto">
      <Link href="/" className="text-sm font-bold block mb-4">APIANT Docs</Link>
      {Object.entries(grouped).map(([product, items]) => (
        <div key={product} className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            {productLabels[product] || product}
          </h3>
          <ul className="space-y-1">
            {items.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/docs/${doc.slug}`}
                  className={`block text-sm px-2 py-1 rounded transition-colors ${
                    currentSlug === doc.slug
                      ? "bg-zinc-100 dark:bg-zinc-800 font-medium"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
