"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (loading) {
    return (
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-primary)",
        }}
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--text-secondary)",
          textDecoration: "none",
          padding: "6px 12px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-primary)",
          background: "var(--bg-surface)",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-primary)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
      >
        Log in
      </Link>
    );
  }

  const initials = getInitials(user.email || "");
  const displayName = user.user_metadata?.name || user.email || "User";

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "var(--accent-primary-muted)",
          border: "1px solid var(--border-primary)",
          color: "var(--accent-primary)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "var(--border-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--border-primary)")
        }
        aria-label="User menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: "220px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-secondary)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 50,
            overflow: "hidden",
            animation: "userMenuIn 0.12s ease-out",
          }}
        >
          {/* User info */}
          <div
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderBottom: "1px solid var(--border-primary)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </div>
            {user.email && displayName !== user.email && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-tertiary)",
                  marginTop: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            )}
          </div>

          {/* Menu items */}
          <div style={{ padding: "var(--space-1)" }}>
            <Link
              href="/dashboard/keys"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "var(--space-2) var(--space-3)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                textDecoration: "none",
                borderRadius: "var(--radius-sm)",
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-surface-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              API Keys
            </Link>
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.push("/");
                router.refresh();
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "var(--space-2) var(--space-3)",
                fontSize: "13px",
                color: "var(--text-secondary)",
                background: "transparent",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-surface-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              Log out
            </button>
          </div>

          <style>{`
            @keyframes userMenuIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function getInitials(email: string): string {
  const name = email.split("@")[0] || "";
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
