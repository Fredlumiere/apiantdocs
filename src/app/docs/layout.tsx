import { Sidebar } from "@/components/sidebar";
import { SearchModal } from "@/components/search-modal";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Docs header with search */}
      <header style={{
        borderBottom: "1px solid var(--border-primary)",
        padding: "var(--space-3) var(--space-4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-secondary)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          {/* Mobile hamburger will render here via MobileSidebarToggle */}
        </div>
        <SearchModal />
      </header>

      {/* Three-column layout */}
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <div
          className="docs-content-area"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
