import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { TagList } from "@/components/tag-list";
import { DOC_TYPE_LABELS, PRODUCT_LABELS, APP_FAMILIES } from "@/lib/constants";

const QUICK_START_CARDS: { slug: string; title: string; description: string }[] = [
  {
    slug: "get-started/install",
    title: "Install the Plugin",
    description:
      "Install the Claude Code plugin, verify your environment, and authenticate to your APIANT sandbox.",
  },
  {
    slug: "get-started/hello-world",
    title: "Your First Integration",
    description:
      "Ship a working webhook automation in 5–10 minutes. No API keys, no OAuth — just plugin mechanics.",
  },
  {
    slug: "understanding-apiant",
    title: "How APIANT Works",
    description:
      "The conceptual model behind automations, assemblies, connectors, and integration suites.",
  },
  {
    slug: "building-with-the-plugin",
    title: "Building with the Plugin",
    description:
      "Build, edit, test, and deploy automations and assemblies — the everyday surface for working with APIANT through Claude Code.",
  },
];

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

  const heading = tag
    ? `Tagged: ${tag}`
    : product
      ? `${PRODUCT_LABELS[product] || product} Documentation`
      : "Documentation";

  // API Apps landing — show app families with individual apps
  if (product === "api-apps" && !tag) {
    // Count docs per app slug
    const docsBySlug: Record<string, number> = {};
    for (const d of docs || []) {
      const prefix = d.slug.split("/")[0];
      docsBySlug[prefix] = (docsBySlug[prefix] || 0) + 1;
    }

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
          API Apps
        </h1>
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "15px",
          marginBottom: "var(--space-8)",
          maxWidth: "60ch",
          lineHeight: 1.5,
        }}>
          Pre-built integration products connecting your favorite platforms. Choose your integration to find setup guides, configuration, and troubleshooting.
        </p>

        {APP_FAMILIES.map((family) => (
          <div key={family.key} style={{ marginBottom: "var(--space-8)" }}>
            <h2 style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "var(--space-2)",
            }}>
              {family.label}
            </h2>
            <p style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginBottom: "var(--space-4)",
              lineHeight: 1.5,
            }}>
              {family.description}
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "var(--space-3)",
            }}>
              {family.apps.map((app) => {
                const count = docsBySlug[app.slug] || 0;
                const hasDoc = count > 0;
                return hasDoc ? (
                  <Link
                    key={app.slug}
                    href={`/docs/${app.slug}`}
                    className="app-card"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                      <span className="app-arrow">→</span>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                        {app.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                        {app.source} → {app.destination}
                      </span>
                      <span style={{
                        fontSize: "11px",
                        fontFamily: "var(--font-geist-mono), monospace",
                        color: "var(--accent-primary)",
                      }}>
                        {count} {count === 1 ? "doc" : "docs"}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div key={app.slug} className="app-card app-card-empty">
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                      <span className="app-arrow" style={{ opacity: 0.3 }}>→</span>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-tertiary)" }}>
                        {app.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-disabled)" }}>Coming soon</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <Link
          href="/docs"
          style={{
            fontSize: "13px",
            color: "var(--accent-primary)",
            textDecoration: "none",
          }}
        >
          ← Back to all docs
        </Link>

        <style>{`
          .app-card {
            display: block;
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-primary);
            text-decoration: none;
            color: inherit;
            transition: border-color 0.15s, background 0.15s;
          }
          .app-card:hover {
            border-color: var(--accent-primary);
            background: var(--bg-surface);
          }
          .app-card-empty {
            opacity: 0.5;
            cursor: default;
          }
          .app-card-empty:hover {
            border-color: var(--border-primary);
            background: transparent;
          }
          .app-arrow {
            color: var(--accent-primary);
            font-weight: 600;
          }
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
            border-color: var(--accent-primary);
            background: var(--bg-surface);
          }
        `}</style>
      </main>
    );
  }

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
              <div key={doc.slug} className="doc-list-card">
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
                <h3 style={{ fontWeight: 500, marginTop: "var(--space-2)", fontSize: "15px" }}>
                  <Link href={`/docs/${doc.slug}`} className="doc-list-card-title">
                    {doc.title}
                  </Link>
                </h3>
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
              </div>
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
            transition: border-color 0.15s, background 0.15s;
          }
          .doc-list-card:hover {
            border-color: var(--border-hover);
            background: var(--bg-surface);
          }
          .doc-list-card-title {
            color: var(--text-primary);
            text-decoration: none;
            transition: color 0.15s;
          }
          .doc-list-card:hover .doc-list-card-title {
            color: var(--accent-primary);
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
      {/* Hero */}
      <section style={{ marginBottom: "var(--space-12)" }}>
        <h1 style={{
          fontSize: "38px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          marginBottom: "var(--space-4)",
          color: "var(--text-primary)",
          maxWidth: "24ch",
        }}>
          One prompt. Any integration. Claude Code drives the platform.
        </h1>
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "16px",
          lineHeight: 1.5,
          marginBottom: "var(--space-6)",
          maxWidth: "60ch",
        }}>
          APIANT is an iPaaS operable end-to-end by the Claude Code plugin. Build automations, register OAuth apps, and deploy to production from natural-language prompts.
        </p>
        <Link
          href="/docs/get-started/install"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            background: "var(--accent-primary)",
            color: "#0b0d0a",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
        >
          Install the Claude Code Plugin →
        </Link>
      </section>

      {/* Quick Start */}
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
          Quick Start
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
        }}>
          {QUICK_START_CARDS.map((card) => (
            <Link
              key={card.slug}
              href={`/docs/${card.slug}`}
              className="doc-list-card"
              style={{ padding: "var(--space-4)" }}
            >
              <h3 style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
                {card.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {card.description}
              </p>
            </Link>
          ))}
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
