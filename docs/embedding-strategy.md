# Embedding & Search Strategy — apiantdocs (Actual + Improvements)

## Current Implementation

### Embedding Pipeline (As Built)

**File:** `src/lib/embeddings.ts`

- **Model**: Voyage AI `voyage-3`, 1024 dimensions
- **Chunking**: Character-based, 1000 chars per chunk, 200 char overlap
- **Title prepend**: Each chunk gets the document title prepended for context
- **Storage**: `doc_embeddings` table — document_id, chunk_index, content, embedding vector(1024)
- **Fallback**: Random vectors if VOYAGE_API_KEY not set (silent — no warning)

### Semantic Search (As Built)

**RPC Function:** `match_doc_embeddings(query_embedding text, match_count int, filter_product text)`

1. Embed query text via Voyage API
2. Call RPC function (SECURITY DEFINER, bypasses RLS)
3. Cosine distance on published docs only
4. Optional product filter
5. Returns: content, document_id, slug, title, similarity score

### Full-Text Search (As Built)

**Index:** GIN on `to_tsvector('english', title || description || body)` — but the search API only queries title.

**Trigram index:** `gin(title gin_trgm_ops)` — available but not actively used in search endpoint.

---

## Improvements Needed

### 1. Fix Search API (next-phase 1.1)

Replace title-only search with full tsvector query using the existing GIN index. Add `ts_headline()` for snippets.

### 2. Fix Chat RAG (next-phase 1.2)

Replace ilike retrieval with `semanticSearch()` from embeddings.ts. The function already exists — just needs to be called from the chat route.

### 3. Hybrid Search (next-phase 4.1)

Combine full-text + semantic results:

```
Query → run both searches in parallel
  ├─ Full-text: ts_rank scores
  └─ Semantic: cosine similarity scores

Normalize both to 0-1 range
Combine: 0.4 * keyword + 0.6 * semantic
Deduplicate by document_id (keep highest)
Return top-k
```

### 4. Heading-Aware Chunking (next-phase 5.1)

Current character-based chunking splits mid-section. Improve:

1. Split on H2 headings first
2. If section > 1000 chars, split on H3
3. If still too long, split on paragraph boundaries (double newline)
4. Never split mid-code-block
5. Minimum chunk: 200 chars — merge with adjacent if smaller
6. Keep 200-char overlap between chunks

### 5. Chunk Metadata (next-phase 5.3)

Add `metadata jsonb` column to `doc_embeddings`. Store per chunk:

```typescript
{
  doc_slug: string;
  doc_title: string;
  doc_type: string;
  product: string | null;
  section_path: string;      // "Authentication > API Keys"
  has_code: boolean;
}
```

Requires a new migration.

---

## RAG System Prompt (For Chat)

Currently used in `src/app/api/chat/route.ts`:

```
You are the APIANT documentation assistant. Answer questions about APIANT
using ONLY the provided documentation excerpts. Follow these rules:

1. If the answer is in the provided sources, cite the source number [1].
2. If the answer is NOT in sources, say so and suggest where to look.
3. Never make up information not in the sources.
4. Be concise — technical audience.
5. Format code with proper syntax highlighting markdown.
```

Uses: Claude Sonnet (claude-sonnet-4-20250514), max_tokens 1024.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| VOYAGE_API_KEY | Yes (for semantic search) | Voyage AI API key. Without it, embeddings are random noise. |
| ANTHROPIC_API_KEY | Yes (for chat) | Anthropic API key for Claude. Without it, /api/chat returns 503. |
