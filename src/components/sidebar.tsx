import { SidebarTree, MobileSidebarToggle } from "@/components/sidebar-tree";
import { SidebarResize } from "@/components/sidebar-resize";
import type { TreeNode } from "@/components/sidebar-tree";
import { createServerClient } from "@/lib/supabase";
import { buildTree, type FlatDoc } from "@/lib/doc-tree";

async function fetchTree(): Promise<TreeNode[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("documents")
      .select("id, slug, title, doc_type, product, parent_id, sort_order")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    return buildTree((data as FlatDoc[]) || []);
  } catch {
    return [];
  }
}

export async function Sidebar() {
  const tree = await fetchTree();

  return (
    <>
      {/* Sidebar wrapper for resize handle positioning */}
      <div className="sidebar-wrapper">
        <aside
          className="desktop-sidebar"
          style={{
            width: "100%",
            borderRight: "1px solid var(--border-primary)",
            background: "var(--bg-secondary)",
            overflowY: "auto",
            padding: "var(--space-4)",
            height: "100%",
          }}
        >
          {tree.length > 0 ? (
            <SidebarTree tree={tree} />
          ) : (
            <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
              No documents yet.
            </p>
          )}
        </aside>
        <SidebarResize />
      </div>

      {/* Mobile hamburger + drawer */}
      <MobileSidebarToggle tree={tree} />

      <style>{`
        .sidebar-wrapper {
          position: sticky;
          top: 52px;
          height: calc(100vh - 52px);
          width: var(--sidebar-width);
          flex-shrink: 0;
        }
        @media (max-width: 767px) {
          .sidebar-wrapper { display: none !important; }
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
