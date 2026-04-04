import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { PRODUCTS } from "@/lib/constants";
import { HomeSearchHero } from "@/components/home-search-hero";

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
      <header
        style={{
          borderBottom: "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "var(--space-4) var(--space-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              gap: "6px",
            }}
          >
            <img
              src="/apiant-logo.svg"
              alt="APIANT"
              style={{ height: "22px", width: "auto" }}
            />
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-tertiary)", marginLeft: "4px" }}>
              Docs
            </span>
          </Link>
          <nav className="home-nav" style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", fontSize: "14px" }}>
            <Link href="/docs" className="home-nav-link">
              Docs
            </Link>
            <Link href="/api/docs" className="home-nav-link">
              API Reference
            </Link>
          </nav>
        </div>
        <style>{`
          .home-nav-link {
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.1s;
          }
          .home-nav-link:hover {
            color: var(--text-primary);
          }
          .home-card {
            display: block;
            padding: var(--space-6);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-primary);
            text-decoration: none;
            color: inherit;
            transition: border-color 0.15s, background 0.15s;
          }
          .home-card:hover {
            border-color: var(--border-hover);
            background: var(--bg-surface);
          }
          .home-card-compact {
            padding: var(--space-4);
            border-radius: var(--radius-md);
          }
        `}</style>
      </header>

      <main style={{ flex: 1, maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-6)", width: "100%" }}>
        {/* Hero section with search */}
        <div style={{ paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)" }}>
          <div style={{ maxWidth: "640px", marginBottom: "var(--space-8)" }}>
            <h1 style={{
              fontSize: "40px",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              marginBottom: "var(--space-4)",
              color: "var(--text-primary)",
            }}>
              APIANT Documentation
            </h1>
            <p style={{
              fontSize: "18px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: "var(--space-6)",
            }}>
              The AI-first integration platform. Build automations, connect APIs, and deploy integrations at scale.
            </p>
            <HomeSearchHero />
          </div>
        </div>

        {/* Product cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-6)",
          marginBottom: "var(--space-12)",
        }}>
          {PRODUCTS.map((p) => (
            <Link
              key={p.key}
              href={`/docs?product=${p.key}`}
              className="home-card"
            >
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-2)", color: "var(--text-primary)" }}>
                {p.label}
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{p.description}</p>
            </Link>
          ))}
        </div>

        {/* Recent docs */}
        {docs && docs.length > 0 && (
          <div style={{ marginBottom: "var(--space-12)" }}>
            <h2 style={{
              fontSize: "24px",
              fontWeight: 600,
              marginBottom: "var(--space-6)",
              color: "var(--text-primary)",
            }}>
              Recent Documentation
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {docs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className="home-card home-card-compact"
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
                      {doc.doc_type}
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
                        {doc.product}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontWeight: 500, marginTop: "var(--space-2)", fontSize: "15px", color: "var(--text-primary)" }}>
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                      {doc.description}
                    </p>
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
