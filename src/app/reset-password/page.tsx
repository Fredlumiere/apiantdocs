"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createBrowserClient();

  // Wait for Supabase to pick up the recovery session from the URL hash
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
          setSessionReady(true);
          setChecking(false);
        }
      }
    );

    // Also check if there's already a session (user might have refreshed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (checking) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ ...subtextStyle, textAlign: "center" }}>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            <h1 style={headingStyle}>Invalid or expired link</h1>
            <p style={subtextStyle}>
              This password reset link is no longer valid. Please request a new one.
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

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center" }}>
            <h1 style={headingStyle}>Password updated</h1>
            <p style={subtextStyle}>
              Your password has been reset successfully.
            </p>
            <Link
              href="/docs"
              style={{
                display: "inline-block",
                marginTop: "var(--space-4)",
                fontSize: "13px",
                color: "var(--accent-primary)",
                textDecoration: "none",
              }}
            >
              Go to docs
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
          <h1 style={headingStyle}>Reset your password</h1>
          <p style={subtextStyle}>Enter your new password below.</p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleReset}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label htmlFor="password" style={labelStyle}>
              New password
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

          <div style={{ marginBottom: "var(--space-6)" }}>
            <label htmlFor="confirm" style={labelStyle}>
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
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
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
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
