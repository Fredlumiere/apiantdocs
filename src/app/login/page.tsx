"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const router = useRouter();
  const supabase = createBrowserClient();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setMagicLinkSent(true);
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            <h1 style={headingStyle}>Check your email</h1>
            <p style={subtextStyle}>
              We sent a magic link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
              Click the link in the email to sign in.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setMode("password");
              }}
              style={linkButtonStyle}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ marginBottom: "var(--space-6)" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              marginBottom: "var(--space-6)",
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
          <h1 style={headingStyle}>Sign in</h1>
          <p style={subtextStyle}>
            Access your API keys and manage documentation.
          </p>
        </div>

        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-1)",
            marginBottom: "var(--space-6)",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            padding: "3px",
          }}
        >
          <button
            onClick={() => setMode("password")}
            style={{
              ...tabStyle,
              ...(mode === "password" ? tabActiveStyle : {}),
            }}
          >
            Password
          </button>
          <button
            onClick={() => setMode("magic")}
            style={{
              ...tabStyle,
              ...(mode === "magic" ? tabActiveStyle : {}),
            }}
          >
            Magic Link
          </button>
        </div>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <form onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          {mode === "password" && (
            <div style={{ marginBottom: "var(--space-6)" }}>
              <label htmlFor="password" style={labelStyle}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                style={inputStyle}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButtonStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Signing in..."
              : mode === "password"
                ? "Sign in"
                : "Send magic link"}
          </button>
        </form>

        <p
          style={{
            marginTop: "var(--space-6)",
            fontSize: "13px",
            color: "var(--text-tertiary)",
            textAlign: "center",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "var(--accent-primary)",
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--space-6)",
  background: "var(--bg-primary)",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  padding: "var(--space-8)",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-primary)",
  borderRadius: "var(--radius-xl)",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "var(--space-2)",
};

const subtextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: "var(--space-1)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  fontFamily: "inherit",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const submitButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  fontSize: "14px",
  fontWeight: 500,
  fontFamily: "inherit",
  background: "var(--accent-primary)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-md)",
  transition: "opacity 0.15s",
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: 500,
  fontFamily: "inherit",
  background: "transparent",
  border: "none",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-tertiary)",
  cursor: "pointer",
  transition: "background 0.1s, color 0.1s",
};

const tabActiveStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
};

const errorStyle: React.CSSProperties = {
  padding: "var(--space-3)",
  marginBottom: "var(--space-4)",
  fontSize: "13px",
  color: "#ef4444",
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.2)",
  borderRadius: "var(--radius-md)",
};

const linkButtonStyle: React.CSSProperties = {
  marginTop: "var(--space-4)",
  fontSize: "13px",
  color: "var(--accent-primary)",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "underline",
};
