-- One-time cleanup for issue #10: doc_embeddings grew to ~1.34M rows because
-- the embed cron re-inserted ~240 documents' chunks on every run without
-- deleting the previous ones. This keeps, per document, only the rows from the
-- newest embed batch (all rows of one batch share the created_at of the batch's
-- chunk 0, since they come from a single INSERT) and rebuilds the vector index.
--
-- Run with direct database access (psql via the pooler URL, or the Supabase SQL
-- editor). It will not run through PostgREST: the service role's statement
-- timeout is 8 s and this touches every row once.
--
-- Safe to re-run. Check the two counts before committing.

BEGIN;

-- Rows to keep: newest batch per document.
CREATE TEMP TABLE doc_embeddings_keep ON COMMIT DROP AS
SELECT e.*
FROM doc_embeddings e
JOIN (
  SELECT document_id, max(created_at) AS batch_at
  FROM doc_embeddings
  WHERE chunk_index = 0
  GROUP BY document_id
) b ON b.document_id = e.document_id AND e.created_at >= b.batch_at;

-- Expect: total in the millions, keep in the low thousands, one row per
-- published document with a body in the third column.
SELECT
  (SELECT count(*) FROM doc_embeddings)               AS total_rows,
  (SELECT count(*) FROM doc_embeddings_keep)          AS rows_kept,
  (SELECT count(DISTINCT document_id) FROM doc_embeddings_keep) AS docs_kept;

-- TRUNCATE is transactional in Postgres: if anything below fails the table is
-- untouched. It also releases the bloated heap and index pages immediately,
-- which a DELETE of 1.3M rows would not.
TRUNCATE doc_embeddings;

INSERT INTO doc_embeddings (id, document_id, chunk_index, content, embedding, created_at)
SELECT id, document_id, chunk_index, content, embedding, created_at
FROM doc_embeddings_keep;

COMMIT;

-- Outside the transaction: rebuild the IVFFlat index over the small table and
-- refresh planner stats. Every scheduled REINDEX since 2026-08 timed out.
REINDEX INDEX idx_doc_embeddings_vector;
ANALYZE doc_embeddings;

-- Verify: expect roughly 3,500 rows and one chunk 0 per document.
SELECT count(*) AS rows_now,
       count(*) FILTER (WHERE chunk_index = 0) AS docs_now,
       count(DISTINCT document_id) AS distinct_docs
FROM doc_embeddings;
