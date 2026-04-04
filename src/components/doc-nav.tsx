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
        <Link href={`/docs/${prev.slug}`} className="doc-nav-link">
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
        <Link href={`/docs/${next.slug}`} className="doc-nav-link" style={{ alignItems: "flex-end" }}>
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

      <style>{`
        .doc-nav-link {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          text-decoration: none;
          color: inherit;
          flex: 1;
          max-width: 50%;
          transition: border-color 0.15s, background 0.15s;
        }
        .doc-nav-link:hover {
          border-color: var(--border-hover);
          background: var(--bg-surface);
        }
      `}</style>
    </nav>
  );
}
