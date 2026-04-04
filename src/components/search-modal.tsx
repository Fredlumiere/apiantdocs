"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_LABELS, DOC_TYPE_LABELS } from "@/lib/constants";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  snippet: string | null;
  doc_type: string;
  product: string | null;
  rank: number;
}

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setResults([]);
    setError(null);
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, open, close]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=10`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Search failed");
          return res.json();
        })
        .then((data) => {
          setResults(data.data || []);
          setLoading(false);
          setSelectedIndex(0);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setError("Search unavailable. Please try again.");
          setLoading(false);
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen]);

  function navigateToResult(result: SearchResult) {
    close();
    router.push(`/docs/${result.slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-primary)",
          background: "var(--bg-surface)",
          color: "var(--text-tertiary)",
          fontSize: "14px",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
        aria-label="Search documentation"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span>Search docs...</span>
        <kbd style={{
          marginLeft: "var(--space-4)",
          padding: "2px 6px",
          borderRadius: "4px",
          border: "1px solid var(--border-secondary)",
          fontSize: "11px",
          fontFamily: "var(--font-geist-mono), monospace",
          color: "var(--text-tertiary)",
        }}>
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "min(20vh, 120px)",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          margin: "0 var(--space-4)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-secondary)",
          background: "var(--bg-secondary)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          overflow: "hidden",
          animation: "searchModalIn 0.15s ease-out",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "var(--space-4)",
          borderBottom: "1px solid var(--border-primary)",
          gap: "var(--space-3)",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "16px",
              fontFamily: "inherit",
            }}
            aria-label="Search query"
          />
          <kbd
            onClick={close}
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              border: "1px solid var(--border-secondary)",
              fontSize: "12px",
              fontFamily: "var(--font-geist-mono), monospace",
              color: "var(--text-tertiary)",
              cursor: "pointer",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "400px", overflowY: "auto", padding: "var(--space-2)" }}>
          {loading && (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "60px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface)",
                    marginBottom: "var(--space-2)",
                    animation: "pulse 1.5s ease-in-out infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {error && (
            <div style={{
              padding: "var(--space-6)",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}>
              {error}
            </div>
          )}

          {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
            <div style={{
              padding: "var(--space-6)",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}>
              No results found. Try a different search term.
            </div>
          )}

          {!loading && !error && query.trim().length < 2 && (
            <div style={{
              padding: "var(--space-6)",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "14px",
            }}>
              Type at least 2 characters to search
            </div>
          )}

          {!loading && !error && results.map((result, i) => (
            <button
              key={result.id}
              onClick={() => navigateToResult(result)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: i === selectedIndex ? "var(--bg-surface-hover)" : "transparent",
                cursor: "pointer",
                transition: "background 0.1s",
                color: "var(--text-primary)",
                fontFamily: "inherit",
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              aria-selected={i === selectedIndex}
              role="option"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                <span style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "var(--accent-primary-muted)",
                  color: "var(--accent-primary)",
                }}>
                  {DOC_TYPE_LABELS[result.doc_type] || result.doc_type}
                </span>
                {result.product && (
                  <span style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}>
                    {PRODUCT_LABELS[result.product] || result.product}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 500, fontSize: "14px" }}>{result.title}</div>
              {(result.snippet || result.description) && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginTop: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: result.snippet || result.description || "",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes searchModalIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
