# Next Phase — Prioritized Task List

Based on the current state documented in `apiantdocs-technical-documentation.md` and reviewed by Sam (Architect), Zoe (Design), Max (Staff Engineer), and Gus (QA).

---

## Phase 0: Foundation (Before Everything Else)

Critical bugs, security issues, and structural prerequisites that must be resolved before any feature work.

### 0.1 Fix PostgREST Filter Injection (P0 Security)

**Files:** `src/app/api/search/route.ts`, `src/app/api/chat/route.ts`

**Current:** User input interpolated directly into Supabase `.or()` filter strings:
```typescript
.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
```
A crafted query can inject PostgREST filter syntax and manipulate query logic.

**Fix:** Sanitize input by escaping special PostgREST characters, or eliminate `ilike` fallback paths entirely (which tasks 1.1 and 1.2 will do — but the vulnerability is live now).

**Acceptance criteria:**
- No user input is interpolated into filter strings without sanitization
- Verified with test cases: `%`, `,`, `.`, `(`, `)`, PostgREST operators

---

### 0.2 Rate Limit `/api/chat` Endpoint (P0 Cost)

**File:** `src/app/api/chat/route.ts`

**Current:** No auth, no rate limit. Anyone can spam it and run up Anthropic API costs.

**Fix:** Add IP-based rate limiting. Options: Vercel Edge rate limiter, or simple sliding-window counter with Supabase/KV.

**Acceptance criteria:**
- Max 10 requests per IP per minute (configurable)
- Returns 429 with `Retry-After` header when exceeded
- Doesn't affect authenticated/internal callers

---

### 0.3 Set Up Test Framework

**Current:** Zero test files, no test runner, no `npm test` script.

**Fix:** Add vitest + @testing-library/react. Write initial critical-path tests:
- Unit: `chunkText()`, `validateApiKey()`, `requireWriteAccess()`, `extractSlug()`
- Integration: API route response shapes (mock Supabase)
- Auth edge cases: undefined env vars, malformed tokens, expired keys

**Acceptance criteria:**
- `npm test` runs and passes
- Auth layer has >90% branch coverage
- CI-ready (can add to GitHub Actions later)

---

### 0.4 Fix Arial Font Override

**File:** `src/app/globals.css`

**Current:** `font-family: Arial, Helvetica, sans-serif` on body overrides the Geist fonts loaded in layout.tsx.

**Fix:** Remove the hardcoded font-family. Geist is already applied via CSS variables (`--font-geist-sans`).

---

### 0.5 Extract Brand Tokens & Define Design Foundation

**File:** `src/app/globals.css`

**Current:** Generic Tailwind zinc palette. Colors don't match apiant.com brand.

**Fix:** Before building any UI components:
1. Extract exact colors from apiant.com/index2.html source
2. Define CSS custom properties for colors, spacing scale (8px base grid), and breakpoints
3. Define focus ring styles (`2px solid var(--accent-primary)` with offset)
4. Dark-only (cut theme toggle — `prefers-color-scheme` handles light-mode users)

See `docs/design-system.md` for reference. **Lock tokens before Phase 2.**

**Acceptance criteria:**
- All color values are exact matches from apiant.com (not approximations)
- Spacing scale defined: 4/8/12/16/24/32/48px
- Breakpoints formalized: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Focus styles defined and applied globally

---

### 0.6 Create `docs/layout.tsx` (Shared Layout)

**Current:** `/docs/page.tsx` and `/docs/[...slug]/page.tsx` both independently render `<Sidebar>`. No shared layout.

**Fix:** Create `src/app/docs/layout.tsx` that wraps children with sidebar and three-column grid structure. This prevents:
- Sidebar re-fetching on every doc navigation
- Duplicated layout code when adding breadcrumbs, TOC, three-column grid

---

### 0.7 Move MarkdownRenderer to Server Component

**File:** `src/components/markdown-renderer.tsx`

**Current:** `"use client"` — ships react-markdown + remark-gfm + rehype-highlight + rehype-slug + rehype-autolink-headings to the browser (~200KB+).

**Fix:** Remove `"use client"`. These libraries have no client-side interactivity requirement. Run markdown rendering server-side in RSC. Add a thin client wrapper only for future interactive features (code copy button).

**Also:** Extract heading list server-side (regex on markdown body) for the TOC component (2.4).

---

### 0.8 Extract Shared Constants

**Current:** Product labels (`"Platform"`, `"API Apps"`, `"MCP"`) hardcoded in sidebar.tsx AND page.tsx. Will be duplicated again in breadcrumbs, search, chat.

**Fix:** Create `src/lib/constants.ts` with product labels, doc type labels, and any other repeated values.

---

## Phase 1: Backend Fixes

### 1.1 Fix Search to Use Full-Text Index

**File:** `src/app/api/search/route.ts`

**Current:** Uses `textSearch("title", q)` only. Falls back to `ilike` on title+description. Ignores the GIN index on title+description+body.

**Fix:** Replace with proper `websearch_to_tsquery` across the full tsvector. Use an RPC function or raw query via Supabase.

**Critical:** Verify the GIN index expression matches the query expression character-for-character. The index is:
```sql
to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(body, ''))
```
The query must use the identical expression or Postgres won't use the index.

Also add a `snippet` field using `ts_headline()` (max 200 chars, plain text with `<mark>` tags for highlighting).

**Acceptance criteria:**
- Search matches against title, description, AND body
- Results include a text snippet with match context
- Product filter works
- GIN index is confirmed in use (check with `EXPLAIN ANALYZE`)
- Graceful empty results (no errors on zero matches)

---

### 1.2 Fix Chat RAG to Use Semantic Search

**File:** `src/app/api/chat/route.ts`

**Current:** Uses `ilike` across title+body. Slow, no ranking, doesn't leverage embeddings.

**Fix:** Replace retrieval with `semanticSearch()` from `src/lib/embeddings.ts`. Add try/catch for Voyage API failures (the current code will throw unhandled if Voyage returns non-200 or wrong shape).

Also: remove unused `Anthropic` import from `embeddings.ts`.

**Acceptance criteria:**
- Chat uses semantic search (Voyage embeddings + cosine similarity via RPC)
- Retrieves top-8 relevant chunks, not full documents
- Response includes citations mapped to real document slugs
- Returns 503 with helpful message if VOYAGE_API_KEY missing
- Returns meaningful error if Voyage API is down (not a raw 500)

---

### 1.3 Fix Pagination Metadata

**File:** `src/app/api/docs/route.ts` (GET handler)

**Fix:** Use Supabase's `{ count: 'exact', head: false }` and return:

```json
{
  "data": [...],
  "count": 87,
  "meta": {
    "total": 87,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Note:** Keep `count` at top level for backward compatibility with MCP server, AND add `meta` object.

**Acceptance criteria:**
- `meta.total` reflects total matching documents
- `meta.has_more` is correct
- `count` still present (MCP server compat)

---

### 1.4 Voyage API Key: Throw, Don't Insert Garbage

**File:** `src/lib/embeddings.ts`

**Current:** Falls back to random vectors silently. This poisons the `doc_embeddings` table — semantic search returns noise.

**Fix:**
- Log warning at import time
- `generateEmbeddings()` throws if VOYAGE_API_KEY missing (don't silently insert random vectors)
- `/api/docs/[...slug]/embed` returns clear error when Voyage unavailable

---

### 1.5 Make `embedDocument` Atomic

**File:** `src/lib/embeddings.ts`

**Current:** Deletes old embeddings before generating new ones. If Voyage API fails after deletion, the document has zero embeddings.

**Fix:** Generate new embeddings first, then delete old and insert new in a single operation. Or use a transaction.

---

### 1.6 Hybrid Search Endpoint

**File:** `src/app/api/search/route.ts`

**Dependencies:** 1.1 + 1.2

Add `mode` query param to `GET /api/search`:
- `keyword` — full-text only
- `semantic` — vector similarity only
- `hybrid` (default) — combine both

**Score normalization:** Use percentile rank within each result set (not raw scores — ts_rank and cosine similarity have incompatible distributions). Weight: 0.4 keyword + 0.6 semantic. Dedup by document_id, take highest combined score.

**Acceptance criteria:**
- `mode=keyword` returns full-text results only
- `mode=semantic` returns vector results only
- `mode=hybrid` combines both with dedup
- Handles Voyage API down gracefully (falls back to keyword-only)
- Latency < 500ms for hybrid mode (with warm caches)

---

### 1.7 Navigation Tree Endpoint

**New route:** `GET /api/docs/tree`

Returns the full document hierarchy as a nested tree. Used by sidebar and breadcrumbs.

```typescript
interface TreeNode {
  id: string;
  slug: string;
  title: string;
  doc_type: string;
  product: string | null;
  sort_order: number;
  children: TreeNode[];
}
```

**Caching:** Use `unstable_cache` with a `docs-tree` tag. Revalidate on doc create/update/delete (add `revalidateTag('docs-tree')` to write endpoints).

**Acceptance criteria:**
- Returns nested tree grouped by product
- sort_order respected at each level
- Cycle detection (max depth 10, skip circular parent_id references)
- Cached, revalidated on mutations
- < 100ms response time

---

## Phase 2: Frontend — Search & Navigation

### 2.1 Search UI with ⌘K Modal

**New file:** `src/components/search-modal.tsx` (Client Component)

Build a command-palette-style search modal:
- Triggered by ⌘K (Mac) / Ctrl+K (Windows) or clicking search icon in header
- Full-screen overlay with centered search input
- Debounced input (300ms) → calls `GET /api/search?q=...&mode=hybrid`
- `AbortController` to cancel in-flight requests on new keystrokes
- Results as cards: title, snippet, product badge, doc_type badge
- Arrow key navigation, Enter to select
- ESC to close
- Minimum query length: 2 characters

**Dependencies:** 1.1 (search must return useful results), 0.5 (brand tokens)

**Acceptance criteria:**
- ⌘K opens modal from any page
- Live results as you type (debounced, cancels stale requests)
- Keyboard navigable (up/down/enter/esc)
- Results link to `/docs/[slug]`
- Empty state: "No results found. Try a different search term."
- Loading state: skeleton/pulse animation
- Error state: "Search unavailable. Please try again."
- Styled with brand tokens

---

### 2.2 Hierarchical Sidebar

**Files:** `src/components/sidebar.tsx` (Server Component for data), new `src/components/sidebar-tree.tsx` (Client Component for interaction)

**Dependencies:** 1.7 (tree endpoint)

**Architecture:** Server Component fetches tree via `/api/docs/tree` (cached). Passes tree data as props to a `"use client"` child that handles expand/collapse state.

**Behavior:**
- Collapsible tree with expand/collapse chevrons
- Auto-expand the branch containing the current page
- Active page highlighted with accent left border
- Collapsed branches render zero children (lazy DOM — avoids 444 Link prefetches)
- Mobile (<768px): hamburger icon triggers full-screen overlay drawer

**Acceptance criteria:**
- Parent docs show as expandable nodes
- Child docs nested under their parent
- Current page's branch auto-expanded
- sort_order respected within each level
- Long titles truncated with ellipsis
- Mobile: full-screen drawer with close button

---

### 2.3 Breadcrumbs

**New file:** `src/components/breadcrumbs.tsx` (Server Component)

**Dependencies:** 1.7 (tree endpoint, for walking parent chain)

`Home > Product > Parent Doc > Current Page`

**Acceptance criteria:**
- Shows on every doc page (rendered in `docs/layout.tsx`)
- Links to each ancestor
- Current page shown as plain text (not linked)
- Product name shown between Home and first doc

---

### 2.4 Table of Contents (On-This-Page)

**New file:** `src/components/table-of-contents.tsx` (Client Component)

**Heading extraction:** Server-side in the doc page component (regex parse of markdown body for `## ` and `### ` lines). Pass heading list as props to client TOC component.

**Behavior:**
- Fixed position on right side (screens ≥1280px)
- Hidden on smaller screens
- Scroll spy via `IntersectionObserver`: highlight heading currently in view
- Click to smooth-scroll to heading
- Uses IDs from `rehype-slug`

**Acceptance criteria:**
- Shows H2 and H3 headings from current document
- Scroll spy tracks current section
- Click scrolls smoothly to heading
- Hides on screens <1280px

---

### 2.5 Chat UI with Streaming

**New file:** `src/components/chat-panel.tsx` (Client Component)

**Backend change required:** Convert `/api/chat` to use `anthropic.messages.stream()` and return a `ReadableStream`. Streaming is not optional — waiting 5-10s for a full response is unacceptable UX.

**UI:** Slide-out panel (right side, triggered by floating button).

**Features:**
- Text input with max 500 char limit
- Streaming response display (token by token)
- Typing indicator during retrieval phase
- Citations as clickable links to source docs
- Session-only history (cleared on refresh)
- Product scope selector (optional filter)
- Retry button on failed messages

**Dependencies:** 1.2 (semantic search), 0.5 (brand tokens)

**Acceptance criteria:**
- Streaming tokens appear as they arrive
- Citations link to real doc pages
- Loading: "Searching documentation..." then streaming
- Error: message with retry button
- Rate limit hit: friendly message with wait time
- Session history maintained until page refresh

---

### 2.6 Error Handling & Empty States

**New files:**
- `src/app/docs/not-found.tsx` — branded 404 with search suggestions
- `src/app/docs/error.tsx` — error boundary for doc pages
- `src/app/error.tsx` — global error boundary

**Patterns to define:**
- Loading: skeleton/pulse animation (one pattern, used everywhere)
- Empty: icon + message + suggested action
- Error: message + retry button

**Acceptance criteria:**
- 404 page shows search bar and suggests related docs
- Error boundaries catch client component failures without crashing page
- Consistent loading/empty/error patterns across all components

---

## Phase 3: Design Polish & Layout

### 3.1 Header & Navigation Overhaul

**Current:** Minimal — just "APIANT Docs" link and basic nav.

**Target:**
- APIANT logo (dark mode SVG from apiant.com)
- Search icon/bar (triggers ⌘K modal)
- Nav links: Docs, API Reference, Chat
- Responsive: hamburger menu on mobile

---

### 3.2 Doc Page Three-Column Layout

**File:** `src/app/docs/layout.tsx`

**Target layout on wide screens (≥1280px):**
```
[Sidebar 260px] [Content max-768px] [TOC 200px]
```

**Responsive:**
- <768px: sidebar hidden (hamburger), content full-width, no TOC
- 768-1279px: sidebar + content, no TOC
- ≥1280px: full three-column

With breadcrumbs above title, prev/next navigation at bottom, "Last updated" timestamp.

---

### 3.3 Code Block Styling

**Current:** rehype-highlight with default theme.

**Target:**
- Dark terminal-style code blocks matching the brand
- Copy button (top-right, appears on hover) — this is the one client-side interactive element in markdown rendering
- Language label (top-left)
- Max-height 500px with scroll for long blocks
- No line numbers by default (add toggle later if needed)

---

### 3.4 Homepage: Add Search + Chat CTA (Slim Scope)

**Current:** Product cards + recent docs list.

**Change:** Add:
- Prominent search bar in hero (triggers ⌘K modal)
- "Ask AI" button/CTA
- Keep product cards and recent docs

**Cut:** No "featured/popular docs" (no analytics data to determine popularity). No full redesign — that's marketing, not docs.

---

## Phase 4: Content & Embedding Quality

### 4.1 Embed All Published Documents + REINDEX

Run embedding generation for all published docs that don't yet have embeddings. Script or MCP batch.

**After completion:** Run `REINDEX INDEX idx_doc_embeddings_vector;` — the IVFFlat index with 100 lists needs retraining after bulk data changes.

---

### 4.2 Add Metadata Column to `doc_embeddings`

**Migration:** Add `metadata jsonb DEFAULT '{}'` to `doc_embeddings` table.

Store: doc_type, product, section_path, has_code per chunk for better retrieval filtering.

**Must run before 4.3** (chunking improvement needs the column).

---

### 4.3 Improve Chunking Strategy

**File:** `src/lib/embeddings.ts`

**Current:** Character-based (1000 chars, 200 overlap). Splits mid-sentence, mid-code-block.

**Improvement:** Heading-aware chunking:
1. Split on H2 headings first
2. If section > 1500 chars, split on H3
3. If still too long, split on paragraph boundaries
4. Never split mid-code-block (detect ``` fences)
5. Prepend section path as metadata (e.g., "Authentication > API Keys")
6. Store metadata in the new `metadata` column

**Acceptance criteria:**
- Code blocks are never split
- Each chunk has a section_path in metadata
- Chunks are 500-1500 chars (not fixed 1000)
- Unit tests for chunking edge cases: empty doc, single heading, 10K code block, no headings

---

### 4.4 Add `last_embedded_at` Tracking

**Migration:** Add `last_embedded_at timestamptz` to `documents` table. Set it when embeddings are generated.

Enables: identifying docs with stale/missing embeddings, verifying 4.1 completion.

---

## Dependency Graph

```
Phase 0 (Foundation) ← MUST complete first
  ├── 0.1 Fix filter injection
  ├── 0.2 Rate limit chat
  ├── 0.3 Test framework
  ├── 0.4 Fix Arial font
  ├── 0.5 Brand tokens ──────────────────┐
  ├── 0.6 docs/layout.tsx                │
  ├── 0.7 MarkdownRenderer → RSC         │
  └── 0.8 Shared constants               │
                                          │
Phase 1 (Backend Fixes)                   │
  ├── 1.1 Fix Search ────────────┐        │
  ├── 1.2 Fix Chat RAG ─────────┤        │
  ├── 1.3 Fix Pagination         │        │
  ├── 1.4 Voyage: throw ≠ random │        │
  ├── 1.5 Atomic embedDocument    │        │
  ├── 1.6 Hybrid Search ◄── 1.1+1.2      │
  └── 1.7 Tree Endpoint ────────┐│        │
                                 ││        │
Phase 2 (Frontend)               ││        │
  ├── 2.1 Search UI ◄────── 1.1+1.6 ◄── 0.5
  ├── 2.2 Sidebar ◄──────── 1.7  │   ◄── 0.5
  ├── 2.3 Breadcrumbs ◄──── 1.7  │
  ├── 2.4 TOC                     │
  ├── 2.5 Chat UI ◄──────── 1.2  │   ◄── 0.5
  └── 2.6 Error/Empty/404         │
                                   │
Phase 3 (Design Polish)            │
  ├── 3.1 Header ◄─────── 2.1     │
  ├── 3.2 Three-column ◄── 2.3+2.4│
  ├── 3.3 Code blocks              │
  └── 3.4 Homepage ◄───── 2.1+2.5 │
                                    │
Phase 4 (Content Quality)           │
  ├── 4.1 Embed all + REINDEX      │
  ├── 4.2 Metadata column migration │
  ├── 4.3 Better chunking ◄── 4.2  │
  └── 4.4 last_embedded_at tracking │
```

## Agent Assignment

Two agents with clear boundaries (per Sam's recommendation — 6 agents is over-staffed for 20 tasks):

| Agent | Tasks | Scope |
|-------|-------|-------|
| **Backend** | 0.1, 0.2, 0.3, 0.8, 1.1–1.7, 4.1–4.4 | Security, API, search, embeddings, data |
| **Frontend** | 0.4, 0.5, 0.6, 0.7, 2.1–2.6, 3.1–3.4 | Design tokens, components, layout, styling |

Backend starts Phase 0 security fixes → Phase 1 backend. Frontend starts Phase 0 design foundation → Phase 2 components once tokens and backend are ready. Phase 3 and 4 follow naturally.
