"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CardGlyph } from "./glyphs";
import { useCardDetail } from "./card-detail-panel";
import { CARD_METADATA } from "@/lib/card-metadata";

type Mutation = "read" | "write";

function defaultProdDesc(mutation: Mutation): string
{
  if (mutation === "write")
  {
    return "Write gated on explicit confirmation in prod.";
  }
  return "Read-only in prod. Returns same surface as dev.";
}

// ToolCard renders a Core MCP tool card with a DEV/PROD environment toggle in
// the upper-right corner. Ported from ai-operability.html (#inventory-tools).
// Clicking the card (outside the env-toggle) opens a detail drawer matching
// Fred's right-slide panel.
export function ToolCard(
  {
    name,
    title,
    desc,
    prodDesc,
    glyph,
    mutation = "read",
    when,
    category = "tool",
  }: {
    name: string;
    title: string;
    desc: string;
    prodDesc?: string;
    glyph: string;
    mutation?: Mutation;
    when?: string;
    category?: string;
  }
): ReactNode
{
  const [env, setEnv] = useState<"dev" | "prod">("dev");
  const drawer = useCardDetail();
  const resolvedProdDesc = prodDesc ?? defaultProdDesc(mutation);
  const shownDesc = env === "prod" ? resolvedProdDesc : desc;
  const cardClass = `apiant-gallery-card ${env === "prod" ? "env-prod" : "env-dev"}`;

  const openDrawer = () =>
  {
    const meta = CARD_METADATA[name];
    drawer?.open({
      name,
      title,
      desc: shownDesc,
      category: meta?.category ?? category,
      mutation,
      env,
      when: when ?? meta?.when,
      kind: "tool",
      invokes: meta?.invokes,
      usedBy: meta?.usedBy,
    });
  };

  const onCardClick = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    const target = e.target as HTMLElement;
    if (target.closest(".env-toggle")) return;
    openDrawer();
  };

  const onKey = (e: React.KeyboardEvent) =>
  {
    const t = e.target as HTMLElement;
    if (t.closest(".env-toggle")) return;
    if (e.key === "Enter" || e.key === " ")
    {
      e.preventDefault();
      openDrawer();
    }
  };

  return (
    <div
      className={cardClass}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${title}`}
      onClick={onCardClick}
      onKeyDown={onKey}
    >
      <div className="env-toggle" role="group" aria-label="Environment">
        <button
          type="button"
          className={`env-seg${env === "dev" ? " active" : ""}`}
          data-env="dev"
          aria-pressed={env === "dev"}
          onClick={(e) => { e.stopPropagation(); setEnv("dev"); }}
        >
          dev
        </button>
        <button
          type="button"
          className={`env-seg${env === "prod" ? " active" : ""}`}
          data-env="prod"
          aria-pressed={env === "prod"}
          onClick={(e) => { e.stopPropagation(); setEnv("prod"); }}
        >
          prod
        </button>
      </div>
      <div className="glyph">
        <CardGlyph name={glyph} />
      </div>
      <div className="name">{name}</div>
      <div className="title">{title}</div>
      <p className="desc">{shownDesc}</p>
    </div>
  );
}
