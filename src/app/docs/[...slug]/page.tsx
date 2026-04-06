import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TableOfContents } from "@/components/table-of-contents";
import { extractHeadings } from "@/lib/extract-headings";
import { DocNav } from "@/components/doc-nav";
import { ChildCards } from "@/components/child-cards";
import { TagList } from "@/components/tag-list";
import { EditButton } from "@/components/edit-button";
import { DOC_TYPE_LABELS, PRODUCT_LABELS } from "@/lib/constants";
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

  // Fetch prev/next docs (same product, by sort_order)
  const { data: siblings } = await supabase
    .from("documents")
    .select("slug, title, sort_order")
    .eq("status", "published")
    .eq("product", doc.product || "")
    .order("sort_order", { ascending: true });

  let prevDoc: { slug: string; title: string } | null = null;
  let nextDoc: { slug: string; title: string } | null = null;

  if (siblings && siblings.length > 1) {
    const currentIndex = siblings.findIndex((s) => s.slug === fullSlug);
    if (currentIndex > 0) {
      prevDoc = { slug: siblings[currentIndex - 1].slug, title: siblings[currentIndex - 1].title };
    }
    if (currentIndex >= 0 && currentIndex < siblings.length - 1) {
      nextDoc = { slug: siblings[currentIndex + 1].slug, title: siblings[currentIndex + 1].title };
    }
  }

  // Fetch child documents
  const { data: childDocs } = await supabase
    .from("documents")
    .select("slug, title, description, doc_type")
    .eq("parent_id", doc.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  // Fetch related docs (share at least one tag, excluding self)
  const docTags: string[] = doc.tags || [];
  let relatedDocs: { slug: string; title: string; tags: string[] }[] = [];
  if (docTags.length > 0) {
    const { data: related } = await supabase
      .from("documents")
      .select("slug, title, tags")
      .eq("status", "published")
      .neq("id", doc.id)
      .overlaps("tags", docTags)
      .limit(5);
    relatedDocs = related || [];
  }

  // Clean body: strip Archbee JSX tags that don't render in Markdown
  const cleanBody = (doc.body || "")
    .replace(/<LinkArray[\s\S]*?<\/LinkArray>/gi, "")
    .replace(/<LinkArrayItem[\s\S]*?\/>/gi, "")
    .replace(/<Image[\s\S]*?(?:\/>|<\/Image>)/gi, "")
    .replace(/<Callout[\s\S]*?<\/Callout>/gi, "")
    .trim();

  // Extract headings server-side for TOC
  const headings = extractHeadings(cleanBody);

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
              {doc.description}
            </p>
          )}
          {docTags.length > 0 && (
            <div style={{ marginTop: "var(--space-4)" }}>
              <TagList tags={docTags} />
            </div>
          )}
        </div>
        {cleanBody && <MarkdownRenderer content={cleanBody} />}

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
                <a
                  key={rd.slug}
                  href={`/docs/${rd.slug}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-3) var(--space-4)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    fontSize: "14px",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  className="related-doc-link"
                >
                  <span>{rd.title}</span>
                  <TagList tags={(rd.tags || []).filter((t: string) => docTags.includes(t))} compact />
                </a>
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
