import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { PRODUCTS, APP_FAMILIES } from "@/lib/constants";
import { HomeSearchHero } from "@/components/home-search-hero";
import { UserMenu } from "@/components/user-menu";

export const revalidate = 60;

// SVG icons for product cards
const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  rocket: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  cpu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
      <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
    </svg>
  ),
  zap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  terminal: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  ),
};

// App family icons
const APP_ICONS: Record<string, React.ReactNode> = {
  crmconnect: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  shopconnect: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  ),
  zoomconnect: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  mailconnect: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  calendarconnect: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  appconnect: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" /><path d="m6.8 15-3.5 2" /><path d="m20.7 7-3.5 2" />
      <path d="M6.8 9 3.3 7" /><path d="m20.7 17-3.5-2" /><path d="M12 22v-4" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
};

export default async function Home() {
  const supabase = createServerClient();

  // Fetch top 15 tags by frequency
  const { data: allDocs } = await supabase
    .from("documents")
    .select("tags")
    .eq("status", "published")
    .not("tags", "is", null);

  const tagCounts: Record<string, number> = {};
  for (const doc of allDocs || []) {
    for (const tag of doc.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag]) => tag);

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
              style={{ height: "23px", width: "auto" }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "var(--accent-primary)",
                background: "var(--accent-primary-subtle)",
                padding: "2px 6px",
                borderRadius: "4px",
                marginLeft: "6px",
              }}
            >
              docs
            </span>
          </Link>
          <nav className="home-nav" style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", fontSize: "14px" }}>
            <Link href="/docs" className="home-nav-link">
              Docs
            </Link>
            <Link href="/api-reference" className="home-nav-link">
              API Reference
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-6)", width: "100%" }}>
        {/* 1. Hero section with search */}
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
              Build automations, connect APIs, and deploy integrations at scale.
            </p>
            <HomeSearchHero />
          </div>
        </div>

        {/* 2. Quick Start Cards — 3 persona entry points */}
        <section style={{ marginBottom: "var(--space-12)" }}>
          <h2 style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-6)",
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            Where do you want to start?
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "var(--space-6)",
          }}>
            {/* Persona A: Subscriber */}
            <Link href="/docs?product=api-apps" className="home-card persona-card">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "var(--radius-md)",
                  background: "rgba(26, 183, 89, 0.1)", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--accent-primary)",
                }}>
                  {APP_ICONS.shopconnect}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                  I have an API App subscription
                </h3>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "var(--space-4)", lineHeight: 1.5 }}>
                ShopConnect, ZoomConnect, CRMConnect, MailConnect, or CalendarConnect. Find setup guides, settings, and troubleshooting.
              </p>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <span className="persona-tag">Setup guides</span>
                <span className="persona-tag">Settings</span>
                <span className="persona-tag">Troubleshooting</span>
              </div>
            </Link>

            {/* Persona B: Builder */}
            <Link href="/docs?product=platform" className="home-card persona-card">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "var(--radius-md)",
                  background: "rgba(26, 183, 89, 0.1)", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--accent-primary)",
                }}>
                  {PRODUCT_ICONS.cpu}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                  I use the Automation Editor
                </h3>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "var(--space-4)", lineHeight: 1.5 }}>
                Build workflows with the drag-and-drop editor. Triggers, actions, field mappings, subroutines, forms, and AI chatbots.
              </p>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <span className="persona-tag">Automation editor</span>
                <span className="persona-tag">Key concepts</span>
                <span className="persona-tag">Triggers &amp; actions</span>
              </div>
            </Link>

            {/* Persona C: Integrator */}
            <Link href="/docs/apiant-for-builders" className="home-card persona-card">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "var(--radius-md)",
                  background: "rgba(26, 183, 89, 0.1)", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--accent-primary)",
                }}>
                  {PRODUCT_ICONS.terminal}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                  I use the Assembly Editor
                </h3>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "var(--space-4)", lineHeight: 1.5 }}>
                Build app connectors, API integrations, and modules. Module IDE, templates, deployment, and the platform SDK.
              </p>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <span className="persona-tag">Assembly editor</span>
                <span className="persona-tag">Module IDE</span>
                <span className="persona-tag">Templates</span>
              </div>
            </Link>
          </div>
        </section>

        {/* 3. Product Grid */}
        <section style={{ marginBottom: "var(--space-12)" }}>
          <h2 style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-6)",
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            Browse by product
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--space-4)",
          }}>
            {PRODUCTS.map((p) => (
              <Link
                key={p.key}
                href={`/docs?product=${p.key}`}
                className="home-card"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                  <span style={{ color: "var(--accent-primary)" }}>
                    {PRODUCT_ICONS[p.icon] || null}
                  </span>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {p.label}
                  </h3>
                </div>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{p.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. API Apps Grid */}
        <section style={{
          marginBottom: "var(--space-12)",
          padding: "var(--space-8)",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-primary)",
        }}>
          <h2 style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-6)",
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            API Apps
          </h2>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-6)",
          }}>
            {APP_FAMILIES.map((family) => (
              <div key={family.key} style={{ marginBottom: "var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-1)" }}>
                  <span style={{ color: "var(--accent-primary)" }}>
                    {APP_ICONS[family.key] || null}
                  </span>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                    {family.label}
                  </h3>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: "0 0 var(--space-3) 0", paddingLeft: "35px" }}>
                  {family.description}
                </p>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                  paddingLeft: "35px",
                }}>
                  {family.apps.map((app) => (
                    <Link
                      key={app.slug}
                      href={`/docs/${app.slug}`}
                      className="home-card-app-item"
                    >
                      {app.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Popular Topics */}
        {topTags.length > 0 && (
          <section style={{ marginBottom: "var(--space-12)" }}>
            <h2 style={{
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--text-tertiary)",
              marginBottom: "var(--space-6)",
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              Popular topics
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {topTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/docs?tag=${encodeURIComponent(tag)}`}
                  className="tag-pill-home"
                  style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    padding: "var(--space-2) var(--space-4)",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.15s, background 0.15s, border-color 0.15s",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 6. Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-primary)",
        padding: "var(--space-8) var(--space-6)",
        marginTop: "var(--space-12)",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-4)",
        }}>
          <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0 }}>
            &copy; {new Date().getFullYear()} APIANT. All rights reserved.
          </p>
          <nav style={{ display: "flex", gap: "var(--space-6)", fontSize: "13px" }}>
            <a href="https://apiant.com" className="home-nav-link" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>
              apiant.com
            </a>
            <Link href="/docs/contact-apiant-support" className="home-nav-link" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>
              Support
            </Link>
            <Link href="/docs/feature-requests" className="home-nav-link" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>
              Feature Requests
            </Link>
          </nav>
        </div>
      </footer>

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
        .home-card-app {
          background: var(--bg-secondary);
        }
        .home-card-app:hover {
          background: var(--bg-surface-hover);
          border-color: var(--accent-primary);
        }
        .home-card-app-item {
          display: inline-flex;
          padding: 5px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          text-decoration: none;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .home-card-app-item:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: var(--accent-primary-subtle);
        }
        .persona-card {
          position: relative;
          overflow: hidden;
        }
        .persona-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-primary);
          opacity: 0;
          transition: opacity 0.15s;
        }
        .persona-card:hover::before {
          opacity: 1;
        }
        .persona-tag {
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
        }
        .tag-pill-home:hover {
          color: var(--accent-primary) !important;
          background: var(--accent-primary-muted) !important;
          border-color: var(--accent-primary) !important;
        }
      `}</style>
    </div>
  );
}
