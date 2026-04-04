export interface Document {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  doc_type: "guide" | "api-ref" | "tutorial" | "changelog";
  product: "api-apps" | "platform" | "mcp" | null;
  parent_id: string | null;
  sort_order: number;
  tags: string[];
  metadata: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface DocVersion {
  id: string;
  document_id: string;
  version: number;
  title: string;
  body: string;
  changed_by: string;
  change_summary: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  user_id: string | null;
  created_at: string;
  last_used_at: string | null;
}
