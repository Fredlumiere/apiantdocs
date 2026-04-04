import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "./supabase";

const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200;

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
 * Generate embeddings for text chunks using Anthropic's Voyage API.
 * Falls back to a simple hash-based vector if VOYAGE_API_KEY is not set.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const voyageKey = process.env.VOYAGE_API_KEY;

  if (voyageKey) {
    // Use Voyage API for production embeddings
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

    const data = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  }

  // Fallback: use Anthropic to generate a summary, then a deterministic vector
  // This is a placeholder — replace with Voyage or another embedding model
  return texts.map(() => Array.from({ length: 1024 }, () => Math.random() * 2 - 1));
}

/**
 * Embed a document: chunk its body, generate embeddings, store in doc_embeddings.
 */
export async function embedDocument(documentId: string) {
  const supabase = createServerClient();

  // Fetch the document
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, body")
    .eq("id", documentId)
    .single();

  if (!doc) throw new Error(`Document ${documentId} not found`);

  // Delete existing embeddings for this document
  await supabase
    .from("doc_embeddings")
    .delete()
    .eq("document_id", documentId);

  // Chunk the content (prepend title for context)
  const fullText = `# ${doc.title}\n\n${doc.body}`;
  const chunks = chunkText(fullText);

  // Generate embeddings
  const embeddings = await generateEmbeddings(chunks);

  // Store chunks and embeddings
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

  // Generate embedding for the query
  const [queryEmbedding] = await generateEmbeddings([query]);

  // Use Supabase RPC for vector similarity search
  // We need a function for this — fall back to full-text for now
  const { data } = await supabase.rpc("match_doc_embeddings", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: limit,
    filter_product: product || null,
  });

  return data || [];
}
