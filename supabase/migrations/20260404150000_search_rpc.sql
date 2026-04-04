-- Full-text search RPC with ranking and snippets
CREATE OR REPLACE FUNCTION search_documents(
  search_query text,
  filter_product text DEFAULT NULL,
  result_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  description text,
  doc_type text,
  product text,
  snippet text,
  rank float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.slug,
    d.title,
    d.description,
    d.doc_type,
    d.product,
    ts_headline('english', coalesce(d.body, ''), websearch_to_tsquery('english', search_query),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=40, MinWords=20, MaxFragments=1'
    ) AS snippet,
    ts_rank(
      to_tsvector('english', coalesce(d.title, '') || ' ' || coalesce(d.description, '') || ' ' || coalesce(d.body, '')),
      websearch_to_tsquery('english', search_query)
    ) AS rank
  FROM documents d
  WHERE d.status = 'published'
    AND to_tsvector('english', coalesce(d.title, '') || ' ' || coalesce(d.description, '') || ' ' || coalesce(d.body, ''))
        @@ websearch_to_tsquery('english', search_query)
    AND (filter_product IS NULL OR d.product = filter_product)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$;

-- Navigation tree RPC (returns flat list for client-side tree building)
CREATE OR REPLACE FUNCTION get_doc_tree()
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  doc_type text,
  product text,
  parent_id uuid,
  sort_order int
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT d.id, d.slug, d.title, d.doc_type, d.product, d.parent_id, d.sort_order
  FROM documents d
  WHERE d.status = 'published'
  ORDER BY d.sort_order;
$$;
