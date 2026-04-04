-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Documents: the atomic unit of content
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

-- Version history for every edit
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

-- Embeddings for semantic search
CREATE TABLE doc_embeddings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index   int NOT NULL,
  content       text NOT NULL,
  embedding     vector(1024),
  created_at    timestamptz DEFAULT now()
);

-- API keys for programmatic access
CREATE TABLE api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  key_hash      text NOT NULL,
  key_prefix    text NOT NULL,
  permissions   text[] DEFAULT '{read}',
  created_at    timestamptz DEFAULT now(),
  last_used_at  timestamptz
);

-- Indexes
CREATE INDEX idx_documents_slug ON documents(slug);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);
CREATE INDEX idx_documents_product ON documents(product);
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_doc_versions_document_id ON doc_versions(document_id);
CREATE INDEX idx_doc_embeddings_document_id ON doc_embeddings(document_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Full-text search index
CREATE INDEX idx_documents_fts ON documents USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(body, ''))
);

-- Trigram index for fuzzy search
CREATE INDEX idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);

-- Vector similarity index (IVFFlat — switch to HNSW if >100k rows)
CREATE INDEX idx_doc_embeddings_vector ON doc_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Public can read published documents
CREATE POLICY "Published docs are public" ON documents
  FOR SELECT USING (status = 'published');

-- Service role has full access (API routes use service role key)
CREATE POLICY "Service role full access to documents" ON documents
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to doc_versions" ON doc_versions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to doc_embeddings" ON doc_embeddings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to api_keys" ON api_keys
  FOR ALL USING (auth.role() = 'service_role');

-- Public can read embeddings for published docs
CREATE POLICY "Public can read embeddings for published docs" ON doc_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = doc_embeddings.document_id
      AND documents.status = 'published'
    )
  );

-- Updated_at trigger
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
