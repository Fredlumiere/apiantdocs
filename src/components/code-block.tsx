"use client";

import { useState, useCallback, useRef } from "react";

interface CodeBlockProps {
  language: string | null;
  children: React.ReactNode;
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = useCallback(async () => {
    const text = preRef.current?.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <div className="code-block-wrapper" style={{ position: "relative", marginBottom: "var(--space-4)" }}>
      {/* Language label + copy button bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-2) var(--space-4)",
          background: "rgba(255, 255, 255, 0.04)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          borderTopLeftRadius: "var(--radius-md)",
          borderTopRightRadius: "var(--radius-md)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-geist-mono), monospace",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="code-copy-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 8px",
            border: "none",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: copied ? "var(--accent-primary)" : "var(--text-tertiary)",
            fontSize: "11px",
            fontFamily: "var(--font-geist-mono), monospace",
            cursor: "pointer",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.background = "transparent";
            }
          }}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Pre block with scroll */}
      <pre
        ref={preRef}
        style={{
          margin: 0,
          padding: "var(--space-4)",
          background: "var(--bg-tertiary)",
          borderBottomLeftRadius: "var(--radius-md)",
          borderBottomRightRadius: "var(--radius-md)",
          overflow: "auto",
          maxHeight: "500px",
          fontSize: "13px",
          lineHeight: 1.6,
          fontFamily: "var(--font-geist-mono), monospace",
        }}
      >
        {children}
      </pre>
    </div>
  );
}
