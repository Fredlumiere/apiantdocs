import { createServerClient } from "@/lib/supabase";
import { buildTree, type FlatDoc, type TreeNode } from "@/lib/doc-tree";
import { APIANT_AI_PRODUCT, inSiteScope, isApiantAiSite } from "@/lib/site";

/**
 * Restrict a documents query to the current site. apiant-ai mode adds
 * product = 'apiant-ai'; classic mode excludes 'apiant-ai' while keeping
 * rows whose product is NULL (a plain neq would drop those). Every server
 * read of `documents` that feeds a page, the sidebar, search, chat or an
 * export goes through this, or filters rows with inSiteScope.
 */
export function scopeToSite<Q>(query: Q): Q {
  // Structural cast instead of a generic constraint: checking supabase-js's
  // PostgrestFilterBuilder against a recursive constraint exceeds the
  // compiler's instantiation depth (TS2589). Both methods return the builder.
  const q = query as unknown as FilterableQuery;
  const scoped = isApiantAiSite()
    ? q.eq("product", APIANT_AI_PRODUCT)
    : q.or(`product.is.null,product.neq.${APIANT_AI_PRODUCT}`);
  return scoped as unknown as Q;
}

interface FilterableQuery {
  eq(column: string, value: string): unknown;
  or(filters: string): unknown;
}

/**
 * scopeToSite for an API request that may name a product. apiant-ai mode is
 * always scoped. In classic mode an explicit product (for example a writer
 * agent searching product 'apiant-ai' through info.apiant.com) is honored as
 * asked, and only an unfiltered request gets the classic exclusion.
 */
export function scopeForRequest<Q>(query: Q, requestedProduct: string | null | undefined): Q {
  if (!isApiantAiSite() && requestedProduct) return query;
  return scopeToSite(query);
}

/** Row-level counterpart of scopeForRequest. */
export function rowInScopeForRequest(
  product: string | null | undefined,
  requestedProduct: string | null | undefined,
): boolean {
  if (!isApiantAiSite() && requestedProduct) return true;
  return inSiteScope(product);
}

export interface SiteDoc extends FlatDoc {
  description: string | null;
}

/** Published documents of the current site, in sort_order, plus their tree. */
export async function fetchSiteDocs(): Promise<{ docs: SiteDoc[]; tree: TreeNode[] }> {
  const supabase = createServerClient();
  const { data } = await scopeToSite(
    supabase
      .from("documents")
      .select("id, slug, title, description, doc_type, product, parent_id, sort_order")
      .eq("status", "published")
  ).order("sort_order", { ascending: true });
  const docs = (data as SiteDoc[] | null) || [];
  return { docs, tree: buildTree(docs) };
}
