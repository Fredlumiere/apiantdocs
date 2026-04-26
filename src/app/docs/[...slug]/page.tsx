import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { MdxRenderer } from "@/components/mdx-renderer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TableOfContents } from "@/components/table-of-contents";
import { extractHeadings } from "@/lib/extract-headings";
import { DocNav } from "@/components/doc-nav";
import { ChildCards } from "@/components/child-cards";
import { TagList } from "@/components/tag-list";
import { EditButton } from "@/components/edit-button";
import { DOC_TYPE_LABELS, PRODUCT_LABELS } from "@/lib/constants";
import { buildTree, flattenTreeForSidebar, type FlatDoc } from "@/lib/doc-tree";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const supabase = createServerClient();

  const { data } = await supabase
    .from("documents")
    .select("title, description")
    .eq("slug", fullSlug)
    .eq("status", "published")
    .single();

  if (!data) return { title: "Not Found | APIANT Docs" };

  return {
    title: `${data.title} | APIANT Docs`,
    description: data.description || undefined,
  };
}

export const revalidate = 60;

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const supabase = createServerClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("slug", fullSlug)
    .eq("status", "published")
    .single();

  if (!doc) notFound();

  // Fetch parent doc title/slug for breadcrumbs
  let parentTitle: string | null = null;
  let parentSlug: string | null = null;
  if (doc.parent_id) {
    const { data: parent } = await supabase
      .from("documents")
      .select("title, slug")
      .eq("id", doc.parent_id)
      .single();
    if (parent) {
      parentTitle = parent.title;
      parentSlug = parent.slug;
    }
  }

  // Fetch prev/next by walking the full sidebar tree (DFS). Earlier this used
  // a flat sort_order query scoped to product, which produced wrong neighbors
  // when the sidebar grouped pages under parents (e.g. "Install the Plugin"
  // got "The Four Core Objects" as Previous), and missed cross-product nesting
  // (Automations and Assemblies live in platform-ui but render under
  // platform's "The Four Core Objects" via parent_id).
  const { data: allDocs } = await supabase
    .from("documents")
    .select("id, slug, title, doc_type, product, parent_id, sort_order")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  const fullTree = buildTree((allDocs as FlatDoc[]) || []);
  const flat = flattenTreeForSidebar(fullTree);

  let prevDoc: { slug: string; title: string } | null = null;
  let nextDoc: { slug: string; title: string } | null = null;

  if (flat.length > 1) {
    const currentIndex = flat.findIndex((n) => n.slug === fullSlug);
    if (currentIndex > 0) {
      prevDoc = { slug: flat[currentIndex - 1].slug, title: flat[currentIndex - 1].title };
    }
    if (currentIndex >= 0 && currentIndex < flat.length - 1) {
      nextDoc = { slug: flat[currentIndex + 1].slug, title: flat[currentIndex + 1].title };
    }
  }

  // Fetch child documents
  const { data: childDocs } = await supabase
    .from("documents")
    .select("slug, title, description, doc_type")
    .eq("parent_id", doc.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  // Related docs — semantic similarity over body embeddings, scoped to same product.
  // Tag overlap was too noisy on broad tags like "automation"; cosine on the body's
  // first chunk picks up genuine topical neighbors.
  const docTags: string[] = doc.tags || [];
  let relatedDocs: { slug: string; title: string; tags: string[] }[] = [];
  {
    const { data: srcEmb } = await supabase
      .from("doc_embeddings")
      .select("embedding")
      .eq("document_id", doc.id)
      .order("chunk_index", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (srcEmb?.embedding) {
      const { data: matches } = await supabase.rpc("match_doc_embeddings", {
        query_embedding: typeof srcEmb.embedding === "string" ? srcEmb.embedding : JSON.stringify(srcEmb.embedding),
        match_count: 50,
        filter_product: doc.product,
      });
      // Dedupe by document_id (multiple chunks per doc), drop self, keep highest similarity per doc.
      const byDoc = new Map<string, { slug: string; title: string; similarity: number }>();
      for (const m of (matches || []) as Array<{ document_id: string; slug: string; title: string; similarity: number }>) {
        if (m.document_id === doc.id) continue;
        const prev = byDoc.get(m.document_id);
        if (!prev || m.similarity > prev.similarity) {
          byDoc.set(m.document_id, { slug: m.slug, title: m.title, similarity: m.similarity });
        }
      }
      // Only show as "related" if similarity clears 0.55 — voyage-3 cosine on truly related
      // docs scores 0.6+; anything lower is shared vocabulary, not shared topic.
      const RELATED_THRESHOLD = 0.55;
      const ranked = [...byDoc.values()]
        .filter((d) => d.similarity >= RELATED_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
      if (ranked.length > 0) {
        const slugs = ranked.map((r) => r.slug);
        const { data: tagged } = await supabase
          .from("documents")
          .select("slug, tags")
          .in("slug", slugs);
        const tagMap = new Map<string, string[]>((tagged || []).map((t: { slug: string; tags: string[] | null }) => [t.slug, t.tags || []]));
        relatedDocs = ranked.map((r) => ({
          slug: r.slug,
          title: r.title,
          tags: tagMap.get(r.slug) || [],
        }));
      }
    }
  }

  // MDX render path — documents with render_mode='mdx' get the React-component
  // pipeline. Skip all the markdown cleanBody transforms (which would mangle
  // JSX components like <SkillCard>) and skip TOC extraction (not reliable over
  // JSX). The branch uses doc.body raw.
  const isMdx = doc.render_mode === "mdx";

  // Clean body: transform Archbee JSX tags into forms react-markdown can render.
  // Archbee <hint> blocks use MDX indentation (no closing tag): content is 2-space
  // indented; block ends at the first non-indented, non-blank line.
  const transformHint = (match: string, type: string, content: string) => {
    const variant = (type || "info").toLowerCase();
    const normalized = ["info", "note"].includes(variant) ? "info"
      : ["warning", "warn"].includes(variant) ? "warning"
      : ["danger", "error"].includes(variant) ? "danger"
      : ["success", "tip"].includes(variant) ? "success"
      : "info";
    const cleaned = content
      .split("\n")
      .map((line: string) => line.replace(/^ {2}/, ""))
      .join("\n")
      .trim();
    return `\n\n<div class="callout callout-${normalized}">\n\n${cleaned}\n\n</div>\n\n`;
  };

  // Branch early: MDX docs bypass all markdown transforms below. The regex
  // sweeps (LinkArray, Image, script, hint) would shred JSX components like
  // <SkillCard name=... title=...>. MDX content is handed to the MDX renderer
  // raw; components are resolved via src/components/mdx-renderer.tsx.
  let finalBody: string;
  if (isMdx)
  {
    finalBody = (doc.body || "").trim();
  }
  else
  {
  // Markdown pipeline — unchanged from the pre-MDX behavior.
  // Pull fenced code blocks out to placeholders first so prose-level transforms
  // (like the <script> safety wrap below) don't mangle already-fenced content.
  const codeBlocks: string[] = [];
  const withPlaceholders = (doc.body || "").replace(/```[\s\S]*?```/g, (m: string) => {
    codeBlocks.push(m);
    return ` CODEBLOCK${codeBlocks.length - 1} `;
  });

  finalBody = withPlaceholders
    .replace(/<LinkArray[\s\S]*?<\/LinkArray>/gi, "")
    .replace(/<LinkArrayItem[\s\S]*?\/>/gi, "")
    .replace(/<Image[\s\S]*?(?:\/>|<\/Image>)/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, (m: string) => `\n\n\`\`\`html\n${m}\n\`\`\`\n\n`)
    .replace(
      /<hint\s+type="(\w+)"[^>]*>((?:\n  [^\n]*|\n[ \t]*(?=\n))+)/gi,
      transformHint
    )
    .replace(
      /<hint\s+style="(\w+)"[^>]*>((?:\n  [^\n]*|\n[ \t]*(?=\n))+)/gi,
      transformHint
    )
    // Remove any stray closing tags from docs that did use them
    .replace(/<\/hint>/gi, "")
    // Restore the original fenced code blocks
    .replace(/ CODEBLOCK(\d+) /g, (_: string, i: string) => codeBlocks[parseInt(i, 10)])
    .trim();
  }

  // Extract headings server-side for TOC. The regex extractor is markdown-only;
  // JSX would confuse it, so MDX docs skip TOC (empty array = TOC hidden).
  const headings = isMdx ? [] : extractHeadings(finalBody);

  // Auto-link URLs in plain text (for descriptions). External links open in a new tab.
  const renderWithLinks = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s)]+)/g);
    return parts.map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-primary)", textDecoration: "underline" }}
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  // Format last updated
  const updatedAt = doc.updated_at
    ? new Date(doc.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div style={{
      display: "flex",
      flex: 1,
      gap: "var(--space-8)",
      maxWidth: "calc(var(--content-max-width) + var(--toc-width) + 64px)",
      width: "100%",
    }}>
      <main style={{
        flex: 1,
        minWidth: 0,
        maxWidth: "var(--content-max-width)",
        padding: "var(--space-8) var(--space-4)",
      }}>
        <Breadcrumbs
          slug={fullSlug}
          title={doc.title}
          product={doc.product}
          parentTitle={parentTitle}
          parentSlug={parentSlug}
        />

        <div style={{ marginBottom: "var(--space-8)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <span style={{
              fontSize: "12px",
              fontFamily: "var(--font-geist-mono), monospace",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-primary-muted)",
              color: "var(--accent-primary)",
            }}>
              {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
            </span>
            {doc.product && (
              <span style={{
                fontSize: "12px",
                fontFamily: "var(--font-geist-mono), monospace",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
              }}>
                {PRODUCT_LABELS[doc.product] || doc.product}
              </span>
            )}
            <span style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              v{doc.version}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
            <h1 style={{
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}>
              {doc.title}
            </h1>
            <EditButton slug={fullSlug} />
          </div>
          {doc.description && (
            <p style={{
              marginTop: "var(--space-2)",
              fontSize: "18px",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}>
              {renderWithLinks(doc.description)}
            </p>
          )}
          {docTags.length > 0 && (
            <div style={{ marginTop: "var(--space-4)" }}>
              <TagList tags={docTags} />
            </div>
          )}
        </div>
        {finalBody && (isMdx
          ? <MdxRenderer content={finalBody} />
          : <MarkdownRenderer content={finalBody} />
        )}

        {/* Child document cards */}
        {childDocs && childDocs.length > 0 && (
          <ChildCards children={childDocs} />
        )}

        {/* Related docs */}
        {relatedDocs.length > 0 && (
          <div style={{
            marginTop: "var(--space-8)",
            paddingTop: "var(--space-6)",
            borderTop: "1px solid var(--border-primary)",
          }}>
            <h2 style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "var(--space-4)",
              fontFamily: "var(--font-geist-mono), monospace",
              letterSpacing: "0.02em",
            }}>
              Related docs
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {relatedDocs.map((rd) => (
                <div
                  key={rd.slug}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-3) var(--space-4)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-primary)",
                    fontSize: "14px",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  className="related-doc-link"
                >
                  <a
                    href={`/docs/${rd.slug}`}
                    style={{
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      flex: 1,
                    }}
                  >
                    {rd.title}
                  </a>
                  <TagList tags={(rd.tags || []).filter((t: string) => docTags.includes(t))} compact />
                </div>
              ))}
            </div>
            <style>{`
              .related-doc-link:hover {
                border-color: var(--border-hover) !important;
                background: var(--bg-surface) !important;
              }
            `}</style>
          </div>
        )}

        {/* Prev/Next navigation */}
        <DocNav prev={prevDoc} next={nextDoc} />

        {/* Last updated */}
        {updatedAt && (
          <div style={{
            marginTop: "var(--space-8)",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--border-primary)",
            fontSize: "13px",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            Last updated {updatedAt}
          </div>
        )}
      </main>

      <TableOfContents headings={headings} />
    </div>
  );
}
