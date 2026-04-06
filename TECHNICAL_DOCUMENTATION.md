# APIANT Docs — Complete Technical Documentation

> Generated: 2026-04-04 (regenerated with full codebase audit)
> Purpose: Comprehensive technical reference for all developers working on apiantdocs.

---

## 1. Project Overview

**apiantdocs** is an AI-first documentation platform for APIANT, replacing the previous Archbee-hosted docs at `info.apiant.com`. The system stores Markdown content in Supabase Postgres (with pgvector), serves it via Next.js 16 App Router with ISR, exposes a REST API for CRUD operations, supports hybrid search (keyword + semantic), provides RAG-powered chat via Claude, and ships a standalone MCP server for programmatic access.

**Current content:** 444 published documents migrated from Archbee, organized by product (`platform`: 301, `api-apps`: 138, untagged: 5).

---

## 2. Full Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, RSC) | 16.2.2 |
| UI Library | React | 19.2.4 |
| Language | TypeScript (strict) | ^5 |
| CSS | Tailwind CSS v4 + @tailwindcss/typography | ^4 / ^0.5.19 |
| Fonts | Geist + Geist Mono (next/font/google) | - |
| Database | Supabase (Postgres + pgvector + pg_trgm) | supabase-js ^2.101.1 |
| Auth | Supabase Auth via @supabase/ssr | ^0.10.0 |
| LLM (Chat) | Anthropic Claude Sonnet 4 | @anthropic-ai/sdk ^0.82.0 |
| Embeddings | Voyage AI voyage-3 (1024-dim) | REST API |
| Markdown | react-markdown ^10.1.0 | - |
| Markdown plugins | remark-gfm, rehype-highlight, rehype-slug, rehype-autolink-headings, rehype-raw | ^4/^7 |
| Frontmatter | gray-matter ^4.0.3 | - |
| Slug util | slugify ^1.6.9 | - |
| MCP Server | @modelcontextprotocol/sdk | ^1.0.0 |
| Testing | Vitest + jsdom + @testing-library/react | vitest ^4.1.2 |
| Linting | ESLint 9 + eslint-config-next | ^9 / 16.2.2 |
| Deployment | Vercel (frontend) + Supabase (database) | - |

---

## 3. Architecture Diagram

```
                              +---------------------+
                              |     Vercel Edge      |
                              |   (Next.js 16 SSR)   |
                              +---------+-----------+
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
              +-----+------+    +------+------+    +------+------+
              | SSR Pages  |    | API Routes  |    | Middleware   |
              | /docs/*    |    | /api/*      |    | Auth refresh |
              | /login     |    |             |    | CORS headers |
              | /signup    |    |             |    | Route guard  |
              | /dashboard |    |             |    +-------------+
              +-----+------+    +------+------+
                    |                  |
                    +--------+---------+
                             |
                    +--------+--------+
                    |   Supabase      |
                    |   Postgres      |
                    |   + pgvector    |
                    |   + pg_trgm     |
                    |   + RLS         |
                    |   + Auth        |
                    +--------+--------+
                             |
              +--------------+--------------+
              |              |              |
        +-----+----+  +-----+-----+  +-----+-----+
        | Voyage AI |  | Anthropic |  | MCP Server|
        | Embeddings|  | Claude    |  | (stdio)   |
        | voyage-3  |  | Sonnet 4  |  | 8 tools   |
        +-----------+  +-----------+  +-----------+

Client Architecture:
+----------------------------------------------------------+
|  Root Layout (Server)                                     |
|  +-- AuthProvider (Client) — React Context for user state |
|  +-- <children> (page content)                            |
|  +-- ChatPanel (Client) — floating RAG chat               |
+----------------------------------------------------------+

Docs Layout:
+----------------------------------------------------------+
|  DocsHeaderWrapper (Client) — search + nav + theme toggle |
+----------------------------------------------------------+
|  Sidebar (Server) | Content Area      | TOC (Client)     |
|  +-- SidebarTree  | +-- Breadcrumbs   | +-- scroll spy   |
|  (Client, tree)   | +-- MarkdownRdr   | h2/h3 headings   |
|  +-- SidebarRsz   | +-- ChildCards    |                   |
|  (Client, drag)   | +-- RelatedDocs   |                   |
|                    | +-- DocNav        |                   |
+----------------------------------------------------------+
```

---

## 4. Complete Database Schema

### Extensions

- `vector` (pgvector) — 1024-dimension vector embeddings
- `pg_trgm` — trigram-based fuzzy text matching

### Table: `documents`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | uuid | PK | `gen_random_uuid()` |
| `slug` | text | UNIQUE NOT NULL | - |
| `title` | text | NOT NULL | - |
| `description` | text | nullable | - |
| `body` | text | NOT NULL | - |
| `doc_type` | text | NOT NULL, CHECK IN ('guide','api-ref','tutorial','changelog') | - |
| `product` | text | CHECK IN ('api-apps','platform','mcp'), nullable | - |
| `parent_id` | uuid | FK -> documents(id), nullable | - |
| `sort_order` | int | - | 0 |
| `tags` | text[] | - | '{}' |
| `metadata` | jsonb | - | '{}' |
| `status` | text | CHECK IN ('draft','published','archived') | 'draft' |
| `version` | int | - | 1 |
| `created_at` | timestamptz | - | `now()` |
| `updated_at` | timestamptz | auto-updated by trigger | `now()` |
| `published_at` | timestamptz | nullable | - |

### Table: `doc_versions`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | uuid | PK | `gen_random_uuid()` |
| `document_id` | uuid | FK -> documents(id) ON DELETE CASCADE | - |
| `version` | int | NOT NULL | - |
| `title` | text | NOT NULL | - |
| `body` | text | NOT NULL | - |
| `changed_by` | text | NOT NULL | - |
| `change_summary` | text | nullable | - |
| `created_at` | timestamptz | - | `now()` |

### Table: `doc_embeddings`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | uuid | PK | `gen_random_uuid()` |
| `document_id` | uuid | FK -> documents(id) ON DELETE CASCADE | - |
| `chunk_index` | int | NOT NULL | - |
| `content` | text | NOT NULL | - |
| `embedding` | vector(1024) | - | - |
| `created_at` | timestamptz | - | `now()` |

### Table: `api_keys`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | uuid | PK | `gen_random_uuid()` |
| `name` | text | NOT NULL | - |
| `key_hash` | text | NOT NULL | - |
| `key_prefix` | text | NOT NULL | - |
| `permissions` | text[] | - | '{read}' |
| `user_id` | uuid | FK -> auth.users(id) ON DELETE CASCADE, nullable | - |
| `created_at` | timestamptz | - | `now()` |
| `last_used_at` | timestamptz | nullable | - |

### Indexes

| Name | Table | Type | Expression |
|------|-------|------|-----------|
| `idx_documents_slug` | documents | btree | slug |
| `idx_documents_status` | documents | btree | status |
| `idx_documents_doc_type` | documents | btree | doc_type |
| `idx_documents_product` | documents | btree | product |
| `idx_documents_parent_id` | documents | btree | parent_id |
| `idx_documents_fts` | documents | GIN | `to_tsvector('english', title \|\| ' ' \|\| description \|\| ' ' \|\| body)` |
| `idx_documents_title_trgm` | documents | GIN (pg_trgm) | `title gin_trgm_ops` |
| `idx_documents_tags` | documents | GIN | tags |
| `idx_doc_versions_document_id` | doc_versions | btree | document_id |
| `idx_doc_embeddings_document_id` | doc_embeddings | btree | document_id |
| `idx_doc_embeddings_vector` | doc_embeddings | IVFFlat | `embedding vector_cosine_ops` (lists=100) |
| `idx_api_keys_key_prefix` | api_keys | btree | key_prefix |
| `idx_api_keys_user_id` | api_keys | btree | user_id |

### RLS Policies

| Table | Policy | Effect |
|-------|--------|--------|
| `documents` | "Published docs are public" | SELECT WHERE status='published' |
| `documents` | "Service role full access" | ALL WHERE auth.role()='service_role' |
| `doc_versions` | "Service role full access" | ALL WHERE auth.role()='service_role' |
| `doc_embeddings` | "Service role full access" | ALL WHERE auth.role()='service_role' |
| `doc_embeddings` | "Public can read embeddings for published docs" | SELECT WHERE doc is published |
| `api_keys` | "Service role full access" | ALL WHERE auth.role()='service_role' |
| `api_keys` | "Users can read own api_keys" | SELECT WHERE auth.uid()=user_id |
| `api_keys` | "Users can insert own api_keys" | INSERT WHERE auth.uid()=user_id |
| `api_keys` | "Users can delete own api_keys" | DELETE WHERE auth.uid()=user_id |

### RPC Functions

#### `match_doc_embeddings(query_embedding text, match_count int, filter_product text)`

- **Language:** plpgsql, SECURITY DEFINER
- **Returns:** `TABLE(content text, document_id uuid, slug text, title text, similarity float)`
- **Logic:** Cosine similarity search against `doc_embeddings.embedding`, joins `documents` (published only), optional product filter. Orders by distance, returns top `match_count` results.

#### `search_documents(search_query text, filter_product text, result_limit int)`

- **Language:** plpgsql, SECURITY DEFINER
- **Returns:** `TABLE(id uuid, slug text, title text, description text, doc_type text, product text, snippet text, rank float)`
- **Logic:** Full-text search using `websearch_to_tsquery('english', search_query)` against `to_tsvector('english', title || description || body)`. Returns ranked results with `ts_headline` snippets (HTML `<mark>` tags). Filters by status='published' and optional product.

#### `get_doc_tree()`

- **Language:** SQL, SECURITY DEFINER, STABLE
- **Returns:** `TABLE(id uuid, slug text, title text, doc_type text, product text, parent_id uuid, sort_order int)`
- **Logic:** Returns all published documents ordered by sort_order for client-side tree building.

### Trigger

- `documents_updated_at` — BEFORE UPDATE on `documents`, executes `update_updated_at()` to auto-set `updated_at = now()`.

---

## 5. All API Endpoints

### `GET /api/docs` — List documents

- **Auth:** Public (published only via service role client filtering)
- **Query params:** `type`, `product`, `tag`, `status` (default: "published"), `limit` (max 100, default 50), `offset`
- **Response:** `{ data: Document[], count: number, meta: { total, limit, offset, has_more } }`

### `POST /api/docs` — Create document

- **Auth:** Write access required (service role key, API key with write/admin, or Supabase session)
- **Body:** `{ slug, title, doc_body, doc_type, description?, product?, parent_id?, sort_order?, metadata?, status?, tags? }`
- **Required fields:** slug, title, doc_body, doc_type
- **Note:** Uses `doc_body` (NOT `body`) to avoid clash with `Request.body`
- **Response:** `{ data: Document }` (201)
- **Side effect:** Creates initial doc_version (version=1)

### `GET /api/docs/[...slug]` — Get single document

- **Auth:** Public (published only)
- **Response:** `{ data: Document }` or 404

### `POST /api/docs/[...slug]/embed` — Trigger embedding

- **Auth:** Write access required
- **Response:** `{ success: true, document_id, chunks: number }`
- **Side effect:** Chunks document body, generates Voyage AI embeddings, replaces old embeddings atomically

### `PATCH /api/docs/[...slug]` — Update document

- **Auth:** Write access required
- **Body:** `{ title?, doc_body?, description?, doc_type?, product?, parent_id?, sort_order?, metadata?, status?, slug?, tags?, change_summary? }`
- **Response:** `{ data: Document }`
- **Side effects:** Increments version if `doc_body` changed; creates doc_version entry; sets `published_at` on first publish; checks slug uniqueness on rename (409 on conflict)
- **Headers:** `X-Changed-By` -> stored as `changed_by` in doc_versions

### `DELETE /api/docs/[...slug]` — Delete document

- **Auth:** Write access required
- **Response:** `{ success: true }` or 404

### `GET /api/docs/tree` — Document hierarchy tree

- **Auth:** Public
- **ISR:** revalidate=60
- **Response:** `{ data: TreeNode[] }` where TreeNode has nested `children: TreeNode[]`
- **Logic:** Calls `get_doc_tree()` RPC, falls back to direct query. Client-side tree building with cycle detection (max depth 10).

### `GET /api/search` — Search documents

- **Auth:** Public
- **Query params:** `q` (required, min 2 chars), `product?`, `limit` (max 50, default 10), `mode` ("keyword" | "semantic" | "hybrid", default: hybrid if VOYAGE_API_KEY set)
- **Response:** `{ data: SearchResult[], count, mode }`
- **Modes:**
  - **keyword:** Uses `search_documents` RPC (websearch_to_tsquery full-text). Falls back to ilike on title+description if RPC fails.
  - **semantic:** Generates query embedding via Voyage AI, calls `match_doc_embeddings` RPC. Falls back to keyword if semantic fails.
  - **hybrid:** Runs keyword + semantic in parallel, merges results. Weights: both present = 0.4 keyword + 0.6 semantic; single source = 0.8x score. Deduplicates by document ID.

### `POST /api/chat` — RAG chat

- **Auth:** Public (rate limited: 10 requests/minute per IP)
- **Body:** `{ question: string, product?: string }`
- **Response:** `{ answer: string, citations: { index, slug, title }[] }`
- **Pipeline:** Sanitize query -> `search_documents` RPC (top 5) -> fetch full bodies (truncated to 3000 chars each) -> Claude Sonnet 4 with system prompt + numbered context -> return answer with citations
- **Rate limiting:** In-memory Map, 10 req/60s per IP, auto-purges entries when Map exceeds 1000

### `GET /api/keys` — List user's API keys

- **Auth:** Supabase session (cookie-based)
- **Response:** `{ data: ApiKey[] }` (excludes key_hash)

### `POST /api/keys` — Create API key

- **Auth:** Supabase session
- **Body:** `{ name: string, permissions?: string[] }`
- **Valid permissions:** "read", "write", "admin" (defaults to ["read"])
- **Response:** `{ data: { ...key_metadata, key: "ak_..." } }` (201)
- **Key format:** `ak_` + 32 random base36 chars. SHA-256 hashed for storage. Prefix (first 11 chars) stored for lookup. Full key returned ONCE at creation.

### `DELETE /api/keys` — Revoke API key

- **Auth:** Supabase session
- **Body:** `{ id: string }`
- **Validation:** Verifies key belongs to authenticated user
- **Response:** `{ success: true }`

### CORS

All API routes return CORS headers via middleware:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Changed-By`

All routes also have `OPTIONS` handlers returning 204.

---

## 6. File Structure

```
apiantdocs/
+-- package.json
+-- next.config.ts                      # Archbee 301 redirects
+-- tsconfig.json                       # TypeScript strict, @/* path alias
+-- vitest.config.ts                    # jsdom environment, @/ alias
+-- CLAUDE.md                           # AI context file
+-- TECHNICAL_DOCUMENTATION.md          # This file
+-- src/
|   +-- middleware.ts                   # Auth refresh, /dashboard guard, CORS, user header
|   +-- app/
|   |   +-- globals.css                 # Tailwind v4 + full design token system + dark/light
|   |   +-- layout.tsx                  # Root: Geist fonts, AuthProvider, ChatPanel
|   |   +-- page.tsx                    # Homepage: hero search, product cards, recent docs
|   |   +-- login/page.tsx             # Login: password + magic link modes
|   |   +-- signup/page.tsx            # Signup: email + password + name
|   |   +-- docs/
|   |   |   +-- layout.tsx             # Three-column: Sidebar | Content | TOC
|   |   |   +-- page.tsx               # /docs — doc index with product/tag filters
|   |   |   +-- [...slug]/page.tsx     # /docs/[slug] — single doc with full chrome
|   |   +-- dashboard/
|   |   |   +-- keys/page.tsx          # API key management UI
|   |   +-- api/
|   |       +-- docs/
|   |       |   +-- route.ts           # GET (list) + POST (create)
|   |       |   +-- tree/route.ts      # GET (hierarchy tree)
|   |       |   +-- [...slug]/route.ts # GET + POST (embed) + PATCH + DELETE
|   |       +-- search/route.ts        # GET (hybrid search)
|   |       +-- chat/route.ts          # POST (RAG chat)
|   |       +-- keys/route.ts          # GET + POST + DELETE (API keys)
|   +-- components/
|   |   +-- auth-provider.tsx           # Client — React Context: user, session, signOut
|   |   +-- breadcrumbs.tsx             # Server — Home > Docs > Product > Parent > Title
|   |   +-- chat-panel.tsx              # Client — floating RAG chat widget
|   |   +-- child-cards.tsx             # Server — grid of child document cards
|   |   +-- code-block.tsx              # Client — syntax-highlighted code with copy button
|   |   +-- doc-nav.tsx                 # Server — prev/next navigation links
|   |   +-- docs-header.tsx             # Client — docs page header bar with search trigger
|   |   +-- docs-header-wrapper.tsx     # Client — wraps DocsHeader with search modal state
|   |   +-- home-search-hero.tsx        # Client — homepage search with inline results
|   |   +-- image-lightbox.tsx          # Client — click-to-zoom image with overlay
|   |   +-- markdown-renderer.tsx       # Server* — ReactMarkdown with all plugins (*uses client sub-components)
|   |   +-- search-modal.tsx            # Client — Cmd+K search modal with keyboard nav
|   |   +-- sidebar.tsx                 # Server — fetches tree, renders SidebarTree
|   |   +-- sidebar-tree.tsx            # Client — collapsible nav tree + mobile drawer
|   |   +-- sidebar-resize.tsx          # Client — drag handle for sidebar width
|   |   +-- table-of-contents.tsx       # Client — right-rail TOC with scroll spy
|   |   +-- tag-list.tsx                # Server — clickable tag pills linking to /docs?tag=
|   |   +-- theme-toggle.tsx            # Client — dark/light toggle (localStorage)
|   |   +-- user-menu.tsx               # Client — avatar dropdown (dashboard, sign out)
|   +-- lib/
|       +-- api-auth.ts                 # validateApiKey, validateSession, requireWriteAccess
|       +-- archbee-redirects.ts        # ~530 old Archbee URL -> new slug redirects
|       +-- constants.ts                # PRODUCT_LABELS, DOC_TYPE_LABELS, PRODUCTS, APP_FAMILIES
|       +-- cors.ts                     # corsHeaders() helper
|       +-- embeddings.ts              # chunkText, generateEmbeddings, embedDocument, semanticSearch
|       +-- extract-headings.ts        # extractHeadings(markdown) -> TocHeading[]
|       +-- supabase.ts                # createBrowserClient (anon), createServerClient (service role)
|       +-- supabase-browser.ts        # createBrowserClient via @supabase/ssr (cookie-based)
|       +-- supabase-server.ts         # createAuthServerClient, getSession, getUser (cookie-based)
|       +-- types.ts                    # Document, DocVersion, ApiKey interfaces
+-- packages/
|   +-- mcp-server/
|       +-- package.json               # @apiant/docs-mcp v0.1.0
|       +-- src/index.ts               # 8 MCP tools (stdio transport)
+-- scripts/
|   +-- migrate-from-export.ts         # Archbee MDX -> Supabase migration
|   +-- fix-images.ts                  # Re-download failed image migrations
+-- supabase/
|   +-- migrations/
|       +-- 20260404113000_initial_schema.sql
|       +-- 20260404114100_vector_search_rpc.sql
|       +-- 20260404120000_api_keys_user_id.sql
|       +-- 20260404150000_search_rpc.sql
|       +-- 20260404170000_add_tags.sql
+-- docs/                               # Internal planning documents
    +-- restructuring-plan.md           # Full content reorganization plan
    +-- content-strategy.md             # Content audit + persona analysis
    +-- api-spec.md
    +-- mcp-spec.md
    +-- embedding-strategy.md
    +-- design-system.md
    +-- content-style-guide.md
    +-- next-phase.md
```

---

## 7. All Components

### Server Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `Sidebar` | sidebar.tsx | none | Fetches doc tree from `/api/docs/tree` (revalidate=60), renders `SidebarTree` + `SidebarResize`. Sticky, hidden on mobile. |
| `Breadcrumbs` | breadcrumbs.tsx | `slug, title, product, parentTitle?, parentSlug?` | Renders: Home > Docs > Product > Parent > Current. Uses PRODUCT_LABELS for display names. |
| `DocNav` | doc-nav.tsx | `prev: {slug,title} \| null, next: {slug,title} \| null` | Previous/Next navigation links in a 2-column grid. |
| `ChildCards` | child-cards.tsx | `children: {slug,title,description,doc_type}[]` | Grid of child document cards with "In this section" heading. |
| `TagList` | tag-list.tsx | `tags: string[], compact?: boolean` | Clickable tag pills linking to `/docs?tag=<tag>`. Two sizes. |
| `MarkdownRenderer` | markdown-renderer.tsx | `content: string` | Renders Markdown via ReactMarkdown with remark-gfm, rehype-highlight, rehype-slug, rehype-autolink-headings, rehype-raw. Custom components: `<pre>` -> CodeBlock, `<img>` -> ImageFrame, `<iframe>` -> VideoEmbed (allowlisted domains), `<table>` -> scrollable wrapper. Strips Archbee JSX tags from body before render. |

### Client Components

| Component | File | Props/Context | Description |
|-----------|------|---------------|-------------|
| `AuthProvider` | auth-provider.tsx | wraps children | React Context providing `user`, `session`, `loading`, `signOut`. Uses @supabase/ssr browser client. Listens to auth state changes. |
| `UserMenu` | user-menu.tsx | uses `useAuth()` | Avatar/initial dropdown: Dashboard link, Sign out. Shows Sign in/Sign up links when not authenticated. Click-outside-to-close. |
| `ThemeToggle` | theme-toggle.tsx | none | Sun/moon icon button. Toggles `data-theme` attribute on `<html>` and persists to localStorage. Default: dark. |
| `SidebarTree` | sidebar-tree.tsx | `tree: TreeNode[]` | Collapsible navigation tree. Groups by product, auto-expands to current page. Highlights active doc. |
| `MobileSidebarToggle` | sidebar-tree.tsx | `tree: TreeNode[]` | Hamburger button + slide-out drawer for mobile sidebar. |
| `SidebarResize` | sidebar-resize.tsx | none | Drag handle on sidebar right edge. Persists width to localStorage. Min 180px, max 500px. |
| `SearchModal` | search-modal.tsx | none | Cmd+K / Ctrl+K triggered modal. Debounced search against `/api/search`. Keyboard navigation (arrow keys, Enter). Shows doc_type and product badges per result. |
| `DocsHeader` | docs-header.tsx | `onOpenSearch: () => void` | Fixed docs header bar with logo, nav links, search trigger, ThemeToggle, UserMenu. Mobile hamburger menu. |
| `DocsHeaderWrapper` | docs-header-wrapper.tsx | none | Wraps DocsHeader + SearchModal, manages search open/close state. |
| `HomeSearchHero` | home-search-hero.tsx | none | Homepage search input with inline dropdown results. |
| `ChatPanel` | chat-panel.tsx | none | Floating bottom-right chat widget. Sends questions to `/api/chat`, renders Markdown answers with citation links. Expandable/collapsible. |
| `TableOfContents` | table-of-contents.tsx | `headings: TocHeading[]` | Right-rail TOC. IntersectionObserver scroll spy highlights active heading. Shows h2 and h3 levels. Hidden when < 3 headings or on mobile. |
| `CodeBlock` | code-block.tsx | `language: string \| null, children: ReactNode` | Wraps `<pre>` blocks with copy-to-clipboard button and optional language label. |
| `ImageFrame` | image-lightbox.tsx | `src?: string, alt?: string` | Renders images with border frame. Click opens fullscreen lightbox overlay. ESC to close. |

---

## 8. Auth System

### Three auth layers (checked in order by `requireWriteAccess`):

1. **Service role key** — `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`. Full admin access. Used by migration scripts and internal tools.

2. **API keys** — `Authorization: Bearer ak_...`. SHA-256 hashed, prefix-based lookup. Permissions: `["read"]`, `["read","write"]`, or `["read","write","admin"]`. Created via `/api/keys` (requires Supabase session). `last_used_at` updated on each use.

3. **Supabase session** — Cookie-based auth via @supabase/ssr. All authenticated users get `["read","write"]` permissions.

### Auth flow:

- **Middleware** (`src/middleware.ts`): Runs on every request (except static files). Refreshes Supabase auth session by calling `getUser()`. Protects `/dashboard/*` routes (redirects to `/login` if no session). Redirects authenticated users away from `/login` and `/signup`. Adds CORS headers to `/api/*`. Passes `x-supabase-user` header to API routes (informational only — NOT trusted for auth decisions).

- **Login page**: Supports password login (`signInWithPassword`) and magic link (`signInWithOtp`). Redirects to `/dashboard` on success.

- **Signup page**: Email + password + name. Sends confirmation email via Supabase. Min 8 character password.

- **API key validation** (`api-auth.ts`): Extracts key from `Bearer ak_...` header. Looks up by 11-char prefix. Computes SHA-256 hash via Web Crypto API. Compares against stored `key_hash`. Returns permissions array on match.

- **Session validation** (`api-auth.ts`): Creates SSR server client from request cookies. Calls `getUser()` to validate. Returns userId + `["read","write"]` permissions.

### MCP auth:

The MCP server supports two auth methods:
1. **API key** via `APIANTDOCS_API_KEY` env var or `docs_api_key` tool
2. **Session token** via `docs_login` tool (calls Supabase REST auth directly)

---

## 9. Search System

### Three modes (controlled by `mode` query param or auto-detected):

#### Keyword search
- Uses `search_documents` RPC (PostgreSQL full-text search)
- `websearch_to_tsquery('english', query)` — supports natural language queries, quoted phrases, AND/OR/NOT
- Searches across `title || description || body` using GIN index
- Returns `ts_headline` snippets with `<mark>` highlighting
- Ranked by `ts_rank`
- Fallback: if RPC fails (e.g., invalid syntax), falls back to `ilike` on title+description

#### Semantic search
- Generates query embedding via Voyage AI (`voyage-3`, 1024 dimensions)
- Calls `match_doc_embeddings` RPC (cosine similarity via pgvector)
- Returns matched chunks with similarity scores
- Deduplicates by document_id (multiple chunks from same doc)
- Falls back to keyword search if Voyage API fails or key not set

#### Hybrid search (default when VOYAGE_API_KEY is set)
- Runs keyword + semantic in parallel via `Promise.all`
- Merges results using weighted scoring:
  - Both present: `0.4 * keywordScore + 0.6 * semanticScore`
  - Semantic only: `0.8 * semanticScore`
  - Keyword only: `0.8 * keywordScore`
- Deduplicates by document ID
- Sorts by combined score, returns top N

### Query sanitization
- Strips `%`, `_`, `\`, `;` (SQL injection)
- Strips `(){}[]` (tsquery syntax breakers)
- Trims and caps at 200 chars (search) / 500 chars (chat)

---

## 10. Embedding Pipeline

### Configuration
- **Model:** Voyage AI `voyage-3`
- **Dimensions:** 1024
- **Chunk size:** 1000 characters
- **Chunk overlap:** 200 characters
- **Index type:** IVFFlat with 100 lists (cosine distance)

### Process (`embedDocument(documentId)`)
1. Fetch document from database (id, title, body)
2. Prepend title: `# {title}\n\n{body}`
3. Split into overlapping chunks (1000 chars, 200 overlap)
4. Generate embeddings for all chunks via Voyage API (single batch request)
5. Delete old embeddings for this document
6. Insert new embedding rows
7. Return chunk count

**Atomicity:** New embeddings are generated BEFORE old ones are deleted. If Voyage API fails, old embeddings remain intact.

**Error handling:** Throws on missing VOYAGE_API_KEY (never inserts random vectors). Warns at module load if key is missing.

### Triggering
- Manual: `POST /api/docs/{slug}/embed` (requires write access)
- Not automatic — embedding is not triggered by document creation/update

---

## 11. MCP Server

**Package:** `@apiant/docs-mcp` v0.1.0
**Transport:** stdio
**Location:** `packages/mcp-server/`
**Build:** `cd packages/mcp-server && npm run build` (TypeScript -> dist/index.js)
**Run:** `node packages/mcp-server/dist/index.js`

### Environment variables
- `APIANTDOCS_API_URL` — API base URL (default: `https://apiantdocs.vercel.app`)
- `APIANTDOCS_API_KEY` — API key for auth (optional, can set via tool)
- `NEXT_PUBLIC_SUPABASE_URL` — for login tool's direct Supabase auth
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — for login tool's direct Supabase auth

### Tools (8)

| Tool | Description | Auth required |
|------|-------------|---------------|
| `docs_login` | Authenticate with email/password via Supabase REST API. Stores session token. | No |
| `docs_api_key` | Set an API key (must start with `ak_`). Stored in memory. | No |
| `docs_list` | List docs with optional filters (type, product, limit) | No (public read) |
| `docs_read` | Read single doc by slug | No (public read) |
| `docs_search` | Search docs by query with optional product filter and limit | No (public read) |
| `docs_create` | Create new doc (slug, title, doc_body, doc_type, description?, product?, status?) | Yes (write) |
| `docs_update` | Update doc by slug (title?, doc_body?, description?, status?, change_summary?) | Yes (write) |
| `docs_chat` | Ask a question, get RAG-powered answer with citations | No (public) |

All tools return JSON text content. Auth headers (`Authorization: Bearer ...`) and `X-Changed-By: mcp:claude-code` are sent with every request.

---

## 12. Tag System

### Storage
- `documents.tags` column: `text[]` with `DEFAULT '{}'`
- GIN index for fast `@>` (contains) and `&&` (overlaps) queries

### API support
- `POST /api/docs`: `tags` field in body (array of strings)
- `PATCH /api/docs/[slug]`: `tags` field updates replace entire array
- `GET /api/docs`: `?tag=<tag>` filter uses Supabase `contains()`
- `GET /api/search`: not tag-filtered (full-text covers tag content in body)

### UI support
- `TagList` component renders clickable pills
- `/docs?tag=<tag>` filters doc index
- Doc detail page shows tags below title
- "Related docs" section uses `overlaps('tags', docTags)` to find docs sharing tags
- Clear filter link shown when tag filter is active

### Proposed taxonomy (from `docs/restructuring-plan.md`)
Tags will use prefixed categories: `src:mindbody`, `dst:hubspot`, `audience:builder`, `level:beginner`, plus unprefixed feature tags (`automation`, `webhook`, `ai`, etc.).

---

## 13. Theme System

### Implementation
- CSS custom properties defined in `globals.css` under `:root` (dark defaults) and `[data-theme="light"]` overrides
- Default: dark mode (`data-theme="dark"` on `<html>`)
- Toggle: `ThemeToggle` component sets `data-theme` attribute + persists to `localStorage`
- Flash prevention: Inline `<script>` in `layout.tsx` reads localStorage before paint and sets `data-theme`

### Dark mode tokens (`:root`)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | #0c0c0c | Body background |
| `--bg-secondary` | #0e0f11 | Cards, sidebar |
| `--bg-tertiary` | #1a1a2e | Code blocks, terminal |
| `--text-primary` | #f7f8f8 | Main text |
| `--text-secondary` | rgba(255,255,255,0.7) | Nav, secondary |
| `--text-tertiary` | rgba(255,255,255,0.4) | Muted |
| `--accent-primary` | #1ab759 | Green — links, CTAs, brand |
| `--accent-gold` | #d4af37 | Badges, warnings |
| `--accent-purple` | #c084fc | Features, syntax highlighting |
| `--accent-cyan` | #06b6d4 | Info, keywords |
| `--accent-amber` | #f59e0b | Warnings, numbers |
| `--border-primary` | rgba(255,255,255,0.06) | Default borders |

### Light mode overrides (`[data-theme="light"]`)
| Token | Value |
|-------|-------|
| `--bg-primary` | #ffffff |
| `--bg-secondary` | #f9fafb |
| `--bg-tertiary` | #f3f4f6 |
| `--text-primary` | #111827 |
| `--text-secondary` | rgba(0,0,0,0.6) |
| `--border-primary` | rgba(0,0,0,0.08) |

### Layout tokens
| Token | Value |
|-------|-------|
| `--sidebar-width` | 260px (resizable via drag handle, persisted to localStorage) |
| `--toc-width` | 200px |
| `--content-max-width` | 768px |
| `--radius-sm/md/lg/xl` | 6/8/12/16px |
| `--space-1..12` | 4/8/12/16/24/32/48px (8px base grid) |

### Syntax highlighting (highlight.js classes mapped to theme tokens)
- `.hljs-keyword` -> cyan
- `.hljs-string` -> green (accent-primary)
- `.hljs-function`/`.hljs-title`/`.hljs-type` -> purple
- `.hljs-comment` -> tertiary text, italic
- `.hljs-number`/`.hljs-literal` -> amber

---

## 14. Migration History

| Migration | Timestamp | Description |
|-----------|-----------|-------------|
| `20260404113000_initial_schema.sql` | 2026-04-04 11:30 | Creates `documents`, `doc_versions`, `doc_embeddings`, `api_keys` tables. Extensions: vector, pg_trgm. All indexes (btree, GIN FTS, GIN trgm, IVFFlat vector). RLS policies (public read published, service role full access, public read published embeddings). `updated_at` trigger. |
| `20260404114100_vector_search_rpc.sql` | 2026-04-04 11:41 | Creates `match_doc_embeddings()` RPC for cosine similarity search with product filter. |
| `20260404120000_api_keys_user_id.sql` | 2026-04-04 12:00 | Adds `user_id` column to `api_keys` (FK -> auth.users, ON DELETE CASCADE). Index + RLS policies for user-owned key management. |
| `20260404150000_search_rpc.sql` | 2026-04-04 15:00 | Creates `search_documents()` RPC (full-text search with ranking + snippets) and `get_doc_tree()` RPC (navigation tree). |
| `20260404170000_add_tags.sql` | 2026-04-04 17:00 | Adds `tags text[] DEFAULT '{}'` column to documents. GIN index for fast tag queries. |

---

## 15. Environment Variables

| Variable | Required | Used in | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | All Supabase clients | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser client, middleware, auth | Supabase anonymous key (RLS-bound) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | API routes, embeddings | Supabase service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | Yes (for chat) | `/api/chat` | Anthropic API key for Claude Sonnet 4 |
| `VOYAGE_API_KEY` | Yes (for semantic search) | `/api/search`, embeddings.ts | Voyage AI API key for voyage-3 embeddings |
| `NEXT_PUBLIC_SITE_URL` | Optional | sidebar.tsx | Site URL for server-side fetch (fallback: VERCEL_URL) |
| `VERCEL_URL` | Auto (Vercel) | sidebar.tsx | Auto-set by Vercel deployment |
| `APIANTDOCS_API_URL` | Optional (MCP) | MCP server | API base URL (default: https://apiantdocs.vercel.app) |
| `APIANTDOCS_API_KEY` | Optional (MCP) | MCP server | API key for MCP write operations |

---

## 16. Deployment

### Vercel (Frontend)
- **Framework:** Next.js 16 (automatically detected)
- **Build command:** `npm run build`
- **Output:** Standalone mode (RSC + ISR)
- **ISR:** All doc pages and tree endpoint use `revalidate = 60`
- **Redirects:** ~530 Archbee redirects loaded from `src/lib/archbee-redirects.ts` via `next.config.ts`
- **Edge middleware:** Auth session refresh + route protection + CORS

### Supabase (Database)
- **Postgres** with pgvector and pg_trgm extensions
- **Auth:** Email/password + magic link (OTP)
- **RLS:** Enabled on all 4 tables
- **IVFFlat index:** Needs `REINDEX` after bulk data changes (>100 list count)

### Scripts
- `npx tsx scripts/migrate-from-export.ts` — One-time Archbee MDX migration
- `npx tsx scripts/fix-images.ts` — Re-download failed image migrations

---

## 17. Known Issues / Remaining Work

1. **Chat RAG uses keyword search, not semantic** — The `/api/chat` endpoint calls `search_documents` (full-text) instead of `semanticSearch()`. This means retrieval quality depends on keyword overlap, not meaning.

2. **Embeddings not auto-triggered** — Creating or updating a document does NOT automatically generate embeddings. Must manually call `POST /api/docs/{slug}/embed`.

3. **IVFFlat needs periodic reindex** — The vector index uses IVFFlat with 100 lists. After bulk inserts/updates, run `REINDEX INDEX idx_doc_embeddings_vector` or data distribution degrades.

4. **No admin/editor UI** — All document CRUD is via API or MCP. No web-based editor.

5. **Missing VOYAGE_API_KEY degrades silently** — Search falls back to keyword-only mode without error. Embedding operations throw but the `/api/search` endpoint silently degrades.

6. **Content quality issues** — 61 docs with null descriptions, 3 with broken AI-generated descriptions, ~200 with SEO-style marketing copy. See `docs/restructuring-plan.md` for full audit.

7. **Deep nesting** — 72 docs are 5 levels deep in slug hierarchy. Max recommended is 3. Navigation breaks down at this depth.

8. **Archbee artifacts in content** — Body text contains `<LinkArray>`, `<LinkArrayItem>`, `<Image>`, `<Callout>` JSX tags that are stripped at render time via regex. Some `<hint>` syntax and `<./Something.mdx>` relative links remain unprocessed.

9. **No "Was this helpful?" feedback** — No user feedback mechanism on doc pages.

10. **No analytics** — No page view tracking, search analytics, or chat usage metrics.

11. **Video embed allowlist** — Only YouTube, Vimeo, Loom, Wistia. No video content currently exists.

---

## 18. Strategic Plans

### Content Restructuring (`docs/restructuring-plan.md`)

**Scope:** Complete reorganization of 444 published documents.

**Key changes:**
- Flatten max depth from 5 levels to 3
- New top-level categories: `/docs/getting-started/`, `/docs/platform/`, `/docs/apps/`, `/docs/api/`, `/docs/guides/`, `/docs/changelog/`
- Merge ~80 micro-pages (folder ops, group ops, search ops, menu ops into comprehensive single pages)
- Target doc count: ~350 (from 444) after merges + new content
- API Apps reorganized by product family (CRMConnect, ZoomConnect, ShopConnect, etc.) instead of per-integration-pair
- Full tag schema with prefixed categories: `src:`, `dst:`, `audience:`, `level:`
- Every doc gets 2-5 tags minimum

**Phases:**
1. Foundation (weeks 1-2): Tags column, fix broken descriptions, write 7 high-priority new docs
2. Restructure Platform (weeks 3-4): Execute merges, flatten slugs, assign tags
3. Restructure API Apps (weeks 5-6): Product family landing pages, consolidate, fill descriptions
4. New content & polish (weeks 7-8): Cross-cutting guides, redirects, reindex embeddings

### Content Strategy (`docs/content-strategy.md`)

**Key findings:**
- 5 user personas identified: Subscriber, Builder, Integrator, AI Builder, Evaluator
- No onboarding path for any persona
- Missing content types: tutorials (5 exist, need 25+), architecture docs (0), troubleshooting guides (2 parents), video (0)
- Top 10 priority content pieces: Getting Started tutorial, product setup guides, platform overview rewrite, MCP integration guide, troubleshooting guide, glossary, assembly lifecycle, AI capabilities overview, automation patterns cookbook, docs API reference
- Homepage redesign: persona-based routing hub instead of generic doc listing
- Video strategy: 12 priority videos identified, hosted on YouTube/Wistia with embedded iframes

### Other planning docs
- `docs/next-phase.md` — Prioritized implementation tasks
- `docs/api-spec.md` — API design spec
- `docs/mcp-spec.md` — MCP server spec
- `docs/embedding-strategy.md` — Embedding pipeline improvements
- `docs/design-system.md` — Visual design tokens and component patterns
- `docs/content-style-guide.md` — Writing voice, formatting rules, doc_type definitions
