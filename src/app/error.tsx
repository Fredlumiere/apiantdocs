"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
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
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: "rgba(239, 68, 68, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "var(--space-4)",
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 style={{
        fontSize: "24px",
        fontWeight: 600,
        color: "var(--text-primary)",
        marginBottom: "var(--space-2)",
      }}>
        Something went wrong
      </h1>
      <p style={{
        fontSize: "15px",
        color: "var(--text-secondary)",
        marginBottom: "var(--space-6)",
        maxWidth: "400px",
      }}>
        An unexpected error occurred. This has been logged automatically.
        {error.digest && (
          <span style={{
            display: "block",
            marginTop: "var(--space-2)",
            fontSize: "12px",
            fontFamily: "var(--font-geist-mono), monospace",
            color: "var(--text-tertiary)",
          }}>
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "var(--space-2) var(--space-6)",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "var(--accent-primary)",
          color: "white",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        Try again
      </button>
    </main>
  );
}
