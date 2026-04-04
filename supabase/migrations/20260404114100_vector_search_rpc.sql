-- RPC function for vector similarity search with document join
CREATE OR REPLACE FUNCTION match_doc_embeddings(
  query_embedding text,
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
