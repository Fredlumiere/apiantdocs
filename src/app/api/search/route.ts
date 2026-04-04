import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * Sanitize search input for use with websearch_to_tsquery.
 * Only strip characters that are genuinely dangerous for SQL or tsquery parsing.
 * Keep letters, numbers, spaces, hyphens, and quotes (websearch_to_tsquery handles these).
 */
function sanitizeQuery(input: string): string {
  return input
    .replace(/[%_\\;]/g, "")   // SQL injection chars
    .replace(/[(){}[\]]/g, "") // brackets that break tsquery
    .trim()
    .slice(0, 200);
}

interface SemanticResult {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  doc_type: string;
  product: string;
  similarity: number;
}

/**
 * Fetch embeddings from Voyage AI and run semantic search against document_embeddings.
 * Returns null if VOYAGE_API_KEY is not set or on any error.
 */
async function semanticSearch(
  query: string,
  product: string | null,
  limit: number,
  supabase: ReturnType<typeof createServerClient>
): Promise<SemanticResult[] | null> {
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (!voyageKey) return null;

  try {
    // Get embedding from Voyage AI
    const embRes = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${voyageKey}`,
      },
      body: JSON.stringify({
        input: [query],
        model: "voyage-3-lite",
      }),
    });

    if (!embRes.ok) return null;

    const embData = await embRes.json();
    const embedding = embData?.data?.[0]?.embedding;
    if (!embedding) return null;

    // Query Supabase for similar document chunks using match_doc_embeddings RPC
    const { data, error } = await supabase.rpc("match_doc_embeddings", {
      query_embedding: JSON.stringify(embedding),
      match_count: limit,
      filter_product: product || null,
    });

    if (error || !data) return null;

    // Deduplicate by document_id (multiple chunks can match the same doc)
    const seen = new Set<string>();
    const deduped: SemanticResult[] = [];
    for (const row of data as Array<{ content: string; document_id: string; slug: string; title: string; similarity: number }>) {
      if (!seen.has(row.document_id)) {
        seen.add(row.document_id);
        deduped.push({
          id: row.document_id,
          slug: row.slug,
          title: row.title,
          description: null,
          doc_type: "",
          product: "",
          similarity: row.similarity,
        });
      }
    }
    return deduped;
  } catch {
    return null;
  }
}

/**
 * Merge keyword and semantic results, deduplicating by id.
 * Keyword results get a normalized score based on rank; semantic results based on similarity.
 * Combined score is averaged when a doc appears in both sets.
 */
function mergeResults(
  keywordResults: Array<{ id: string; slug: string; title: string; description: string | null; doc_type: string; product: string; snippet: string | null; rank: number }>,
  semanticResults: SemanticResult[],
  limit: number
) {
  const merged = new Map<string, { id: string; slug: string; title: string; description: string | null; doc_type: string; product: string; snippet: string | null; keywordScore: number; semanticScore: number }>();

  // Normalize keyword ranks to 0-1
  const maxRank = Math.max(...keywordResults.map((r) => r.rank), 0.001);
  for (const r of keywordResults) {
    merged.set(r.id, {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      doc_type: r.doc_type,
      product: r.product,
      snippet: r.snippet,
      keywordScore: r.rank / maxRank,
      semanticScore: 0,
    });
  }

  for (const r of semanticResults) {
    const existing = merged.get(r.id);
    if (existing) {
      existing.semanticScore = r.similarity;
    } else {
      merged.set(r.id, {
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        doc_type: r.doc_type,
        product: r.product,
        snippet: null,
        keywordScore: 0,
        semanticScore: r.similarity,
      });
    }
  }

  // Combined score: weighted average (keyword 0.4, semantic 0.6 when both present)
  const scored = Array.from(merged.values()).map((r) => {
    const hasKeyword = r.keywordScore > 0;
    const hasSemantic = r.semanticScore > 0;
    let combinedScore: number;
    if (hasKeyword && hasSemantic) {
      combinedScore = r.keywordScore * 0.4 + r.semanticScore * 0.6;
    } else if (hasSemantic) {
      combinedScore = r.semanticScore * 0.8;
    } else {
      combinedScore = r.keywordScore * 0.8;
    }
    return { ...r, rank: combinedScore };
  });

  scored.sort((a, b) => b.rank - a.rank);
  return scored.slice(0, limit).map(({ keywordScore, semanticScore, ...rest }) => rest);
}

// GET /api/search?q=query&product=&limit=&mode=keyword|semantic|hybrid
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const product = searchParams.get("product");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const mode = searchParams.get("mode") || "keyword";

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query parameter 'q' is required (min 2 chars)" }, { status: 400 });
  }

  const supabase = createServerClient();
  const sanitized = sanitizeQuery(q.trim());

  if (!sanitized || sanitized.length < 2) {
    return NextResponse.json({ error: "Query too short after sanitization" }, { status: 400 });
  }

  // Keyword search via RPC
  const keywordSearch = async () => {
    const { data, error } = await supabase.rpc("search_documents", {
      search_query: sanitized,
      filter_product: product || null,
      result_limit: limit,
    });

    if (error) {
      // Fallback to simple ilike if RPC fails (e.g., invalid websearch syntax)
      const safeQ = sanitized.replace(/'/g, "''");
      const { data: fallbackData } = await supabase
        .from("documents")
        .select("id, slug, title, description, doc_type, product")
        .eq("status", "published")
        .or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
        .limit(limit);

      return (fallbackData || []).map((d) => ({ ...d, snippet: null, rank: 0 }));
    }

    return data || [];
  };

  // Hybrid mode: run keyword + semantic in parallel, merge results
  if (mode === "hybrid") {
    const [keywordData, semanticData] = await Promise.all([
      keywordSearch(),
      semanticSearch(sanitized, product, limit, supabase),
    ]);

    if (semanticData && semanticData.length > 0) {
      const merged = mergeResults(keywordData, semanticData, limit);
      return NextResponse.json({ data: merged, count: merged.length, mode: "hybrid" });
    }

    // Semantic failed or returned nothing — return keyword only
    return NextResponse.json({ data: keywordData, count: keywordData.length, mode: "keyword" });
  }

  // Semantic-only mode
  if (mode === "semantic") {
    const semanticData = await semanticSearch(sanitized, product, limit, supabase);
    if (semanticData && semanticData.length > 0) {
      const results = semanticData.map((d) => ({ ...d, snippet: null, rank: d.similarity }));
      return NextResponse.json({ data: results, count: results.length, mode: "semantic" });
    }
    // Fall back to keyword if semantic fails
    const keywordData = await keywordSearch();
    return NextResponse.json({ data: keywordData, count: keywordData.length, mode: "keyword" });
  }

  // Default: keyword-only mode
  const keywordData = await keywordSearch();
  return NextResponse.json({ data: keywordData, count: keywordData.length, mode: "keyword" });
}
