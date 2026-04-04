import { describe, it, expect } from "vitest";

// Test the extractSlug logic from the API route
function extractSlug(slugParts: string[]): { slug: string; action: string | null } {
  if (slugParts[slugParts.length - 1] === "embed") {
    return { slug: slugParts.slice(0, -1).join("/"), action: "embed" };
  }
  return { slug: slugParts.join("/"), action: null };
}

describe("extractSlug", () => {
  it("handles single segment slug", () => {
    const result = extractSlug(["getting-started"]);
    expect(result).toEqual({ slug: "getting-started", action: null });
  });

  it("handles nested slug", () => {
    const result = extractSlug(["automation-editor", "key-concepts"]);
    expect(result).toEqual({ slug: "automation-editor/key-concepts", action: null });
  });

  it("handles deeply nested slug", () => {
    const result = extractSlug(["automation-editor", "building-automations", "tips-and-tricks"]);
    expect(result).toEqual({ slug: "automation-editor/building-automations/tips-and-tricks", action: null });
  });

  it("detects embed action", () => {
    const result = extractSlug(["getting-started", "embed"]);
    expect(result).toEqual({ slug: "getting-started", action: "embed" });
  });

  it("detects embed action on nested slug", () => {
    const result = extractSlug(["automation-editor", "key-concepts", "embed"]);
    expect(result).toEqual({ slug: "automation-editor/key-concepts", action: "embed" });
  });

  it("handles doc named 'embed' (collision case)", () => {
    // This is a known issue — a doc with slug ending in "embed" is unreachable via GET
    const result = extractSlug(["getting-started", "embed"]);
    expect(result.action).toBe("embed"); // Will treat as action, not doc
  });
});
