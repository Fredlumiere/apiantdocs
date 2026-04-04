import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireWriteAccess } from "@/lib/api-auth";

// GET /api/docs — list documents (public: published only)
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const doc_type = searchParams.get("type");
  const product = searchParams.get("product");
  const status = searchParams.get("status") || "published";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("documents")
    .select("id, slug, title, description, doc_type, product, parent_id, sort_order, status, version, created_at, updated_at, published_at")
    .eq("status", status)
    .order("sort_order", { ascending: true })
    .range(offset, offset + limit - 1);

  if (doc_type) query = query.eq("doc_type", doc_type);
  if (product) query = query.eq("product", product);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count: data?.length || 0 });
}

// POST /api/docs — create a document (requires write access)
export async function POST(request: NextRequest) {
  const auth = await requireWriteAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const { slug, title, description, doc_body, doc_type, product, parent_id, sort_order, metadata, status } = body;

  if (!slug || !title || !doc_body || !doc_type) {
    return NextResponse.json(
      { error: "Missing required fields: slug, title, doc_body, doc_type" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("documents")
    .insert({
      slug,
      title,
      description: description || null,
      body: doc_body,
      doc_type,
      product: product || null,
      parent_id: parent_id || null,
      sort_order: sort_order || 0,
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

  return NextResponse.json({ data }, { status: 201 });
}
