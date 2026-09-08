import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireWriteAccess } from "@/lib/api-auth";
import { embedDocument } from "@/lib/embeddings";
import { corsHeaders } from "@/lib/cors";
import { resolveParent, nextSortOrder, unknownFieldWarnings } from "@/lib/doc-hierarchy";

const CREATE_ALLOWED_FIELDS = [
  "slug",
  "title",
  "description",
  "doc_body",
  "doc_type",
  "product",
  "parent_id",
  "parent_slug",
  "sort_order",
  "metadata",
  "status",
  "tags",
] as const;

export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 204 }));
}

// GET /api/docs — list documents (public: published only)
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const doc_type = searchParams.get("type");
  const product = searchParams.get("product");
  const tag = searchParams.get("tag");
  const status = searchParams.get("status") || "published";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("documents")
    .select("id, slug, title, description, doc_type, product, parent_id, sort_order, tags, status, version, created_at, updated_at, published_at", { count: "exact" })
    .eq("status", status)
    .order("sort_order", { ascending: true })
    .range(offset, offset + limit - 1);

  if (doc_type) query = query.eq("doc_type", doc_type);
  if (product) query = query.eq("product", product);
  if (tag) query = query.contains("tags", [tag]);

  const { data, error, count: total } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalCount = total || 0;
  return NextResponse.json({
    data,
    count: totalCount,
    meta: {
      total: totalCount,
      limit,
      offset,
      has_more: offset + limit < totalCount,
    },
  });
}

// POST /api/docs — create a document (requires write access)
export async function POST(request: NextRequest) {
  const auth = await requireWriteAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const { slug, title, description, doc_body, doc_type, product, parent_id, parent_slug, sort_order, metadata, status, tags } = body;

  if (!slug || !title || !doc_body || !doc_type) {
    return NextResponse.json(
      { error: "Missing required fields: slug, title, doc_body, doc_type" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const warnings = unknownFieldWarnings(body, CREATE_ALLOWED_FIELDS);

  // Resolve/validate the parent when hierarchy is requested.
  let resolvedParentId: string | null = parent_id ?? null;
  let effectiveProduct: string | null = product ?? null;
  if (parent_id !== undefined || parent_slug !== undefined) {
    const resolution = await resolveParent(supabase, {
      parentIdRaw: parent_id,
      parentSlug: parent_slug,
      selfId: null,
      currentProduct: effectiveProduct,
    });
    if (resolution.error) {
      return NextResponse.json(
        { error: resolution.error.code, message: resolution.error.message },
        { status: resolution.error.status }
      );
    }
    resolvedParentId = resolution.parentId;
    if (resolution.product !== undefined) effectiveProduct = resolution.product;
  }

  // Default sort_order to append after existing siblings.
  const resolvedSortOrder =
    sort_order !== undefined ? sort_order : await nextSortOrder(supabase, resolvedParentId);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      slug,
      title,
      description: description || null,
      body: doc_body,
      doc_type,
      product: effectiveProduct,
      parent_id: resolvedParentId,
      sort_order: resolvedSortOrder,
      tags: Array.isArray(tags) ? tags : [],
      metadata: metadata || {},
      status: status || "draft",
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create initial version
  await supabase.from("doc_versions").insert({
    document_id: data.id,
    version: 1,
    title,
    body: doc_body,
    changed_by: request.headers.get("x-changed-by") || "api",
    change_summary: "Initial creation",
  });

  // Index for semantic search (Ask AI) when published. Best-effort: a failure
  // here (e.g. VOYAGE_API_KEY unset) must never fail document creation.
  if (data.status === "published") {
    try {
      await embedDocument(data.id);
    } catch (err) {
      console.error("[apiantdocs] embedDocument after create failed:", err);
    }
  }

  return NextResponse.json(
    warnings.length > 0 ? { data, warnings } : { data },
    { status: 201 }
  );
}
