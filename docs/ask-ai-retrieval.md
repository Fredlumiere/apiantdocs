# Ask AI Retrieval (RAG)

## Background

The **Ask AI** widget (`POST /api/chat`) answers reader questions over the docs. Originally it used **only** Postgres full-text (keyword) search via the `search_documents` RPC. That made it brittle:

- It only found pages that lexically contained the query terms, so natural/situational questions ("how do I find the email delivery report") often missed the right page.
- `websearch_to_tsquery` treats punctuation as operators. Pasting a title like `ZoomConnect Mindbody Appointments - Setup and requirements` turned `- Setup` into a **NOT Setup** clause, excluding the very page the reader was viewing and returning "I couldn't find any relevant documentation."

The semantic stack already existed (`pgvector`, `doc_embeddings` 1024-dim, `match_doc_embeddings`, Voyage `voyage-3`, `embedDocument`/`semanticSearch`) but was **not connected** to the chat, and nothing re-embedded docs on publish, so the index drifted.

## What changed

### 1. Hybrid retrieval (`src/app/api/chat/route.ts`)
`/api/chat` now runs two searches in parallel and merges them:
- **Semantic** — `semanticSearch()` embeds the raw question with Voyage and finds nearest chunks via the `match_doc_embeddings` pgvector RPC.
- **Keyword** — the existing `search_documents` full-text RPC, on a sanitized query.

Results merge into an ordered, de-duplicated set of document IDs (semantic first, then keyword), capped at 5. Full bodies (published only) are fetched in rank order and passed to Claude for a cited answer.

### 2. Query sanitization
`sanitizeQuery()` now also neutralizes `websearch_to_tsquery` operators (`-`, quotes, `+`, `~`, `*`, `<`, `>`), so punctuation in a question can't accidentally exclude results.

### 3. Auto-embed on publish
Embeddings now regenerate automatically (best-effort, wrapped in try/catch so a failure never blocks a write):
- **Create** (`POST /api/docs`) when `status = published`.
- **Update** (`PATCH /api/docs/[...slug]`) when the body changes or the doc becomes published.

The manual `POST /api/docs/[...slug]/embed` action still exists for ad-hoc re-indexing; `scripts/embed-all-docs.ts` remains the bulk backfill.

## Safe fallback (no regression)

`semanticSearch()` returns `[]` on any failure — missing `VOYAGE_API_KEY`, no embeddings yet, or an API error. So if the semantic side isn't ready, chat runs **keyword-only**, i.e. identical to the previous behavior. Nothing degrades.

## Activation checklist (required for the upgrade to take effect in prod)

1. **Set `VOYAGE_API_KEY`** in the deployment environment (Vercel). Without it, semantic search stays empty and chat is keyword-only. (`ANTHROPIC_API_KEY` is already configured for answer generation.)
2. **Backfill embeddings** for existing docs: run `scripts/embed-all-docs.ts` (needs `VOYAGE_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`), or hit the per-doc `embed` action. Docs created/edited after this change self-index.
3. **Deploy.** Hybrid retrieval activates once the key is set and at least some docs are embedded.

## Files touched

| File | Change |
|---|---|
| `src/app/api/chat/route.ts` | Hybrid retrieval + query operator sanitization |
| `src/app/api/docs/route.ts` | Auto-embed on publish (create) |
| `src/app/api/docs/[...slug]/route.ts` | Auto-embed on publish / content change (update) |
| `src/lib/embeddings.ts` | `semanticSearch` / `embedDocument` (reused, unchanged) |
