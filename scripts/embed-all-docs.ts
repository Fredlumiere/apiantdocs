/**
 * Embed all published documents that don't have embeddings yet.
 * Run after migration or when VOYAGE_API_KEY becomes available.
 * Also run by .github/workflows/embed-new-docs.yml on a schedule.
 *
 * Usage: npx tsx scripts/embed-all-docs.ts
 *
 * Idempotent: a document is embedded only if it has no chunk rows, and a
 * document's old rows are deleted before its new rows are inserted. The
 * "already embedded" set is read page by page because PostgREST caps a single
 * response at 1,000 rows (Supabase max_rows). The previous version asked for
 * 10,000 rows in one call, got 1,000, treated every other document as missing
 * and re-inserted its embeddings on every run (issue #10).
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
      await new Promise((r) => setTimeout(r, 2000)); // Rate limit courtesy
    }
  }
  return results;
}


/**
 * Every document_id that has at least one chunk row. Reads only chunk 0 (one
 * row per embedded document) and pages through with range() so the result is
 * complete regardless of PostgREST's max_rows cap.
 */
async function fetchEmbeddedDocIds(): Promise<Set<string>> {
  const PAGE = 1000;
  const ids = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("doc_embeddings")
      .select("document_id")
      .eq("chunk_index", 0)
      .order("document_id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to read embedded document ids: ${error.message}`);
    for (const row of data || []) ids.add(row.document_id);
    if (!data || data.length < PAGE) break;
  }
  return ids;
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

  const embeddedSet = await fetchEmbeddedDocIds();
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

      // Replace, never append: drop any rows this document already has so a
      // re-run (or a stale "already embedded" read) cannot duplicate them.
      const { error: deleteError } = await supabase
        .from("doc_embeddings")
        .delete()
        .eq("document_id", doc.id);
      if (deleteError) throw new Error(deleteError.message);

      const { error } = await supabase.from("doc_embeddings").insert(rows);
      if (error) throw new Error(error.message);

      console.log(` ${chunks.length} chunks`);
      success++;
      // Growth tier: 200 RPM — 500ms between docs is plenty
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log(` FAILED: ${err}`);
      failed++;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Success: ${success}, Failed: ${failed}`);

  if (success > 0) {
    process.stdout.write(`\nREINDEX idx_doc_embeddings_vector...`);
    const { error } = await supabase.rpc("reindex_doc_embeddings");
    console.log(error ? ` FAILED: ${error.message}` : " done");
  }
}

main().catch(console.error);
