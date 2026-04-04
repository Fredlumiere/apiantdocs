/**
 * Converts JSX <Image> tags to standard Markdown ![alt](url) syntax
 * and re-downloads any remaining archbee-hosted images.
 *
 * Usage:
 *   npx tsc scripts/fix-image-tags.ts --outDir scripts/dist --esModuleInterop --module commonjs --target es2022 --moduleResolution node --skipLibCheck
 *   node scripts/dist/fix-image-tags.js
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let docsUpdated = 0;
let tagsConverted = 0;
let archbeeImagesFixed = 0;

async function downloadAndUploadImage(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, { redirect: "follow" });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    let contentType = response.headers.get("content-type") || "image/png";

    if (contentType.includes("octet-stream")) {
      if (buffer[0] === 0xFF && buffer[1] === 0xD8) contentType = "image/jpeg";
      else if (buffer[0] === 0x89 && buffer[1] === 0x50) contentType = "image/png";
      else if (buffer[0] === 0x47 && buffer[1] === 0x49) contentType = "image/gif";
      else contentType = "image/png";
    }

    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg"
      : contentType.includes("gif") ? "gif"
      : contentType.includes("svg") ? "svg"
      : contentType.includes("webp") ? "webp"
      : "png";

    const urlHash = imageUrl.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") || `img_${Date.now()}`;
    const storagePath = `docs-images/${urlHash}.${ext}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(storagePath, buffer, { contentType, upsert: true });

    if (error) return null;

    const { data } = supabase.storage.from("images").getPublicUrl(storagePath);
    return data.publicUrl;
  } catch {
    return null;
  }
}

function convertImageTags(body: string): { result: string; count: number } {
  let count = 0;

  // Match self-closing <Image ... /> and <Image ...></Image>
  const result = body.replace(
    /<Image\s+([^>]*?)(?:\/>|><\/Image>)/gi,
    (_fullMatch, attrs: string) => {
      count++;

      // Extract src
      const srcMatch = attrs.match(/src=["']([^"']+)["']/);
      const src = srcMatch?.[1] || "";

      // Extract alt if present
      const altMatch = attrs.match(/alt=["']([^"']+)["']/);
      const alt = altMatch?.[1] || "";

      // Extract title if present
      const titleMatch = attrs.match(/title=["']([^"']+)["']/);
      const title = titleMatch?.[1] || "";

      if (!src) return "";

      const titlePart = title ? ` "${title}"` : "";
      return `![${alt}](${src}${titlePart})`;
    }
  );

  return { result, count };
}

async function fixArchbeeUrls(body: string): Promise<{ result: string; count: number }> {
  let count = 0;

  // Find all remaining archbee URLs in markdown images
  const archbeeRegex = /!\[([^\]]*)\]\((https?:\/\/api\.archbee\.com[^)\s]+)(?:\s+"([^"]*)")?\)/g;
  const matches = [...body.matchAll(archbeeRegex)];

  for (const match of matches) {
    const [fullMatch, alt, url, title] = match;
    const newUrl = await downloadAndUploadImage(url);
    if (newUrl) {
      const titlePart = title ? ` "${title}"` : "";
      body = body.replace(fullMatch, `![${alt}](${newUrl}${titlePart})`);
      count++;
    }
  }

  return { result: body, count };
}

async function main() {
  console.log("=== Fix Image Tags ===\n");

  // Fetch docs with <Image tags or archbee URLs
  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, slug, body")
    .or("body.ilike.%<Image %,body.ilike.%api.archbee.com%");

  if (error || !docs) {
    console.error("Failed to fetch docs:", error?.message);
    return;
  }

  console.log(`Found ${docs.length} documents to fix\n`);

  for (const doc of docs) {
    let body = doc.body;
    let changed = false;

    // Step 1: Convert <Image> tags to markdown
    const { result: converted, count: tagCount } = convertImageTags(body);
    if (tagCount > 0) {
      body = converted;
      tagsConverted += tagCount;
      changed = true;
    }

    // Step 2: Fix remaining archbee URLs
    const { result: fixed, count: archbeeCount } = await fixArchbeeUrls(body);
    if (archbeeCount > 0) {
      body = fixed;
      archbeeImagesFixed += archbeeCount;
      changed = true;
    }

    if (changed) {
      const { error: updateError } = await supabase
        .from("documents")
        .update({ body })
        .eq("id", doc.id);

      if (updateError) {
        console.log(`  ✗ ${doc.slug}: ${updateError.message}`);
      } else {
        console.log(`  ✓ ${doc.slug} (${tagCount} tags, ${archbeeCount} archbee URLs)`);
        docsUpdated++;
      }
    }
  }

  console.log("\n=== Fix Complete ===");
  console.log(`Documents updated: ${docsUpdated}`);
  console.log(`<Image> tags converted: ${tagsConverted}`);
  console.log(`Archbee URLs re-hosted: ${archbeeImagesFixed}`);
}

main().catch(console.error);
