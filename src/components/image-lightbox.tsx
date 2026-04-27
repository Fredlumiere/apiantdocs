"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function ImageFrame({ src, alt, width }: { src?: string; alt?: string; width?: string })
{
  const [open, setOpen] = useState(false);
  const [isSmall, setIsSmall] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() =>
  {
    setMounted(true);
  }, []);

  useEffect(() =>
  {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) =>
    {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!src) return null;

  const lightbox = open && mounted
    ? createPortal(
        <div
          className="lightbox-overlay"
          onClick={() => setOpen(false)}
        >
          <button
            className="lightbox-close"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="Close"
          >
            &#x2715;
          </button>
          <img
            src={src}
            alt={alt || ""}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <span
        className={isSmall ? "doc-image-inline" : "doc-image-frame"}
        onClick={isSmall ? undefined : () => setOpen(true)}
        style={isSmall ? undefined : { cursor: "zoom-in" }}
      >
        <img
          src={src}
          alt={alt || ""}
          loading="lazy"
          style={width ? { width, height: "auto" } : undefined}
          onLoad={(e) =>
          {
            const img = e.currentTarget;
            if (img.naturalWidth < 80 || img.naturalHeight < 80)
            {
              setIsSmall(true);
            }
          }}
        />
      </span>
      {lightbox}
    </>
  );
}
