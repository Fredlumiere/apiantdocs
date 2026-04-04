import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { DOC_TYPE_LABELS, PRODUCT_LABELS } from "@/lib/constants";

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
    <main style={{
      flex: 1,
      maxWidth: "var(--content-max-width)",
      padding: "var(--space-8) var(--space-4)",
    }}>
      <h1 style={{
        fontSize: "32px",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        marginBottom: "var(--space-2)",
        color: "var(--text-primary)",
      }}>
        {product ? `${PRODUCT_LABELS[product] || product} Documentation` : "All Documentation"}
      </h1>
      <p style={{
        color: "var(--text-secondary)",
        marginBottom: "var(--space-8)",
        fontSize: "15px",
      }}>
        {docs?.length || 0} documents
      </p>

      {docs && docs.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="doc-list-card"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "var(--accent-primary-muted)",
                  color: "var(--accent-primary)",
                }}>
                  {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                </span>
                {doc.product && (
                  <span style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}>
                    {PRODUCT_LABELS[doc.product] || doc.product}
                  </span>
                )}
              </div>
              <h3 style={{ fontWeight: 500, marginTop: "var(--space-2)", fontSize: "15px" }}>{doc.title}</h3>
              {doc.description && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {doc.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--text-tertiary)" }}>No published documents yet.</p>
      )}

      <style>{`
        .doc-list-card {
          display: block;
          padding: var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s, background 0.15s;
        }
        .doc-list-card:hover {
          border-color: var(--border-hover);
          background: var(--bg-surface);
        }
      `}</style>
    </main>
  );
}
