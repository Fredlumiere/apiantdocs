import Link from "next/link";

interface DocNavLink {
  slug: string;
  title: string;
}

interface DocNavProps {
  prev: DocNavLink | null;
  next: DocNavLink | null;
}

export function DocNav({ prev, next }: DocNavProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Previous and next documents"
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        marginTop: "var(--space-12)",
        paddingTop: "var(--space-6)",
        borderTop: "1px solid var(--border-primary)",
      }}
    >
      {prev ? (
        <Link
          href={`/docs/${prev.slug}`}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            textDecoration: "none",
            color: "inherit",
            flex: 1,
            maxWidth: "50%",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.background = "var(--bg-surface)";
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = "var(--border-primary)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            &#8592; Previous
          </span>
          <span style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--accent-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/docs/${next.slug}`}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            textDecoration: "none",
            color: "inherit",
            flex: 1,
            maxWidth: "50%",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.background = "var(--bg-surface)";
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.borderColor = "var(--border-primary)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            Next &#8594;
          </span>
          <span style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--accent-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
