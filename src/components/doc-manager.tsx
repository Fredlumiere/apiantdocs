"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PRODUCT_LABELS, DOC_TYPE_LABELS } from "@/lib/constants";

interface DocListItem {
  id: string;
  slug: string;
  title: string;
  doc_type: string;
  product: string | null;
  status: "draft" | "published" | "archived";
  tags: string[];
  version: number;
  updated_at: string;
}

type StatusFilter = "all" | "published" | "draft" | "archived";

export function DocManager() {
  const [docs, setDocs] = useState<DocListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [productFilter, setProductFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all statuses by making individual requests
      const statuses: string[] = statusFilter === "all"
        ? ["published", "draft", "archived"]
        : [statusFilter];

      const allDocs: DocListItem[] = [];
      for (const s of statuses) {
        const params = new URLSearchParams({ status: s, limit: "200" });
        if (productFilter) params.set("product", productFilter);
        const res = await fetch(`/api/docs?${params}`);
        if (res.ok) {
          const json = await res.json();
          allDocs.push(...(json.data || []));
        }
      }

      // Sort by updated_at descending
      allDocs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setDocs(allDocs);
    } catch {
      setMessage({ type: "error", text: "Failed to load documents" });
    }
    setLoading(false);
  }, [statusFilter, productFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function updateDocStatus(slug: string, newStatus: "draft" | "published" | "archived") {
    setActionLoading(slug);
    setMessage(null);
    try {
      const res = await fetch(`/api/docs/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Action failed" });
      } else {
        setMessage({ type: "success", text: `${slug} ${newStatus === "published" ? "published" : newStatus === "draft" ? "unpublished" : "archived"}` });
        await fetchDocs();
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setActionLoading(null);
  }

  const filteredDocs = search
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.slug.toLowerCase().includes(search.toLowerCase())
      )
    : docs;

  const PRODUCTS = Object.entries(PRODUCT_LABELS);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border-primary)",
        background: "var(--bg-secondary)",
        padding: "0 var(--space-6)",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            <img src="/apiant-logo.svg" alt="APIANT" style={{ height: "23px", width: "auto" }} />
            <span style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              background: "var(--accent-primary-subtle)",
              padding: "2px 6px",
              borderRadius: "4px",
              marginLeft: "6px",
            }}>
              docs
            </span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <Link href="/docs" style={{ fontSize: "14px", color: "var(--text-secondary)", textDecoration: "none" }}>
              Docs
            </Link>
            <Link href="/dashboard" style={{ fontSize: "14px", color: "var(--text-secondary)", textDecoration: "none" }}>
              Dashboard
            </Link>
            <Link href="/dashboard/docs" style={{ fontSize: "14px", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>
              Manage Docs
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--space-8) var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-6)" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
              Documents
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              {filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {message && (
          <div style={{
            padding: "var(--space-3) var(--space-4)",
            marginBottom: "var(--space-4)",
            fontSize: "13px",
            borderRadius: "var(--radius-md)",
            color: message.type === "success" ? "var(--accent-primary)" : "#ef4444",
            background: message.type === "success" ? "rgba(26, 183, 89, 0.08)" : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${message.type === "success" ? "rgba(26, 183, 89, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: "flex",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or slug..."
            style={{
              padding: "8px 12px",
              fontSize: "13px",
              fontFamily: "inherit",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              outline: "none",
              width: "260px",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "var(--space-1)", background: "var(--bg-surface)", borderRadius: "var(--radius-md)", padding: "3px" }}>
            {(["all", "published", "draft", "archived"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  background: statusFilter === s ? "var(--bg-secondary)" : "transparent",
                  color: statusFilter === s ? "var(--text-primary)" : "var(--text-tertiary)",
                  transition: "background 0.1s, color 0.1s",
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: "13px",
              fontFamily: "var(--font-geist-mono), monospace",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          >
            <option value="">All products</option>
            {PRODUCTS.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: "var(--space-8)", color: "var(--text-tertiary)", fontFamily: "var(--font-geist-mono), monospace", textAlign: "center" }}>
            Loading...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}>
              <thead>
                <tr>
                  {["Title", "Slug", "Status", "Type", "Product", "Ver", "Updated", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "var(--space-3) var(--space-3)",
                        borderBottom: "2px solid var(--border-secondary)",
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--text-tertiary)",
                        fontFamily: "var(--font-geist-mono), monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((d) => (
                  <tr
                    key={d.id}
                    style={{ borderBottom: "1px solid var(--border-primary)" }}
                  >
                    <td style={cellStyle}>
                      <Link
                        href={`/edit/${d.slug}`}
                        style={{
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        {d.title}
                      </Link>
                    </td>
                    <td style={{ ...cellStyle, fontFamily: "var(--font-geist-mono), monospace", fontSize: "12px", color: "var(--text-tertiary)" }}>
                      {d.slug}
                    </td>
                    <td style={cellStyle}>
                      <span style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background: d.status === "published" ? "rgba(26, 183, 89, 0.12)" : d.status === "archived" ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)",
                        color: d.status === "published" ? "var(--accent-primary)" : d.status === "archived" ? "#ef4444" : "var(--accent-amber)",
                      }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, fontSize: "12px", color: "var(--text-secondary)" }}>
                      {DOC_TYPE_LABELS[d.doc_type] || d.doc_type}
                    </td>
                    <td style={{ ...cellStyle, fontSize: "12px", color: "var(--text-secondary)" }}>
                      {d.product ? (PRODUCT_LABELS[d.product] || d.product) : "-"}
                    </td>
                    <td style={{ ...cellStyle, fontFamily: "var(--font-geist-mono), monospace", fontSize: "12px", color: "var(--text-tertiary)" }}>
                      {d.version}
                    </td>
                    <td style={{ ...cellStyle, fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-geist-mono), monospace", whiteSpace: "nowrap" }}>
                      {new Date(d.updated_at).toLocaleDateString()}
                    </td>
                    <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "var(--space-1)" }}>
                        <Link
                          href={`/edit/${d.slug}`}
                          style={actionBtnStyle}
                        >
                          Edit
                        </Link>
                        {d.status !== "published" && (
                          <button
                            onClick={() => updateDocStatus(d.slug, "published")}
                            disabled={actionLoading === d.slug}
                            style={{ ...actionBtnStyle, color: "var(--accent-primary)" }}
                          >
                            Publish
                          </button>
                        )}
                        {d.status === "published" && (
                          <button
                            onClick={() => updateDocStatus(d.slug, "draft")}
                            disabled={actionLoading === d.slug}
                            style={{ ...actionBtnStyle, color: "var(--accent-amber)" }}
                          >
                            Unpublish
                          </button>
                        )}
                        {d.status !== "archived" && (
                          <button
                            onClick={() => updateDocStatus(d.slug, "archived")}
                            disabled={actionLoading === d.slug}
                            style={{ ...actionBtnStyle, color: "#ef4444" }}
                          >
                            Archive
                          </button>
                        )}
                        {d.status === "archived" && (
                          <button
                            onClick={() => updateDocStatus(d.slug, "draft")}
                            disabled={actionLoading === d.slug}
                            style={{ ...actionBtnStyle, color: "var(--accent-amber)" }}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDocs.length === 0 && (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                No documents found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "var(--space-3)",
  verticalAlign: "middle",
};

const actionBtnStyle: React.CSSProperties = {
  padding: "3px 8px",
  fontSize: "12px",
  fontWeight: 500,
  fontFamily: "var(--font-geist-mono), monospace",
  background: "none",
  border: "1px solid var(--border-primary)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  transition: "border-color 0.1s",
};
