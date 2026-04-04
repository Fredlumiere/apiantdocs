/**
 * Image fix script: Re-downloads images that failed due to MIME type issues,
 * uploads them to Supabase Storage, and updates the document body.
 *
 * Usage:
 *   npx tsc scripts/fix-images.ts --outDir scripts/dist --esModuleInterop --module commonjs --target es2022 --moduleResolution node --skipLibCheck
 *   node scripts/dist/fix-images.js
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let totalImages = 0;
let uploadedImages = 0;
let failedImages = 0;
let docsUpdated = 0;

async function downloadAndUploadImage(imageUrl: string): Promise<string | null> {
  try {
    totalImages++;
    const response = await fetch(imageUrl, { redirect: "follow" });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());

    // Detect MIME type from URL extension, then magic bytes
    const urlExt = imageUrl.match(/\.(png|jpg|jpeg|gif|svg|webp)(\?|$)/i)?.[1]?.toLowerCase();
    let contentType = response.headers.get("content-type") || "image/png";

    if (contentType === "application/octet-stream" || contentType.includes("octet-stream")) {
      if (urlExt === "jpg" || urlExt === "jpeg") contentType = "image/jpeg";
      else if (urlExt === "gif") contentType = "image/gif";
      else if (urlExt === "svg") contentType = "image/svg+xml";
      else if (urlExt === "webp") contentType = "image/webp";
      else if (buffer[0] === 0xFF && buffer[1] === 0xD8) contentType = "image/jpeg";
      else if (buffer[0] === 0x89 && buffer[1] === 0x50) contentType = "image/png";
      else if (buffer[0] === 0x47 && buffer[1] === 0x49) contentType = "image/gif";
      else contentType = "image/png";
    }

    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg"
      : contentType.includes("gif") ? "gif"
      : contentType.includes("svg") ? "svg"
      : contentType.includes("webp") ? "webp"
      : "png";

    const urlHash = imageUrl.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") || `img_${totalImages}`;
    const storagePath = `docs-images/${urlHash}.${ext}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (error) {
      failedImages++;
      return null;
    }

    const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(storagePath);
    uploadedImages++;
    return publicUrl.publicUrl;
  } catch {
    failedImages++;
    return null;
  }
}

async function fixDocImages(doc: { id: string; slug: string; body: string }): Promise<boolean> {
  let body = doc.body;
  let changed = false;

  // Find all archbee and googleusercontent image URLs that haven't been rewritten yet
  const imageUrls: { original: string; fullMatch: string }[] = [];

  // Markdown images
  const mdRegex = /!\[([^\]]*)\]\((https?:\/\/(?:api\.archbee\.com|archbee-doc-uploads|lh[0-9]+\.googleusercontent)[^\s)]+)(?:\s+"([^"]*)")?\)/g;
  let match;
  while ((match = mdRegex.exec(body)) !== null) {
    imageUrls.push({ original: match[2], fullMatch: match[0] });
  }

  // HTML/JSX images
  const htmlRegex = /<(?:Image|img)[^>]*src=["'](https?:\/\/(?:api\.archbee\.com|archbee-doc-uploads|lh[0-9]+\.googleusercontent)[^"']+)["'][^>]*\/?>/gi;
  while ((match = htmlRegex.exec(body)) !== null) {
    imageUrls.push({ original: match[1], fullMatch: match[0] });
  }

  if (imageUrls.length === 0) return false;

  for (const img of imageUrls) {
    const newUrl = await downloadAndUploadImage(img.original);
    if (newUrl) {
      body = body.replace(img.original, newUrl);
      changed = true;
    }
  }

  if (changed) {
    const { error } = await supabase
      .from("documents")
      .update({ body })
      .eq("id", doc.id);

    if (error) {
      console.log(`  ✗ Failed to update ${doc.slug}: ${error.message}`);
      return false;
    }
    docsUpdated++;
    return true;
  }

  return false;
}

async function main() {
  console.log("=== Image Fix Pass ===\n");

  // Fetch all documents that still have archbee/googleusercontent image URLs
  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, slug, body")
    .or("body.ilike.%api.archbee.com%,body.ilike.%archbee-doc-uploads%,body.ilike.%googleusercontent%");

  if (error) {
    console.error("Failed to fetch docs:", error.message);
    return;
  }

  console.log(`Found ${docs?.length || 0} documents with external images to fix\n`);

  if (!docs || docs.length === 0) {
    console.log("No documents need image fixes.");
    return;
  }

  for (const doc of docs) {
    process.stdout.write(`  Fixing: ${doc.slug}...`);
    const fixed = await fixDocImages(doc);
    console.log(fixed ? " ✓" : " (no changes)");
  }

  console.log("\n=== Image Fix Complete ===");
  console.log(`Documents updated: ${docsUpdated}`);
  console.log(`Images: ${uploadedImages} uploaded / ${failedImages} failed / ${totalImages} total`);
}

main().catch(console.error);
