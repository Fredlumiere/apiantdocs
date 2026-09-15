"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APIANT_AI_ORIGIN } from "@/lib/apiant-ai-brand";
import { sectionForSlug, slugFromPathname, type DocSection } from "@/lib/doc-sections";

/** Event the mobile sidebar drawer (MobileSidebarToggle) listens for. */
export const OPEN_DOCS_SIDEBAR_EVENT = "open-docs-sidebar";

/**
 * The Docs submenu under apiant.ai's menu (apiant-ai site only): a Docs label,
 * the top-level sections as tabs with the current page's section marked, and
 * search and Ask AI on the right. Under 768px the tabs collapse into a
 * "Docs / <section>" button that opens the sidebar drawer.
 */
export function DocsSubmenu({
  sections,
  onOpenSearch,
}: {
  sections: DocSection[];
  onOpenSearch: () => void;
}) {
  const pathname = usePathname();
  const current = sectionForSlug(sections, slugFromPathname(pathname));
  const tabsRef = useRef<HTMLElement>(null);

  // Keep the active tab visible when the tabs overflow.
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [current?.slug]);

  return (
    <div className="aai-sub">
      <div className="aai-sub-bar">
      <a className="aai-sub-home" href={`${APIANT_AI_ORIGIN}/docs`}>
        Docs
      </a>
      <span className="aai-sub-sep" aria-hidden="true" />
      <button
        type="button"
        className="aai-sub-mobile"
        onClick={() => window.dispatchEvent(new Event(OPEN_DOCS_SIDEBAR_EVENT))}
        aria-label={`Docs navigation${current ? `, current section ${current.title}` : ""}`}
      >
        <b>Docs</b>
        {current && (
          <>
            <em aria-hidden="true">/</em>
            <span>{current.label}</span>
          </>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <nav className="aai-tabs" aria-label="Docs sections" ref={tabsRef}>
        <ul>
          {sections.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/docs/${s.slug}`}
                className="aai-tab"
                title={s.label !== s.title ? s.title : undefined}
                aria-current={current?.slug === s.slug ? "true" : undefined}
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="aai-sub-actions">
        <button type="button" className="aai-search" onClick={onOpenSearch} aria-label="Search documentation">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="aai-search-text">Search docs</span>
          <kbd>&#8984;K</kbd>
        </button>
        <button
          type="button"
          className="aai-btn-brand aai-ask"
          onClick={() => window.dispatchEvent(new Event("open-chat-panel"))}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
          </svg>
          Ask AI
        </button>
      </div>
      </div>
    </div>
  );
}
