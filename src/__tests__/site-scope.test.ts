import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// A small in-memory stand-in for the supabase-js query builder, covering the
// chains the scoped read paths use: select → eq/or/in/contains → order →
// single/maybeSingle/limit/await, plus rpc for search_documents.
interface Row {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  doc_type: string;
  product: string | null;
  parent_id: string | null;
  sort_order: number;
  status: string;
  tags: string[];
}

const rows: Row[] = [
  row("c1", "classic-intro", "Classic intro", "platform", null, 0),
  row("c2", "classic-null", "Classic without product", null, null, 1),
  row("a1", "getting-started", "Getting started", "apiant-ai", null, 0, "Start here."),
  row("a2", "getting-started/connect", "Connect an app", "apiant-ai", "a1", 0),
  row("a3", "reference", "Reference", "apiant-ai", null, 1),
  { ...row("a4", "draft-page", "Draft", "apiant-ai", null, 2), status: "draft" },
];

function row(id: string, slug: string, title: string, product: string | null, parent: string | null, sort: number, description: string | null = null): Row {
  return { id, slug, title, description, body: `Body of ${title}. See [x](/other-page).`, doc_type: "guide", product, parent_id: parent, sort_order: sort, status: "published", tags: [] };
}

function matchesOr(r: Row, expr: string): boolean {
  return expr.split(",").some((clause) => {
    const [field, op, ...rest] = clause.split(".");
    const value = rest.join(".");
    const actual = (r as unknown as Record<string, unknown>)[field];
    if (op === "is" && value === "null") return actual === null;
    if (op === "neq") return actual !== null && actual !== value;
    if (op === "eq") return actual === value;
    throw new Error(`unsupported or clause ${clause}`);
  });
}

function builder() {
  const filters: ((r: Row) => boolean)[] = [];
  let sortField: keyof Row | null = null;
  let limitN = Infinity;
  const run = () => {
    let out = rows.filter((r) => filters.every((f) => f(r)));
    if (sortField) out = [...out].sort((a, b) => (a[sortField!] as number) - (b[sortField!] as number));
    return out.slice(0, limitN);
  };
  const b = {
    select: () => b,
    eq: (field: keyof Row, value: unknown) => { filters.push((r) => r[field] === value); return b; },
    or: (expr: string) => { filters.push((r) => matchesOr(r, expr)); return b; },
    in: (field: keyof Row, values: unknown[]) => { filters.push((r) => values.includes(r[field])); return b; },
    contains: (field: keyof Row, values: string[]) => { filters.push((r) => values.every((v) => (r[field] as string[]).includes(v))); return b; },
    order: (field: keyof Row) => { sortField = field; return b; },
    limit: (n: number) => { limitN = n; return b; },
    single: async () => { const out = run(); return out.length === 1 ? { data: out[0], error: null } : { data: null, error: { message: "not single" } }; },
    maybeSingle: async () => { const out = run(); return { data: out[0] ?? null, error: null }; },
    then: (resolve: (v: { data: Row[]; error: null }) => unknown) => resolve({ data: run(), error: null }),
  };
  return b;
}

vi.mock("@/lib/supabase", () => ({
  createServerClient: () => ({
    from: () => builder(),
    rpc: async (name: string, args: { search_query: string; filter_product: string | null }) => {
      if (name !== "search_documents") return { data: null, error: { message: "no rpc" } };
      const data = rows
        .filter((r) => r.status === "published")
        .filter((r) => args.filter_product === null || r.product === args.filter_product)
        .filter((r) => r.body.toLowerCase().includes(args.search_query.toLowerCase().split(" ")[0]))
        .map((r) => ({ id: r.id, slug: r.slug, title: r.title, description: r.description, doc_type: r.doc_type, product: r.product, snippet: null, rank: 1 }));
      return { data, error: null };
    },
  }),
}));

async function freshModules() {
  vi.resetModules();
  return {
    site: await import("@/lib/site"),
    siteDocs: await import("@/lib/site-docs"),
    markdownRoute: await import("@/app/api/markdown/[...slug]/route"),
    llmsRoute: await import("@/app/docs/llms.txt/route"),
    searchRoute: await import("@/app/api/search/route"),
  };
}

function markdownRequest(slug: string) {
  return [new Request(`http://localhost/api/markdown/${slug}`), { params: Promise.resolve({ slug: slug.split("/") }) }] as const;
}

describe("apiant-ai site mode", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_SITE", "apiant-ai");
    vi.stubEnv("VOYAGE_API_KEY", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("reports the site, branding and API paths", async () => {
    const { site } = await freshModules();
    expect(site.getDocsSite()).toBe("apiant-ai");
    expect(site.siteName()).toBe("APIANT.ai Docs");
    expect(site.apiPath("/search")).toBe("/docs/api/search");
    expect(site.apiPath("chat")).toBe("/docs/api/chat");
    expect(site.docUrl("getting-started")).toBe("https://apiant.ai/docs/getting-started");
  });

  it("forces the site product whatever the caller asks for", async () => {
    const { site } = await freshModules();
    expect(site.effectiveProduct(null)).toBe("apiant-ai");
    expect(site.effectiveProduct("platform")).toBe("apiant-ai");
    expect(site.inSiteScope("apiant-ai")).toBe(true);
    expect(site.inSiteScope("platform")).toBe(false);
    expect(site.inSiteScope(null)).toBe(false);
  });

  it("rewrites root-relative content links into the zone and leaves the rest alone", async () => {
    const { site } = await freshModules();
    expect(site.contentHref("/other-page")).toBe("/docs/other-page");
    expect(site.contentHref("/docs/x")).toBe("/docs/x");
    expect(site.contentHref("/docs")).toBe("/docs");
    expect(site.contentHref("/docs?tag=a")).toBe("/docs?tag=a");
    expect(site.contentHref("/docsomething")).toBe("/docs/docsomething");
    expect(site.contentHref("https://example.com/a")).toBe("https://example.com/a");
    expect(site.contentHref("//cdn.example.com/a")).toBe("//cdn.example.com/a");
    expect(site.contentHref("#section")).toBe("#section");
    expect(site.contentHref(undefined)).toBeUndefined();
  });

  it("serves Markdown only for published apiant-ai pages", async () => {
    const { markdownRoute } = await freshModules();
    const ok = await markdownRoute.GET(...markdownRequest("getting-started"));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toContain("text/markdown");
    expect(await ok.text()).toBe("# Getting started\n\n> Start here.\n\nBody of Getting started. See [x](/other-page).\n");

    expect((await markdownRoute.GET(...markdownRequest("classic-intro"))).status).toBe(404);
    expect((await markdownRoute.GET(...markdownRequest("classic-null"))).status).toBe(404);
    expect((await markdownRoute.GET(...markdownRequest("draft-page"))).status).toBe(404);
  });

  it("lists only apiant-ai pages in sidebar order in llms.txt", async () => {
    const { llmsRoute } = await freshModules();
    const text = await (await llmsRoute.GET()).text();
    expect(text).toBe(
      [
        "# APIANT.ai Docs",
        "",
        "> Documentation for APIANT.ai, the AI-first integration platform. Each link is the Markdown version of a page.",
        "",
        "- [Getting started](https://apiant.ai/docs/getting-started.md): Start here.",
        "- [Connect an app](https://apiant.ai/docs/getting-started/connect.md)",
        "- [Reference](https://apiant.ai/docs/reference.md)",
        "",
      ].join("\n")
    );
  });

  it("scopes keyword search even when ?product= names another product", async () => {
    const { searchRoute } = await freshModules();
    const res = await searchRoute.GET(new Request("http://localhost/api/search?q=body&product=platform&mode=keyword") as never);
    const json = await res.json();
    expect(json.data.map((d: { slug: string }) => d.slug).sort()).toEqual(["getting-started", "getting-started/connect", "reference"]);
  });

  it("builds the scoped tree for the sidebar and prev/next", async () => {
    const { siteDocs } = await freshModules();
    const { tree } = await siteDocs.fetchSiteDocs();
    expect(tree.map((n) => n.slug)).toEqual(["getting-started", "reference"]);
    expect(tree[0].children.map((n) => n.slug)).toEqual(["getting-started/connect"]);
  });
});

describe("classic site mode (no env var)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_SITE", "");
    vi.stubEnv("DOCS_SITE", "");
    vi.stubEnv("VOYAGE_API_KEY", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("keeps classic branding, API paths and content links", async () => {
    const { site } = await freshModules();
    expect(site.getDocsSite()).toBe("classic");
    expect(site.siteName()).toBe("APIANT Docs");
    expect(site.apiPath("/search")).toBe("/api/search");
    expect(site.contentHref("/other-page")).toBe("/other-page");
    expect(site.effectiveProduct(null)).toBeNull();
    expect(site.effectiveProduct("platform")).toBe("platform");
  });

  it("shows classic pages, including product NULL, and hides apiant-ai pages", async () => {
    const { markdownRoute, siteDocs } = await freshModules();
    expect((await markdownRoute.GET(...markdownRequest("classic-intro"))).status).toBe(200);
    expect((await markdownRoute.GET(...markdownRequest("classic-null"))).status).toBe(200);
    expect((await markdownRoute.GET(...markdownRequest("getting-started"))).status).toBe(404);
    const { tree } = await siteDocs.fetchSiteDocs();
    expect(tree.map((n) => n.slug)).toEqual(["classic-intro", "classic-null"]);
  });

  it("excludes apiant-ai pages from unfiltered search but honors an explicit product", async () => {
    const { searchRoute } = await freshModules();
    const all = await (await searchRoute.GET(new Request("http://localhost/api/search?q=body&mode=keyword") as never)).json();
    expect(all.data.map((d: { slug: string }) => d.slug).sort()).toEqual(["classic-intro", "classic-null"]);
    const explicit = await (await searchRoute.GET(new Request("http://localhost/api/search?q=body&product=apiant-ai&mode=keyword") as never)).json();
    expect(explicit.data.map((d: { slug: string }) => d.slug).sort()).toEqual(["getting-started", "getting-started/connect", "reference"]);
  });
});

describe("markdown export helpers", () => {
  it("parses /docs/<slug>.md paths", async () => {
    const { markdownSlugFromPath } = await import("@/lib/markdown-export");
    expect(markdownSlugFromPath("/docs/getting-started.md")).toBe("getting-started");
    expect(markdownSlugFromPath("/docs/a/b.md")).toBe("a/b");
    expect(markdownSlugFromPath("/docs/getting-started")).toBeNull();
    expect(markdownSlugFromPath("/docs/.md")).toBeNull();
    expect(markdownSlugFromPath("/docs/a//b.md")).toBeNull();
    expect(markdownSlugFromPath("/docs/../secret.md")).toBeNull();
    expect(markdownSlugFromPath("/other/page.md")).toBeNull();
  });

  it("renders an empty-state llms.txt", async () => {
    const { buildLlmsTxt } = await import("@/lib/markdown-export");
    expect(buildLlmsTxt([], { siteName: "S", summary: "Sum", docsBaseUrl: "https://x/docs", descriptions: new Map() })).toBe(
      "# S\n\n> Sum\n\nNo published pages yet.\n"
    );
  });
});
