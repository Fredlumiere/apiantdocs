import { describe, it, expect } from "vitest";
import { parseImportFile, planImport, resolveActions, type TargetDoc } from "@/lib/content-import";

const page = (fm: string, body = "Body with a [link](/docs/automations/triggers).") => `---\n${fm}\n---\n${body}\n`;

describe("parseImportFile", () => {
  it("reads the frontmatter writers use and keeps /docs links untouched", () => {
    const { doc, errors } = parseImportFile(
      "a.md",
      page("title: Polling\nslug: automations/triggers/polling\nparent_slug: automations/triggers\nsort_order: 2\ndoc_type: tutorial\ndescription: Polls.")
    );
    expect(errors).toEqual([]);
    expect(doc).toEqual({
      file: "a.md",
      slug: "automations/triggers/polling",
      title: "Polling",
      description: "Polls.",
      body: "Body with a [link](/docs/automations/triggers).",
      doc_type: "tutorial",
      parent_slug: "automations/triggers",
      sort_order: 2,
    });
  });

  it("defaults doc_type to guide and rejects values the database refuses", () => {
    expect(parseImportFile("a.md", page("title: T\nslug: t")).doc?.doc_type).toBe("guide");
    expect(parseImportFile("a.md", page("title: T\nslug: t\ndoc_type: overview")).errors[0]).toContain("doc_type must be one of");
  });

  it("rejects slugs that would break /docs/<slug> URLs", () => {
    for (const slug of ["docs/a", "/a", "a/", "a.md", "A/b", "a//b", ""]) {
      expect(parseImportFile("a.md", page(`title: T\nslug: "${slug}"`)).errors.join()).toContain("slug");
    }
  });
});

describe("planImport", () => {
  it("orders parents before children regardless of file order", () => {
    const plan = planImport([
      { file: "c.md", raw: page("title: C\nslug: a/b/c\nparent_slug: a/b") },
      { file: "b.md", raw: page("title: B\nslug: a/b\nparent_slug: a") },
      { file: "a.md", raw: page("title: A\nslug: a") },
    ]);
    expect(plan.errors).toEqual([]);
    expect(plan.docs.map((d) => d.slug)).toEqual(["a", "a/b", "a/b/c"]);
  });

  it("reports duplicate slugs and parent cycles", () => {
    expect(planImport([
      { file: "1.md", raw: page("title: A\nslug: a") },
      { file: "2.md", raw: page("title: A2\nslug: a") },
    ]).errors[0]).toContain("also used by");
    expect(planImport([
      { file: "x.md", raw: page("title: X\nslug: x\nparent_slug: y") },
      { file: "y.md", raw: page("title: Y\nslug: y\nparent_slug: x") },
    ]).errors.join()).toContain("parent cycle");
  });
});

describe("resolveActions", () => {
  const plan = planImport([
    { file: "a.md", raw: page("title: A\nslug: a") },
    { file: "b.md", raw: page("title: B\nslug: a/b\nparent_slug: a") },
    { file: "c.md", raw: page("title: C\nslug: c\nparent_slug: existing-parent") },
  ]).docs;

  it("inserts new pages, updates existing apiant-ai pages, and resolves parents from the target", () => {
    const existing = new Map<string, TargetDoc>([
      ["a", { id: "1", slug: "a", product: "apiant-ai", version: 3 }],
      ["existing-parent", { id: "2", slug: "existing-parent", product: "apiant-ai", version: 1 }],
    ]);
    expect(resolveActions(plan, existing).map((a) => `${a.kind}:${a.doc.slug}`)).toEqual(["update:a", "insert:a/b", "insert:c"]);
  });

  it("refuses a slug owned by a classic page, and its children", () => {
    const existing = new Map<string, TargetDoc>([
      ["a", { id: "1", slug: "a", product: "platform", version: 1 }],
      ["existing-parent", { id: "2", slug: "existing-parent", product: null, version: 1 }],
    ]);
    const actions = resolveActions(plan, existing);
    expect(actions.map((a) => a.kind)).toEqual(["error", "error", "error"]);
    expect(actions[0].kind === "error" && actions[0].message).toContain("platform page");
    expect(actions[1].kind === "error" && actions[1].message).toContain("was not imported");
    expect(actions[2].kind === "error" && actions[2].message).toContain("not apiant-ai");
  });

  it("updates claimed pages of another product in place, parents included", () => {
    const refPlan = planImport([
      { file: "r.md", raw: page("title: Reference\nslug: reference") },
      { file: "t.md", raw: page("title: MCP tools\nslug: reference/mcp-tools\nparent_slug: reference") },
      { file: "g.md", raw: page("title: Glossary\nslug: reference/glossary\nparent_slug: reference") },
    ]).docs;
    const existing = new Map<string, TargetDoc>([
      ["reference", { id: "r", slug: "reference", product: "platform", version: 1 }],
      ["reference/mcp-tools", { id: "t", slug: "reference/mcp-tools", product: "platform", version: 4 }],
      ["reference/glossary", { id: "g", slug: "reference/glossary", product: "platform", version: 1 }],
    ]);
    const claim = new Set(["reference", "reference/mcp-tools", "reference/glossary"]);
    const actions = resolveActions(refPlan, existing, { claim });
    expect(actions.map((a) => `${a.kind}:${a.doc.slug}:${a.kind === "update" ? a.existing.id + ":" + a.claimed : ""}`)).toEqual([
      "update:reference:r:true",
      "update:reference/mcp-tools:t:true",
      "update:reference/glossary:g:true",
    ]);
    // Without the claim, the same import is refused, never duplicated.
    const refused = resolveActions(refPlan, existing);
    expect(refused.map((a) => a.kind)).toEqual(["error", "error", "error"]);
    expect(refused[0].kind === "error" && refused[0].message).toContain("--claim=reference");
  });

  it("refuses a parent that exists nowhere", () => {
    const actions = resolveActions(plan, new Map());
    expect(actions[2].kind === "error" && actions[2].message).toContain("neither in this import nor in the target");
  });
});
