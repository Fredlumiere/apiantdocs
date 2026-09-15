import matter from "gray-matter";
import { APIANT_AI_PRODUCT } from "@/lib/site";

/**
 * Pure planning for scripts/import-apiant-ai-content.ts: parse Markdown files
 * with frontmatter, validate them, and order them parents-first. No I/O, so
 * the rules are unit-tested; the script does the reads and writes.
 *
 * File shape (frontmatter keys writers use):
 *   ---
 *   title: Polling triggers
 *   slug: automations/triggers/polling
 *   parent_slug: automations/triggers
 *   sort_order: 2
 *   doc_type: guide
 *   description: One sentence.
 *   ---
 *   Markdown body. Internal links use the public path: [Triggers](/docs/automations/triggers)
 */

/** Values allowed by documents_doc_type_check (read from the live database). */
export const DOC_TYPES = ["guide", "api-ref", "tutorial", "changelog"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export interface ImportDoc {
  file: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  doc_type: DocType;
  parent_slug: string | null;
  sort_order: number | null;
}

export interface ParseResult {
  docs: ImportDoc[];
  errors: string[];
}

export function parseImportFile(file: string, raw: string): { doc: ImportDoc | null; errors: string[] } {
  const errors: string[] = [];
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (err) {
    return { doc: null, errors: [`${file}: frontmatter does not parse (${(err as Error).message})`] };
  }
  const fm = parsed.data as Record<string, unknown>;

  const title = typeof fm.title === "string" ? fm.title.trim() : "";
  if (!title) errors.push(`${file}: title is required`);

  const slug = typeof fm.slug === "string" ? fm.slug.trim() : "";
  const slugError = validateSlug(slug);
  if (slugError) errors.push(`${file}: slug ${slugError}`);

  let parentSlug: string | null = null;
  if (fm.parent_slug !== undefined && fm.parent_slug !== null && fm.parent_slug !== "") {
    parentSlug = typeof fm.parent_slug === "string" ? fm.parent_slug.trim() : "";
    const parentError = validateSlug(parentSlug);
    if (parentError) errors.push(`${file}: parent_slug ${parentError}`);
    if (parentSlug === slug) errors.push(`${file}: parent_slug is the page's own slug`);
  }

  const docTypeRaw = fm.doc_type === undefined ? "guide" : fm.doc_type;
  const docType = DOC_TYPES.find((t) => t === docTypeRaw);
  if (!docType) errors.push(`${file}: doc_type must be one of ${DOC_TYPES.join(", ")} (got ${JSON.stringify(docTypeRaw)})`);

  let sortOrder: number | null = null;
  if (fm.sort_order !== undefined && fm.sort_order !== null) {
    if (typeof fm.sort_order === "number" && Number.isInteger(fm.sort_order)) sortOrder = fm.sort_order;
    else errors.push(`${file}: sort_order must be an integer`);
  }

  const description = typeof fm.description === "string" && fm.description.trim() ? fm.description.trim() : null;
  const body = parsed.content.trim();
  if (!body) errors.push(`${file}: body is empty`);

  if (errors.length > 0) return { doc: null, errors };
  return {
    doc: { file, slug, title, description, body, doc_type: docType!, parent_slug: parentSlug, sort_order: sortOrder },
    errors,
  };
}

function validateSlug(slug: string): string | null {
  if (!slug) return "is required";
  if (slug.startsWith("docs/")) return `must not start with "docs/" (got ${slug})`;
  if (slug.startsWith("/") || slug.endsWith("/")) return `must not start or end with "/" (got ${slug})`;
  if (slug.endsWith(".md")) return `must not end with ".md" (got ${slug})`;
  if (!/^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/.test(slug)) {
    return `may only contain lowercase letters, digits, "-" and "/" between segments (got ${slug})`;
  }
  return null;
}

/**
 * Parse every file, reject duplicate slugs and parent cycles inside the batch,
 * and return the docs ordered so a parent that is also in the batch comes
 * before its children. Parents outside the batch are resolved by the script
 * against the target database.
 */
export function planImport(files: { file: string; raw: string }[]): ParseResult {
  const errors: string[] = [];
  const docs: ImportDoc[] = [];
  for (const f of files) {
    const r = parseImportFile(f.file, f.raw);
    errors.push(...r.errors);
    if (r.doc) docs.push(r.doc);
  }

  const bySlug = new Map<string, ImportDoc>();
  for (const d of docs) {
    const prior = bySlug.get(d.slug);
    if (prior) errors.push(`${d.file}: slug ${d.slug} is also used by ${prior.file}`);
    else bySlug.set(d.slug, d);
  }

  const ordered: ImportDoc[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (d: ImportDoc, trail: string[]) => {
    const s = state.get(d.slug);
    if (s === "done") return;
    if (s === "visiting") {
      errors.push(`parent cycle: ${[...trail, d.slug].join(" -> ")}`);
      return;
    }
    state.set(d.slug, "visiting");
    const parent = d.parent_slug ? bySlug.get(d.parent_slug) : undefined;
    if (parent) visit(parent, [...trail, d.slug]);
    state.set(d.slug, "done");
    ordered.push(d);
  };
  for (const d of bySlug.values()) visit(d, []);

  return { docs: errors.length ? [] : ordered, errors };
}

export interface TargetDoc {
  id: string;
  slug: string;
  product: string | null;
  version: number | null;
}

export type ImportAction =
  | { kind: "insert"; doc: ImportDoc; parentSlug: string | null }
  | { kind: "update"; doc: ImportDoc; parentSlug: string | null; existing: TargetDoc; claimed: boolean }
  | { kind: "error"; doc: ImportDoc; message: string };

export interface ResolveOptions {
  /**
   * Slugs of existing pages of another product (for example classic
   * 'platform' pages) that this import may take over: the row is updated in
   * place and its product becomes apiant-ai, which removes it from
   * info.apiant.com. Anything not listed is refused.
   */
  claim?: Set<string>;
}

/**
 * Decide insert, update or refuse for each planned doc against what exists in
 * the target. Slugs are unique across products, so a slug already used by a
 * page of another product is refused unless it is listed in options.claim,
 * and a parent must be an apiant-ai page: in the batch, already apiant-ai in
 * the target, or claimed.
 */
export function resolveActions(
  planned: ImportDoc[],
  existingBySlug: Map<string, TargetDoc>,
  options: ResolveOptions = {},
): ImportAction[] {
  const claim = options.claim ?? new Set<string>();
  const batchSlugs = new Set(planned.map((d) => d.slug));
  const failed = new Set<string>();
  const actions: ImportAction[] = [];
  for (const doc of planned) {
    const existing = existingBySlug.get(doc.slug);
    const claimed = !!existing && existing.product !== APIANT_AI_PRODUCT && claim.has(doc.slug);
    if (existing && existing.product !== APIANT_AI_PRODUCT && !claimed) {
      actions.push({
        kind: "error",
        doc,
        message: `slug ${doc.slug} already belongs to a ${existing.product ?? "no-product"} page; choose another slug, or pass --claim=${doc.slug} to convert that page to apiant-ai (it leaves info.apiant.com)`,
      });
      failed.add(doc.slug);
      continue;
    }
    if (doc.parent_slug) {
      if (failed.has(doc.parent_slug)) {
        actions.push({ kind: "error", doc, message: `parent ${doc.parent_slug} was not imported` });
        failed.add(doc.slug);
        continue;
      }
      const parent = existingBySlug.get(doc.parent_slug);
      if (!batchSlugs.has(doc.parent_slug)) {
        if (!parent) {
          actions.push({ kind: "error", doc, message: `parent ${doc.parent_slug} is neither in this import nor in the target` });
          failed.add(doc.slug);
          continue;
        }
        if (parent.product !== APIANT_AI_PRODUCT) {
          actions.push({ kind: "error", doc, message: `parent ${doc.parent_slug} is a ${parent.product ?? "no-product"} page, not apiant-ai (import or claim it too)` });
          failed.add(doc.slug);
          continue;
        }
      }
    }
    actions.push(
      existing
        ? { kind: "update", doc, parentSlug: doc.parent_slug, existing, claimed }
        : { kind: "insert", doc, parentSlug: doc.parent_slug },
    );
  }
  return actions;
}
