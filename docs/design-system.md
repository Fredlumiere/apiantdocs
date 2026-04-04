# Design System — apiantdocs

## North Star

The docs site is a seamless extension of apiant.com/index2.html. Dark mode primary, terminal/CLI aesthetic, code-forward, premium technical brand. No generic doc templates.

## Current State

- Dark mode via `prefers-color-scheme` (Tailwind v4)
- Geist + Geist Mono fonts (Google Fonts, loaded in root layout.tsx)
- Tailwind Typography (`prose prose-zinc dark:prose-invert`) for markdown rendering
- Basic sidebar (flat list by product, w-64, fixed left)
- Minimal header — no logo, no search, no theme toggle

## Color Tokens (Target)

Extract exact values from apiant.com/index2.html. These are starting points:

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0f;         /* Page background */
  --bg-secondary: #111118;       /* Cards, sidebar */
  --bg-tertiary: #1a1a24;        /* Code blocks, hover states */
  --bg-elevated: #222230;        /* Dropdowns, modals */

  /* Text */
  --text-primary: #f0f0f5;       /* Body text */
  --text-secondary: #a0a0b0;     /* Muted, descriptions */
  --text-tertiary: #606070;      /* Disabled, timestamps */

  /* Accent — match APIANT brand exactly */
  --accent-primary: #6366f1;     /* Links, active states */
  --accent-hover: #818cf8;       /* Hover */
  --accent-muted: #6366f120;     /* Subtle backgrounds */

  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Borders */
  --border-primary: #2a2a3a;
  --border-hover: #3a3a4a;

  /* Code */
  --code-bg: #0d0d14;
  --code-border: #1e1e2e;
}
```

**IMPORTANT:** Extract actual colors from the apiant.com/index2.html stylesheet before implementing. The above are approximations.

## Typography (Actual)

Fonts are already configured in `src/app/layout.tsx`:

```typescript
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

**Do NOT change to Inter or JetBrains Mono.** Geist is the established font. Verify it matches apiant.com — if apiant.com uses a different font, then the docs font should be updated to match.

Typography scale (target):
- `text-xs` (12px): timestamps, badges
- `text-sm` (14px): sidebar items, captions
- `text-base` (16px): body text
- `text-lg` (18px): lead paragraphs
- `text-xl` (20px): H3
- `text-2xl` (24px): H2
- `text-3xl` (32px): H1 / page title

## Layout (Target)

### Page Structure

```
┌──────────────────────────────────────────────────────┐
│  Header: Logo | Search (⌘K) | Nav | Theme toggle    │
├───────────┬──────────────────────────┬───────────────┤
│  Sidebar  │  Main Content            │  On-this-page │
│  (260px)  │  (flexible, max 768px)   │  TOC (200px)  │
│           │                          │               │
│  - Tree   │  Breadcrumbs             │  - H2 links   │
│    nav    │  Title                   │  - H3 links   │
│           │  Description             │  - Scroll spy │
│           │  Body (markdown)         │               │
│           │  Prev/Next nav           │               │
├───────────┴──────────────────────────┴───────────────┤
│  Footer: Links | © 2026 Apiant, Inc.                 │
└──────────────────────────────────────────────────────┘
```

- **Sidebar** collapses to hamburger on mobile (<768px)
- **TOC** hides on screens <1280px
- **Main content** max-width 768px for readability

### Current Layout

Sidebar (w-64) + content area. No header redesign, no TOC, no breadcrumbs, no footer.

## Components

### Sidebar (Needs Upgrade)

**Current:** Flat list grouped by product (platform, api-apps, mcp, general). Active item bg-zinc-100. Product labels uppercase.

**Target:** Collapsible tree with parent/child hierarchy. Expand/collapse chevrons. Current page's branch auto-expanded. Accent left border on active item.

### Search Modal (New — Phase 2.1)

- ⌘K / Ctrl+K trigger
- Full-screen dark overlay
- Centered search input with autofocus
- Debounced results (300ms)
- Keyboard navigation (arrows, enter, esc)
- Results: title, snippet, product badge, doc_type badge

### Code Blocks (Needs Upgrade)

**Current:** rehype-highlight with default theme. Tailwind Typography prose styling.

**Target:**
- Dark terminal-style blocks (--code-bg)
- Copy button (top-right, hover)
- Language label (top-left)
- Consider Shiki for more control over theme

### Chat Panel (New — Phase 2.5)

- Slide-out or integrated with search
- Message input, response display
- Clickable citation links
- Dark themed

### Callouts / Admonitions

- **Info** (blue ℹ️) — general notes
- **Tip** (green 💡) — best practices
- **Warning** (yellow ⚠️) — gotchas
- **Danger** (red 🚨) — breaking changes
- **Patent Pending** (accent ⚖) — APIANT differentiator

### Tables

- Stripe with alternating bg-primary / bg-secondary
- Sticky header
- Horizontal scroll on overflow (mobile)
- Clean, minimal borders

## Theme Toggle

**Current:** `prefers-color-scheme` only (no toggle).

**Target:** Manual toggle with localStorage persistence. Default to dark. CSS custom properties swap via class on `<html>`.

## Animations

Keep minimal — docs site, performance matters:
- Page transitions: subtle fade (150ms)
- Sidebar expand/collapse: smooth height (200ms)
- Code copy button: brief checkmark on success
- Search modal: fade + scale in (200ms)
