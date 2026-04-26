import type { ReactNode } from "react";

type CalloutType = "info" | "note" | "success" | "tip" | "warning" | "danger";

export function Callout(
  {
    type = "info",
    children,
  }: {
    type?: CalloutType;
    children: ReactNode;
  }
): ReactNode
{
  const normalized = type === "note" ? "info"
    : type === "tip" ? "success"
    : type;

  return (
    <div className={`callout callout-${normalized}`}>
      {children}
    </div>
  );
}
