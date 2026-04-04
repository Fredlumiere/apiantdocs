/**
 * Migration script: Archbee MDX export → apiantdocs
 *
 * Reads all .mdx files from the export directory, parses frontmatter,
 * builds the doc tree, downloads images, rewrites URLs, and imports
 * into the apiantdocs API.
 *
 * Usage:
 *   npx tsx scripts/migrate-from-export.ts
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

const EXPORT_DIR = path.join(process.cwd(), "migration2");
const API_URL = process.env.APIANTDOCS_API_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Stats
let totalFiles = 0;
let successFiles = 0;
let failedFiles = 0;
let totalImages = 0;
let downloadedImages = 0;

interface DocEntry {
  filePath: string;
  relativePath: string;
  title: string;
  slug: string;
  archbeeSlug: string;
  description: string | null;
  body: string;
  parentSlug: string | null;
  sortOrder: number;
  depth: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Convert a file path to a URL-safe slug
 */
function pathToSlug(relativePath: string): string {
  return relativePath
    .replace(/\.mdx$/, "")
    .replace(/[_ ]+/g, "-")
    .replace(/[→]/g, "to")
    .replace(/[^a-zA-Z0-9\-\/]/g, "")
    .replace(/--+/g, "-")
    .replace(/-\//g, "/")
    .replace(/\/-/g, "/")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Infer product from the doc title/path
 */
function inferProduct(title: string, relativePath: string): string | null {
  const text = `${title} ${relativePath}`.toLowerCase();
  if (text.includes("crmconnect") || text.includes("shopconnect") || text.includes("calendarconnect") || text.includes("mailconnect") || text.includes("zoomconnect") || text.includes("appconnect")) {
    return "api-apps";
  }
  if (text.includes("assembly editor") || text.includes("apiant for builders") || text.includes("apiant inline")) {
    return "platform";
  }
  if (text.includes("automation editor")) {
    return "platform";
  }
  if (text.includes("mcp")) {
    return "mcp";
  }
  return null;
}

/**
 * Infer doc type from title/content
 */
function inferDocType(title: string, body: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("changelog") || lowerTitle.includes("release") || lowerTitle.includes("version") || lowerTitle.includes("enhancement")) {
    return "changelog";
  }
  if (lowerTitle.includes("how to") || lowerTitle.includes("setup") || lowerTitle.includes("getting started") || lowerTitle.includes("tutorial")) {
    return "tutorial";
  }
  if (lowerTitle.includes("api") || lowerTitle.includes("endpoint") || lowerTitle.includes("reference")) {
    return "api-ref";
  }
  return "guide";
}

/**
 * Download an image and upload to Supabase Storage
 */
async function downloadAndUploadImage(imageUrl: string): Promise<string | null> {
  try {
    totalImages++;
    const response = await fetch(imageUrl, { redirect: "follow" });
    if (!response.ok) {
      console.log(`    ⚠ Failed to download: ${imageUrl} (${response.status})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Detect MIME type from URL extension first, then response header, then magic bytes
    const urlExt = imageUrl.match(/\.(png|jpg|jpeg|gif|svg|webp)(\?|$)/i)?.[1]?.toLowerCase();
    let contentType = response.headers.get("content-type") || "image/png";

    // If server returns octet-stream, detect from URL or file magic bytes
    if (contentType === "application/octet-stream" || contentType.includes("octet-stream")) {
      if (urlExt === "jpg" || urlExt === "jpeg") contentType = "image/jpeg";
      else if (urlExt === "gif") contentType = "image/gif";
      else if (urlExt === "svg") contentType = "image/svg+xml";
      else if (urlExt === "webp") contentType = "image/webp";
      else if (buffer[0] === 0xFF && buffer[1] === 0xD8) contentType = "image/jpeg";
      else if (buffer[0] === 0x89 && buffer[1] === 0x50) contentType = "image/png";
      else if (buffer[0] === 0x47 && buffer[1] === 0x49) contentType = "image/gif";
      else contentType = "image/png"; // default fallback
    }

    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg"
      : contentType.includes("gif") ? "gif"
      : contentType.includes("svg") ? "svg"
      : contentType.includes("webp") ? "webp"
      : "png";

    // Generate a unique filename from the URL
    const urlHash = imageUrl.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") || `img_${totalImages}`;
    const storagePath = `docs-images/${urlHash}.${ext}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.log(`    ⚠ Upload failed: ${error.message}`);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from("images")
      .getPublicUrl(storagePath);

    downloadedImages++;
    return publicUrl.publicUrl;
  } catch (err) {
    console.log(`    ⚠ Image error: ${err}`);
    return null;
  }
}

/**
 * Rewrite image URLs in markdown content
 */
async function rewriteImages(body: string): Promise<string> {
  // Match markdown images: ![alt](url) and ![alt](url "title")
  const mdImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  const matches = [...body.matchAll(mdImageRegex)];

  for (const match of matches) {
    const [fullMatch, alt, url, title] = match;
    if (url.includes("archbee") || url.includes("googleusercontent")) {
      const newUrl = await downloadAndUploadImage(url);
      if (newUrl) {
        const titlePart = title ? ` "${title}"` : "";
        body = body.replace(fullMatch, `![${alt}](${newUrl}${titlePart})`);
      }
    }
  }

  // Match HTML/JSX images: <Image src="..." /> and <img src="..." />
  const htmlImageRegex = /<(?:Image|img)[^>]*src=["']([^"']+)["'][^>]*\/?>/gi;
  const htmlMatches = [...body.matchAll(htmlImageRegex)];

  for (const match of htmlMatches) {
    const [fullMatch, url] = match;
    if (url.includes("archbee") || url.includes("googleusercontent")) {
      const newUrl = await downloadAndUploadImage(url);
      if (newUrl) {
        body = body.replace(fullMatch, fullMatch.replace(url, newUrl));
      }
    }
  }

  return body;
}

/**
 * Recursively scan the export directory and build doc entries
 */
function scanDirectory(dir: string, basePath: string = ""): DocEntry[] {
  const entries: DocEntry[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  // Sort: files first (by name), then directories
  const files = items.filter((i) => i.isFile() && i.name.endsWith(".mdx")).sort((a, b) => a.name.localeCompare(b.name));
  const dirs = items.filter((i) => i.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));

  let sortOrder = 0;

  for (const file of files) {
    const filePath = path.join(dir, file.name);
    const relativePath = basePath ? `${basePath}/${file.name}` : file.name;
    let raw = fs.readFileSync(filePath, "utf-8");

    // Fix unquoted YAML values with colons (e.g., "title: CRMConnect: Mindbody → HubSpot")
    const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const fixedFm = frontmatterMatch[1].replace(
        /^(title|description|slug|docTags):[ ]*(.+)$/gm,
        (_, key, value) => {
          // Quote the value if it contains colons and isn't already quoted
          if (value.includes(":") && !value.startsWith('"') && !value.startsWith("'")) {
            return `${key}: "${value.replace(/"/g, '\\"')}"`;
          }
          return `${key}: ${value}`;
        }
      );
      raw = raw.replace(frontmatterMatch[1], fixedFm);
    }

    const { data: frontmatter, content } = matter(raw);

    const title = frontmatter.title || file.name.replace(/\.mdx$/, "").replace(/_/g, " ");
    const slug = pathToSlug(relativePath);
    const parentSlug = basePath ? pathToSlug(basePath + ".mdx") : null;
    const depth = relativePath.split("/").length - 1;

    entries.push({
      filePath,
      relativePath,
      title,
      slug,
      archbeeSlug: frontmatter.slug || "",
      description: frontmatter.description?.substring(0, 500) || null,
      body: content.trim(),
      parentSlug,
      sortOrder: sortOrder++,
      depth,
      createdAt: frontmatter.createdAt || null,
      updatedAt: frontmatter.updatedAt || null,
    });
  }

  for (const subdir of dirs) {
    const subdirPath = path.join(dir, subdir.name);
    const subdirBasePath = basePath ? `${basePath}/${subdir.name}` : subdir.name;
    const childEntries = scanDirectory(subdirPath, subdirBasePath);
    entries.push(...childEntries);
  }

  return entries;
}

/**
 * Build the old Archbee URL → new slug redirect map
 */
function buildRedirectMap(entries: DocEntry[]): Record<string, string> {
  const redirects: Record<string, string> = {};

  for (const entry of entries) {
    // Map from info.apiant.com slug (from frontmatter) to new slug
    if (entry.archbeeSlug) {
      // Archbee slugs look like "NhcF-what-is-apiant" — the part after the ID prefix is the URL slug
      const archbeePath = entry.archbeeSlug.replace(/^[A-Za-z0-9_-]+-/, "");
      if (archbeePath) {
        redirects[`/${archbeePath}`] = `/docs/${entry.slug}`;
      }
      // Also map the full archbee slug
      redirects[`/${entry.archbeeSlug}`] = `/docs/${entry.slug}`;
    }

    // Also create a direct title-based redirect matching info.apiant.com URL style
    const titleSlug = entry.title
      .toLowerCase()
      .replace(/[→]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (titleSlug) {
      redirects[`/${titleSlug}`] = `/docs/${entry.slug}`;
    }
  }

  return redirects;
}

/**
 * Create a document via the API
 */
async function createDoc(doc: {
  slug: string;
  title: string;
  doc_body: string;
  doc_type: string;
  description?: string | null;
  product?: string | null;
  parent_id?: string | null;
  sort_order: number;
  status: string;
}): Promise<{ data?: { id: string }; error?: string }> {
  const response = await fetch(`${API_URL}/api/docs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "X-Changed-By": "migration:archbee-export",
    },
    body: JSON.stringify(doc),
  });
  return response.json();
}

async function main() {
  console.log("=== Archbee Export Migration ===\n");
  console.log(`Export directory: ${EXPORT_DIR}`);
  console.log(`Target API: ${API_URL}\n`);

  // Ensure Supabase storage bucket exists
  const { error: bucketError } = await supabase.storage.createBucket("images", {
    public: true,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/svg+xml", "image/webp"],
  });
  if (bucketError && !bucketError.message.includes("already exists")) {
    console.error("Failed to create storage bucket:", bucketError.message);
  }

  // Step 1: Scan all files
  console.log("Step 1: Scanning export directory...");
  const entries = scanDirectory(EXPORT_DIR);
  totalFiles = entries.length;
  console.log(`Found ${totalFiles} documents\n`);

  // Step 2: Import documents (parent docs first, then children)
  console.log("Step 2: Importing documents...\n");

  // Sort by depth so parents are created before children
  entries.sort((a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder);

  // Track slug → id mapping for parent references
  const slugToId: Record<string, string> = {};

  for (const entry of entries) {
    totalFiles = entries.length;
    const product = inferProduct(entry.title, entry.relativePath);
    const docType = inferDocType(entry.title, entry.body);

    // Rewrite images
    console.log(`  Processing: ${entry.title}`);
    const body = await rewriteImages(entry.body);

    // Resolve parent ID
    const parentId = entry.parentSlug ? slugToId[entry.parentSlug] || null : null;

    const result = await createDoc({
      slug: entry.slug,
      title: entry.title,
      doc_body: body || "(empty document)",
      doc_type: docType,
      description: entry.description,
      product,
      parent_id: parentId,
      sort_order: entry.sortOrder,
      status: "published",
    });

    if (result.error) {
      console.log(`    ✗ ${result.error}`);
      failedFiles++;
    } else {
      console.log(`    ✓ → /docs/${entry.slug}`);
      if (result.data?.id) {
        slugToId[entry.slug] = result.data.id;
      }
      successFiles++;
    }
  }

  // Step 3: Generate redirect map
  console.log("\nStep 3: Generating redirect map...");
  const redirects = buildRedirectMap(entries);
  const redirectEntries = Object.entries(redirects)
    .map(([source, destination]) => `    { source: "${source}", destination: "${destination}", permanent: true }`)
    .join(",\n");

  const redirectConfig = `
// Auto-generated redirect map from Archbee migration
// Add this to your next.config.ts redirects() function
export const archbeeRedirects = [
${redirectEntries}
];
`;

  const redirectPath = path.join(process.cwd(), "src/lib/archbee-redirects.ts");
  fs.writeFileSync(redirectPath, redirectConfig);
  console.log(`Written ${Object.keys(redirects).length} redirects to ${redirectPath}`);

  // Summary
  console.log("\n=== Migration Complete ===");
  console.log(`Documents: ${successFiles} success / ${failedFiles} failed / ${entries.length} total`);
  console.log(`Images: ${downloadedImages} downloaded / ${totalImages} total`);
  console.log(`Redirects: ${Object.keys(redirects).length} generated`);
}

main().catch(console.error);
