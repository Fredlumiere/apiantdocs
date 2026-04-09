"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ApiKeyEntry {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  created_at: string;
  last_used_at: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch keys");
      }
      const data = await res.json();
      setKeys(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create key");
      }

      const data = await res.json();
      setCreatedKey(data.data.key);
      setNewKeyName("");
      setNewKeyPermissions(["read"]);
      setShowCreateForm(false);
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;

    setRevoking(id);
    setError(null);

    try {
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke key");
      }

      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    } finally {
      setRevoking(null);
    }
  }

  function togglePermission(perm: string) {
    setNewKeyPermissions((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  }

  async function copyKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
          padding: "0 var(--space-6)",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            <img src="/apiant-logo.svg" alt="APIANT" style={{ height: "23px", width: "auto" }} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent-primary)",
                background: "var(--accent-primary-subtle)",
                padding: "2px 6px",
                borderRadius: "4px",
                marginLeft: "6px",
              }}
            >
              docs
            </span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <Link
              href="/dashboard"
              style={{ fontSize: "14px", color: "var(--text-secondary)", textDecoration: "none" }}
            >
              Dashboard
            </Link>
            <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>
              API Keys
            </span>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "var(--space-8) var(--space-6)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-6)",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>
              API Keys
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Manage your API keys for programmatic access.
            </p>
          </div>
          {!showCreateForm && !createdKey && (
            <button
              onClick={() => setShowCreateForm(true)}
              style={primaryButtonStyle}
            >
              Create API Key
            </button>
          )}
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", fontFamily: "inherit" }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Newly created key — show once */}
        {createdKey && (
          <div
            style={{
              padding: "var(--space-4)",
              marginBottom: "var(--space-6)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-accent)",
              background: "var(--accent-primary-subtle)",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--accent-primary)",
                marginBottom: "var(--space-2)",
              }}
            >
              API key created. Copy it now — you won&apos;t see it again.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <code
                style={{
                  flex: 1,
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--bg-primary)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-secondary)",
                  fontSize: "13px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  color: "var(--text-primary)",
                  wordBreak: "break-all",
                }}
              >
                {createdKey}
              </code>
              <button onClick={copyKey} style={secondaryButtonStyle}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {/* MCP Setup Instructions */}
            <div
              style={{
                marginTop: "var(--space-4)",
                padding: "var(--space-4)",
                background: "var(--bg-primary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-secondary)",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Connect via MCP (Claude Code)
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-tertiary)",
                  marginBottom: "var(--space-3)",
                  lineHeight: 1.5,
                }}
              >
                Run this command in your terminal to connect APIANT Docs to Claude Code:
              </p>
              <div style={{ position: "relative" }}>
                <pre
                  style={{
                    padding: "var(--space-3)",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-primary)",
                    fontSize: "12px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    lineHeight: 1.6,
                    margin: 0,
                    paddingRight: "60px",
                  }}
                >{`curl -sf https://info.apiant.com/apiant-docs-mcp.js -o ~/.apiant-docs-mcp.js && claude mcp add apiant-docs -s user -- node ~/.apiant-docs-mcp.js --api-key ${createdKey}`}</pre>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `curl -sf https://info.apiant.com/apiant-docs-mcp.js -o ~/.apiant-docs-mcp.js && claude mcp add apiant-docs -s user -- node ~/.apiant-docs-mcp.js --api-key ${createdKey}`
                    );
                    setCopiedMcp(true);
                    setTimeout(() => setCopiedMcp(false), 2000);
                  }}
                  style={{
                    ...secondaryButtonStyle,
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    padding: "3px 8px",
                    fontSize: "11px",
                  }}
                >
                  {copiedMcp ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setCreatedKey(null)}
              style={{
                marginTop: "var(--space-3)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
              }}
            >
              Done
            </button>
          </div>
        )}

        {/* Create form */}
        {showCreateForm && (
          <div
            style={{
              padding: "var(--space-6)",
              marginBottom: "var(--space-6)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              background: "var(--bg-secondary)",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-4)" }}>
              Create new API key
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label htmlFor="key-name" style={labelStyle}>
                  Name
                </label>
                <input
                  id="key-name"
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  required
                  placeholder="e.g. Claude Code, CI pipeline"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "var(--space-6)" }}>
                <label style={labelStyle}>Permissions</label>
                <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
                  {["read", "write", "admin"].map((perm) => (
                    <label
                      key={perm}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        style={{ accentColor: "var(--accent-primary)" }}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    ...primaryButtonStyle,
                    opacity: creating ? 0.6 : 1,
                  }}
                >
                  {creating ? "Creating..." : "Create key"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Keys list */}
        {loading ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)" }}>
            Loading...
          </div>
        ) : keys.length === 0 ? (
          <div
            style={{
              padding: "var(--space-8)",
              textAlign: "center",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              background: "var(--bg-secondary)",
            }}
          >
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              No API keys yet.
            </p>
            {!showCreateForm && (
              <button onClick={() => setShowCreateForm(true)} style={primaryButtonStyle}>
                Create your first API key
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              overflow: "hidden",
            }}
          >
            {keys.map((key, i) => (
              <div
                key={key.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-4) var(--space-6)",
                  background: "var(--bg-secondary)",
                  borderBottom: i < keys.length - 1 ? "1px solid var(--border-primary)" : "none",
                  gap: "var(--space-4)",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {key.name}
                    </span>
                    {key.permissions.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: "11px",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: p === "admin" ? "rgba(239,68,68,0.1)" : p === "write" ? "var(--accent-gold-muted)" : "var(--accent-primary-muted)",
                          color: p === "admin" ? "#ef4444" : p === "write" ? "var(--accent-gold)" : "var(--accent-primary)",
                          fontFamily: "var(--font-geist-mono), monospace",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                    {key.key_prefix}...
                    <span style={{ marginLeft: "var(--space-3)", fontFamily: "inherit" }}>
                      Created {new Date(key.created_at).toLocaleDateString()}
                    </span>
                    {key.last_used_at && (
                      <span style={{ marginLeft: "var(--space-3)" }}>
                        Last used {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  disabled={revoking === key.id}
                  style={{
                    fontSize: "12px",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    background: "transparent",
                    color: "#ef4444",
                    cursor: revoking === key.id ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: revoking === key.id ? 0.5 : 1,
                    transition: "background 0.1s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {revoking === key.id ? "Revoking..." : "Revoke"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Permanent MCP Setup Instructions */}
        <div
          style={{
            marginTop: "var(--space-8)",
            padding: "var(--space-6)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-primary)",
            background: "var(--bg-secondary)",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
            Connect to Claude Code
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "var(--space-4)", lineHeight: 1.5 }}>
            Use your API key to connect APIANT Docs as an MCP server in Claude Code. Run this in your terminal:
          </p>
          <div style={{ position: "relative" }}>
            <pre
              style={{
                padding: "var(--space-3)",
                background: "var(--bg-primary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-primary)",
                fontSize: "12px",
                fontFamily: "var(--font-geist-mono), monospace",
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                lineHeight: 1.6,
                margin: 0,
              }}
            >{`curl -sf https://info.apiant.com/apiant-docs-mcp.js -o ~/.apiant-docs-mcp.js && claude mcp add apiant-docs -s user -- node ~/.apiant-docs-mcp.js --api-key YOUR_API_KEY`}</pre>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "var(--space-3)", lineHeight: 1.5 }}>
            Replace <code style={{ fontSize: "12px", fontFamily: "var(--font-geist-mono), monospace", color: "var(--text-secondary)" }}>YOUR_API_KEY</code> with one of your keys above. Create a key with <strong>read</strong> + <strong>write</strong> permissions for full access.
          </p>
        </div>
      </main>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 500,
  fontFamily: "inherit",
  background: "var(--accent-primary)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  transition: "opacity 0.15s",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 500,
  fontFamily: "inherit",
  background: "var(--bg-surface)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: "var(--space-1)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  fontFamily: "inherit",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "var(--space-3) var(--space-4)",
  marginBottom: "var(--space-4)",
  fontSize: "13px",
  color: "#ef4444",
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.2)",
  borderRadius: "var(--radius-md)",
};
