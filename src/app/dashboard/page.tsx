import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const displayName = user.user_metadata?.name || user.email || "User";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
          padding: "0 var(--space-6)",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            <img
              src="/apiant-logo.svg"
              alt="APIANT"
              style={{ height: "23px", width: "auto" }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent-primary)",
                background: "var(--accent-primary-subtle)",
                padding: "2px 6px",
                borderRadius: "4px",
                marginLeft: "6px",
              }}
            >
              docs
            </span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <Link
              href="/docs"
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              Docs
            </Link>
            <Link
              href="/dashboard"
              style={{
                fontSize: "14px",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "var(--space-8) var(--space-6)",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "var(--space-2)",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            marginBottom: "var(--space-8)",
          }}
        >
          Welcome, {displayName}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-6)",
          }}
        >
          <Link
            href="/dashboard/docs"
            style={{
              display: "block",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.15s, background 0.15s",
              background: "var(--bg-secondary)",
            }}
            onMouseEnter={undefined}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "var(--space-2)",
              }}
            >
              Manage Documents
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              View, edit, publish, and archive documentation. Manage all document statuses.
            </p>
          </Link>
          <Link
            href="/dashboard/keys"
            style={{
              display: "block",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.15s, background 0.15s",
              background: "var(--bg-secondary)",
            }}
            onMouseEnter={undefined}
          >
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "var(--space-2)",
              }}
            >
              API Keys
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Create and manage API keys for programmatic access to the docs API and MCP server.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
