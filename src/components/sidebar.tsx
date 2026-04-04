import Link from "next/link";
import { SidebarTree, MobileSidebarToggle } from "@/components/sidebar-tree";
import type { TreeNode } from "@/components/sidebar-tree";

async function fetchTree(): Promise<TreeNode[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/docs/tree`, {
      next: { revalidate: 60, tags: ["docs-tree"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function Sidebar() {
  const tree = await fetchTree();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="desktop-sidebar"
        style={{
          width: "var(--sidebar-width)",
          flexShrink: 0,
          borderRight: "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
          overflowY: "auto",
          padding: "var(--space-4)",
          position: "sticky",
          top: "52px",
          height: "calc(100vh - 52px)",
          display: "block",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text-primary)",
            textDecoration: "none",
            display: "block",
            marginBottom: "var(--space-6)",
          }}
        >
          APIANT Docs
        </Link>
        {tree.length > 0 ? (
          <SidebarTree tree={tree} />
        ) : (
          <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
            No documents yet.
          </p>
        )}
      </aside>

      {/* Mobile hamburger + drawer */}
      <MobileSidebarToggle tree={tree} />

      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
        }
        .desktop-sidebar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .desktop-sidebar:hover {
          scrollbar-color: var(--border-secondary) transparent;
        }
        .desktop-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        .desktop-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .desktop-sidebar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 3px;
        }
        .desktop-sidebar:hover::-webkit-scrollbar-thumb {
          background: var(--border-secondary);
        }
        .desktop-sidebar::-webkit-scrollbar-thumb:hover {
          background: var(--border-hover);
        }
      `}</style>
    </>
  );
}
