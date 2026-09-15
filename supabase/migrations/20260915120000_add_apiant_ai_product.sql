-- Allow product 'apiant-ai' for pages served on https://apiant.ai/docs
-- (the apiantdocs app built with DOCS_SITE=apiant-ai).
--
-- The live constraint already differs from 20260404113000_initial_schema.sql:
-- read from pg_constraint on 2026-09-15 it allowed NULL or
-- ('api-apps', 'platform', 'platform-ui', 'mcp', 'general'). Those values are
-- kept exactly; this migration only adds 'apiant-ai'.

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_product_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_product_check
  CHECK (
    product IS NULL
    OR product IN ('api-apps', 'platform', 'platform-ui', 'mcp', 'general', 'apiant-ai')
  );
