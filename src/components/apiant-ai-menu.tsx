"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  APIANT_AI_LOGO_URL,
  APIANT_AI_ORIGIN,
  MENU_LINKS,
  SIGN_IN_URL,
  START_FREE_URL,
} from "@/lib/apiant-ai-brand";

/**
 * apiant.ai's site menu, rebuilt in React for the docs zone.
 *
 * Source to keep in sync: apiant.ai `site.js` (HEADER markup and the menu
 * part of its CSS, which lives in src/lib/apiant-ai-brand.ts). site.js itself
 * is not loaded here: it inserts markup into <body> and rewrites body padding,
 * which would fight React hydration. The behavior below mirrors its mount():
 * at 720px and under the links collapse behind a Menu button, opening moves
 * focus to the first link, a link click closes, Escape closes and returns
 * focus to the button.
 *
 * Every link is absolute because the zone is also served on its own
 * vercel.app host, where a relative /pricing would 404.
 */
export function ApiantAiMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Crossing the breakpoint closes the menu, as site.js's fit() does.
  useEffect(() => {
    const mq = window.matchMedia("(max-width:720px)");
    const fit = () => setOpen(false);
    mq.addEventListener("change", fit);
    return () => mq.removeEventListener("change", fit);
  }, []);

  const toggle = useCallback(() => setOpen((was) => !was), []);

  useEffect(() => {
    if (!open) return;
    navRef.current?.querySelector("a")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sm" id="siteMenu">
      <div className="sm-bar">
        <a className="sm-brand" href={`${APIANT_AI_ORIGIN}/`} aria-label="APIANT.AI home">
          {/* eslint-disable-next-line @next/next/no-img-element -- cross-origin SVG, same tag site.js renders */}
          <img src={APIANT_AI_LOGO_URL} alt="" width={1158} height={213} />
          <i aria-hidden="true">.AI</i>
        </a>
        <nav
          className="sm-links"
          id="smLinks"
          aria-label="Site"
          ref={navRef}
          data-open={open ? "true" : "false"}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <ul>
            {MENU_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} rel={l.rel} aria-current={l.current ? "page" : undefined}>
                  {l.label}
                </a>
              </li>
            ))}
            <li className="sm-signin">
              <a href={SIGN_IN_URL}>Sign in</a>
            </li>
          </ul>
        </nav>
        <div className="sm-actions">
          <a className="sm-start" href={START_FREE_URL}>
            Start free
          </a>
          <button
            type="button"
            className="sm-btn"
            id="smBtn"
            ref={buttonRef}
            aria-expanded={open}
            aria-controls="smLinks"
            onClick={toggle}
          >
            Menu
          </button>
        </div>
      </div>
    </header>
  );
}
