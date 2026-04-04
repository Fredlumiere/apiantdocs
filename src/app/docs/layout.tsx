import { Sidebar } from "@/components/sidebar";
import { DocsHeaderWrapper } from "@/components/docs-header-wrapper";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Docs header with search */}
      <DocsHeaderWrapper />

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
