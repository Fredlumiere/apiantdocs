-- Add tags column to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- GIN index for fast tag lookups
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);
