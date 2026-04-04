import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TableOfContents, extractHeadings } from "@/components/table-of-contents";
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

  // Extract headings server-side for TOC
  const headings = extractHeadings(doc.body || "");

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
          <h1 style={{
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            lineHeight: 1.2,
          }}>
            {doc.title}
          </h1>
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
        </div>
        <MarkdownRenderer content={doc.body} />
      </main>

      <TableOfContents headings={headings} />
    </div>
  );
}
