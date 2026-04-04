"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createBrowserClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            <h1 style={headingStyle}>Check your email</h1>
            <p style={subtextStyle}>
              We sent a confirmation link to{" "}
              <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
              Click the link to verify your account.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                marginTop: "var(--space-4)",
                fontSize: "13px",
                color: "var(--accent-primary)",
                textDecoration: "none",
              }}
            >
              Back to login
            </Link>
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
          <h1 style={headingStyle}>Create an account</h1>
          <p style={subtextStyle}>
            Sign up to generate API keys and contribute to documentation.
          </p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label htmlFor="name" style={labelStyle}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
              style={inputStyle}
            />
          </div>

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
              autoComplete="new-password"
              placeholder="Min 8 characters"
              minLength={8}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButtonStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
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
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--accent-primary)",
              textDecoration: "none",
            }}
          >
            Sign in
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

const errorStyle: React.CSSProperties = {
  padding: "var(--space-3)",
  marginBottom: "var(--space-4)",
  fontSize: "13px",
  color: "#ef4444",
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.2)",
  borderRadius: "var(--radius-md)",
};
