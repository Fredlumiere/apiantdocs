import type { ReactNode } from "react";

// Card glyphs (64x64). Ported verbatim from apiant.com/ai-operability.html
// with React-safe attribute casing. Class name `g` on the <svg> + `anim`, `soft`,
// `fill`, `tk` inside match the CSS selectors in src/styles/gallery.css.
//
// Animation style strings use Fred's original keyframe names (orbit, dash, tick,
// rise, plug, draw, spark, etc.) — those aliases are defined in gallery.css.

// Category header glyphs (24x24). Stroke is --accent-primary, stroke-width=1.7.
// Used by WorkflowSection via the .cat-ico selector.
const CAT_ICONS: Record<string, ReactNode> = {
  setup: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  build: (
    <svg viewBox="0 0 24 24">
      <path d="M4 20V10l8-6 8 6v10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  test: (
    <svg viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  triggers: (
    <svg viewBox="0 0 24 24">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  actions: (
    <svg viewBox="0 0 24 24">
      <path d="M5 12h14M12 5v14" />
    </svg>
  ),
  connector: (
    <svg viewBox="0 0 24 24">
      <path d="M9 17h6M9 13h6M7 7l5-4 5 4" />
      <rect height="10" rx="2" width="18" x="3" y="11" />
    </svg>
  ),
  sync: (
    <svg viewBox="0 0 24 24">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  patterns: (
    <svg viewBox="0 0 24 24">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  ops: (
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
};

// Card glyphs (64x64). One per skill; keyed by a short glyph name.
const CARD_GLYPHS: Record<string, ReactNode> = {
  // setup — /apiant-setup
  "setup-check": (
    <svg className="g" viewBox="0 0 64 64">
      <circle className="soft" cx="32" cy="32" r="20" />
      <g className="anim" style={{ transformOrigin: "32px 32px", animation: "orbit 12s linear infinite" }}>
        <circle className="fill" cx="32" cy="10" r="3" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
      </g>
      <path className="tk" d="M22 32 L30 40 L44 24" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: "tick 2.8s ease-in-out infinite" }} />
    </svg>
  ),
  // build — /build-automation
  "build-automation": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="14" rx="2" width="14" x="8" y="16" />
      <rect height="14" rx="2" width="14" x="26" y="16" />
      <rect height="14" rx="2" width="14" x="44" y="16" />
      <path className="anim" d="M22 23 L26 23 M40 23 L44 23" strokeDasharray="2 2" style={{ animation: "dash 1.6s linear infinite" }} />
      <rect className="soft" height="14" rx="2" width="30" x="17" y="40" />
      <path className="soft anim" d="M15 30 L32 40 L49 30" strokeDasharray="3 3" style={{ animation: "dash 2s linear infinite" }} />
    </svg>
  ),
  // build — /build-assembly
  "build-assembly": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="10" rx="2" width="36" x="14" y="10" />
      <rect height="10" rx="2" width="48" x="8" y="24" />
      <rect height="10" rx="2" width="24" x="20" y="38" />
      <g className="anim" style={{ animation: "rise 2.4s ease-in-out infinite" }}>
        <circle className="fill" cx="32" cy="54" r="3" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
      </g>
    </svg>
  ),
  // build — /build-integration
  "build-integration": (
    <svg className="g" viewBox="0 0 64 64">
      <circle cx="16" cy="32" r="6" />
      <circle cx="48" cy="18" r="6" />
      <circle cx="48" cy="46" r="6" />
      <path className="anim" d="M22 32 L42 20 M22 32 L42 44" strokeDasharray="3 3" style={{ animation: "dash 1.8s linear infinite" }} />
      <circle className="fill" cx="16" cy="32" r="2" />
      <circle className="fill" cx="48" cy="18" r="2" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
      <circle className="fill" cx="48" cy="46" r="2" style={{ ["--gc" as string]: "#c084fc" } as React.CSSProperties} />
    </svg>
  ),
  // build — /build-form
  "build-form": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="44" rx="4" width="44" x="10" y="10" />
      <rect className="soft fill" height="5" rx="1" width="32" x="16" y="18" />
      <rect className="soft fill" height="5" rx="1" width="22" x="16" y="27" />
      <rect height="10" rx="2" width="32" x="16" y="36" />
      <path className="anim" d="M20 41 L26 41" style={{ strokeDasharray: 12, strokeDashoffset: 12, animation: "draw 2.4s ease-in-out infinite" }} />
    </svg>
  ),
  // edit — /edit-automation
  "edit-automation": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="10" rx="2" width="14" x="10" y="14" />
      <rect height="10" rx="2" width="14" x="10" y="30" />
      <rect height="10" rx="2" width="14" x="10" y="46" />
      <path className="soft" d="M24 19 L40 19 M24 35 L40 35 M24 51 L40 51" />
      <path className="tk" d="M38 28 L52 14 L58 20 L44 34 Z" />
      <path className="soft" d="M38 28 L44 34" />
    </svg>
  ),
  // edit — /edit-assembly
  "edit-assembly": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="14" rx="3" width="48" x="8" y="10" />
      <rect height="14" rx="3" width="48" x="8" y="28" />
      <rect className="soft" height="8" rx="2" width="30" x="8" y="46" />
      <path className="tk" d="M40 42 L52 30 L58 36 L46 48 Z" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
    </svg>
  ),
  // test — /test-automation
  "test-automation": (
    <svg className="g" viewBox="0 0 64 64">
      <circle className="soft" cx="32" cy="32" r="20" />
      <path className="anim" d="M22 32 L30 40 L44 24" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: "tick 2.8s ease-in-out infinite" }} />
    </svg>
  ),
  // test — /test-integration
  "test-integration": (
    <svg className="g" viewBox="0 0 64 64">
      <circle cx="20" cy="22" r="6" />
      <circle cx="44" cy="22" r="6" />
      <circle cx="32" cy="46" r="6" />
      <path className="anim" d="M26 22 L38 22 M24 27 L29 41 M40 27 L35 41" strokeDasharray="3 3" style={{ animation: "dash 2s linear infinite" }} />
    </svg>
  ),
  // test — /deploy-automation
  "deploy-automation": (
    <svg className="g" viewBox="0 0 64 64">
      <path className="tk" d="M32 52 L32 12" />
      <path className="tk" d="M24 20 L32 12 L40 20" />
      <rect className="soft" height="8" rx="2" width="28" x="18" y="44" />
      <g className="anim" style={{ animation: "rise2 2.4s ease-in-out infinite" }}>
        <circle className="fill" cx="32" cy="32" r="3" />
      </g>
      <circle className="soft fill" cx="20" cy="52" r="1.5" />
      <circle className="soft fill" cx="44" cy="52" r="1.5" />
    </svg>
  ),
  // triggers — assembly-trigger-new
  "trigger-new": (
    <svg className="g" viewBox="0 0 64 64">
      <circle className="soft" cx="32" cy="32" r="20" />
      <path className="tk" d="M32 14 V32 L42 38" />
      <circle className="fill" cx="32" cy="32" r="2" />
      <g className="anim" style={{ transformOrigin: "32px 32px", animation: "orbit 6s linear infinite" }}>
        <circle className="fill" cx="52" cy="32" r="2.5" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
      </g>
    </svg>
  ),
  // triggers — assembly-trigger-updated
  "trigger-updated": (
    <svg className="g" viewBox="0 0 64 64">
      <circle className="soft" cx="32" cy="32" r="20" />
      <path className="tk" d="M32 14 V32 L42 38" />
      <path className="soft" d="M18 48 L26 48 L26 54" />
      <path className="soft" d="M46 18 L50 18 L50 22" />
      <circle className="fill" cx="32" cy="32" r="2" />
    </svg>
  ),
  // triggers — manual-webhook
  "trigger-manual-webhook": (
    <svg className="g" viewBox="0 0 64 64">
      <path className="tk" d="M8 44 C 20 44, 20 20, 32 20 C 44 20, 44 44, 56 44" />
      <circle className="fill" cx="8" cy="44" r="3" />
      <circle className="fill" cx="56" cy="44" r="3" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
      <circle className="fill" cx="32" cy="20" r="2" />
      <g className="anim" style={{ animation: "travelH 2.2s ease-in-out infinite" }}>
        <circle className="fill" cx="32" cy="20" r="2" />
      </g>
    </svg>
  ),
  // triggers — self-registering-webhook
  "trigger-self-reg-webhook": (
    <svg className="g" viewBox="0 0 64 64">
      <circle className="soft" cx="32" cy="32" r="22" />
      <path className="tk" d="M22 32 L30 40 L44 24" />
      <circle className="fill" cx="32" cy="10" r="3" />
      <circle className="fill" cx="32" cy="54" r="3" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
    </svg>
  ),
  // triggers — service-webhook
  "trigger-service-webhook": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="36" rx="4" width="44" x="10" y="14" />
      <path d="M10 24 L54 24" />
      <circle className="fill" cx="16" cy="19" r="1.5" />
      <circle className="fill" cx="22" cy="19" r="1.5" />
      <path className="soft" d="M16 34 L48 34" />
      <rect className="anim" height="6" rx="1" style={{ ["--gc" as string]: "#1ab759", animation: "blink 1.8s infinite" } as React.CSSProperties} width="18" x="16" y="40" />
    </svg>
  ),
  // triggers — protocol-thread
  "trigger-protocol-thread": (
    <svg className="g" viewBox="0 0 64 64">
      <path className="tk" d="M8 32 L56 32" />
      <path className="soft" d="M16 22 L16 42 M26 22 L26 42 M36 22 L36 42 M46 22 L46 42" />
      <circle className="fill" cx="8" cy="32" r="3" />
      <circle className="fill" cx="56" cy="32" r="3" style={{ ["--gc" as string]: "#c084fc" } as React.CSSProperties} />
      <g className="anim" style={{ animation: "travelH 1.8s linear infinite" }}>
        <circle className="fill" cx="16" cy="32" r="2.5" />
      </g>
    </svg>
  ),
  // actions — ADD
  "action-add": (
    <svg className="g" viewBox="0 0 64 64">
      <circle className="soft" cx="32" cy="32" r="20" />
      <path className="tk" d="M32 22 V42 M22 32 H42" />
    </svg>
  ),
  // actions — DELETE
  "action-delete": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="40" rx="3" width="36" x="14" y="16" />
      <rect height="8" rx="2" width="24" x="20" y="10" />
      <path className="soft" d="M20 28 L44 28 M20 36 L44 36 M20 44 L44 44" />
      <path className="anim" d="M14 52 L50 20" strokeDasharray="2 3" style={{ animation: "dash 1.6s linear infinite", ["--gc" as string]: "#ff78b4" } as React.CSSProperties} />
    </svg>
  ),
  // actions — FIND
  "action-find": (
    <svg className="g" viewBox="0 0 64 64">
      <circle cx="26" cy="26" r="14" />
      <path className="tk" d="M36 36 L52 52" />
      <g className="anim" style={{ animation: "spark 1.8s ease-in-out infinite" }}>
        <circle className="fill" cx="26" cy="26" r="3" />
      </g>
    </svg>
  ),
  // actions — GET
  "action-get": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="36" rx="4" width="36" x="14" y="14" />
      <path className="soft" d="M22 22 L42 22 M22 30 L42 30 M22 38 L34 38" />
      <circle className="fill" cx="50" cy="50" r="7" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
      <path className="tk" d="M46 50 L50 54 L56 46" stroke="#0c0c0c" />
    </svg>
  ),
  // actions — LIST
  "action-list": (
    <svg className="g" viewBox="0 0 64 64">
      <rect className="soft fill" height="6" rx="2" width="44" x="10" y="14" />
      <rect className="soft fill" height="6" rx="2" width="44" x="10" y="24" />
      <rect className="fill" height="6" rx="2" width="44" x="10" y="34" />
      <rect className="soft fill" height="6" rx="2" width="44" x="10" y="44" />
    </svg>
  ),
  // actions — UPDATE
  "action-update": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="32" rx="3" width="40" x="12" y="16" />
      <path className="soft" d="M12 26 L52 26" />
      <path className="tk" d="M20 38 L28 32 L36 36 L44 30" />
      <circle className="fill" cx="20" cy="38" r="1.7" />
      <circle className="fill" cx="28" cy="32" r="1.7" />
      <circle className="fill" cx="36" cy="36" r="1.7" />
      <circle className="fill" cx="44" cy="30" r="1.7" />
    </svg>
  ),
  // connector — assembly-connector
  "connector": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="16" rx="3" width="20" x="8" y="24" />
      <rect height="16" rx="3" width="20" x="36" y="24" />
      <path className="tk anim" d="M28 32 L36 32" style={{ animation: "plug 1.6s ease-in-out infinite" }} />
      <circle className="fill" cx="14" cy="20" r="2" />
      <circle className="fill" cx="22" cy="20" r="2" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
      <circle className="fill" cx="42" cy="44" r="2" style={{ ["--gc" as string]: "#c084fc" } as React.CSSProperties} />
      <circle className="fill" cx="50" cy="44" r="2" style={{ ["--gc" as string]: "#f5b748" } as React.CSSProperties} />
    </svg>
  ),
  // connector — /register-oauth-app
  "register-oauth": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="36" rx="4" width="44" x="10" y="14" />
      <path className="soft" d="M16 22 L48 22" />
      <rect className="fill" height="10" rx="2" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} width="16" x="20" y="30" />
      <path className="soft" d="M40 34 L48 34 M40 40 L44 40" />
      <circle className="fill" cx="52" cy="14" r="4" />
      <path className="tk" d="M50 14 L52 16 L54 13" stroke="#0c0c0c" />
    </svg>
  ),
  // connector — /convert-assembly
  "convert-assembly": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="26" rx="2" width="18" x="10" y="14" />
      <rect height="26" rx="2" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} width="18" x="36" y="14" />
      <path className="tk" d="M14 44 L14 50 L50 50 L50 44" />
      <path className="anim" d="M28 24 C 32 20, 32 30, 36 26" strokeDasharray="2 2" style={{ animation: "dash 1.6s linear infinite" }} />
    </svg>
  ),
  // sync — bidirectional
  "sync-bidirectional": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="36" rx="3" width="18" x="8" y="14" />
      <rect height="36" rx="3" width="18" x="38" y="14" />
      <path className="tk" d="M26 24 L38 24 M32 20 L38 24 L32 28" />
      <path className="tk" d="M38 40 L26 40 M26 44 L20 40 L26 36" style={{ ["--gc" as string]: "#5cc8ff" } as React.CSSProperties} />
    </svg>
  ),
  // patterns — chat-widget
  "pattern-chat": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="28" rx="6" width="36" x="8" y="14" />
      <path className="fill" d="M14 48 L18 42 L14 42 Z" />
      <circle className="fill" cx="18" cy="28" r="2" />
      <circle className="fill" cx="26" cy="28" r="2" />
      <circle className="fill" cx="34" cy="28" r="2" style={{ animation: "blink 1.5s infinite" }} />
      <circle className="soft" cx="52" cy="18" r="6" />
    </svg>
  ),
  // patterns — csv
  "pattern-csv": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="44" rx="2" width="22" x="8" y="10" />
      <rect height="44" rx="2" width="22" x="34" y="10" />
      <path className="soft" d="M8 20 L30 20 M8 30 L30 30 M8 40 L30 40 M34 20 L56 20 M34 30 L56 30 M34 40 L56 40" />
      <path className="anim" d="M26 20 C 30 20, 32 30, 38 30" strokeDasharray="2 2" style={{ animation: "dash 1.6s linear infinite" }} />
      <path className="anim" d="M26 30 C 30 30, 32 40, 38 40" strokeDasharray="2 2" style={{ animation: "dash 1.8s linear infinite" }} />
    </svg>
  ),
  // patterns — execute-automation
  "pattern-execute": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="14" rx="2" width="20" x="8" y="8" />
      <rect height="14" rx="2" width="20" x="36" y="24" />
      <rect height="14" rx="2" width="20" x="8" y="42" />
      <path className="anim" d="M28 15 C 36 15, 36 31, 36 31" strokeDasharray="2 2" style={{ animation: "dash 1.6s linear infinite" }} />
      <path className="anim" d="M36 31 C 28 31, 28 49, 28 49" strokeDasharray="2 2" style={{ animation: "dash 1.9s linear infinite" }} />
    </svg>
  ),
  // patterns — human-moderation
  "pattern-human": (
    <svg className="g" viewBox="0 0 64 64">
      <rect height="28" rx="4" width="36" x="14" y="14" />
      <path className="soft" d="M22 24 L42 24 M22 32 L34 32" />
      <circle cx="24" cy="50" r="6" />
      <path className="tk" d="M20 50 L23 53 L28 47" />
      <circle cx="44" cy="50" r="6" />
      <path className="tk" d="M40 46 L48 54 M48 46 L40 54" style={{ ["--gc" as string]: "#ff78b4" } as React.CSSProperties} />
    </svg>
  ),
  // patterns — latches
  "pattern-latches": (
    <svg className="g" viewBox="0 0 64 64">
      <circle className="fill" cx="32" cy="14" r="4" />
      <path className="tk" d="M32 18 L20 34 M32 18 L44 34 M32 18 L32 34" />
      <circle cx="20" cy="38" r="4" />
      <circle cx="32" cy="38" r="4" />
      <circle cx="44" cy="38" r="4" />
      <path className="anim" d="M20 42 L32 54 M32 42 L32 54 M44 42 L32 54" strokeDasharray="2 2" style={{ animation: "dash 1.8s linear infinite" }} />
      <circle className="fill" cx="32" cy="54" r="4" style={{ ["--gc" as string]: "#c084fc" } as React.CSSProperties} />
    </svg>
  ),
  // patterns — snooze
  "pattern-snooze": (
    <svg className="g" viewBox="0 0 64 64">
      <circle className="soft" cx="32" cy="32" r="22" />
      <path className="tk" d="M32 16 V32 L44 40" />
      <path className="soft" d="M18 50 L28 50 M36 50 L46 50" />
      <g className="anim" style={{ transformOrigin: "32px 32px", animation: "orbit 8s linear infinite" }}>
        <circle className="fill" cx="54" cy="32" r="2" style={{ ["--gc" as string]: "#f5b748" } as React.CSSProperties} />
      </g>
    </svg>
  ),
  // ops — monitor-account
  "ops-monitor": (
    <svg className="g" viewBox="0 0 64 64">
      <path className="tk" d="M8 50 L16 38 L24 44 L32 24 L40 30 L48 16 L56 22" />
      <circle className="fill" cx="32" cy="24" r="3" />
      <circle className="fill" cx="48" cy="16" r="3" style={{ ["--gc" as string]: "#ff78b4" } as React.CSSProperties} />
      <g className="anim" style={{ animation: "spark 2s ease-in-out infinite" }}>
        <circle className="soft" cx="48" cy="16" r="6" />
      </g>
    </svg>
  ),
  // ops — support
  "ops-support": (
    <svg className="g" viewBox="0 0 64 64">
      <circle cx="26" cy="26" r="14" />
      <circle className="soft fill" cx="26" cy="26" r="6" />
      <path className="tk" d="M36 36 L54 54" />
      <path className="anim soft" d="M14 14 L20 20 M32 14 L26 20" strokeDasharray="2 2" style={{ animation: "dash 1.6s linear infinite" }} />
    </svg>
  ),
  // ops — alert-handling
  "ops-alert": (
    <svg className="g" viewBox="0 0 64 64">
      <path className="tk" d="M32 12 C 22 12, 18 20, 18 30 L 18 40 L 14 46 L 50 46 L 46 40 L 46 30 C 46 20, 42 12, 32 12 Z" />
      <path className="tk" d="M28 50 C 28 54, 36 54, 36 50" />
      <g className="anim" style={{ animation: "spark 1.6s ease-in-out infinite" }}>
        <circle className="soft" cx="46" cy="16" r="6" style={{ ["--gc" as string]: "#ff78b4" } as React.CSSProperties} />
      </g>
      <circle className="fill" cx="46" cy="16" r="3" style={{ ["--gc" as string]: "#ff78b4" } as React.CSSProperties} />
    </svg>
  ),
};

export function CategoryIcon({ name }: { name: string }): ReactNode
{
  return CAT_ICONS[name] ?? null;
}

export function CardGlyph({ name }: { name: string }): ReactNode
{
  return CARD_GLYPHS[name] ?? null;
}
