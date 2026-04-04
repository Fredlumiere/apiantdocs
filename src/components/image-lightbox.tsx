"use client";

import { useState, useEffect } from "react";

export function ImageFrame({ src, alt }: { src?: string; alt?: string }) {
  const [open, setOpen] = useState(false);

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
      <span className="doc-image-frame" onClick={() => setOpen(true)} style={{ cursor: "zoom-in" }}>
        <img src={src} alt={alt || ""} loading="lazy" />
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
