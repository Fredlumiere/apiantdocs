import Link from "next/link";

export default function DocsNotFound() {
  return (
    <main style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-12) var(--space-4)",
      textAlign: "center",
      minHeight: "60vh",
    }}>
      <div style={{
        fontSize: "64px",
        fontWeight: 700,
        color: "var(--text-disabled)",
        lineHeight: 1,
        marginBottom: "var(--space-4)",
        fontFamily: "var(--font-geist-mono), monospace",
      }}>
        404
      </div>
      <h1 style={{
        fontSize: "24px",
        fontWeight: 600,
        color: "var(--text-primary)",
        marginBottom: "var(--space-2)",
      }}>
        Page not found
      </h1>
      <p style={{
        fontSize: "15px",
        color: "var(--text-secondary)",
        marginBottom: "var(--space-8)",
        maxWidth: "400px",
      }}>
        The document you&apos;re looking for doesn&apos;t exist or may have been moved.
        Try searching for what you need.
      </p>
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/docs"
          style={{
            padding: "var(--space-2) var(--space-6)",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-primary)",
            color: "white",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Browse all docs
        </Link>
        <Link
          href="/"
          style={{
            padding: "var(--space-2) var(--space-6)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-secondary)",
            background: "var(--bg-surface)",
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
