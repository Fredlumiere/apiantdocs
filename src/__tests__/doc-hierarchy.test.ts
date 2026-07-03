import { describe, it, expect } from "vitest";
import { resolveParent, nextSortOrder, unknownFieldWarnings } from "@/lib/doc-hierarchy";

type Doc = {
  id: string;
  slug: string;
  product: string | null;
  parent_id: string | null;
  sort_order: number;
};

// Minimal fake of the supabase query builder covering the chains used by
// resolveParent (select→eq→single) and nextSortOrder (select→order→limit→eq/is).
function fakeSupabase(docs: Doc[]) {
  function builder() {
    const filters: { field: string; val: unknown; op: "eq" | "is" }[] = [];
    let orderField: string | null = null;
    let orderAsc = true;
    let limitN = Infinity;

    const apply = () => {
      let rows = docs.filter((d) =>
        filters.every((f) =>
          f.op === "is"
            ? (d as Record<string, unknown>)[f.field] === f.val
            : (d as Record<string, unknown>)[f.field] === f.val
        )
      );
      if (orderField) {
        rows = [...rows].sort((a, b) => {
          const av = (a as Record<string, number>)[orderField!];
          const bv = (b as Record<string, number>)[orderField!];
          return orderAsc ? av - bv : bv - av;
        });
      }
      return rows.slice(0, limitN);
    };

    const chain = {
      select() {
        return chain;
      },
      eq(field: string, val: unknown) {
        filters.push({ field, val, op: "eq" });
        return chain;
      },
      is(field: string, val: unknown) {
        filters.push({ field, val, op: "is" });
        return chain;
      },
      order(field: string, opts: { ascending: boolean }) {
        orderField = field;
        orderAsc = opts.ascending;
        return chain;
      },
      limit(n: number) {
        limitN = n;
        return chain;
      },
      single() {
        const rows = apply();
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      // Thenable: awaiting the builder resolves to the full result set.
      then(onFulfilled: (v: { data: Doc[]; error: null }) => unknown) {
        return Promise.resolve({ data: apply(), error: null }).then(onFulfilled);
      },
    };
    return chain;
  }

  return { from: () => builder() } as unknown as Parameters<typeof resolveParent>[0];
}

const DOCS: Doc[] = [
  { id: "A", slug: "a", product: "api-apps", parent_id: null, sort_order: 0 },
  { id: "B", slug: "b", product: "api-apps", parent_id: "A", sort_order: 1 },
  { id: "C", slug: "c", product: "platform", parent_id: null, sort_order: 5 },
];

describe("resolveParent", () => {
  it("resolves parent_slug to an id", async () => {
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: undefined,
      parentSlug: "a",
      selfId: "B",
      currentProduct: "api-apps",
    });
    expect(res.error).toBeUndefined();
    expect(res.parentId).toBe("A");
  });

  it("explicit parent_id wins over parent_slug", async () => {
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: "A",
      parentSlug: "c",
      selfId: "B",
      currentProduct: "api-apps",
    });
    expect(res.parentId).toBe("A");
  });

  it("null parent_id un-parents to root", async () => {
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: null,
      parentSlug: "a",
      selfId: "B",
      currentProduct: "api-apps",
    });
    expect(res.error).toBeUndefined();
    expect(res.parentId).toBeNull();
  });

  it("errors parent_not_found for a missing slug", async () => {
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: undefined,
      parentSlug: "nope",
      selfId: "B",
      currentProduct: "api-apps",
    });
    expect(res.error?.code).toBe("parent_not_found");
    expect(res.error?.status).toBe(400);
  });

  it("errors parent_not_found for a missing id", async () => {
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: "ZZZ",
      selfId: "B",
      currentProduct: "api-apps",
    });
    expect(res.error?.code).toBe("parent_not_found");
  });

  it("rejects self as parent", async () => {
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: "A",
      selfId: "A",
      currentProduct: "api-apps",
    });
    expect(res.error?.code).toBe("invalid_parent_cycle");
  });

  it("rejects a descendant as parent (cycle)", async () => {
    // A is the doc; B is A's child. Setting A.parent = B is a cycle.
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: "B",
      selfId: "A",
      currentProduct: "api-apps",
    });
    expect(res.error?.code).toBe("invalid_parent_cycle");
  });

  it("inherits parent product when doc product is unset", async () => {
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: "C",
      selfId: "B",
      currentProduct: null,
    });
    expect(res.error).toBeUndefined();
    expect(res.product).toBe("platform");
  });

  it("rejects an explicit product conflict", async () => {
    const res = await resolveParent(fakeSupabase(DOCS), {
      parentIdRaw: "C", // product platform
      selfId: "B",
      currentProduct: "api-apps",
    });
    expect(res.error?.code).toBe("parent_product_mismatch");
  });
});

describe("nextSortOrder", () => {
  it("appends after the max sibling under a parent", async () => {
    // Only B is a child of A (sort_order 1) → next is 2.
    expect(await nextSortOrder(fakeSupabase(DOCS), "A")).toBe(2);
  });

  it("appends after the max root sibling", async () => {
    // Root docs A(0) and C(5) → next is 6.
    expect(await nextSortOrder(fakeSupabase(DOCS), null)).toBe(6);
  });

  it("returns 0 when there are no siblings", async () => {
    expect(await nextSortOrder(fakeSupabase(DOCS), "B")).toBe(0);
  });
});

describe("unknownFieldWarnings", () => {
  it("flags keys outside the allowed set", () => {
    const warnings = unknownFieldWarnings(
      { title: "x", foo: 1, bar: 2 },
      ["title", "slug"]
    );
    expect(warnings).toEqual([
      "ignored unknown field: foo",
      "ignored unknown field: bar",
    ]);
  });

  it("returns empty when all keys are allowed", () => {
    expect(unknownFieldWarnings({ title: "x" }, ["title"])).toEqual([]);
  });
});
