export const metadata = {
  title: "API Reference | APIANT Docs",
  description: "REST API reference for APIANT documentation platform",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/docs",
    description: "List published documents",
    params: [
      { name: "product", type: "string", desc: "Filter by product (platform, api-apps, mcp)" },
      { name: "type", type: "string", desc: "Filter by doc type (guide, api-ref, tutorial, changelog)" },
      { name: "tag", type: "string", desc: "Filter by tag" },
      { name: "limit", type: "number", desc: "Max results (default 50, max 500)" },
      { name: "offset", type: "number", desc: "Pagination offset" },
    ],
    auth: "None (public)",
  },
  {
    method: "GET",
    path: "/api/docs/{slug}",
    description: "Get a single document by slug",
    params: [
      { name: "slug", type: "path", desc: "Document slug (supports nested paths like automation-editor/key-concepts)" },
    ],
    auth: "None (published only). Add ?any_status=true with auth for drafts.",
  },
  {
    method: "POST",
    path: "/api/docs",
    description: "Create a new document",
    params: [
      { name: "slug", type: "string", desc: "URL slug (required)" },
      { name: "title", type: "string", desc: "Document title (required)" },
      { name: "doc_body", type: "string", desc: "Markdown content (required)" },
      { name: "doc_type", type: "string", desc: "guide | api-ref | tutorial | changelog (required)" },
      { name: "description", type: "string", desc: "Short description" },
      { name: "product", type: "string", desc: "platform | api-apps | mcp" },
      { name: "tags", type: "string[]", desc: "Array of tags" },
      { name: "status", type: "string", desc: "draft | published (default: draft)" },
    ],
    auth: "API key or session (write permission)",
  },
  {
    method: "PATCH",
    path: "/api/docs/{slug}",
    description: "Update an existing document",
    params: [
      { name: "title", type: "string", desc: "New title" },
      { name: "doc_body", type: "string", desc: "New markdown content" },
      { name: "description", type: "string", desc: "New description" },
      { name: "status", type: "string", desc: "draft | published | archived" },
      { name: "tags", type: "string[]", desc: "Replace tags" },
      { name: "change_summary", type: "string", desc: "Version change note" },
    ],
    auth: "API key or session (write permission)",
  },
  {
    method: "DELETE",
    path: "/api/docs/{slug}",
    description: "Delete a document",
    params: [],
    auth: "API key or session (write permission)",
  },
  {
    method: "GET",
    path: "/api/docs/tree",
    description: "Get the full document hierarchy as a nested tree",
    params: [],
    auth: "None (public, cached 60s)",
  },
  {
    method: "GET",
    path: "/api/search",
    description: "Search documents",
    params: [
      { name: "q", type: "string", desc: "Search query (min 2 chars, required)" },
      { name: "mode", type: "string", desc: "keyword | semantic | hybrid (default: hybrid if Voyage configured)" },
      { name: "product", type: "string", desc: "Filter by product" },
      { name: "limit", type: "number", desc: "Max results (default 10, max 50)" },
    ],
    auth: "None (public)",
  },
  {
    method: "POST",
    path: "/api/chat",
    description: "Ask a question about APIANT documentation (RAG-powered)",
    params: [
      { name: "question", type: "string", desc: "Your question (min 3 chars, max 500)" },
      { name: "product", type: "string", desc: "Limit to a specific product" },
    ],
    auth: "None (rate limited: 10 req/min per IP)",
  },
  {
    method: "GET",
    path: "/api/keys",
    description: "List your API keys",
    params: [],
    auth: "Session (logged in)",
  },
  {
    method: "POST",
    path: "/api/keys",
    description: "Create a new API key",
    params: [
      { name: "name", type: "string", desc: "Key name (required)" },
      { name: "permissions", type: "string[]", desc: "read | write | admin" },
    ],
    auth: "Session (logged in)",
  },
];

const methodColors: Record<string, string> = {
  GET: "var(--accent-primary)",
  POST: "var(--accent-cyan)",
  PATCH: "var(--accent-amber)",
  DELETE: "#ef4444",
};

export default function ApiReferencePage() {
  return (
    <main style={{
      maxWidth: "900px",
      margin: "0 auto",
      padding: "var(--space-8) var(--space-6)",
    }}>
      <h1 style={{
        fontSize: "32px",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "var(--text-primary)",
        marginBottom: "var(--space-2)",
      }}>
        API Reference
      </h1>
      <p style={{
        fontSize: "16px",
        color: "var(--text-secondary)",
        marginBottom: "var(--space-8)",
        lineHeight: 1.6,
      }}>
        REST API for reading, creating, and managing APIANT documentation. Authenticate with an API key (<code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: "4px", fontSize: "0.9em" }}>Bearer ak_...</code>) or a Supabase session cookie.
      </p>

      <div style={{
        display: "flex",
        gap: "var(--space-3)",
        marginBottom: "var(--space-8)",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>Base URL:</span>
        <code style={{
          background: "var(--bg-tertiary)",
          padding: "3px 10px",
          borderRadius: "var(--radius-sm)",
          fontSize: "13px",
          fontFamily: "var(--font-geist-mono), monospace",
          color: "var(--text-primary)",
        }}>
          https://apiantdocs-fredlumieres-projects.vercel.app
        </code>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {endpoints.map((ep, i) => (
          <div
            key={i}
            style={{
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              padding: "var(--space-3) var(--space-4)",
              background: "var(--bg-surface)",
              borderBottom: "1px solid var(--border-primary)",
            }}>
              <span style={{
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-geist-mono), monospace",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                color: methodColors[ep.method] || "var(--text-primary)",
                border: `1px solid ${methodColors[ep.method] || "var(--border-primary)"}`,
                minWidth: "52px",
                textAlign: "center" as const,
              }}>
                {ep.method}
              </span>
              <code style={{
                fontSize: "14px",
                fontFamily: "var(--font-geist-mono), monospace",
                color: "var(--text-primary)",
                fontWeight: 500,
              }}>
                {ep.path}
              </code>
            </div>
            <div style={{ padding: "var(--space-3) var(--space-4)" }}>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 var(--space-2) 0" }}>
                {ep.description}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "0 0 var(--space-3) 0" }}>
                Auth: {ep.auth}
              </p>
              {ep.params.length > 0 && (
                <div style={{ fontSize: "13px" }}>
                  {ep.params.map((p, j) => (
                    <div key={j} style={{
                      display: "flex",
                      gap: "var(--space-3)",
                      padding: "4px 0",
                      borderTop: j > 0 ? "1px solid var(--border-primary)" : "none",
                    }}>
                      <code style={{
                        fontFamily: "var(--font-geist-mono), monospace",
                        color: "var(--accent-primary)",
                        fontSize: "12px",
                        minWidth: "120px",
                        flexShrink: 0,
                      }}>
                        {p.name}
                      </code>
                      <span style={{ color: "var(--text-tertiary)", fontSize: "11px", minWidth: "60px", flexShrink: 0 }}>
                        {p.type}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>{p.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: "var(--space-12)",
        padding: "var(--space-6)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-surface)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
          MCP Server
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "var(--space-3)", lineHeight: 1.6 }}>
          Access the docs API from Claude Code or any MCP client. Available tools: <code>docs_list</code>, <code>docs_read</code>, <code>docs_search</code>, <code>docs_create</code>, <code>docs_update</code>, <code>docs_chat</code>, <code>docs_login</code>, <code>docs_api_key</code>.
        </p>
        <pre style={{
          background: "var(--bg-tertiary)",
          padding: "var(--space-3)",
          borderRadius: "var(--radius-md)",
          fontSize: "13px",
          fontFamily: "var(--font-geist-mono), monospace",
          color: "var(--text-primary)",
          overflowX: "auto",
        }}>{`// .claude/settings.json
{
  "mcpServers": {
    "apiantdocs": {
      "command": "node",
      "args": ["packages/mcp-server/dist/index.js"],
      "env": {
        "APIANTDOCS_API_KEY": "ak_your_key_here"
      }
    }
  }
}`}</pre>
      </div>
    </main>
  );
}
