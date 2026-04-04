import { createServerClient } from "./supabase";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// Warn at module load if Voyage API key is missing
if (!process.env.VOYAGE_API_KEY) {
  console.warn("[apiantdocs] VOYAGE_API_KEY not set — embedding operations will fail. Semantic search will not work.");
}

/**
 * Split text into overlapping chunks for embedding.
 */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Generate embeddings via Voyage API.
 * Throws if VOYAGE_API_KEY is not set (never inserts random vectors).
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const voyageKey = process.env.VOYAGE_API_KEY;

  if (!voyageKey) {
    throw new Error("VOYAGE_API_KEY is not configured. Cannot generate embeddings.");
  }

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${voyageKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: "voyage-3",
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error("Unexpected Voyage API response shape");
  }

  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

/**
 * Embed a document: chunk its body, generate embeddings, store in doc_embeddings.
 * Atomic: generates new embeddings first, then replaces old ones.
 */
export async function embedDocument(documentId: string) {
  const supabase = createServerClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, body")
    .eq("id", documentId)
    .single();

  if (!doc) throw new Error(`Document ${documentId} not found`);
  if (!doc.body) throw new Error(`Document ${documentId} has no body content`);

  // Chunk the content (prepend title for context)
  const fullText = `# ${doc.title}\n\n${doc.body}`;
  const chunks = chunkText(fullText);

  // Generate embeddings FIRST (before deleting old ones)
  const embeddings = await generateEmbeddings(chunks);

  // Now safe to delete old embeddings and insert new ones
  await supabase
    .from("doc_embeddings")
    .delete()
    .eq("document_id", documentId);

  const rows = chunks.map((content, i) => ({
    document_id: documentId,
    chunk_index: i,
    content,
    embedding: JSON.stringify(embeddings[i]),
  }));

  const { error } = await supabase.from("doc_embeddings").insert(rows);
  if (error) throw new Error(`Failed to store embeddings: ${error.message}`);

  return { chunks: chunks.length };
}

/**
 * Semantic search: find the most relevant chunks for a query.
 */
export async function semanticSearch(
  query: string,
  limit: number = 5,
  product?: string
): Promise<{ content: string; document_id: string; slug: string; title: string }[]> {
  const supabase = createServerClient();

  try {
    const [queryEmbedding] = await generateEmbeddings([query]);

    const { data } = await supabase.rpc("match_doc_embeddings", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: limit,
      filter_product: product || null,
    });

    return data || [];
  } catch (err) {
    console.error("[apiantdocs] Semantic search failed:", err);
    return [];
  }
}
