import { describe, it, expect } from "vitest";
import { splitSlugAction, resolveSlugAction } from "@/lib/doc-slug";

// Minimal fake of the supabase query builder covering the one chain
// resolveSlugAction uses: from→select→eq→maybeSingle.
function fakeSupabase(slugs: string[]) {
  return {
    from() {
      let wanted: string | null = null;
      const chain = {
        select: () => chain,
        eq(_field: string, val: string) {
          wanted = val;
          return chain;
        },
        async maybeSingle() {
          return { data: wanted && slugs.includes(wanted) ? { id: wanted } : null };
        },
      };
      return chain;
    },
  } as unknown as Parameters<typeof resolveSlugAction>[0];
}

describe("splitSlugAction", () => {
  it("handles single segment slug", () => {
    expect(splitSlugAction(["getting-started"])).toEqual({
      slug: "getting-started",
      action: null,
    });
  });

  it("handles nested slug", () => {
    expect(splitSlugAction(["automation-editor", "key-concepts"])).toEqual({
      slug: "automation-editor/key-concepts",
      action: null,
    });
  });

  it("handles deeply nested slug", () => {
    expect(
      splitSlugAction(["automation-editor", "building-automations", "tips-and-tricks"])
    ).toEqual({
      slug: "automation-editor/building-automations/tips-and-tricks",
      action: null,
    });
  });

  it("reads a trailing embed as an action", () => {
    expect(splitSlugAction(["getting-started", "embed"])).toEqual({
      slug: "getting-started",
      action: "embed",
    });
  });

  it("reads a trailing versions as an action", () => {
    expect(splitSlugAction(["automations", "versions"])).toEqual({
      slug: "automations",
      action: "versions",
    });
  });
});

describe("resolveSlugAction", () => {
  it("returns a plain slug untouched, without a lookup", async () => {
    const supabase = fakeSupabase([]);
    expect(await resolveSlugAction(supabase, ["automation-editor", "key-concepts"])).toEqual({
      slug: "automation-editor/key-concepts",
      action: null,
    });
  });

  it("treats a trailing action as an action when no such document exists", async () => {
    const supabase = fakeSupabase(["automations"]);
    expect(await resolveSlugAction(supabase, ["automations", "versions"])).toEqual({
      slug: "automations",
      action: "versions",
    });
  });

  // The regression: automations/versions is a real page. Without the lookup,
  // a PATCH to it wrote to automations, and a DELETE would have removed it.
  it("prefers a real document whose slug ends in an action name", async () => {
    const supabase = fakeSupabase(["automations", "automations/versions"]);
    expect(await resolveSlugAction(supabase, ["automations", "versions"])).toEqual({
      slug: "automations/versions",
      action: null,
    });
  });

  it("prefers a real document whose slug ends in embed", async () => {
    const supabase = fakeSupabase(["guides", "guides/embed"]);
    expect(await resolveSlugAction(supabase, ["guides", "embed"])).toEqual({
      slug: "guides/embed",
      action: null,
    });
  });

  it("keeps the action reachable for such a document by repeating it", async () => {
    const supabase = fakeSupabase(["automations", "automations/versions"]);
    expect(await resolveSlugAction(supabase, ["automations", "versions", "versions"])).toEqual({
      slug: "automations/versions",
      action: "versions",
    });
  });
});
