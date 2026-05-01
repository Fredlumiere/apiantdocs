-- SECURITY DEFINER function so the service role can rebuild the IVFFlat
-- vector index after bulk embedding inserts. Service role lacks superuser,
-- but a SECURITY DEFINER function owned by postgres can REINDEX.
--
-- Called from scripts/embed-all-docs.ts at the end of a run if any new
-- embeddings landed.

CREATE OR REPLACE FUNCTION public.reindex_doc_embeddings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REINDEX INDEX public.idx_doc_embeddings_vector;
END;
$$;

REVOKE ALL ON FUNCTION public.reindex_doc_embeddings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reindex_doc_embeddings() TO service_role;
