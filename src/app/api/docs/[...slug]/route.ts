import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireWriteAccess } from "@/lib/api-auth";
import { embedDocument } from "@/lib/embeddings";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 204 }));
}

function extractSlug(slugParts: string[]): { slug: string; action: string | null } {
  // If last segment is "embed", treat it as an action
  if (slugParts[slugParts.length - 1] === "embed") {
    return { slug: slugParts.slice(0, -1).join("/"), action: "embed" };
  }
  return { slug: slugParts.join("/"), action: null };
}

// GET /api/docs/[...slug] — get a single document
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: slugParts } = await params;
  const { slug } = extractSlug(slugParts);
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, slug, title, description, body, doc_type, product, version, sort_order, parent_id, status, created_at, updated_at, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

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
  const { slug, action } = extractSlug(slugParts);

  if (action === "embed") {
    const auth = await requireWriteAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = createServerClient();
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
  const { slug } = extractSlug(slugParts);
  const body = await request.json();
  const supabase = createServerClient();

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

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.doc_body !== undefined) updates.body = body.doc_body;
  if (body.doc_type !== undefined) updates.doc_type = body.doc_type;
  if (body.product !== undefined) updates.product = body.product;
  if (body.parent_id !== undefined) updates.parent_id = body.parent_id;
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

  return NextResponse.json({ data });
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
  const { slug } = extractSlug(slugParts);
  const supabase = createServerClient();

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
