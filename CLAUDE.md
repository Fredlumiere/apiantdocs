# CLAUDE.md

AI-first documentation platform replacing info.apiant.com (Archbee). Next.js 16 App Router, Supabase Postgres with pgvector, deployed on Vercel. Content stored as Markdown in Postgres, served via SSR pages, REST API, MCP server, and RAG-powered chat.

## Commands

- `npm run dev` — Start Next.js dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint 9 check
- `npx tsx scripts/migrate-from-export.ts` — Run Archbee migration
- `npx tsx scripts/fix-images.ts` — Fix failed image migrations
- `cd packages/mcp-server && npm run build` — Build MCP server

## Architecture

```
apiantdocs/
├── src/
│   ├── app/
│   │   ├── globals.css                 # Tailwind v4 + theme vars + dark mode
│   │   ├── layout.tsx                  # Root layout: Geist fonts, metadata
│   │   ├── page.tsx                    # Homepage: product cards + recent docs
│   │   ├── docs/
│   │   │   ├── page.tsx               # /docs — all docs with Sidebar, product filter
│   │   │   └── [...slug]/page.tsx     # /docs/[...slug] — single doc with Sidebar
│   │   └── api/
│   │       ├── docs/
│   │       │   ├── route.ts           # GET (list) + POST (create)
│   │       │   └── [...slug]/
│   │       │       ├── route.ts       # GET + PATCH + DELETE
│   │       │       └── embed/route.ts # POST (trigger embedding)
│   │       ├── search/route.ts        # GET search
│   │       └── chat/route.ts          # POST RAG chat
│   ├── components/
│   │   ├── markdown-renderer.tsx       # Client component: ReactMarkdown + plugins
│   │   └── sidebar.tsx                 # Server component: nav grouped by product
│   └── lib/
│       ├── supabase.ts                 # createBrowserClient + createServerClient
│       ├── api-auth.ts                 # API key validation (SHA-256, prefix lookup)
│       ├── embeddings.ts               # Chunking (1000 chars/200 overlap), Voyage, semantic search
│       ├── archbee-redirects.ts        # ~530 redirect entries (auto-generated)
│       └── types.ts                    # Document, DocVersion, ApiKey interfaces
├── packages/
│   └── mcp-server/                     # @apiant/docs-mcp (standalone, stdio transport)
│       ├── src/index.ts               # 6 tools: list, read, search, create, update, chat
│       └── package.json
├── scripts/
│   ├── migrate-from-export.ts          # Archbee MDX → Supabase migration
│   └── fix-images.ts                   # Re-download failed images
├── supabase/
│   └── migrations/
│       ├── 20260404113000_initial_schema.sql
│       └── 20260404114100_vector_search_rpc.sql
└── next.config.ts                      # Imports archbee-redirects for 301s
```

## Tech Stack (Actual)

- **Next.js 16.2.2** (App Router, RSC), **React 19.2.4**, **TypeScript ^5**
- **Tailwind CSS v4** + @tailwindcss/typography, **Geist + Geist Mono** fonts
- **Supabase** (supabase-js ^2.101.1) with pgvector + pg_trgm
- **@anthropic-ai/sdk ^0.82.0** — Claude Sonnet for RAG chat
- **Voyage AI voyage-3** — 1024-dim embeddings
- **react-markdown ^10** + remark-gfm + rehype-highlight + rehype-slug + rehype-autolink-headings
- **@modelcontextprotocol/sdk ^1.0.0** — MCP server (stdio transport)

## Coding Standards

- TypeScript strict, no `any`
- Server Components by default; `"use client"` only for interactivity
- Tailwind CSS v4 — no CSS modules, no styled-components
- API routes use service role client (bypasses RLS). Auth checked via `requireWriteAccess()`
- Request body uses `doc_body` (not `body`) to avoid Request.body clash
- PATCH for updates (not PUT). Catch-all `[...slug]` for nested slugs
- All RSC pages: `export const revalidate = 60` (ISR, 60s stale window)

## Database

Four tables: `documents`, `doc_versions`, `doc_embeddings`, `api_keys`. RLS enabled on all.

- Anon: SELECT published docs only. Service role: full access all tables.
- RPC: `match_doc_embeddings(query_embedding, match_count, filter_product)` — cosine similarity, SECURITY DEFINER
- Trigger: `documents_updated_at` — auto-updates `updated_at`
- Version history handled in API route code (not trigger). Incremented when `doc_body` in PATCH.

## Design Direction

Dark mode via `prefers-color-scheme`. Must match apiant.com/index2.html — dark-first, terminal/CLI aesthetic, code-forward, premium. See `docs/design-system.md`.

## Next Phase Specs

**Read before implementing:** `docs/next-phase.md` for prioritized tasks. Supporting specs: `docs/api-improvements.md`, `docs/design-system.md`, `docs/embedding-improvements.md`, `docs/content-style-guide.md`.

## Known Issues

1. Search is title-only — full-text GIN index covers title+description+body but API only queries title
2. Chat RAG uses ilike (not semantic search) — slow and imprecise
3. No client-side interactivity — no search UI, no chat UI, no JS navigation
4. Sidebar is flat by product — doesn't render parent/child hierarchy
5. No breadcrumbs, no TOC, no on-this-page navigation
6. No admin/editor UI — API or MCP only
7. Pagination `count` is page length, not total
8. Without VOYAGE_API_KEY, embeddings silently fall back to random vectors

## Critical Gotchas

- `doc_body` field name in API requests — NOT `body`
- Slug routes are catch-all `[...slug]` joined with `/` for nested paths
- Embed endpoint detects `/embed` as last segment within catch-all
- MCP server NOT on npm — run `node dist/index.js` after `npm run build`
- Service role key accepted as Bearer token for write access
- `X-Changed-By` header → `changed_by` in doc_versions
- IVFFlat (100 lists) needs REINDEX after bulk data changes

## When Compacting

Preserve: current task, modified files, spec docs read, test status, issues being fixed.
