"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCT_LABELS } from "@/lib/constants";

export interface TreeNode {
  id: string;
  slug: string;
  title: string;
  doc_type: string;
  product: string | null;
  sort_order: number;
  children: TreeNode[];
}

interface SidebarTreeProps {
  tree: TreeNode[];
}

function findExpandedSlugs(nodes: TreeNode[], currentSlug: string): Set<string> {
  const expanded = new Set<string>();

  function walk(node: TreeNode, ancestors: string[]): boolean {
    if (node.slug === currentSlug) {
      for (const a of ancestors) expanded.add(a);
      expanded.add(node.slug);
      return true;
    }
    for (const child of node.children) {
      if (walk(child, [...ancestors, node.slug])) return true;
    }
    return false;
  }

  for (const node of nodes) {
    walk(node, []);
  }
  return expanded;
}

function TreeItem({ node, currentSlug, expandedSlugs, onToggle }: {
  node: TreeNode;
  currentSlug: string;
  expandedSlugs: Set<string>;
  onToggle: (slug: string) => void;
}) {
  const isActive = node.slug === currentSlug;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedSlugs.has(node.slug);

  return (
    <li>
      <div style={{
        display: "flex",
        alignItems: "center",
        borderLeft: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
        marginLeft: "-2px",
      }}>
        {hasChildren && (
          <button
            onClick={() => onToggle(node.slug)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-tertiary)",
              padding: 0,
              flexShrink: 0,
              transition: "transform 0.15s",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
        <Link
          href={`/docs/${node.slug}`}
          style={{
            display: "block",
            flex: 1,
            fontSize: "14px",
            padding: "4px 8px",
            paddingLeft: hasChildren ? "2px" : "22px",
            borderRadius: "var(--radius-sm)",
            color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
            fontWeight: isActive ? 500 : 400,
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color 0.1s, background 0.1s",
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--bg-surface-hover)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          {node.title}
        </Link>
      </div>
      {/* Lazy render: collapsed branches render no children */}
      {hasChildren && isExpanded && (
        <ul style={{ listStyle: "none", padding: 0, paddingLeft: "16px", margin: 0 }}>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              currentSlug={currentSlug}
              expandedSlugs={expandedSlugs}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SidebarTree({ tree }: SidebarTreeProps) {
  const pathname = usePathname();
  const currentSlug = pathname.replace(/^\/docs\/?/, "") || "";

  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(() =>
    findExpandedSlugs(tree, currentSlug)
  );

  // Re-expand when the route changes
  useEffect(() => {
    setExpandedSlugs((prev) => {
      const autoExpanded = findExpandedSlugs(tree, currentSlug);
      const merged = new Set(prev);
      for (const s of autoExpanded) merged.add(s);
      return merged;
    });
  }, [currentSlug, tree]);

  const onToggle = useCallback((slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  // Group tree roots by product
  const grouped: Record<string, TreeNode[]> = {};
  for (const node of tree) {
    const key = node.product || "general";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(node);
  }

  // Pin product order so equal-sort_order groups render deterministically.
  // Anything not in this list renders last in whatever order it appears.
  const PRODUCT_ORDER = ["getting-started", "platform", "mcp", "api-apps", "general"];
  // api-apps is a flat catalog of integrations — always alphabetize by title for discoverability.
  // Other products (platform, mcp) respect sort_order from the DB.
  const ALPHA_PRODUCTS = new Set(["api-apps"]);
  for (const key of Object.keys(grouped)) {
    if (ALPHA_PRODUCTS.has(key)) {
      grouped[key].sort((a, b) => a.title.localeCompare(b.title));
    }
  }
  const orderedGroups: [string, TreeNode[]][] = [
    ...PRODUCT_ORDER.filter((k) => grouped[k]).map((k): [string, TreeNode[]] => [k, grouped[k]]),
    ...Object.entries(grouped).filter(([k]) => !PRODUCT_ORDER.includes(k)),
  ];

  return (
    <nav>
      {orderedGroups.map(([product, nodes]) => (
        <div key={product} style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-2)",
            padding: "0 var(--space-2)",
          }}>
            {PRODUCT_LABELS[product] || product}
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {nodes.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                currentSlug={currentSlug}
                expandedSlugs={expandedSlugs}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* Mobile sidebar drawer */
export function MobileSidebarToggle({ tree }: { tree: TreeNode[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-surface)",
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
        className="mobile-sidebar-toggle"
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "280px",
            background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border-primary)",
            overflowY: "auto",
            padding: "var(--space-4)",
            animation: "slideInLeft 0.2s ease-out",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-4)",
            }}>
              <Link
                href="/"
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  textDecoration: "none",
                }}
              >
                APIANT Docs
              </Link>
              <button
                onClick={() => setIsOpen(false)}
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
                aria-label="Close navigation"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarTree tree={tree} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 767px) {
          .mobile-sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}
