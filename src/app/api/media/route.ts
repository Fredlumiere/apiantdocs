import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireWriteAccess } from "@/lib/api-auth";

/**
 * POST /api/media — mint a direct-to-storage upload URL for large media.
 *
 * /api/images receives base64 JSON through a serverless function, which caps
 * uploads at roughly 4.5 MB on the wire and 10 MB in code, and it only accepts
 * image types. Video and long screen-recording GIFs do not fit (issue #5).
 *
 * This route never sees the file bytes. It returns a signed upload URL for
 * the public `media` bucket and the caller PUTs the file straight to Supabase
 * Storage. The bucket enforces the type list and the 50 MB per-file cap.
 *
 * Body:    { filename: string, content_type?: string }
 * Returns: 201 { upload_url, path, public_url, content_type, max_bytes, expires_in }
 *
 * Upload:  curl -X PUT "$upload_url" \
 *            -H "Content-Type: video/mp4" \
 *            -H "Cache-Control: max-age=31536000" \
 *            --data-binary @clip.mp4
 *
 * Embed in a doc body:
 *   <video src="$public_url" controls></video>     mp4 / webm
 *   ![What the reader sees]($public_url)            gif
 *
 * The markdown renderer already handles <video> (rehype-raw is on and the
 * `video` component adds controls and the doc frame). YouTube, Vimeo, Loom and
 * Wistia iframes are also accepted; any other iframe host is dropped.
 */
const BUCKET = "media";
const MAX_BYTES = 50 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 2 * 60 * 60; // fixed by Supabase for signed upload URLs
const ALLOWED_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  gif: "image/gif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function POST(request: NextRequest)
{
  const auth = await requireWriteAccess(request);
  if (!auth.authorized)
  {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: { filename?: unknown; content_type?: unknown };
  try
  {
    body = await request.json();
  }
  catch
  {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, content_type } = body;
  if (!filename || typeof filename !== "string")
  {
    return NextResponse.json({ error: "Missing 'filename'" }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeForExt = ALLOWED_BY_EXT[ext];
  if (!mimeForExt)
  {
    return NextResponse.json(
      { error: `Unsupported media type '.${ext}'. Allowed: ${Object.keys(ALLOWED_BY_EXT).join(", ")}` },
      { status: 400 }
    );
  }
  if (content_type !== undefined && content_type !== mimeForExt)
  {
    return NextResponse.json(
      { error: `content_type '${String(content_type)}' does not match '.${ext}' (expected ${mimeForExt})` },
      { status: 400 }
    );
  }

  const timestamp = Date.now();
  const baseName = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `docs-media/${timestamp}-${baseName}.${ext}`;

  const supabase = createServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data)
  {
    return NextResponse.json(
      { error: `Could not create upload URL: ${error?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json(
    {
      upload_url: data.signedUrl,
      path: data.path,
      public_url: urlData.publicUrl,
      content_type: mimeForExt,
      max_bytes: MAX_BYTES,
      expires_in: SIGNED_URL_TTL_SECONDS,
    },
    { status: 201 }
  );
}
