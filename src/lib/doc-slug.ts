import { createServerClient } from "@/lib/supabase";

type ServerClient = ReturnType<typeof createServerClient>;

// Trailing segments that /api/docs/[...slug] treats as an operation on the
// document in front of them, rather than as part of the document's slug.
export const SLUG_ACTIONS = ["embed", "versions"] as const;
export type SlugAction = (typeof SLUG_ACTIONS)[number];

export interface SlugResolution {
  slug: string;
  action: SlugAction | null;
}

// The syntactic reading of a path: if the last segment is an action name, the
// document is everything before it. This is a candidate, not an answer, because
// a real document can be called "…/versions" (docs about versions) or
// "…/embed". resolveSlugAction is what the routes use.
export function splitSlugAction(slugParts: string[]): SlugResolution {
  const last = slugParts[slugParts.length - 1];
  if ((SLUG_ACTIONS as readonly string[]).includes(last)) {
    return { slug: slugParts.slice(0, -1).join("/"), action: last as SlugAction };
  }
  return { slug: slugParts.join("/"), action: null };
}

// Decide whether a path addresses a document or an action on its parent.
//
// A document whose own slug ends in an action name wins over the action
// reading. Without that check, `PATCH /api/docs/automations/versions` writes to
// the document `automations`, and `DELETE` on the same path deletes it: the
// caller addresses one page and a different, existing page changes. The
// document lookup only runs when the path could be read either way, so the
// common case costs no extra query.
//
// The action remains reachable for such a document by appending the action
// again: `automations/versions/versions` has no document of its own, so it
// resolves to the version history of `automations/versions`.
export async function resolveSlugAction(
  supabase: ServerClient,
  slugParts: string[]
): Promise<SlugResolution> {
  const candidate = splitSlugAction(slugParts);
  if (!candidate.action) return candidate;

  const fullSlug = slugParts.join("/");
  const { data } = await supabase
    .from("documents")
    .select("id")
    .eq("slug", fullSlug)
    .maybeSingle();

  if (data) return { slug: fullSlug, action: null };
  return candidate;
}
