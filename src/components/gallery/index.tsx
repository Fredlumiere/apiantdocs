import { Children, isValidElement, type ReactNode } from "react";
import { CategoryIcon, CardGlyph } from "./glyphs";

export { SkillCard } from "./skill-card";

// SkillGrid wraps cards in Fred's responsive grid.
export function SkillGrid({ children }: { children: ReactNode }): ReactNode
{
  return <div className="apiant-gallery-grid">{children}</div>;
}

// WorkflowSection renders Fred's .cat header plus a SkillGrid of children below.
// Count is derived from the children — keeps the header in sync without a prop
// that has to be hand-maintained against the catalog.
export function WorkflowSection(
  {
    icon,
    title,
    desc,
    unit = "skill",
    children,
  }: {
    icon: string;
    title: string;
    desc: string;
    unit?: string;
    children: ReactNode;
  }
): ReactNode
{
  const count = Children.toArray(children).filter(isValidElement).length;
  return (
    <>
      <div className="apiant-gallery-cat">
        <div className="cat-ico">
          <CategoryIcon name={icon} />
        </div>
        <div>
          <div className="cat-title">{title}</div>
          <div className="cat-desc">{desc}</div>
        </div>
        <div className="cat-count">
          {count} {count === 1 ? unit : `${unit}s`}
        </div>
      </div>
      <SkillGrid>{children}</SkillGrid>
    </>
  );
}

// Re-export the primitive glyph components in case a doc wants to embed an
// isolated SVG without the card wrapper.
export { CategoryIcon, CardGlyph };
export { Callout } from "./callout";
export { ToolCard } from "./tool-card";
export { CardDetailProvider, useCardDetail } from "./card-detail-panel";
