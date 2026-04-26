"use client";

import type { ReactNode } from "react";
import { CardGlyph } from "./glyphs";
import { useCardDetail } from "./card-detail-panel";
import { CARD_METADATA } from "@/lib/card-metadata";

// SkillCard — Fred's `.card` markup, clickable to open a detail drawer. The
// optional `href` still exists but it no longer navigates the whole card; it
// surfaces as a "View docs" link inside the drawer footer so clicks don't
// bypass the preview pane.
export function SkillCard(
  {
    name,
    title,
    desc,
    glyph,
    href,
    tag,
    when,
  }: {
    name: string;
    title: string;
    desc: string;
    glyph: string;
    href?: string;
    tag?: string;
    when?: string;
  }
): ReactNode
{
  const drawer = useCardDetail();
  const classes = tag
    ? `apiant-gallery-card t-${tag.toLowerCase()}`
    : "apiant-gallery-card";

  const onClick = () =>
  {
    const meta = CARD_METADATA[name];
    const kind = meta?.kind ?? (tag === "docs" ? "tool" : "skill");
    drawer?.open({
      name,
      title,
      desc,
      category: meta?.category ?? (tag === "docs" ? "docs" : "skill"),
      when: when ?? meta?.when,
      href,
      kind,
      invokes: meta?.invokes,
      usedBy: meta?.usedBy,
      mutation: meta?.mutation === "read" || meta?.mutation === "write" ? meta.mutation : undefined,
    });
  };

  const onKey = (e: React.KeyboardEvent) =>
  {
    if (e.key === "Enter" || e.key === " ")
    {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={classes}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${title}`}
      onClick={onClick}
      onKeyDown={onKey}
    >
      {tag ? <span className="tag">{tag}</span> : null}
      <div className="glyph">
        <CardGlyph name={glyph} />
      </div>
      <div className="name">{name}</div>
      <div className="title">{title}</div>
      <p className="desc">{desc}</p>
    </div>
  );
}
