import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireWriteAccess, validateSession } from "@/lib/api-auth";
import { embedDocument } from "@/lib/embeddings";
import { corsHeaders } from "@/lib/cors";
import { resolveParent, unknownFieldWarnings } from "@/lib/doc-hierarchy";
import { resolveSlugAction } from "@/lib/doc-slug";
import { siteProduct } from "@/lib/site";

const UPDATE_ALLOWED_FIELDS = [
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
  "change_summary",
] as const;

export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 204 }));
}

// GET /api/docs/[...slug] — get a single document or versions
// Public: published only. Authenticated: any status (add ?any_status=true)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: slugParts } = await params;
  const supabase = createServerClient();
  const { slug, action } = await resolveSlugAction(supabase, slugParts);

  // GET /api/docs/[slug]/versions — version history (requires auth)
  if (action === "versions") {
    const session = await validateSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // First get doc ID by slug
    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { data: versions, error } = await supabase
      .from("doc_versions")
      .select("id, version, title, changed_by, change_summary, created_at")
      .eq("document_id", doc.id)
      .order("version", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: versions || [] });
  }

  const { searchParams } = new URL(request.url);
  const anyStatus = searchParams.get("any_status") === "true";

  let query = supabase
    .from("documents")
    .select("id, slug, title, description, body, doc_type, product, tags, version, sort_order, parent_id, status, created_at, updated_at, published_at")
    .eq("slug", slug);

  // Only allow fetching non-published docs if authenticated
  if (anyStatus) {
    const session = await validateSession(request);
    if (!session) {
      query = query.eq("status", "published");
    }
  } else {
    query = query.eq("status", "published");
  }

  // apiant-ai zone: only its own pages. Classic mode reads every product,
  // because writer agents read back pages of any product through this API.
  const scopedProduct = siteProduct();
  if (scopedProduct) query = query.eq("product", scopedProduct);

  const { data, error } = await query.single();

  if (error || !data) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// POST /api/docs/[...slug] — either embed or other actions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: slugParts } = await params;
  const supabase = createServerClient();
  const { slug, action } = await resolveSlugAction(supabase, slugParts);

  if (action === "embed") {
    const auth = await requireWriteAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { data: doc } = await supabase
      .from("documents")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const result = await embedDocument(doc.id);
    return NextResponse.json({
      success: true,
      document_id: doc.id,
      chunks: result.chunks,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// PATCH /api/docs/[...slug] — update a document (requires write access)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const auth = await requireWriteAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { slug: slugParts } = await params;
  const body = await request.json();
  const supabase = createServerClient();
  const { slug } = await resolveSlugAction(supabase, slugParts);

  const { data: existing } = await supabase
    .from("documents")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Check slug uniqueness if renaming
  if (body.slug !== undefined && body.slug !== existing.slug) {
    const { data: conflict } = await supabase
      .from("documents")
      .select("id")
      .eq("slug", body.slug)
      .single();
    if (conflict) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
  }

  const warnings = unknownFieldWarnings(body, UPDATE_ALLOWED_FIELDS);

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.doc_body !== undefined) updates.body = body.doc_body;
  if (body.doc_type !== undefined) updates.doc_type = body.doc_type;
  if (body.product !== undefined) updates.product = body.product;

  // Resolve/validate the parent when a reparent is requested. An explicit
  // parent_id (including null) or a parent_slug triggers resolution; omitting
  // both leaves the current parent unchanged (backward compatible).
  if (body.parent_id !== undefined || body.parent_slug !== undefined) {
    const currentProduct =
      body.product !== undefined ? body.product : existing.product;
    const resolution = await resolveParent(supabase, {
      parentIdRaw: body.parent_id,
      parentSlug: body.parent_slug,
      selfId: existing.id,
      currentProduct,
    });
    if (resolution.error) {
      return NextResponse.json(
        { error: resolution.error.code, message: resolution.error.message },
        { status: resolution.error.status }
      );
    }
    updates.parent_id = resolution.parentId;
    if (resolution.product !== undefined) updates.product = resolution.product;
  }

  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.metadata !== undefined) updates.metadata = body.metadata;
  if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags : [];
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === "published" && !existing.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }
  if (body.slug !== undefined) updates.slug = body.slug;

  const newVersion = body.doc_body !== undefined ? existing.version + 1 : existing.version;
  updates.version = newVersion;

  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.doc_body !== undefined) {
    await supabase.from("doc_versions").insert({
      document_id: existing.id,
      version: newVersion,
      title: body.title || existing.title,
      body: body.doc_body,
      changed_by: request.headers.get("x-changed-by") || "api",
      change_summary: body.change_summary || null,
    });
  }

  // Re-index for semantic search (Ask AI) when the body changed or the doc
  // just became published. Best-effort: never fail the update.
  const nowPublished = (data.status ?? existing.status) === "published";
  if (nowPublished && (body.doc_body !== undefined || body.status === "published")) {
    try {
      await embedDocument(existing.id);
    } catch (err) {
      console.error("[apiantdocs] embedDocument after update failed:", err);
    }
  }

  return NextResponse.json(warnings.length > 0 ? { data, warnings } : { data });
}

// DELETE /api/docs/[...slug] — delete a document (requires write access)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const auth = await requireWriteAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { slug: slugParts } = await params;
  const supabase = createServerClient();
  const { slug } = await resolveSlugAction(supabase, slugParts);

  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("slug", slug)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
