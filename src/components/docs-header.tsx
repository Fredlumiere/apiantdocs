"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

interface DocsHeaderProps {
  onOpenSearch: () => void;
}

export function DocsHeader({ onOpenSearch }: DocsHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on ESC
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileMenuOpen]);

  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border-primary)",
        padding: "0 var(--space-4)",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-secondary)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Left: Logo + Nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            API
          </span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--accent-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            ANT
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--text-tertiary)",
              marginLeft: "2px",
            }}
          >
            Docs
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="desktop-nav-links" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <Link
            href="/docs"
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "color 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Docs
          </Link>
          <Link
            href="/api/docs"
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "color 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            API Reference
          </Link>
        </nav>
      </div>

      {/* Right: Search trigger + mobile hamburger */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        {/* Search trigger */}
        <button
          onClick={onOpenSearch}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "6px var(--space-3)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            background: "var(--bg-surface)",
            color: "var(--text-tertiary)",
            fontSize: "13px",
            cursor: "pointer",
            transition: "border-color 0.15s",
            height: "34px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-primary)")}
          aria-label="Search documentation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="search-trigger-text">Search docs...</span>
          <kbd
            className="search-trigger-kbd"
            style={{
              marginLeft: "var(--space-2)",
              padding: "1px 5px",
              borderRadius: "4px",
              border: "1px solid var(--border-secondary)",
              fontSize: "11px",
              fontFamily: "var(--font-geist-mono), monospace",
              color: "var(--text-tertiary)",
            }}
          >
            &#8984;K
          </kbd>
        </button>

        {/* Mobile hamburger */}
        <button
          className="mobile-hamburger"
          onClick={() => setMobileMenuOpen(true)}
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
          aria-label="Open navigation menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeMobile();
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "280px",
              background: "var(--bg-secondary)",
              borderLeft: "1px solid var(--border-primary)",
              padding: "var(--space-4)",
              animation: "slideInRight 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-6)" }}>
              <button
                onClick={closeMobile}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
                aria-label="Close menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <Link
                href="/docs"
                onClick={closeMobile}
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  transition: "background 0.1s",
                }}
              >
                Docs
              </Link>
              <Link
                href="/api/docs"
                onClick={closeMobile}
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  transition: "background 0.1s",
                }}
              >
                API Reference
              </Link>
            </nav>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 767px) {
          .mobile-hamburger { display: flex !important; }
          .desktop-nav-links { display: none !important; }
          .search-trigger-text { display: none !important; }
          .search-trigger-kbd { display: none !important; }
        }
      `}</style>
    </header>
  );
}
