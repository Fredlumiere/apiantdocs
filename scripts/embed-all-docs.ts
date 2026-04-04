/**
 * Embed all published documents that don't have embeddings yet.
 * Run after migration or when VOYAGE_API_KEY becomes available.
 *
 * Usage: node scripts/dist/embed-all-docs.js
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;

if (!VOYAGE_API_KEY) {
  console.error("VOYAGE_API_KEY is required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Batch in groups of 20 to avoid Voyage rate limits
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += 20) {
    const batch = texts.slice(i, i + 20);
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ input: batch, model: "voyage-3" }),
    });

    if (!response.ok) {
      throw new Error(`Voyage API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    results.push(...data.data.map((d: { embedding: number[] }) => d.embedding));

    if (i + 20 < texts.length) {
      await new Promise((r) => setTimeout(r, 500)); // Rate limit courtesy
    }
  }
  return results;
}

async function main() {
  console.log("=== Embed All Documents ===\n");

  // Find docs without embeddings
  const { data: allDocs } = await supabase
    .from("documents")
    .select("id, slug, title, body")
    .eq("status", "published");

  if (!allDocs || allDocs.length === 0) {
    console.log("No documents found.");
    return;
  }

  const { data: embeddedIds } = await supabase
    .from("doc_embeddings")
    .select("document_id")
    .limit(10000);

  const embeddedSet = new Set((embeddedIds || []).map((e) => e.document_id));
  const toEmbed = allDocs.filter((d) => !embeddedSet.has(d.id) && d.body);

  console.log(`Total docs: ${allDocs.length}, Already embedded: ${embeddedSet.size}, To embed: ${toEmbed.length}\n`);

  let success = 0;
  let failed = 0;

  for (const doc of toEmbed) {
    process.stdout.write(`  ${doc.slug}...`);

    try {
      const fullText = `# ${doc.title}\n\n${doc.body}`;
      const chunks = chunkText(fullText);
      const embeddings = await generateEmbeddings(chunks);

      const rows = chunks.map((content, i) => ({
        document_id: doc.id,
        chunk_index: i,
        content,
        embedding: JSON.stringify(embeddings[i]),
      }));

      const { error } = await supabase.from("doc_embeddings").insert(rows);
      if (error) throw new Error(error.message);

      console.log(` ${chunks.length} chunks`);
      success++;
    } catch (err) {
      console.log(` FAILED: ${err}`);
      failed++;
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Success: ${success}, Failed: ${failed}`);
  console.log(`\nRun REINDEX: supabase db execute --sql "REINDEX INDEX idx_doc_embeddings_vector;"`);
}

main().catch(console.error);
