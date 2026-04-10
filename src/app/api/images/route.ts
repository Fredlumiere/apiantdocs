import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireWriteAccess } from "@/lib/api-auth";

/**
 * POST /api/images — upload an image to Supabase Storage
 * Body: { data: string (base64), filename: string, content_type?: string }
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  const auth = await requireWriteAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, filename, content_type } = body;

  if (!data || typeof data !== "string") {
    return NextResponse.json({ error: "Missing 'data' (base64 encoded image)" }, { status: 400 });
  }

  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "Missing 'filename'" }, { status: 400 });
  }

  // Validate content type
  const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
  const mimeType = content_type || guessMimeType(filename);
  if (!allowedTypes.includes(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${mimeType}. Allowed: ${allowedTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // Decode base64
  let buffer: Buffer;
  try {
    // Strip data URL prefix if present (e.g. "data:image/png;base64,...")
    const base64Data = data.replace(/^data:[^;]+;base64,/, "");
    buffer = Buffer.from(base64Data, "base64");
  } catch {
    return NextResponse.json({ error: "Invalid base64 data" }, { status: 400 });
  }

  // 10MB limit
  if (buffer.length > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });
  }

  // Generate storage path with timestamp to avoid collisions
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `docs-images/${timestamp}-${safeName}`;

  const supabase = createServerClient();
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(storagePath);

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return map[ext || ""] || "image/png";
}
