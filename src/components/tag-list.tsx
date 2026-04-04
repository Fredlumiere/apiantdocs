import Link from "next/link";

interface TagListProps {
  tags: string[];
  /** When true, renders smaller pills (for card listings) */
  compact?: boolean;
}

export function TagList({ tags, compact = false }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  const fontSize = compact ? "11px" : "12px";
  const padding = compact ? "1px 6px" : "2px 8px";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/docs?tag=${encodeURIComponent(tag)}`}
          className="tag-pill"
          style={{
            fontSize,
            fontFamily: "var(--font-geist-mono), monospace",
            padding,
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            textDecoration: "none",
            transition: "color 0.15s, background 0.15s",
            lineHeight: 1.4,
          }}
        >
          {tag}
        </Link>
      ))}
      <style>{`
        .tag-pill:hover {
          color: var(--accent-primary) !important;
          background: var(--accent-primary-muted) !important;
        }
      `}</style>
    </div>
  );
}
