import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { render, cleanup, within } from "@testing-library/react";
import { DocsHeaderWrapper } from "@/components/docs-header-wrapper";
import { ApiantAiFooter } from "@/components/apiant-ai-footer";
import { docSections, sectionForSlug, slugFromPathname } from "@/lib/doc-sections";
import type { TreeNode } from "@/lib/doc-tree";

let pathname = "/docs/automations/triggers/polling";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => pathname,
}));

vi.mock("@/components/auth-provider", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: async () => {} }),
}));

function node(slug: string, title: string, children: TreeNode[] = []): TreeNode {
  return { id: slug, slug, title, doc_type: "guide", product: "apiant-ai", sort_order: 0, children };
}

const tree: TreeNode[] = [
  node("introduction", "Introduction"),
  node("automations", "Automations", [node("automations/triggers", "Triggers", [node("automations/triggers/polling", "Polling triggers")])]),
  node("interfaces", "Forms, chat, web services and tools"),
];

// jsdom lacks these browser APIs the header components call.
beforeAll(() => {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) },
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (media: string) => ({ matches: false, media, addEventListener: () => {}, removeEventListener: () => {} }),
  });
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  pathname = "/docs/automations/triggers/polling";
});

describe("classic site header", () => {
  it("does not render the apiant.ai menu, submenu or brand rule", () => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_SITE", "");
    vi.stubEnv("DOCS_SITE", "");
    const { container } = render(<DocsHeaderWrapper />);
    expect(container.querySelector("#siteMenu")).toBeNull();
    expect(container.querySelector(".sm")).toBeNull();
    expect(container.querySelector(".aai-chrome")).toBeNull();
    expect(container.querySelector(".aai-sub")).toBeNull();
    expect(container.querySelector('a[href^="https://apiant.ai"]')).toBeNull();
    // The classic header is still there: its logo and theme toggle.
    expect(container.querySelector('img[src="/apiant-logo.svg"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label$="mode"]')).not.toBeNull();
  });
});

describe("apiant.ai site header", () => {
  it("renders apiant.ai's menu with absolute links and Docs current", () => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_SITE", "apiant-ai");
    const { container } = render(<DocsHeaderWrapper sections={docSections(tree)} />);
    const menu = container.querySelector("#siteMenu") as HTMLElement;
    expect(menu).not.toBeNull();
    const links = within(menu).getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")]);
    expect(links).toEqual([
      [".AI", "https://apiant.ai/"],
      ["Apps", "https://apiant.ai/apps"],
      ["Pricing", "https://apiant.ai/pricing"],
      ["Docs", "https://apiant.ai/docs"],
      ["Community", "https://discord.gg/qPakRsr28K"],
      ["Sign in", "https://app.apiant.ai"],
      ["Start free", "https://app.apiant.ai/register"],
    ]);
    expect(within(menu).getByText("Docs").getAttribute("aria-current")).toBe("page");
    // No theme toggle in the dark-only zone.
    expect(container.querySelector('button[aria-label$="mode"]')).toBeNull();
    expect(container.querySelector(".aai-rule")).not.toBeNull();
  });

  it("marks the section of a deep page as the active tab", () => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_SITE", "apiant-ai");
    const { container } = render(<DocsHeaderWrapper sections={docSections(tree)} />);
    const tabs = [...container.querySelectorAll(".aai-tab")];
    expect(tabs.map((t) => t.textContent)).toEqual(["Introduction", "Automations", "Forms & chat"]);
    expect(tabs.filter((t) => t.getAttribute("aria-current")).map((t) => t.textContent)).toEqual(["Automations"]);
  });

  it("marks no tab on the docs home", () => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_SITE", "apiant-ai");
    pathname = "/docs";
    const { container } = render(<DocsHeaderWrapper sections={docSections(tree)} />);
    expect(container.querySelector(".aai-tab[aria-current]")).toBeNull();
  });

  it("renders apiant.ai's footer with absolute links", () => {
    const { container } = render(<ApiantAiFooter />);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("https://apiant.ai/docs");
    expect(hrefs.every((h) => /^https:\/\//.test(h || ""))).toBe(true);
  });
});

describe("doc sections", () => {
  it("resolves a page to its root section", () => {
    const sections = docSections(tree);
    expect(sectionForSlug(sections, "automations/triggers/polling")?.slug).toBe("automations");
    expect(sectionForSlug(sections, "interfaces")?.label).toBe("Forms & chat");
    expect(sectionForSlug(sections, "")).toBeNull();
    expect(sectionForSlug(sections, "nope")).toBeNull();
    expect(slugFromPathname("/docs/automations/triggers/")).toBe("automations/triggers");
    expect(slugFromPathname("/docs")).toBe("");
    expect(slugFromPathname("/docs/automations%2Ftriggers%2Fpolling")).toBe("automations/triggers/polling");
    expect(slugFromPathname("/docs/bad%E0%A4%A")).toBe("bad%E0%A4%A");
  });
});
