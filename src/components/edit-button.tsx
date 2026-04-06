"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";

export function EditButton({ slug }: { slug: string }) {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <Link
      href={`/edit/${slug}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "var(--font-geist-mono), monospace",
        color: "var(--text-tertiary)",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-sm)",
        textDecoration: "none",
        transition: "border-color 0.15s, color 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-primary)";
        e.currentTarget.style.color = "var(--text-tertiary)";
      }}
      title="Edit this document"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
      Edit
    </Link>
  );
}
