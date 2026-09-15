import { Sidebar, fetchTree } from "@/components/sidebar";
import { DocsHeaderWrapper } from "@/components/docs-header-wrapper";
import { ApiantAiFooter } from "@/components/apiant-ai-footer";
import { docSections } from "@/lib/doc-sections";
import { isApiantAiSite } from "@/lib/site";

// Kept synchronous so the classic render (and its RSC payload) is exactly
// what it was before the apiant.ai branch existed.
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isApiantAiSite()) return <ApiantAiDocsLayout>{children}</ApiantAiDocsLayout>;

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

/**
 * apiant.ai docs zone: apiant.ai's menu and footer around the docs, all on
 * apiant.ai's widths (1200px row, 24px gutters; footer sized by site.js). The tree
 * is fetched once here and shared by the sidebar and the submenu's section
 * tabs.
 */
async function ApiantAiDocsLayout({ children }: { children: React.ReactNode }) {
  const tree = await fetchTree();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <DocsHeaderWrapper sections={docSections(tree)} />

      {/* apiant.ai's 1200px row, so the sidebar lines up under the logo */}
      <div className="aai-body">
        <Sidebar tree={tree} />
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

      <ApiantAiFooter />
    </div>
  );
}
