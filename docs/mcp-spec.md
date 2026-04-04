# MCP Server — @apiant/docs-mcp (Actual)

## Overview

Standalone Node.js package at `packages/mcp-server/`. Communicates via stdio transport. All operations go through the REST API at APIANTDOCS_API_URL — does NOT access database directly.

## Setup (Current — not published to npm)

```bash
cd packages/mcp-server && npm install && npm run build
```

Configure in Claude Code settings:
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

All requests include:
- `Content-Type: application/json`
- `Authorization: Bearer <APIANTDOCS_API_KEY>` (if set)
- `X-Changed-By: mcp:claude-code`

## Tools (6 — As Built)

### docs_list

List documentation pages with optional filters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| type | string | No | Filter: guide, api-ref, tutorial, changelog |
| product | string | No | Filter: api-apps, platform, mcp |
| limit | number | No | Max results (default 50) |

Calls: `GET /api/docs?type={type}&product={product}&limit={limit}`

---

### docs_read

Read a specific documentation page by slug.

| Parameter | Type | Required | Description |
|---|---|---|---|
| slug | string | Yes | Document slug (e.g., "automation-editor/key-concepts") |

Calls: `GET /api/docs/{slug}`

---

### docs_search

Search documentation by keyword or natural language query.

| Parameter | Type | Required | Description |
|---|---|---|---|
| query | string | Yes | Search query |
| product | string | No | Filter by product |
| limit | number | No | Max results (default 10) |

Calls: `GET /api/search?q={query}&product={product}&limit={limit}`

NOTE: Currently title-only search. Will improve when API search is fixed (next-phase 1.1).

---

### docs_create

Create a new documentation page. Requires API key with write permission.

| Parameter | Type | Required | Description |
|---|---|---|---|
| slug | string | Yes | URL slug |
| title | string | Yes | Title |
| doc_body | string | Yes | Markdown body |
| doc_type | enum | Yes | guide, api-ref, tutorial, changelog |
| description | string | No | Short description |
| product | enum | No | api-apps, platform, mcp |
| status | enum | No | draft (default), published |

Calls: `POST /api/docs` with JSON body.

---

### docs_update

Update an existing documentation page. Requires write permission.

| Parameter | Type | Required | Description |
|---|---|---|---|
| slug | string | Yes | Current slug of document |
| title | string | No | New title |
| doc_body | string | No | New Markdown body |
| description | string | No | New description |
| status | enum | No | draft, published, archived |
| change_summary | string | No | What changed |

Calls: `PATCH /api/docs/{slug}` with JSON body.

---

### docs_chat

Ask a question and get an AI-generated answer with citations.

| Parameter | Type | Required | Description |
|---|---|---|---|
| question | string | Yes | The question |
| product | string | No | Limit to product |

Calls: `POST /api/chat` with JSON body.

NOTE: Currently uses ilike retrieval. Will improve when chat backend is fixed (next-phase 1.2).

---

## Future: npm Publishing

Once stable, publish as `@apiant/docs-mcp` so other projects can install via:
```json
{
  "command": "npx",
  "args": ["@apiant/docs-mcp"],
  "env": { ... }
}
```

Requires updating `package.json` bin entry and publishing to npm.
