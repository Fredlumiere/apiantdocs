/**
 * Archbee Migration Script
 *
 * Exports content from Archbee and imports it into apiantdocs.
 *
 * Usage:
 *   ARCHBEE_API_KEY=xxx APIANTDOCS_API_URL=http://localhost:3000 npx tsx scripts/migrate-archbee.ts
 *
 * This script:
 * 1. Fetches all spaces and docs from Archbee API
 * 2. Converts them to our document format
 * 3. Creates them via our REST API
 *
 * Archbee API docs: https://docs.archbee.com/api
 */

const ARCHBEE_API_KEY = process.env.ARCHBEE_API_KEY;
const ARCHBEE_API_URL = "https://app.archbee.com/api";
const APIANTDOCS_API_URL = process.env.APIANTDOCS_API_URL || "http://localhost:3000";
const APIANTDOCS_API_KEY = process.env.APIANTDOCS_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ARCHBEE_API_KEY) {
  console.error("Error: ARCHBEE_API_KEY environment variable is required");
  process.exit(1);
}

interface ArchbeeDoc {
  id: string;
  title: string;
  content: string;
  slug: string;
  parentId: string | null;
  spaceId: string;
  order: number;
}

interface ArchbeeSpace {
  id: string;
  name: string;
  slug: string;
}

async function archbeeFetch(path: string) {
  const response = await fetch(`${ARCHBEE_API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${ARCHBEE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Archbee API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function createDoc(doc: {
  slug: string;
  title: string;
  doc_body: string;
  doc_type: string;
  description?: string;
  product?: string;
  sort_order?: number;
  status: string;
}) {
  const response = await fetch(`${APIANTDOCS_API_URL}/api/docs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APIANTDOCS_API_KEY}`,
      "X-Changed-By": "migration:archbee",
    },
    body: JSON.stringify(doc),
  });
  return response.json();
}

function inferDocType(title: string, content: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("api") || lowerTitle.includes("endpoint") || lowerTitle.includes("reference")) {
    return "api-ref";
  }
  if (lowerTitle.includes("tutorial") || lowerTitle.includes("how to") || lowerTitle.includes("walkthrough")) {
    return "tutorial";
  }
  if (lowerTitle.includes("changelog") || lowerTitle.includes("release")) {
    return "changelog";
  }
  return "guide";
}

function inferProduct(spaceName: string, title: string): string | undefined {
  const text = `${spaceName} ${title}`.toLowerCase();
  if (text.includes("api app")) return "api-apps";
  if (text.includes("mcp") || text.includes("model context")) return "mcp";
  if (text.includes("platform") || text.includes("automation")) return "platform";
  return undefined;
}

async function migrate() {
  console.log("Starting Archbee migration...\n");

  // Step 1: Fetch all spaces
  console.log("Fetching Archbee spaces...");
  const spaces: ArchbeeSpace[] = await archbeeFetch("/spaces");
  console.log(`Found ${spaces.length} spaces\n`);

  let totalDocs = 0;
  let successDocs = 0;
  let failedDocs = 0;

  for (const space of spaces) {
    console.log(`\n--- Space: ${space.name} (${space.slug}) ---`);

    // Step 2: Fetch docs in this space
    const docs: ArchbeeDoc[] = await archbeeFetch(`/spaces/${space.id}/docs`);
    console.log(`  Found ${docs.length} documents`);

    for (const doc of docs) {
      totalDocs++;
      const slug = `${space.slug}/${doc.slug}`;
      const docType = inferDocType(doc.title, doc.content);
      const product = inferProduct(space.name, doc.title);

      try {
        const result = await createDoc({
          slug,
          title: doc.title,
          doc_body: doc.content,
          doc_type: docType,
          product,
          sort_order: doc.order,
          status: "published",
        });

        if (result.error) {
          console.log(`  ✗ ${doc.title}: ${result.error}`);
          failedDocs++;
        } else {
          console.log(`  ✓ ${doc.title} → /docs/${slug}`);
          successDocs++;
        }
      } catch (err) {
        console.log(`  ✗ ${doc.title}: ${err}`);
        failedDocs++;
      }
    }
  }

  console.log(`\n--- Migration Complete ---`);
  console.log(`Total: ${totalDocs} | Success: ${successDocs} | Failed: ${failedDocs}`);
}

migrate().catch(console.error);
