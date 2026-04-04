# API Specification — apiantdocs (Actual + Improvements)

## Base URL

Production: `https://apiantdocs.vercel.app/api`

## Authentication

- **Public**: GET requests return published docs only (no auth)
- **API Key**: `Authorization: Bearer ak_...` — SHA-256 hash lookup by 11-char prefix (`ak_` + 8 chars)
- **Service Role**: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` — bypasses all checks
- **Write check**: `requireWriteAccess()` in `src/lib/api-auth.ts` — requires write or admin permission
- **Changed-by tracking**: `X-Changed-By` header → stored in `doc_versions.changed_by` (defaults to "api")

## Current Endpoints (As Built)

### GET /api/docs

List published documents with pagination and filtering.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| type | string | — | Filter by doc_type |
| product | string | — | Filter by product |
| status | string | "published" | Filter by status (non-published requires auth) |
| limit | int | 50 | Max results (capped at 100) |
| offset | int | 0 | Pagination offset |

**Response:** `200`
```json
{
  "data": [{ "id", "slug", "title", "description", "doc_type", "product", "parent_id", "sort_order", "status", "version", "created_at", "updated_at", "published_at" }],
  "count": 20
}
```

**NOTE:** `count` is page length, not total. Body NOT included in list. **Fix needed** — see next-phase.md 1.3.

---

### POST /api/docs

Create a new document. **Auth required** (write/admin).

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

**IMPORTANT:** Field is `doc_body`, NOT `body`.

**Response:** `201 { "data": { /* full document row */ } }`

**Side effects:** Creates initial doc_versions record (version 1). Sets published_at if status is "published".

---

### GET /api/docs/[...slug]

Get a single document by slug. Uses service role server-side.

**Response:** `200 { "data": { /* full document including body */ } }`
**Error:** `404 { "error": "Document not found" }`

---

### PATCH /api/docs/[...slug]

Update a document. **Auth required.** Partial update — send only changed fields.

**Request body (all optional):**
```json
{
  "title": "string",
  "description": "string",
  "doc_body": "string — triggers version increment",
  "doc_type": "string",
  "product": "string",
  "parent_id": "uuid",
  "sort_order": 0,
  "metadata": {},
  "status": "draft | published | archived",
  "slug": "string (rename)",
  "change_summary": "string (for version record)"
}
```

**Side effects:** If `doc_body` provided, version increments and new doc_versions record created. If status → "published" and published_at null, sets published_at.

---

### DELETE /api/docs/[...slug]

Delete a document. **Auth required.**

**Response:** `200 { "success": true }`

Cascade deletes doc_versions and doc_embeddings.

---

### POST /api/docs/[...slug]/embed

Trigger embedding generation. **Auth required.**

Detects `/embed` as last segment of catch-all slug.

**Response:** `200 { "success": true, "document_id": "uuid", "chunks": 5 }`

Process: Delete existing embeddings → chunk body (1000 chars, 200 overlap, title prepended) → Voyage API → store.

---

### GET /api/search

**Current implementation:** `websearch` on title only, fallback to `ilike` on title+description.

**Response:** `200 { "data": [{ "id", "slug", "title", "description", "doc_type", "product" }], "count": N }`

**Fix needed:** Use full-text GIN index across title+description+body. Add snippets. See next-phase.md 1.1.

---

### POST /api/chat

RAG-powered Q&A. No auth required (but needs ANTHROPIC_API_KEY server-side).

**Request:** `{ "question": "string", "product?": "string" }`
**Response:** `200 { "answer": "string (Markdown)", "citations": [{ "slug", "title" }] }`

**Current:** Uses ilike for retrieval. **Fix needed:** Use semanticSearch(). See next-phase.md 1.2.

---

## Planned Endpoints

### GET /api/docs/tree

Navigation tree endpoint. Returns full document hierarchy as nested JSON. See next-phase.md 4.2.

### GET /api/search (upgraded)

With `mode` param: keyword | semantic | hybrid. See next-phase.md 4.1.
