"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { RichEditor } from "@/components/rich-editor";
import { DOC_TYPE_LABELS, PRODUCT_LABELS } from "@/lib/constants";

interface DocData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  doc_type: string;
  product: string | null;
  tags: string[];
  status: "draft" | "published" | "archived";
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface DocVersion {
  id: string;
  version: number;
  title: string;
  changed_by: string;
  change_summary: string | null;
  created_at: string;
}

const DOC_TYPES = Object.entries(DOC_TYPE_LABELS).map(([key, label]) => ({ key, label }));
const PRODUCTS = Object.entries(PRODUCT_LABELS).map(([key, label]) => ({ key, label }));

export function DocEditor({ slug }: { slug: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [docType, setDocType] = useState("guide");
  const [product, setProduct] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [changeSummary, setChangeSummary] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load document
  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/docs/${slug}?any_status=true`);
        if (!res.ok) {
          setSaveMessage({ type: "error", text: "Failed to load document" });
          setLoading(false);
          return;
        }
        const json = await res.json();
        const d = json.data as DocData;
        setDoc(d);
        setTitle(d.title);
        setDescription(d.description || "");
        setBody(d.body || "");
        setDocType(d.doc_type);
        setProduct(d.product || "");
        setTags(d.tags || []);
        setStatus(d.status);
      } catch {
        setSaveMessage({ type: "error", text: "Failed to load document" });
      }
      setLoading(false);
    }
    loadDoc();
  }, [slug]);

  // Load versions
  useEffect(() => {
    if (!doc?.id) return;
    async function loadVersions() {
      try {
        const res = await fetch(`/api/docs/${slug}/versions`);
        if (res.ok) {
          const json = await res.json();
          setVersions(json.data || []);
        }
      } catch {
        // Versions are optional
      }
    }
    loadVersions();
  }, [doc?.id, slug]);

  const save = useCallback(async (newStatus?: "draft" | "published" | "archived") => {
    setSaving(true);
    setSaveMessage(null);

    const payload: Record<string, unknown> = {
      title,
      description: description || null,
      doc_body: body,
      doc_type: docType,
      product: product || null,
      tags,
      status: newStatus || status,
      change_summary: changeSummary || undefined,
    };

    try {
      const res = await fetch(`/api/docs/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setSaveMessage({ type: "error", text: err.error || "Save failed" });
        setSaving(false);
        return;
      }

      const json = await res.json();
      const d = json.data;
      setDoc(d);
      if (newStatus) setStatus(newStatus);
      setChangeSummary("");
      setSaveMessage({ type: "success", text: `Saved v${d.version}` });

      // Clear message after 3s
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: "error", text: "Network error" });
    }
    setSaving(false);
  }, [title, description, body, docType, product, tags, status, changeSummary, slug]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: "var(--space-8)", color: "var(--text-tertiary)", fontFamily: "var(--font-geist-mono), monospace" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: "var(--space-8)", color: "#ef4444" }}>
          Document not found or access denied.
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <button
            onClick={() => router.push(`/docs/${slug}`)}
            style={toolbarBtnStyle}
            title="Back to doc"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span style={{ fontSize: "13px", color: "var(--text-tertiary)", fontFamily: "var(--font-geist-mono), monospace" }}>
            /{slug}
          </span>
          <span style={{
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: status === "published" ? "rgba(26, 183, 89, 0.12)" : status === "archived" ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)",
            color: status === "published" ? "var(--accent-primary)" : status === "archived" ? "#ef4444" : "var(--accent-amber)",
          }}>
            {status}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {saveMessage && (
            <span style={{
              fontSize: "12px",
              color: saveMessage.type === "success" ? "var(--accent-primary)" : "#ef4444",
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={() => setShowVersions(!showVersions)}
            style={{
              ...toolbarBtnStyle,
              background: showVersions ? "var(--accent-primary-muted)" : "transparent",
              color: showVersions ? "var(--accent-primary)" : "var(--text-tertiary)",
            }}
            title="Version history"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <div style={{ width: "1px", height: "20px", background: "var(--border-primary)", margin: "0 var(--space-1)" }} />
          <button
            onClick={() => save()}
            disabled={saving}
            style={saveBtnStyle}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {status !== "published" && (
            <button
              onClick={() => save("published")}
              disabled={saving}
              style={publishBtnStyle}
            >
              Publish
            </button>
          )}
          {status === "published" && (
            <button
              onClick={() => save("draft")}
              disabled={saving}
              style={{
                ...saveBtnStyle,
                background: "rgba(245, 158, 11, 0.12)",
                color: "var(--accent-amber)",
              }}
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Editor panel (metadata + rich editor) */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Metadata fields */}
          <div style={metaFieldsStyle}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              style={{
                ...fieldInputStyle,
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                border: "none",
                padding: "0",
                background: "transparent",
              }}
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              style={{
                ...fieldInputStyle,
                fontSize: "14px",
                color: "var(--text-secondary)",
                border: "none",
                padding: "0",
                background: "transparent",
                marginTop: "var(--space-2)",
              }}
            />

            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
              <div style={{ minWidth: "140px" }}>
                <label style={metaLabelStyle}>Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  style={selectStyle}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ minWidth: "140px" }}>
                <label style={metaLabelStyle}>Product</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">None</option>
                  {PRODUCTS.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={metaLabelStyle}>Tags</label>
                <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", alignItems: "center" }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 8px",
                        fontSize: "12px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--accent-primary-muted)",
                        color: "var(--accent-primary)",
                        fontFamily: "var(--font-geist-mono), monospace",
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-primary)",
                          cursor: "pointer",
                          padding: "0",
                          fontSize: "14px",
                          lineHeight: 1,
                          fontFamily: "inherit",
                        }}
                      >
                        x
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    onBlur={addTag}
                    placeholder="Add tag..."
                    style={{
                      ...fieldInputStyle,
                      width: "100px",
                      fontSize: "12px",
                      padding: "4px 6px",
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: "var(--space-3)" }}>
              <label style={metaLabelStyle}>Change summary (optional)</label>
              <input
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="Describe what changed..."
                style={{
                  ...fieldInputStyle,
                  fontSize: "13px",
                }}
              />
            </div>
          </div>

          {/* WYSIWYG Rich Editor */}
          {doc ? (
            <RichEditor
              key={doc.id}
              initialContent={body}
              onChange={setBody}
              onSave={() => save()}
            />
          ) : (
            <div style={{ padding: "var(--space-8)", color: "var(--text-tertiary)", textAlign: "center" }}>
              Loading editor...
            </div>
          )}
        </div>

        {/* Versions panel */}
        {showVersions && (
          <div style={{
            width: "280px",
            flexShrink: 0,
            overflow: "auto",
            padding: "var(--space-4)",
            background: "var(--bg-secondary)",
            borderLeft: "1px solid var(--border-primary)",
          }}>
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-geist-mono), monospace",
              marginBottom: "var(--space-4)",
            }}>
              Version History
            </div>
            {versions.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>No versions yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {versions.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-primary)",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                        v{v.version}
                      </span>
                      <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {v.change_summary && (
                      <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                        {v.change_summary}
                      </div>
                    )}
                    <div style={{ color: "var(--text-tertiary)", marginTop: "2px" }}>
                      by {v.changed_by}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  background: "var(--bg-primary)",
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 var(--space-4)",
  height: "48px",
  borderBottom: "1px solid var(--border-primary)",
  background: "var(--bg-secondary)",
  flexShrink: 0,
};

const toolbarBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "transparent",
  color: "var(--text-tertiary)",
  cursor: "pointer",
  transition: "background 0.1s, color 0.1s",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: 500,
  fontFamily: "inherit",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-secondary)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  cursor: "pointer",
  transition: "background 0.1s, border-color 0.1s",
};

const publishBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: 500,
  fontFamily: "inherit",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "var(--accent-primary)",
  color: "#fff",
  cursor: "pointer",
  transition: "opacity 0.1s",
};

const metaFieldsStyle: React.CSSProperties = {
  padding: "var(--space-6)",
  borderBottom: "1px solid var(--border-primary)",
};

const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  fontSize: "14px",
  fontFamily: "inherit",
  background: "var(--bg-surface)",
  border: "1px solid var(--border-primary)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  fontSize: "13px",
  fontFamily: "var(--font-geist-mono), monospace",
  background: "var(--bg-surface)",
  border: "1px solid var(--border-primary)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const metaLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: "var(--space-1)",
  fontFamily: "var(--font-geist-mono), monospace",
};
