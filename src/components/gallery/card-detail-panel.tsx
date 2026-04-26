"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CARD_METADATA } from "@/lib/card-metadata";

export type CardDetail = {
  name: string;
  title: string;
  desc: string;
  category: string;
  mutation?: "read" | "write" | null;
  when?: string;
  env?: "dev" | "prod";
  href?: string;
  kind?: "skill" | "tool";
  invokes?: string[];
  usedBy?: string[];
};

type Ctx = {
  open: (detail: CardDetail) => void;
  close: () => void;
};

const CardDetailContext = createContext<Ctx | null>(null);

export function useCardDetail(): Ctx | null
{
  return useContext(CardDetailContext);
}

// Ported from ai-operability.html line 2505 (catLabel object).
const CATEGORY_LABEL: Record<string, string> = {
  skill: "Skill",
  tool: "MCP tools",
  tools: "MCP tools",
  docs: "Docs tool",
  setup: "Setup",
  build: "Build",
  edit: "Edit",
  test: "Test & deploy",
  triggers: "Triggers",
  actions: "Actions",
  connector: "Connector",
  sync: "Two-way sync",
  patterns: "Patterns",
  patterns_tool: "Patterns",
  ops: "Ops & support",
  automation_builder: "Automation builder",
  assembly: "Assembly",
  automation_exec: "Automation exec",
  deploy: "Deploy",
  admin: "Admin",
  alerts: "Alerts",
};

// Build a CardDetail from a registry entry, used when a drawer pill is clicked
// so the user can pivot to the invoked tool / referencing skill without
// hunting for the card in the grid.
function entryToDetail(name: string): CardDetail | null
{
  const meta = CARD_METADATA[name];
  if (!meta) return null;
  const mutation = meta.mutation === "read" || meta.mutation === "write"
    ? meta.mutation
    : undefined;
  return {
    name,
    title: meta.title ?? name,
    desc: meta.desc ?? "",
    category: meta.category ?? (meta.kind === "tool" ? "tools" : "skill"),
    when: meta.when,
    mutation,
    kind: meta.kind,
    invokes: meta.invokes,
    usedBy: meta.usedBy,
  };
}

function CardDetailPanel(
  {
    detail,
    onOpen,
    onClose,
  }: {
    detail: CardDetail | null;
    onOpen: (d: CardDetail) => void;
    onClose: () => void;
  }
): ReactNode
{
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    if (detail)
    {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    else
    {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(t);
    }
  }, [detail]);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) =>
    {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detail, onClose]);

  // Fade the body when swapping via a pill click so the content change has a
  // beat of motion instead of popping.
  useEffect(() => {
    if (!swapping) return;
    const t = setTimeout(() => setSwapping(false), 200);
    return () => clearTimeout(t);
  }, [swapping]);

  if (!mounted) return null;

  const mutation = detail?.mutation;
  const showReadOnly = mutation === "read";
  const showMutates = mutation === "write";

  const pills = detail?.kind === "tool"
    ? (detail?.usedBy ?? [])
    : (detail?.invokes ?? []);
  const pillsLabel = detail?.kind === "tool" ? "Used by" : "Invokes";

  const onPillClick = (n: string) =>
  {
    const next = entryToDetail(n);
    if (!next) return;
    setSwapping(true);
    // Give the fade-out a moment before swapping content.
    setTimeout(() => onOpen(next), 180);
  };

  return (
    <>
      <div
        className={`drawer-backdrop${visible ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`drawer${visible ? " visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawerTitle"
      >
        <header className="drawer-head">
          <span className="drawer-cat-chip">
            {detail ? (CATEGORY_LABEL[detail.category] ?? detail.category) : ""}
          </span>
          {showReadOnly && (
            <span className="drawer-mutation readonly">READ-ONLY</span>
          )}
          {showMutates && (
            <span className="drawer-mutation mutates">MUTATES</span>
          )}
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <h3 className="drawer-name" id="drawerTitle">
            {detail?.name}
          </h3>
        </header>
        <div className={`drawer-body${swapping ? " swapping" : ""}`}>
          <section className="drawer-desc">
            <p>
              <b>{detail?.title}.</b> {detail?.desc}
            </p>
          </section>
          {detail?.when && (
            <section className="drawer-when">
              <h5>When to use</h5>
              <p>{detail.when}</p>
            </section>
          )}
          {pills.length > 0 && (
            <section className="drawer-tools">
              <h5>{pillsLabel}</h5>
              <div className="tool-pills">
                {pills.map((n) => {
                  const hit = CARD_METADATA[n];
                  if (hit)
                  {
                    return (
                      <button
                        key={n}
                        type="button"
                        className="tool-pill"
                        onClick={() => onPillClick(n)}
                      >
                        {n}
                      </button>
                    );
                  }
                  return (
                    <span key={n} className="tool-pill tool-pill-static">{n}</span>
                  );
                })}
              </div>
            </section>
          )}
        </div>
        {detail?.href && (
          <footer className="drawer-foot">
            <a
              className="drawer-copy"
              href={detail.href}
              target={detail.href.startsWith("http") ? "_blank" : undefined}
              rel={detail.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              View docs →
            </a>
          </footer>
        )}
      </aside>
    </>
  );
}

export function CardDetailProvider({ children }: { children: ReactNode }): ReactNode
{
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const ctx: Ctx = {
    open: (d) => setDetail(d),
    close: () => setDetail(null),
  };
  return (
    <CardDetailContext.Provider value={ctx}>
      {children}
      <CardDetailPanel detail={detail} onOpen={(d) => setDetail(d)} onClose={ctx.close} />
    </CardDetailContext.Provider>
  );
}
