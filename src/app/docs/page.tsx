import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { TagList } from "@/components/tag-list";
import { DOC_TYPE_LABELS, PRODUCT_LABELS, PRODUCTS, APP_FAMILIES } from "@/lib/constants";

export const revalidate = 60;

export default async function DocsIndex({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; tag?: string }>;
}) {
  const { product, tag } = await searchParams;
  const supabase = createServerClient();
  const isFiltered = !!(product || tag);

  let query = supabase
    .from("documents")
    .select("slug, title, description, doc_type, product, tags")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (product) query = query.eq("product", product);
  if (tag) query = query.contains("tags", [tag]);

  const { data: docs } = await query;

  // For unfiltered view, fetch popular tags
  let topTags: string[] = [];
  if (!isFiltered) {
    const tagCounts: Record<string, number> = {};
    for (const doc of docs || []) {
      for (const t of doc.tags || []) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([t]) => t);
  }

  // For unfiltered view, pick 4 getting-started entry-point docs
  let entryDocs: { slug: string; title: string; description: string | null }[] = [];
  if (!isFiltered && docs) {
    const entrySlugs = [
      "what-is-apiant",
      "automation-editor/key-concepts",
      "automation-editor/building-automations/your-first-automation",
      "assembly-editor/building-assemblies/your-first-assembly",
    ];
    for (const s of entrySlugs) {
      const found = docs.find((d) => d.slug === s);
      if (found) entryDocs.push({ slug: found.slug, title: found.title, description: found.description });
    }
    // If we didn't find enough, grab first few docs
    if (entryDocs.length < 3) {
      entryDocs = docs.slice(0, 4).map((d) => ({ slug: d.slug, title: d.title, description: d.description }));
    }
  }

  const heading = tag
    ? `Tagged: ${tag}`
    : product
      ? `${PRODUCT_LABELS[product] || product} Documentation`
      : "Documentation";

  // Filtered view — standard list
  if (isFiltered) {
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

          <Link
            href={product && !tag ? "/docs" : product ? `/docs?product=${product}` : "/docs"}
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

  // Unfiltered view — curated landing
  return (
    <main style={{
      flex: 1,
      maxWidth: "960px",
      padding: "var(--space-8) var(--space-4)",
    }}>
      <h1 style={{
        fontSize: "32px",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        marginBottom: "var(--space-2)",
        color: "var(--text-primary)",
      }}>
        Documentation
      </h1>
      <p style={{
        color: "var(--text-secondary)",
        fontSize: "15px",
        marginBottom: "var(--space-8)",
      }}>
        {docs?.length || 0} documents
      </p>

      {/* Getting Started section */}
      <section style={{ marginBottom: "var(--space-12)" }}>
        <h2 style={{
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color: "var(--text-tertiary)",
          marginBottom: "var(--space-4)",
          fontFamily: "var(--font-geist-mono), monospace",
        }}>
          Getting Started
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
        }}>
          {entryDocs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="doc-list-card"
              style={{ padding: "var(--space-4)" }}
            >
              <h3 style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
                {doc.title}
              </h3>
              {doc.description && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {doc.description.length > 120 ? doc.description.substring(0, 117) + "..." : doc.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by Product */}
      <section style={{ marginBottom: "var(--space-12)" }}>
        <h2 style={{
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color: "var(--text-tertiary)",
          marginBottom: "var(--space-4)",
          fontFamily: "var(--font-geist-mono), monospace",
        }}>
          Browse by Product
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-4)",
        }}>
          {PRODUCTS.map((p) => {
            const count = docs?.filter((d) => d.product === p.key).length || 0;
            return (
              <Link
                key={p.key}
                href={`/docs?product=${p.key}`}
                className="doc-list-card"
                style={{ padding: "var(--space-4)" }}
              >
                <h3 style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "4px" }}>
                  {p.label}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  {p.description}
                </p>
                {count > 0 && (
                  <span style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "var(--text-tertiary)",
                  }}>
                    {count} docs
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Browse by App */}
      <section style={{ marginBottom: "var(--space-12)" }}>
        <h2 style={{
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color: "var(--text-tertiary)",
          marginBottom: "var(--space-4)",
          fontFamily: "var(--font-geist-mono), monospace",
        }}>
          Browse by App
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-4)",
        }}>
          {APP_FAMILIES.map((app) => {
            const count = docs?.filter((d) => (d.tags || []).includes(app.key)).length || 0;
            return (
              <Link
                key={app.key}
                href={`/docs?tag=${app.key}`}
                className="doc-list-card"
                style={{ padding: "var(--space-4)" }}
              >
                <h3 style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "4px" }}>
                  {app.label}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  {app.description}
                </p>
                {count > 0 && (
                  <span style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "var(--text-tertiary)",
                  }}>
                    {count} docs
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular Tags */}
      {topTags.length > 0 && (
        <section style={{ marginBottom: "var(--space-12)" }}>
          <h2 style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-4)",
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            Popular Tags
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {topTags.map((t) => (
              <Link
                key={t}
                href={`/docs?tag=${encodeURIComponent(t)}`}
                className="tag-pill-docs"
                style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                {t}
              </Link>
            ))}
          </div>
        </section>
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
        .tag-pill-docs:hover {
          color: var(--accent-primary) !important;
          background: var(--accent-primary-muted) !important;
        }
      `}</style>
    </main>
  );
}
