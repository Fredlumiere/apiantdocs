/**
 * Site mode. One codebase serves two documentation sites:
 *
 * - "classic" (default, no env var): info.apiant.com / apiantdocs.vercel.app,
 *   the classic APIANT platform docs. Behaves as it did before site modes
 *   existed, except that pages with product "apiant-ai" are left out of every
 *   read path (a no-op until such pages exist).
 * - "apiant-ai" (DOCS_SITE=apiant-ai at build time): the docs zone served at
 *   https://apiant.ai/docs through a rewrite on the apiant.ai Vercel project.
 *   Every read path is restricted to documents whose product is "apiant-ai",
 *   Next assets live under /docs/_next, and client calls go to /docs/api/*
 *   so they never reach apiant.ai's own /api/* functions.
 *
 * next.config.ts copies DOCS_SITE into NEXT_PUBLIC_DOCS_SITE so client
 * components see the same value. Each helper reads the variable at call time
 * (the literal `process.env.NEXT_PUBLIC_DOCS_SITE` is inlined in client
 * bundles), which also lets unit tests switch modes with vi.stubEnv.
 */

export type DocsSite = "classic" | "apiant-ai";

/** Product value that scopes the apiant.ai docs site. */
export const APIANT_AI_PRODUCT = "apiant-ai";

/** Public mount point of the apiant.ai docs zone. */
export const APIANT_AI_BASE_PATH = "/docs";

export function getDocsSite(): DocsSite {
  const value = process.env.NEXT_PUBLIC_DOCS_SITE || process.env.DOCS_SITE;
  return value === "apiant-ai" ? "apiant-ai" : "classic";
}

export function isApiantAiSite(): boolean {
  return getDocsSite() === "apiant-ai";
}

/**
 * The product the apiant-ai site is restricted to, or null in classic mode.
 */
export function siteProduct(): string | null {
  return isApiantAiSite() ? APIANT_AI_PRODUCT : null;
}

/**
 * True when a document with this product belongs to the current site.
 * apiant-ai: only product 'apiant-ai'. classic: everything except
 * 'apiant-ai', so pages written for apiant.ai never appear on info.apiant.com
 * (on data with no apiant-ai pages this is identical to no filter).
 */
export function inSiteScope(product: string | null | undefined): boolean {
  return isApiantAiSite() ? product === APIANT_AI_PRODUCT : product !== APIANT_AI_PRODUCT;
}

/**
 * Product filter for an RPC or query that takes an optional product
 * parameter. In apiant-ai mode the site product always wins, so a caller
 * cannot widen the scope with ?product=platform. In classic mode the
 * caller's value passes through; asking the classic site for product
 * 'apiant-ai' is answered by the in-memory inSiteScope filter (empty).
 */
export function effectiveProduct(requested: string | null | undefined): string | null {
  return siteProduct() ?? (requested || null);
}

export function siteName(): string {
  return isApiantAiSite() ? "APIANT.ai Docs" : "APIANT Docs";
}

/** Canonical public origin of the current site (no trailing slash). */
export function siteOrigin(): string {
  return isApiantAiSite() ? "https://apiant.ai" : "https://info.apiant.com";
}

/**
 * Path for a same-origin API route as the browser must request it.
 * apiant-ai: /docs/api/search (rewritten to /api/search inside the zone).
 * classic: /api/search.
 */
export function apiPath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return isApiantAiSite() ? `${APIANT_AI_BASE_PATH}/api${clean}` : `/api${clean}`;
}

/** Public path of a doc page. The same in both modes: /docs/<slug>. */
export function docPath(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

/** Absolute public URL of a doc page. */
export function docUrl(slug: string): string {
  return `${siteOrigin()}${docPath(slug)}`;
}

/**
 * Rewrite a root-relative href found in document content so it resolves
 * inside the zone. Under apiant.ai only /docs/* reaches this app, so a bare
 * "/some-slug" (the old Archbee style, which the classic site 301s to
 * /docs/some-slug) or "/api/images?..." would land on the marketing site.
 * apiant-ai mode prefixes those with /docs; classic mode returns the href
 * untouched. Absolute URLs, anchors, protocol-relative URLs and paths that
 * are already under /docs are never changed.
 */
export function contentHref(href: string | undefined): string | undefined {
  if (!href || !isApiantAiSite()) return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href === APIANT_AI_BASE_PATH || href.startsWith(`${APIANT_AI_BASE_PATH}/`) || href.startsWith(`${APIANT_AI_BASE_PATH}?`) || href.startsWith(`${APIANT_AI_BASE_PATH}#`)) {
    return href;
  }
  return `${APIANT_AI_BASE_PATH}${href}`;
}
