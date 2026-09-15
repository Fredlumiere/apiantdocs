"use client";

import { useState } from "react";

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 10px",
  fontSize: "12px",
  fontWeight: 500,
  fontFamily: "var(--font-geist-mono), monospace",
  color: "var(--text-tertiary)",
  background: "var(--bg-surface)",
  border: "1px solid var(--border-primary)",
  borderRadius: "var(--radius-sm)",
  textDecoration: "none",
  transition: "border-color 0.15s, color 0.15s",
  whiteSpace: "nowrap",
  cursor: "pointer",
};

function hoverOn(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "var(--border-hover)";
  e.currentTarget.style.color = "var(--text-secondary)";
}

function hoverOff(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "var(--border-primary)";
  e.currentTarget.style.color = "var(--text-tertiary)";
}

/**
 * "Copy page" copies the page's Markdown export (/docs/<slug>.md) to the
 * clipboard so it can be pasted into an LLM; "View .md" opens that export.
 * The doc page's slug route and the .md route share the /docs prefix in both
 * site modes, so the path needs no base-path handling.
 */
export function CopyPageButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const markdownPath = `/docs/${slug}.md`;

  async function copy() {
    try {
      const res = await fetch(markdownPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await navigator.clipboard.writeText(await res.text());
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
      <button
        type="button"
        onClick={copy}
        style={buttonStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
        title="Copy this page as Markdown"
        aria-live="polite"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        {state === "copied" ? "Copied" : state === "error" ? "Copy failed" : "Copy page"}
      </button>
      <a
        href={markdownPath}
        style={buttonStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
        title="View this page as Markdown"
      >
        View .md
      </a>
    </div>
  );
}
