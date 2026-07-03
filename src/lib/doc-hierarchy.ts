import { createServerClient } from "@/lib/supabase";

type ServerClient = ReturnType<typeof createServerClient>;

export interface ParentError {
  code: "parent_not_found" | "invalid_parent_cycle" | "parent_product_mismatch";
  message: string;
  status: number;
}

export interface ParentResolution {
  parentId: string | null;
  // Effective product to persist. Set when the parent's product is inherited;
  // undefined means "leave the caller's product as-is".
  product?: string | null;
  error?: ParentError;
}

// Resolve a parent reference (parent_id or parent_slug) and validate the
// relationship. Only call this when a parent change is actually requested
// (parent_id or parent_slug present in the request body).
//
// Precedence: an explicit parent_id (including null) wins over parent_slug.
// A null parent_id un-parents the document (moves it to the root).
export async function resolveParent(
  supabase: ServerClient,
  opts: {
    parentIdRaw: string | null | undefined; // body.parent_id verbatim
    parentSlug?: string; // body.parent_slug
    selfId: string | null; // id of the doc being created/updated (null on create)
    currentProduct: string | null; // product that will be persisted for the doc
  }
): Promise<ParentResolution> {
  const { parentIdRaw, parentSlug, selfId, currentProduct } = opts;

  let parentId: string | null;
  if (parentIdRaw !== undefined) {
    // Explicit parent_id wins over parent_slug (spec §1).
    parentId = parentIdRaw;
  } else if (parentSlug) {
    const { data: p } = await supabase
      .from("documents")
      .select("id")
      .eq("slug", parentSlug)
      .single();
    if (!p) {
      return {
        parentId: null,
        error: {
          code: "parent_not_found",
          message: `Parent slug not found: ${parentSlug}`,
          status: 400,
        },
      };
    }
    parentId = p.id;
  } else {
    // Nothing to resolve.
    return { parentId: null };
  }

  // Un-parent to root — nothing to validate.
  if (parentId === null) {
    return { parentId: null };
  }

  // Parent must exist.
  const { data: parent } = await supabase
    .from("documents")
    .select("id, product, parent_id")
    .eq("id", parentId)
    .single();
  if (!parent) {
    return {
      parentId: null,
      error: {
        code: "parent_not_found",
        message: `Parent not found: ${parentId}`,
        status: 400,
      },
    };
  }

  // A document cannot be its own parent.
  if (selfId && parentId === selfId) {
    return {
      parentId: null,
      error: {
        code: "invalid_parent_cycle",
        message: "A document cannot be its own parent",
        status: 400,
      },
    };
  }

  // Cycle: the chosen parent must not be a descendant of self. Walk up the
  // ancestor chain from the parent; if we reach self, the parent is below us.
  if (selfId) {
    const seen = new Set<string>([parentId]);
    let cursor: string | null = parent.parent_id;
    while (cursor) {
      if (cursor === selfId) {
        return {
          parentId: null,
          error: {
            code: "invalid_parent_cycle",
            message: "Cannot set parent to a descendant of the document",
            status: 400,
          },
        };
      }
      if (seen.has(cursor)) break; // guard against a pre-existing cycle
      seen.add(cursor);
      const { data: anc }: { data: { parent_id: string | null } | null } =
        await supabase
          .from("documents")
          .select("parent_id")
          .eq("id", cursor)
          .single();
      cursor = anc?.parent_id ?? null;
    }
  }

  // Product: inherit the parent's product when unset, reject an explicit conflict.
  let product: string | null | undefined = undefined;
  if (parent.product) {
    if (currentProduct == null) {
      product = parent.product;
    } else if (currentProduct !== parent.product) {
      return {
        parentId: null,
        error: {
          code: "parent_product_mismatch",
          message: `Parent product '${parent.product}' does not match document product '${currentProduct}'`,
          status: 400,
        },
      };
    }
  }

  return { parentId, product };
}

// Next sort_order for appending among siblings of the given parent (max + 1).
export async function nextSortOrder(
  supabase: ServerClient,
  parentId: string | null
): Promise<number> {
  let query = supabase
    .from("documents")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  query = parentId === null ? query.is("parent_id", null) : query.eq("parent_id", parentId);

  const { data } = await query;
  if (data && data.length > 0) {
    return (data[0].sort_order ?? 0) + 1;
  }
  return 0;
}

// Report request-body keys that the handler does not recognize, so a dropped
// param is visible instead of silently ignored (spec §3).
export function unknownFieldWarnings(
  body: Record<string, unknown>,
  allowed: readonly string[]
): string[] {
  const allow = new Set(allowed);
  return Object.keys(body)
    .filter((k) => !allow.has(k))
    .map((k) => `ignored unknown field: ${k}`);
}
