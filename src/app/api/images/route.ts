import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createServerClient } from "@/lib/supabase";
import { requireWriteAccess } from "@/lib/api-auth";

/**
 * POST /api/images — upload an image to Supabase Storage.
 *
 * Raster inputs (png/jpg/jpeg/webp) are auto-resized to max 1200px wide
 * and re-encoded to WebP at quality 80 before upload — typical 80–95% size
 * reduction for screenshots. GIF and SVG pass through unchanged so animation
 * and vector data are preserved.
 *
 * All uploads set cacheControl: "31536000" — long browser/CDN cache. The
 * Supabase public-URL endpoint currently strips this from response headers,
 * but the metadata is honored by Smart CDN at the edge.
 *
 * Body: { data: string (base64), filename: string, content_type?: string }
 * Returns: { url: string }
 */
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;
const CACHE_CONTROL = "31536000";
const RASTER_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: NextRequest)
{
  const auth = await requireWriteAccess(request);
  if (!auth.authorized)
  {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body;
  try
  {
    body = await request.json();
  }
  catch
  {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, filename, content_type } = body;

  if (!data || typeof data !== "string")
  {
    return NextResponse.json({ error: "Missing 'data' (base64 encoded image)" }, { status: 400 });
  }

  if (!filename || typeof filename !== "string")
  {
    return NextResponse.json({ error: "Missing 'filename'" }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
  const inputMime = content_type || guessMimeType(filename);
  if (!allowedTypes.includes(inputMime))
  {
    return NextResponse.json(
      { error: `Unsupported image type: ${inputMime}. Allowed: ${allowedTypes.join(", ")}` },
      { status: 400 }
    );
  }

  let buffer: Buffer;
  try
  {
    const base64Data = data.replace(/^data:[^;]+;base64,/, "");
    buffer = Buffer.from(base64Data, "base64");
  }
  catch
  {
    return NextResponse.json({ error: "Invalid base64 data" }, { status: 400 });
  }

  if (buffer.length > 10 * 1024 * 1024)
  {
    return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });
  }

  // Optimize raster images: resize + WebP. Pass GIF/SVG through unchanged.
  let outputBuffer = buffer;
  let outputMime = inputMime;
  let outputExt = filename.split(".").pop()?.toLowerCase() || "png";

  if (RASTER_TYPES.has(inputMime))
  {
    try
    {
      outputBuffer = await sharp(buffer)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      outputMime = "image/webp";
      outputExt = "webp";
    }
    catch (err)
    {
      return NextResponse.json(
        { error: `Image processing failed: ${err instanceof Error ? err.message : String(err)}` },
        { status: 400 }
      );
    }
  }

  const timestamp = Date.now();
  const baseName = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `docs-images/${timestamp}-${baseName}.${outputExt}`;

  const supabase = createServerClient();
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(storagePath, outputBuffer, {
      contentType: outputMime,
      cacheControl: CACHE_CONTROL,
      upsert: false,
    });

  if (uploadError)
  {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(storagePath);

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
}

function guessMimeType(filename: string): string
{
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
