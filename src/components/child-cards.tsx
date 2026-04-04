import Link from "next/link";

interface ChildDoc {
  slug: string;
  title: string;
  description: string | null;
  doc_type: string;
}

export function ChildCards({ children }: { children: ChildDoc[] }) {
  if (children.length === 0) return null;

  return (
    <div className="child-cards-section">
      <h2 style={{
        fontSize: "20px",
        fontWeight: 600,
        color: "var(--text-primary)",
        marginBottom: "var(--space-4)",
      }}>
        In this section
      </h2>
      <div className="child-cards-grid">
        {children.map((child) => (
          <Link
            key={child.slug}
            href={`/docs/${child.slug}`}
            className="child-card"
          >
            <h3 className="child-card-title">{child.title}</h3>
            {child.description && (
              <p className="child-card-desc">{child.description}</p>
            )}
          </Link>
        ))}
      </div>

      <style>{`
        .child-cards-section {
          margin-top: var(--space-8);
        }
        .child-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: var(--space-3);
        }
        .child-card {
          display: block;
          padding: var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s, background 0.15s;
        }
        .child-card:hover {
          border-color: var(--accent-primary);
          background: var(--bg-surface);
        }
        .child-card-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.4;
        }
        .child-card-desc {
          font-size: 13px;
          color: var(--text-tertiary);
          margin: 6px 0 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
