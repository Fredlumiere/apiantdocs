"use client";

import { useState, useEffect, useRef } from "react";
import type { TocHeading } from "@/lib/extract-headings";

interface TableOfContentsProps {
  headings: TocHeading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting from top
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Use the one closest to the top
          const sorted = visible.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveId(sorted[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    );

    for (const el of headingElements) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside
      className="toc-aside"
      style={{
        width: "var(--toc-width)",
        flexShrink: 0,
        position: "sticky",
        top: "calc(52px + var(--space-8))",
        maxHeight: "calc(100vh - 52px - 64px)",
        overflowY: "auto",
        display: "none", // hidden by default, shown via media query
      }}
    >
      <h4 style={{
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-tertiary)",
        marginBottom: "var(--space-3)",
      }}>
        On this page
      </h4>
      <nav aria-label="Table of contents">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(heading.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    // Update URL hash without jumping
                    window.history.replaceState(null, "", `#${heading.id}`);
                  }
                }}
                style={{
                  display: "block",
                  fontSize: "13px",
                  lineHeight: 1.4,
                  padding: "3px 0",
                  paddingLeft: heading.level === 3 ? "calc(var(--space-4) + 8px)" : "8px",
                  color: activeId === heading.id ? "var(--accent-primary)" : "var(--text-tertiary)",
                  textDecoration: "none",
                  borderLeft: activeId === heading.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
                  transition: "color 0.1s, border-color 0.1s",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <style>{`
        @media (min-width: 1280px) {
          .toc-aside { display: block !important; }
        }
        .toc-aside {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .toc-aside:hover {
          scrollbar-color: var(--border-secondary) transparent;
        }
        .toc-aside::-webkit-scrollbar {
          width: 4px;
        }
        .toc-aside::-webkit-scrollbar-track {
          background: transparent;
        }
        .toc-aside::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 2px;
        }
        .toc-aside:hover::-webkit-scrollbar-thumb {
          background: var(--border-secondary);
        }
      `}</style>
    </aside>
  );
}

// extractHeadings moved to src/lib/extract-headings.ts (server-safe)
export type { TocHeading } from "@/lib/extract-headings";
