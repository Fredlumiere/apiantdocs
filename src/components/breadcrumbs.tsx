import Link from "next/link";
import { PRODUCT_LABELS } from "@/lib/constants";

interface BreadcrumbItem {
  label: string;
  href: string | null; // null = current page (no link)
}

interface BreadcrumbsProps {
  slug: string;
  title: string;
  product: string | null;
  parentTitle?: string | null;
  parentSlug?: string | null;
}

export function Breadcrumbs({ slug, title, product, parentTitle, parentSlug }: BreadcrumbsProps) {
  const crumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Docs", href: "/docs" },
  ];

  if (product) {
    crumbs.push({
      label: PRODUCT_LABELS[product] || product,
      href: `/docs?product=${product}`,
    });
  }

  if (parentTitle && parentSlug) {
    crumbs.push({
      label: parentTitle,
      href: `/docs/${parentSlug}`,
    });
  }

  crumbs.push({ label: title, href: null });

  // Don't render if only Home > Docs > Page (too short to be useful)
  // Actually render always — spec says "Home > Product > Parent Doc > Current Page"
  void slug; // used in parent for key

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: "var(--space-4)" }}>
      <ol style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-1)",
        listStyle: "none",
        padding: 0,
        margin: 0,
        fontSize: "13px",
      }}>
        {crumbs.map((crumb, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            {i > 0 && (
              <span style={{ color: "var(--text-disabled)", userSelect: "none" }} aria-hidden="true">
                /
              </span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                style={{
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                  transition: "color 0.1s",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.color = "var(--accent-primary)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: "var(--text-secondary)" }}>{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
