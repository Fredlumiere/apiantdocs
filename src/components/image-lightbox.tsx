"use client";

import { useState, useEffect } from "react";

export function ImageFrame({ src, alt, width }: { src?: string; alt?: string; width?: string }) {
  const [open, setOpen] = useState(false);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!src) return null;

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
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth < 80 || img.naturalHeight < 80) {
              setIsSmall(true);
            }
          }}
        />
      </span>

      {open && (
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
        </div>
      )}

      <style>{`
        .doc-image-frame {
          display: block;
          margin: var(--space-6) 0;
          width: fit-content;
          max-width: 100%;
        }
        .doc-image-frame img {
          display: block;
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          max-width: 100%;
          height: auto;
          transition: border-color 0.15s;
        }
        .doc-image-frame img[width],
        .doc-image-frame img[style] {
          /* Respect explicit sizing */
        }
        /* Inline/small images (icons, badges) — no frame */
        .doc-image-inline {
          display: inline;
          margin: 0;
        }
        .doc-image-inline img {
          display: inline;
          border: none;
          border-radius: 0;
          background: none;
          vertical-align: middle;
          max-height: 1.5em;
          width: auto;
        }
        .doc-image-frame:hover img {
          border-color: var(--accent-primary);
        }
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
          animation: lightbox-fade-in 0.15s ease;
        }
        @keyframes lightbox-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .lightbox-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.15s;
        }
        .lightbox-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .lightbox-image {
          max-width: 90vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: var(--radius-md);
          cursor: default;
        }
      `}</style>
    </>
  );
}
