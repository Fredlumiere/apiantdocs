import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { fetchSiteDocs, scopeToSite } from "@/lib/site-docs";

const cardStyles = `
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
`;

/**
 * /docs landing for the apiant.ai site: the top-level sections of the
 * sidebar as cards, or a tag listing when ?tag= is set. Every read is scoped
 * to product 'apiant-ai'.
 */
export async function ApiantAiDocsIndex({ tag }: { tag?: string }) {
  if (tag) return <TaggedList tag={tag} />;

  const { docs, tree } = await fetchSiteDocs();
  const descriptions = new Map(docs.map((d) => [d.slug, d.description]));

  return (
    <main
      id="main-content"
      style={{ flex: 1, maxWidth: "960px", padding: "var(--space-8) var(--space-4)" }}
    >
      <section style={{ marginBottom: "var(--space-12)" }}>
        <h1
          style={{
            fontSize: "38px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginBottom: "var(--space-4)",
            color: "var(--text-primary)",
          }}
        >
          APIANT.ai Docs
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "16px",
            lineHeight: 1.5,
            maxWidth: "60ch",
          }}
        >
          Guides and reference for APIANT.ai. Search with ⌘K, or ask a question with Ask AI.
        </p>
      </section>

      {tree.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)" }}>No published documents yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {tree.map((node) => (
            <Link key={node.id} href={`/docs/${node.slug}`} className="doc-list-card">
              <h2
                style={{
                  fontWeight: 600,
                  fontSize: "15px",
                  color: "var(--text-primary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {node.title}
              </h2>
              {descriptions.get(node.slug) && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {descriptions.get(node.slug)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
      <style>{cardStyles}</style>
    </main>
  );
}

async function TaggedList({ tag }: { tag: string }) {
  const supabase = createServerClient();
  const { data } = await scopeToSite(
    supabase
      .from("documents")
      .select("slug, title, description, tags")
      .eq("status", "published")
      .contains("tags", [tag])
  ).order("sort_order", { ascending: true });
  const docs = (data || []) as { slug: string; title: string; description: string | null; tags: string[] | null }[];

  return (
    <main
      id="main-content"
      style={{ flex: 1, maxWidth: "var(--content-max-width)", padding: "var(--space-8) var(--space-4)" }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: "var(--space-2)",
          color: "var(--text-primary)",
        }}
      >
        Tagged: {tag}
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "var(--space-8)" }}>
        {docs.length} documents · <Link href="/docs" style={{ color: "var(--accent-primary)" }}>clear filter</Link>
      </p>
      {docs.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)" }}>No published documents yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {docs.map((doc) => (
            <Link key={doc.slug} href={`/docs/${doc.slug}`} className="doc-list-card">
              <h2 style={{ fontWeight: 500, fontSize: "15px", color: "var(--text-primary)" }}>{doc.title}</h2>
              {doc.description && (
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>{doc.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
      <style>{cardStyles}</style>
    </main>
  );
}
