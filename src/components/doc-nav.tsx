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
      className="doc-nav-container"
    >
      {prev ? (
        <Link href={`/docs/${prev.slug}`} className="doc-nav-link doc-nav-prev">
          <span className="doc-nav-label">&#8592; Previous</span>
          <span className="doc-nav-title">{prev.title}</span>
        </Link>
      ) : (
        <div className="doc-nav-spacer" />
      )}

      {next ? (
        <Link href={`/docs/${next.slug}`} className="doc-nav-link doc-nav-next">
          <span className="doc-nav-label">Next &#8594;</span>
          <span className="doc-nav-title">{next.title}</span>
        </Link>
      ) : (
        <div className="doc-nav-spacer" />
      )}

      <style>{`
        .doc-nav-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          margin-top: var(--space-12);
          padding-top: var(--space-6);
          border-top: 1px solid var(--border-primary);
        }
        @media (max-width: 560px) {
          .doc-nav-container {
            grid-template-columns: 1fr;
          }
        }
        .doc-nav-link {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s, background 0.15s;
          min-width: 0;
        }
        .doc-nav-link:hover {
          border-color: var(--border-hover);
          background: var(--bg-surface);
        }
        .doc-nav-next {
          text-align: right;
        }
        .doc-nav-label {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .doc-nav-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--accent-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        .doc-nav-spacer {
          display: none;
        }
      `}</style>
    </nav>
  );
}
