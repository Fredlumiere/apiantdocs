import Link from "next/link";

interface TagListProps {
  tags: string[];
  compact?: boolean;
}

export function TagList({ tags, compact = false }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  const fontSize = compact ? "11px" : "12px";
  const padding = compact ? "2px 8px" : "3px 10px";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/docs?tag=${encodeURIComponent(tag)}`}
          className="tag-pill"
        >
          <span className="tag-hash">#</span>{tag}
        </Link>
      ))}
      <style>{`
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: ${fontSize};
          font-family: var(--font-geist-mono), monospace;
          padding: ${padding};
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          background: var(--bg-surface);
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.15s;
          cursor: pointer;
          line-height: 1.4;
        }
        .tag-pill:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
          background: var(--accent-primary-subtle);
        }
        .tag-hash {
          color: var(--text-tertiary);
          font-weight: 400;
        }
        .tag-pill:hover .tag-hash {
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
