import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireWriteAccess } from "@/lib/api-auth";
import { embedDocument } from "@/lib/embeddings";

// POST /api/docs/[slug]/embed — trigger embedding generation for a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireWriteAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { slug } = await params;
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
