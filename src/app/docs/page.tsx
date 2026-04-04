import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { TagList } from "@/components/tag-list";
import { DOC_TYPE_LABELS, PRODUCT_LABELS } from "@/lib/constants";

export const revalidate = 60;

export default async function DocsIndex({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; tag?: string }>;
}) {
  const { product, tag } = await searchParams;
  const supabase = createServerClient();

  let query = supabase
    .from("documents")
    .select("slug, title, description, doc_type, product, tags")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (product) query = query.eq("product", product);
  if (tag) query = query.contains("tags", [tag]);

  const { data: docs } = await query;

  const heading = tag
    ? `Tagged: ${tag}`
    : product
      ? `${PRODUCT_LABELS[product] || product} Documentation`
      : "All Documentation";

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
        {heading}
      </h1>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        marginBottom: "var(--space-8)",
      }}>
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "15px",
          margin: 0,
        }}>
          {docs?.length || 0} documents
        </p>

        {tag && (
          <Link
            href={product ? `/docs?product=${product}` : "/docs"}
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-geist-mono), monospace",
              padding: "2px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-primary-muted)",
              color: "var(--accent-primary)",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
          >
            clear filter
          </Link>
        )}
      </div>

      {docs && docs.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="doc-list-card"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
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
              {doc.tags && doc.tags.length > 0 && (
                <div style={{ marginTop: "var(--space-2)" }}>
                  <TagList tags={doc.tags} compact />
                </div>
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
