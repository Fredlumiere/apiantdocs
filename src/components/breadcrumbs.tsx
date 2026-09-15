import Link from "next/link";
import { PRODUCT_LABELS } from "@/lib/constants";
import { isApiantAiSite, siteOrigin } from "@/lib/site";

interface BreadcrumbItem {
  label: string;
  href: string | null;
}

interface BreadcrumbsProps {
  slug: string;
  title: string;
  product: string | null;
  parentTitle?: string | null;
  parentSlug?: string | null;
}

export function Breadcrumbs({ slug, title, product, parentTitle, parentSlug }: BreadcrumbsProps) {
  const apiantAi = isApiantAiSite();
  const crumbs: BreadcrumbItem[] = [
    // On apiant.ai the site root is the marketing site, a different zone.
    apiantAi ? { label: "APIANT.ai", href: siteOrigin() } : { label: "Home", href: "/" },
    { label: "Docs", href: "/docs" },
  ];

  // The apiant.ai site has one product, so a product crumb adds nothing.
  if (product && !apiantAi) {
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
  void slug;

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
            {crumb.href && /^https?:\/\//.test(crumb.href) ? (
              <a href={crumb.href} className="breadcrumb-link">
                {crumb.label}
              </a>
            ) : crumb.href ? (
              <Link href={crumb.href} className="breadcrumb-link">
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: "var(--text-secondary)" }}>{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
      <style>{`
        .breadcrumb-link {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.1s;
        }
        .breadcrumb-link:hover {
          color: var(--accent-primary);
        }
      `}</style>
    </nav>
  );
}
