# APIANT Docs — Complete Technical Documentation

> Generated: 2026-04-04
> Purpose: Full codebase reference for downstream Claude instances designing UI/features.

---

## 1. Project Overview

**apiantdocs** is a documentation platform for APIANT (an AI-first integration platform). It replaces the previous docs hosted on Archbee at `info.apiant.com`. The system stores documentation as Markdown in a Supabase Postgres database, serves it via a Next.js 16 frontend, exposes a REST API for CRUD operations, supports semantic/full-text search, provides RAG-powered chat over docs via Claude, and ships an MCP server so Claude Code (or any MCP client) can read/write/search docs programmatically.

**Key URLs:**
- Production: `https://apiantdocs.vercel.app`
- Vercel project ID: `prj_EQK7hg1j1BvOxXjUcWpCCyke7boh`
- Vercel org: `team_jyZB9GsO8ySC5oC3rOdzhsnJ`

---

## 2. Tech Stack

### Runtime & Framework
| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.2 | App framework (App Router, RSCs) |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Language |
| Node.js | >=20 (inferred) | Runtime |

### Backend / Data
| Technology | Version | Role |
|---|---|---|
| Supabase (supabase-js) | ^2.101.1 | Postgres DB, Storage, Auth/RLS |
| pgvector extension | (Supabase-managed) | Vector similarity search |
| pg_trgm extension | (Supabase-managed) | Trigram fuzzy search |

### AI / ML
| Technology | Version | Role |
|---|---|---|
| @anthropic-ai/sdk | ^0.82.0 | Claude chat for RAG |
| Voyage AI (voyage-3) | External API | Embedding generation |

### Styling
| Technology | Version | Role |
|---|---|---|
| Tailwind CSS | ^4 | Utility-first CSS |
| @tailwindcss/typography | ^0.5.19 | Prose styling for Markdown |
| @tailwindcss/postcss | ^4 | PostCSS plugin |
| Geist + Geist Mono | Google Fonts | Typography |

### Markdown Processing
| Technology | Version | Role |
|---|---|---|
| react-markdown | ^10.1.0 | Markdown-to-React renderer |
| remark-gfm | ^4.0.1 | GitHub Flavored Markdown |
| rehype-highlight | ^7.0.2 | Syntax highlighting |
| rehype-slug | ^6.0.0 | Auto-slug headings |
| rehype-autolink-headings | ^7.1.0 | Linkable headings |
| gray-matter | ^4.0.3 | Frontmatter parsing (migration) |
| slugify | ^1.6.9 | Slug generation |

### MCP Server
| Technology | Version | Role |
|---|---|---|
| @modelcontextprotocol/sdk | ^1.0.0 | MCP protocol implementation |
| zod | (peer dep of SDK) | Schema validation |

### Dev Tooling
| Technology | Role |
|---|---|
| ESLint ^9 + eslint-config-next | Linting |
| Vercel | Deployment |
| Supabase CLI | Local dev, migrations |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       CLIENTS                            │
│  Browser (Next.js pages)  │  MCP Client  │  REST API    │
└───────┬───────────────────┼──────────────┼──────────────┘
        │                   │              │
        ▼                   ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                  NEXT.JS 16 (Vercel)                     │
│                                                          │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ App Router  │  │  API Routes    │  │  MCP Server   │  │
│  │ (RSC pages) │  │  /api/docs     │  │  (stdio,      │  │
│  │             │  │  /api/search   │  │   separate     │  │
│  │ / (home)    │  │  /api/chat     │  │   package)     │  │
│  │ /docs       │  │  /api/docs/    │  │               │  │
│  │ /docs/[slug]│  │    [slug]      │  │  Calls REST   │  │
│  │             │  │    [slug]/embed│  │  API over HTTP │  │
│  └──────┬──────┘  └──────┬─────────┘  └───────────────┘  │
│         │                │                                │
│         ▼                ▼                                │
│  ┌────────────────────────────────────┐                   │
│  │         src/lib/                   │                   │
│  │  supabase.ts  (browser + server)  │                   │
│  │  api-auth.ts  (key validation)    │                   │
│  │  embeddings.ts (chunk + embed)    │                   │
│  │  types.ts     (TS interfaces)     │                   │
│  └──────────────┬─────────────────────┘                   │
└─────────────────┼────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│                    SUPABASE                               │
│                                                          │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │  Storage       │  │  RLS          │  │
│  │  - documents │  │  - images      │  │  Policies     │  │
│  │  - doc_ver.  │  │    bucket      │  │  (per table)  │  │
│  │  - doc_embed │  │  (public)      │  │               │  │
│  │  - api_keys  │  │                │  │               │  │
│  │              │  │                │  │               │  │
│  │  Extensions: │  │                │  │               │  │
│  │  - vector    │  │                │  │               │  │
│  │  - pg_trgm   │  │                │  │               │  │
│  └──────────────┘  └────────────────┘  └──────────────┘  │
│                                                          │
│  RPC: match_doc_embeddings()                             │
│  Trigger: documents_updated_at                           │
└──────────────────────────────────────────────────────────┘

External APIs:
  - Voyage AI (voyage-3) for embeddings
  - Anthropic Claude (claude-sonnet-4-20250514) for RAG chat
```

### Data Flow

1. **Read path (browser):** Browser -> Next.js RSC page -> `createServerClient()` -> Supabase (service role, bypasses RLS) -> render Markdown
2. **Read path (API):** HTTP GET -> API route -> Supabase -> JSON response
3. **Write path:** HTTP POST/PATCH + Bearer token -> `requireWriteAccess()` validates API key hash -> Supabase insert/update + version record
4. **Search:** GET /api/search?q= -> full-text `websearch` on title, fallback to `ilike` on title+description
5. **Semantic search:** query -> Voyage API embedding -> `match_doc_embeddings` RPC (cosine similarity) -> ranked chunks
6. **Chat (RAG):** POST question -> ilike search for relevant docs -> truncate bodies to 3000 chars -> Claude claude-sonnet-4-20250514 with system prompt -> answer + citations
7. **Embedding:** POST /api/docs/[slug]/embed -> chunk text (1000 chars, 200 overlap) -> Voyage API -> store in doc_embeddings
8. **MCP:** Claude Code -> stdio transport -> MCP server -> HTTP calls to /api/* -> responses

### Revalidation Strategy
All RSC pages use `export const revalidate = 60` (ISR, 60-second stale window).

---

## 4. Database Schema

### Migration 1: `20260404113000_initial_schema.sql`

#### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

#### Table: `documents`

The atomic unit of content.

```sql
CREATE TABLE documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text,
  body          text NOT NULL,
  doc_type      text NOT NULL CHECK (doc_type IN ('guide', 'api-ref', 'tutorial', 'changelog')),
  product       text CHECK (product IN ('api-apps', 'platform', 'mcp')),
  parent_id     uuid REFERENCES documents(id),
  sort_order    int DEFAULT 0,
  metadata      jsonb DEFAULT '{}',
  status        text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version       int DEFAULT 1,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  published_at  timestamptz
);
```

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| slug | text | NO | — | UNIQUE |
| title | text | NO | — | — |
| description | text | YES | — | — |
| body | text | NO | — | — |
| doc_type | text | NO | — | CHECK IN ('guide','api-ref','tutorial','changelog') |
| product | text | YES | — | CHECK IN ('api-apps','platform','mcp') |
| parent_id | uuid | YES | — | FK -> documents(id) |
| sort_order | int | NO | 0 | — |
| metadata | jsonb | NO | '{}' | — |
| status | text | NO | 'draft' | CHECK IN ('draft','published','archived') |
| version | int | NO | 1 | — |
| created_at | timestamptz | NO | now() | — |
| updated_at | timestamptz | NO | now() | Auto-updated by trigger |
| published_at | timestamptz | YES | — | — |

#### Table: `doc_versions`

Immutable version history for every edit.

```sql
CREATE TABLE doc_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid REFERENCES documents(id) ON DELETE CASCADE,
  version       int NOT NULL,
  title         text NOT NULL,
  body          text NOT NULL,
  changed_by    text NOT NULL,
  change_summary text,
  created_at    timestamptz DEFAULT now()
);
```

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| document_id | uuid | YES | — | FK -> documents(id) ON DELETE CASCADE |
| version | int | NO | — | — |
| title | text | NO | — | — |
| body | text | NO | — | — |
| changed_by | text | NO | — | — |
| change_summary | text | YES | — | — |
| created_at | timestamptz | NO | now() | — |

#### Table: `doc_embeddings`

Chunked vector embeddings for semantic search.

```sql
CREATE TABLE doc_embeddings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index   int NOT NULL,
  content       text NOT NULL,
  embedding     vector(1024),
  created_at    timestamptz DEFAULT now()
);
```

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| document_id | uuid | YES | — | FK -> documents(id) ON DELETE CASCADE |
| chunk_index | int | NO | — | — |
| content | text | NO | — | — |
| embedding | vector(1024) | YES | — | — |
| created_at | timestamptz | NO | now() | — |

#### Table: `api_keys`

API key storage for programmatic access.

```sql
CREATE TABLE api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  key_hash      text NOT NULL,
  key_prefix    text NOT NULL,
  permissions   text[] DEFAULT '{read}',
  created_at    timestamptz DEFAULT now(),
  last_used_at  timestamptz
);
```

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | — | — |
| key_hash | text | NO | — | SHA-256 hex of full key |
| key_prefix | text | NO | — | First 11 chars ("ak_" + 8) |
| permissions | text[] | NO | '{read}' | Array, values: read, write, admin |
| created_at | timestamptz | NO | now() | — |
| last_used_at | timestamptz | YES | — | Updated on each successful auth |

### Indexes

```sql
CREATE INDEX idx_documents_slug ON documents(slug);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);
CREATE INDEX idx_documents_product ON documents(product);
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_doc_versions_document_id ON doc_versions(document_id);
CREATE INDEX idx_doc_embeddings_document_id ON doc_embeddings(document_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Full-text search (GIN, English config, across title + description + body)
CREATE INDEX idx_documents_fts ON documents USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(body, ''))
);

-- Trigram index for fuzzy search on title
CREATE INDEX idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);

-- Vector similarity (IVFFlat, cosine, 100 lists — switch to HNSW at >100k rows)
CREATE INDEX idx_doc_embeddings_vector ON doc_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### RLS Policies

```sql
-- All tables have RLS enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Public (anon) can SELECT published documents only
CREATE POLICY "Published docs are public" ON documents
  FOR SELECT USING (status = 'published');

-- Service role has unrestricted access on all 4 tables
CREATE POLICY "Service role full access to documents" ON documents
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to doc_versions" ON doc_versions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to doc_embeddings" ON doc_embeddings
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access to api_keys" ON api_keys
  FOR ALL USING (auth.role() = 'service_role');

-- Public can read embeddings for published docs (subquery check)
CREATE POLICY "Public can read embeddings for published docs" ON doc_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = doc_embeddings.document_id
      AND documents.status = 'published'
    )
  );
```

### Triggers

```sql
-- Auto-update updated_at on documents
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration 2: `20260404114100_vector_search_rpc.sql`

#### RPC Function: `match_doc_embeddings`

```sql
CREATE OR REPLACE FUNCTION match_doc_embeddings(
  query_embedding text,        -- JSON-stringified float array
  match_count int DEFAULT 5,
  filter_product text DEFAULT NULL
)
RETURNS TABLE (
  content text,
  document_id uuid,
  slug text,
  title text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.content,
    de.document_id,
    d.slug,
    d.title,
    1 - (de.embedding <=> query_embedding::vector) AS similarity
  FROM doc_embeddings de
  JOIN documents d ON d.id = de.document_id
  WHERE d.status = 'published'
    AND (filter_product IS NULL OR d.product = filter_product)
  ORDER BY de.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;
```

Uses cosine distance operator `<=>`. SECURITY DEFINER so it runs with the function owner's privileges (bypasses RLS).

---

## 5. API Endpoints

All routes are under `/api/`. Auth uses Bearer tokens — either the Supabase service role key directly or an API key with prefix `ak_`.

### `GET /api/docs`

List published documents with pagination and filtering.

**Auth:** None required (reads published only by default)

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| type | string | — | Filter by doc_type |
| product | string | — | Filter by product |
| status | string | "published" | Filter by status |
| limit | int | 50 | Max results (capped at 100) |
| offset | int | 0 | Pagination offset |

**Response:** `200`
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "string",
      "title": "string",
      "description": "string | null",
      "doc_type": "guide | api-ref | tutorial | changelog",
      "product": "api-apps | platform | mcp | null",
      "parent_id": "uuid | null",
      "sort_order": 0,
      "status": "published",
      "version": 1,
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "published_at": "ISO8601 | null"
    }
  ],
  "count": 20
}
```

Note: `count` is the length of `data` returned (not total count in DB). No body field returned in list.

---

### `POST /api/docs`

Create a new document.

**Auth:** Required — `Bearer ak_...` with write/admin permission, or `Bearer <service_role_key>`

**Headers:**
| Header | Description |
|---|---|
| Authorization | `Bearer ak_xxx` or `Bearer <service_role_key>` |
| X-Changed-By | Optional. Recorded in doc_versions.changed_by. Defaults to "api" |

**Request body:**
```json
{
  "slug": "string (required)",
  "title": "string (required)",
  "doc_body": "string (required) — Markdown content",
  "doc_type": "guide | api-ref | tutorial | changelog (required)",
  "description": "string (optional)",
  "product": "api-apps | platform | mcp (optional)",
  "parent_id": "uuid (optional)",
  "sort_order": 0,
  "metadata": {},
  "status": "draft | published (optional, default: draft)"
}
```

**Response:** `201`
```json
{
  "data": { /* full document row */ }
}
```

Side effects: Creates initial `doc_versions` record (version 1). Sets `published_at` if status is "published".

---

### `GET /api/docs/[...slug]`

Get a single document by slug (all fields including body).

**Auth:** None (uses service role server-side, returns any status)

**Response:** `200`
```json
{
  "data": {
    "id": "uuid",
    "slug": "string",
    "title": "string",
    "description": "string | null",
    "body": "string (Markdown)",
    "doc_type": "string",
    "product": "string | null",
    "parent_id": "uuid | null",
    "sort_order": 0,
    "metadata": {},
    "status": "string",
    "version": 1,
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "published_at": "ISO8601 | null"
  }
}
```

**Error:** `404` `{ "error": "Document not found" }`

---

### `PATCH /api/docs/[...slug]`

Update an existing document. Only send fields you want to change.

**Auth:** Required (write/admin)

**Request body (all optional):**
```json
{
  "title": "string",
  "description": "string",
  "doc_body": "string",
  "doc_type": "string",
  "product": "string",
  "parent_id": "uuid",
  "sort_order": 0,
  "metadata": {},
  "status": "draft | published | archived",
  "slug": "string (rename slug)",
  "change_summary": "string (for version record)"
}
```

**Response:** `200` `{ "data": { /* updated document */ } }`

Side effects:
- If `doc_body` is provided, `version` is incremented and a new `doc_versions` record is created.
- If `status` is set to "published" and `published_at` was null, sets `published_at`.

---

### `DELETE /api/docs/[...slug]`

Delete a document.

**Auth:** Required (write/admin)

**Response:** `200` `{ "success": true }`

Side effects: Cascading delete removes doc_versions and doc_embeddings rows.

---

### `POST /api/docs/[...slug]/embed`

Trigger embedding generation for a document.

**Auth:** Required (write/admin)

**Request body:** None needed.

**Response:** `200`
```json
{
  "success": true,
  "document_id": "uuid",
  "chunks": 5
}
```

Process: Deletes existing embeddings for the document, chunks the body (1000 chars, 200 overlap, title prepended), generates embeddings via Voyage API (or random fallback), stores in doc_embeddings.

---

### `GET /api/search`

Full-text search across published documents.

**Auth:** None

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| q | string | — (required) | Search query |
| product | string | — | Filter by product |
| limit | int | 10 | Max results (capped at 50) |

**Response:** `200`
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "string",
      "title": "string",
      "description": "string | null",
      "doc_type": "string",
      "product": "string | null"
    }
  ],
  "count": 3
}
```

Uses Postgres `websearch` text search on title. Falls back to `ilike` on title + description if websearch fails.

---

### `POST /api/chat`

RAG-powered Q&A over documentation.

**Auth:** None (but requires ANTHROPIC_API_KEY on server)

**Request body:**
```json
{
  "question": "string (required)",
  "product": "string (optional)"
}
```

**Response:** `200`
```json
{
  "answer": "string (Markdown)",
  "citations": [
    { "slug": "string", "title": "string" }
  ]
}
```

Process: ilike search for relevant docs (limit 5) -> truncate bodies to 3000 chars -> send to Claude claude-sonnet-4-20250514 (max 1024 tokens) with system prompt -> return answer + citations.

Returns a fallback message (not an error) if no relevant docs found.

---

## 6. File Structure

```
apiantdocs/
├── .env.local                          # Environment variables (not committed)
├── .gitignore
├── .vercel/
│   └── project.json                    # Vercel project config (prj_EQK7hg1j1BvOxXjUcWpCCyke7boh)
├── AGENTS.md                           # Agent rules: points to Next.js 16 breaking changes
├── CLAUDE.md                           # Points to AGENTS.md
├── README.md
├── eslint.config.mjs                   # ESLint 9 flat config, next/core-web-vitals + typescript
├── next-env.d.ts                       # Next.js type declarations (auto-generated)
├── next.config.ts                      # Next config: imports archbeeRedirects for redirects()
├── package.json                        # Root package definition
├── package-lock.json
├── postcss.config.mjs                  # PostCSS with @tailwindcss/postcss plugin
├── tsconfig.json                       # TS config: ES2017, bundler resolution, @/* path alias
│
├── public/                             # Static assets (Next.js default SVGs)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css                 # Tailwind imports, theme vars, dark mode
│   │   ├── layout.tsx                  # Root layout: Geist fonts, metadata, html/body shell
│   │   ├── page.tsx                    # Homepage: product cards + recent docs list
│   │   │
│   │   ├── docs/
│   │   │   ├── page.tsx               # /docs — all docs index with Sidebar, product filter
│   │   │   └── [...slug]/
│   │   │       └── page.tsx           # /docs/[...slug] — single doc view with Sidebar + Markdown
│   │   │
│   │   └── api/
│   │       ├── docs/
│   │       │   ├── route.ts           # GET (list) + POST (create)
│   │       │   └── [slug]/
│   │       │       ├── route.ts       # GET (read) + PATCH (update) + DELETE
│   │       │       └── embed/
│   │       │           └── route.ts   # POST (trigger embedding)
│   │       ├── search/
│   │       │   └── route.ts           # GET search
│   │       └── chat/
│   │           └── route.ts           # POST RAG chat
│   │
│   ├── components/
│   │   ├── markdown-renderer.tsx       # Client component: ReactMarkdown with plugins
│   │   └── sidebar.tsx                 # Server component: nav sidebar grouped by product
│   │
│   └── lib/
│       ├── api-auth.ts                 # API key validation + write access check
│       ├── archbee-redirects.ts        # 1079 lines, ~530 redirect entries (auto-generated)
│       ├── embeddings.ts               # Text chunking, Voyage embeddings, semantic search
│       ├── supabase.ts                 # Browser + server Supabase client factories
│       └── types.ts                    # TypeScript interfaces: Document, DocVersion, ApiKey
│
├── packages/
│   └── mcp-server/
│       ├── .gitignore
│       ├── package.json               # @apiant/docs-mcp, bin: apiant-docs-mcp
│       ├── package-lock.json
│       ├── tsconfig.json              # ES2022, Node16 module resolution, outDir: dist
│       └── src/
│           └── index.ts               # MCP server: 6 tools (list, read, search, create, update, chat)
│
├── scripts/
│   ├── migrate-from-export.ts          # Main migration: Archbee MDX -> Supabase via API
│   ├── migrate-archbee.ts              # (earlier migration script, likely superseded)
│   └── fix-images.ts                   # Post-migration: re-download failed images, update bodies
│
├── supabase/
│   ├── .gitignore
│   ├── config.toml                     # Local dev config (project_id: apiantdocs, port 54321/54322)
│   ├── .temp/                          # Supabase CLI state files
│   └── migrations/
│       ├── 20260404113000_initial_schema.sql    # Tables, indexes, RLS, triggers
│       └── 20260404114100_vector_search_rpc.sql # match_doc_embeddings RPC function
│
└── migration/                          # First Archbee export (partial, only Automation Editor subset)
    ├── *.mdx                           # Raw MDX files with frontmatter
    └── Automation Editor/              # Nested subdirectories mirroring doc hierarchy
        └── ...

# Note: migration2/ directory is referenced by migrate-from-export.ts but not committed
```

---

## 7. MCP Server

### Package: `@apiant/docs-mcp`

Located at `packages/mcp-server/`. Standalone Node.js process that communicates via stdio transport.

### Configuration

**Environment variables:**
| Variable | Default | Description |
|---|---|---|
| APIANTDOCS_API_URL | `https://apiantdocs.vercel.app` | Base URL for API calls |
| APIANTDOCS_API_KEY | `""` | API key (ak_...) for authenticated operations |

**All requests include:**
- `Content-Type: application/json`
- `Authorization: Bearer <APIANTDOCS_API_KEY>` (if set)
- `X-Changed-By: mcp:claude-code`

### Tools (6 total)

#### `docs_list`
List documentation pages with optional filters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| type | string | No | Filter: guide, api-ref, tutorial, changelog |
| product | string | No | Filter: api-apps, platform, mcp |
| limit | number | No | Max results (default 50) |

#### `docs_read`
Read a specific documentation page by its slug.

| Parameter | Type | Required | Description |
|---|---|---|---|
| slug | string | Yes | Document slug (e.g., "getting-started") |

#### `docs_search`
Search documentation by keyword or natural language query.

| Parameter | Type | Required | Description |
|---|---|---|---|
| query | string | Yes | Search query |
| product | string | No | Filter by product |
| limit | number | No | Max results (default 10) |

#### `docs_create`
Create a new documentation page.

| Parameter | Type | Required | Description |
|---|---|---|---|
| slug | string | Yes | URL slug |
| title | string | Yes | Title |
| doc_body | string | Yes | Markdown body |
| doc_type | enum | Yes | guide, api-ref, tutorial, changelog |
| description | string | No | Short description |
| product | enum | No | api-apps, platform, mcp |
| status | enum | No | draft (default), published |

#### `docs_update`
Update an existing documentation page.

| Parameter | Type | Required | Description |
|---|---|---|---|
| slug | string | Yes | Current slug of document |
| title | string | No | New title |
| doc_body | string | No | New Markdown body |
| description | string | No | New description |
| status | enum | No | draft, published, archived |
| change_summary | string | No | What changed |

#### `docs_chat`
Ask a question and get an AI-generated answer based on documentation.

| Parameter | Type | Required | Description |
|---|---|---|---|
| question | string | Yes | The question |
| product | string | No | Limit to product |

### How Other Projects Use It

Add to Claude Code's MCP config (e.g., `~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "apiant-docs": {
      "command": "node",
      "args": ["/path/to/apiantdocs/packages/mcp-server/dist/index.js"],
      "env": {
        "APIANTDOCS_API_URL": "https://apiantdocs.vercel.app",
        "APIANTDOCS_API_KEY": "ak_your_key_here"
      }
    }
  }
}
```

Build first: `cd packages/mcp-server && npm install && npm run build`

---

## 8. React Components

### `MarkdownRenderer` — `src/components/markdown-renderer.tsx`

**Type:** Client component (`"use client"`)

**Props:**
```typescript
{ content: string }
```

**What it does:** Renders Markdown string to React using `react-markdown` with:
- `remark-gfm` (tables, strikethrough, task lists, autolinks)
- `rehype-highlight` (syntax highlighting in code blocks)
- `rehype-slug` (auto-generate heading IDs)
- `rehype-autolink-headings` (wrap headings in anchor links, `behavior: "wrap"`)

**Styling:** Uses Tailwind Typography (`prose prose-zinc dark:prose-invert`) with customizations:
- `max-w-none` (no max width constraint)
- `prose-headings:scroll-mt-20` (scroll margin for anchor navigation)
- Inline code: no quotes, zinc-100/800 background, rounded, small text

---

### `Sidebar` — `src/components/sidebar.tsx`

**Type:** Server component (async, fetches data at render)

**Props:**
```typescript
{ currentSlug?: string }
```

**What it does:**
1. Fetches all published documents from Supabase (slug, title, doc_type, product, parent_id, sort_order)
2. Groups documents by `product` (falls back to "general" if null)
3. Renders a fixed-width (w-64) left sidebar with:
   - "APIANT Docs" link to `/`
   - Product group headings (uppercase, small, zinc-500)
   - Document links with active state highlighting (bg-zinc-100)
4. Product label map: `{ platform: "Platform", "api-apps": "API Apps", mcp: "MCP", general: "General" }`

**Layout:** 64px wide, border-right, overflow-y-auto, shrink-0.

---

## 9. Libraries / Utilities

### `src/lib/supabase.ts`

Two factory functions:

```typescript
// Client-side: uses anon key, respects RLS
export function createBrowserClient(): SupabaseClient

// Server-side: uses service role key, bypasses RLS
export function createServerClient(): SupabaseClient
```

All API routes and RSC pages use `createServerClient()`. There is currently no client-side data fetching in the codebase (no `createBrowserClient()` calls observed).

### `src/lib/types.ts`

```typescript
export interface Document {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  doc_type: "guide" | "api-ref" | "tutorial" | "changelog";
  product: "api-apps" | "platform" | "mcp" | null;
  parent_id: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface DocVersion {
  id: string;
  document_id: string;
  version: number;
  title: string;
  body: string;
  changed_by: string;
  change_summary: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  created_at: string;
  last_used_at: string | null;
}
```

### `src/lib/api-auth.ts`

Two functions:

```typescript
// Validates Bearer ak_* token: looks up by prefix, SHA-256 hash comparison
// Updates last_used_at on success
// Returns permissions array or null
export async function validateApiKey(request: NextRequest): Promise<string[] | null>

// Checks for write/admin permission (also accepts raw service role key)
export async function requireWriteAccess(request: NextRequest): Promise<{ authorized: boolean; error?: string }>
```

Key format: `ak_<8-char-prefix><rest>`. Prefix stored in `key_prefix`, full key SHA-256 stored in `key_hash`.

### `src/lib/embeddings.ts`

```typescript
const CHUNK_SIZE = 1000;   // characters per chunk
const CHUNK_OVERLAP = 200;

// Split text into overlapping character-based chunks
export function chunkText(text: string): string[]

// Generate embeddings via Voyage API (voyage-3, 1024 dimensions)
// Fallback: random vectors if VOYAGE_API_KEY not set
export async function generateEmbeddings(texts: string[]): Promise<number[][]>

// Full pipeline: fetch doc -> delete old embeddings -> chunk -> embed -> store
export async function embedDocument(documentId: string): Promise<{ chunks: number }>

// Semantic search: embed query -> RPC match_doc_embeddings -> ranked results
export async function semanticSearch(
  query: string, limit?: number, product?: string
): Promise<{ content: string; document_id: string; slug: string; title: string }[]>
```

### `src/lib/archbee-redirects.ts`

Auto-generated file with ~530 redirect entries. Each maps an old Archbee URL pattern to the new `/docs/[slug]` path. Used in `next.config.ts` via `async redirects()`. All redirects are permanent (301).

Example patterns:
- Short Archbee IDs: `/rSvm-apiant-for-integrators` -> `/docs/apiant-for-builders`
- Clean slugs: `/apiant-for-builders` -> `/docs/apiant-for-builders`
- Title-based: `/zapier` -> `/docs/appconnect`

---

## 10. Migration

### What Was Migrated

The entire APIANT documentation from **Archbee** (hosted at `info.apiant.com`). Archbee exported docs as `.mdx` files with YAML frontmatter organized in nested directories.

### Migration Script: `scripts/migrate-from-export.ts`

**Usage:** `npx tsx scripts/migrate-from-export.ts`

**Source:** `migration2/` directory (MDX files, not committed)

**Process:**
1. **Scan** `migration2/` recursively for `.mdx` files
2. **Parse** frontmatter with `gray-matter` (with YAML colon-fixing for unquoted titles)
3. **Infer** `product` from title/path keywords (CRMConnect, ShopConnect -> "api-apps"; Assembly Editor -> "platform"; etc.)
4. **Infer** `doc_type` from title keywords (changelog, tutorial, api, default: guide)
5. **Download images** from Archbee/Google URLs -> Supabase Storage `images` bucket (public)
6. **Rewrite** image URLs in Markdown body to point to Supabase Storage public URLs
7. **Create** documents via POST /api/docs (sorted by depth so parents before children)
8. **Build** slug-to-ID map for parent_id references
9. **Generate** `archbee-redirects.ts` with all old-URL-to-new-slug mappings

**Image handling:** Downloads from `archbee`/`googleusercontent` domains. MIME detection: URL extension -> response Content-Type -> magic bytes. Uploads to `images` bucket at `docs-images/<filename>.<ext>`.

**Storage bucket:** `images`, public, allowed MIME types: image/png, image/jpeg, image/gif, image/svg+xml, image/webp.

### Post-Migration Fix: `scripts/fix-images.ts`

**Usage:** Compile then run:
```bash
npx tsc scripts/fix-images.ts --outDir scripts/dist --esModuleInterop --module commonjs --target es2022 --moduleResolution node --skipLibCheck
node scripts/dist/fix-images.js
```

**What it does:** Finds all documents still containing `api.archbee.com`, `archbee-doc-uploads`, or `googleusercontent` image URLs. Re-downloads and re-uploads them to Supabase Storage. Updates the document body directly in the database.

### Redirect Strategy

~530 permanent (301) redirects in `archbee-redirects.ts`, loaded by `next.config.ts`. Three mapping strategies per doc:
1. Archbee slug suffix (after ID prefix): `/<slug-part>` -> `/docs/<new-slug>`
2. Full Archbee slug: `/<id>-<slug-part>` -> `/docs/<new-slug>`
3. Title-derived slug: `/<title-slug>` -> `/docs/<new-slug>`

---

## 11. Environment Variables

### Required for the Next.js App

| Variable | Where | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | .env.local | Supabase project URL (public, used client + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | .env.local | Supabase anon/public key (for browser client, respects RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | .env.local | Supabase service role key (server-only, bypasses RLS). Also used directly as a valid auth token for API write access. |

### Optional

| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | .env.local | Anthropic API key for /api/chat RAG. If missing, chat returns 503. |
| `VOYAGE_API_KEY` | .env.local | Voyage AI key for embedding generation. If missing, falls back to random vectors. |

### MCP Server

| Variable | Where | Description |
|---|---|---|
| `APIANTDOCS_API_URL` | MCP env | API base URL. Default: `https://apiantdocs.vercel.app` |
| `APIANTDOCS_API_KEY` | MCP env | API key (ak_...) for read/write operations |

### Migration Scripts

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `APIANTDOCS_API_URL` | Target API (default: http://localhost:3000) |

---

## 12. Deployment

### Vercel

- **Project:** apiantdocs (`prj_EQK7hg1j1BvOxXjUcWpCCyke7boh`)
- **Org:** `team_jyZB9GsO8ySC5oC3rOdzhsnJ`
- **Framework:** Next.js 16 (auto-detected)
- **Build command:** `next build`
- **Output:** `.next/` (standard Next.js output)
- **Environment variables:** Set in Vercel dashboard (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, VOYAGE_API_KEY)

### Supabase

- **Project ID:** apiantdocs
- **Local dev ports:** API 54321, DB 54322
- **Migrations:** Applied via Supabase CLI (`supabase db push` or `supabase migration up`)
- **Storage:** `images` bucket (public, created by migration script)
- **Extensions:** `vector`, `pg_trgm` (enabled in initial migration)

### GitHub

- No `.git` directory detected at time of documentation, but `.vercel/` and `.gitignore` exist, indicating the project is likely deployed from a GitHub repo via Vercel integration.
- MCP server has its own `.gitignore` (ignores `dist/`, `node_modules/`)

---

## 13. Current State

### What's Done
- Full database schema with 4 tables, indexes, RLS policies, triggers, RPC functions
- REST API with CRUD for documents, versioning, embedding trigger, search, RAG chat
- Next.js frontend with homepage, docs index (filterable by product), single doc view with sidebar
- Markdown rendering with GFM, syntax highlighting, linked headings
- API key authentication system (SHA-256 hash, prefix-based lookup, permission levels)
- MCP server with 6 tools covering full docs lifecycle
- Archbee migration completed (530+ redirects, image re-hosting)
- Embedding infrastructure (chunking, Voyage API integration, vector search RPC)
- Dark mode support via `prefers-color-scheme`

### What's Not Done / Gaps
- **No client-side interactivity:** Everything is server-rendered. No search UI, no client-side filtering, no JS-driven navigation. The `createBrowserClient()` function exists but is never called.
- **No search UI:** `/api/search` exists but there's no search input anywhere in the frontend.
- **No chat UI:** `/api/chat` exists but there's no user-facing chat interface.
- **No authentication UI:** No login, no user management. API keys must be created directly in the database.
- **No admin/editor UI:** Document creation/editing is only possible via API or MCP.
- **No breadcrumbs:** The doc page shows doc_type and product badges but no breadcrumb trail.
- **No table of contents:** No in-page TOC despite `rehype-slug` generating heading IDs.
- **Sidebar doesn't show hierarchy:** Documents have `parent_id` but the sidebar renders a flat list grouped only by product.
- **Homepage has no link to search or chat:** Navigation is minimal (just "All Docs" and "API").
- **`createBrowserClient` unused:** Exists but no component calls it.
- **TypeScript interfaces (`types.ts`) unused in API routes:** API routes use inline types from Supabase response; the `Document`, `DocVersion`, `ApiKey` interfaces are defined but not imported anywhere in the app code.
- ~~**MCP server has a stray dependency:**~~ Fixed — `@tailwindcss/typography` removed from MCP server's package.json.
- **`zod` not in MCP server dependencies:** It's used in the server code but not listed in package.json (likely a peer dependency of `@modelcontextprotocol/sdk`).

### Known Issues
1. ~~**Image MIME failures:**~~ Fixed — `fix-images.ts` re-downloaded 969 images with magic byte MIME detection. `fix-image-tags.ts` then converted 787 JSX `<Image>` tags to standard Markdown `![](url)` and re-hosted the last 3 Archbee URLs. All images now in Supabase Storage.
2. **Random vector fallback:** Without `VOYAGE_API_KEY`, embeddings are random noise — semantic search will return garbage results. No warning is surfaced to the user.
3. **Search is title-only:** `/api/search` uses `textSearch("title", q)`. The full-text GIN index covers title + description + body, but the search API only queries title. The fallback ilike also only checks title + description.
4. **Chat search is naive:** RAG chat uses `ilike` across title + body, which is slow on large datasets and doesn't leverage the full-text index or semantic search.
5. **No pagination metadata:** The list API returns `count` as the length of the returned page, not the total count of matching documents. There's no `hasMore` or `total` field.
6. ~~**GET /api/docs/[slug] returns any status:**~~ Fixed — GET now filters to `status = 'published'` for unauthenticated requests.
7. **Embedding dimension mismatch risk:** The vector column is `vector(1024)` matching Voyage-3's 1024 dimensions. If a different model is used, inserts will fail.
8. **IVFFlat index requires training data:** The IVFFlat index with 100 lists may not work well with very few rows. It needs to be rebuilt after significant data changes (`REINDEX`).
9. ~~**Slug in API route is not catch-all:**~~ Fixed — API route changed from `[slug]` to `[...slug]` catch-all. Nested slugs like `automation-editor/key-concepts` now work via `/api/docs/automation-editor/key-concepts`. The embed action is handled via `/api/docs/{slug}/embed` (last segment detection).
