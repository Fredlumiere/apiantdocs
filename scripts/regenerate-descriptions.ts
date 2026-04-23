import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Minimal .env.local loader (no dotenv dep in this project)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase env");
if (!ANTHROPIC_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// CLI: --limit N (default 5), --commit (actually UPDATE), --slug foo (single doc)
const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 5;
const commit = args.includes("--commit");
const slugArg = args.find((a) => a.startsWith("--slug="));
const forcedSlug = slugArg ? slugArg.split("=")[1] : null;

const SYSTEM_PROMPT = `You write concise documentation descriptions for the APIANT platform docs site.

HARD RULES (non-negotiable):
- Output length MUST be 120-170 characters. Count your characters. If your draft is over 170, rewrite shorter.
- End in a period.
- Plain prose. No markdown, no URLs, no HTML, no quotes around the output.
- Lead with what the page covers. Never start with "Learn how to", "Discover", "Find out".
- Be specific about the feature/concept. Do not say "this document", "this guide", or restate the title.

Respond with ONLY the description text, nothing else.`;

async function regenerateDescription(title: string, body: string): Promise<string> {
  const bodySample = (body || "").slice(0, 3000);
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Title: ${title}\n\nBody (first 3000 chars):\n${bodySample}\n\nWrite the description.`,
      },
    ],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
  return text.replace(/^["']|["']$/g, "");
}

function validate(desc: string): string | null {
  if (desc.length < 60) return `too short (${desc.length} chars)`;
  if (desc.length > 240) return `too long (${desc.length} chars)`;
  if (!/[.!?]$/.test(desc)) return "no ending punctuation";
  if (/\*\*|__|\[.*\]\(|<[a-z]/i.test(desc)) return "contains markdown/html";
  return null;
}

async function main() {
  let query = supabase
    .from("documents")
    .select("id, slug, title, description, body")
    .eq("status", "published");

  if (forcedSlug) {
    query = query.eq("slug", forcedSlug);
  } else {
    // Truncated heuristic: length 200-270, ends lowercase (mid-word)
    query = query
      .not("description", "is", null)
      .gte("description", "")
      .order("slug", { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw error;

  const candidates = (data || []).filter((d) => {
    if (forcedSlug) return true;
    const desc = d.description || "";
    return desc.length >= 200 && desc.length <= 270 && /[a-z]$/.test(desc);
  });

  const batch = candidates.slice(0, limit);
  console.log(`[info] ${candidates.length} total candidates; processing ${batch.length}. commit=${commit}`);

  let ok = 0;
  let failed = 0;
  for (const doc of batch) {
    try {
      const newDesc = await regenerateDescription(doc.title, doc.body || "");
      const err = validate(newDesc);
      if (err) {
        console.log(`[skip] ${doc.slug} — ${err}\n        got: ${newDesc}`);
        failed++;
        continue;
      }
      console.log(`\n[${doc.slug}]`);
      console.log(`  OLD (${(doc.description || "").length}): ${doc.description}`);
      console.log(`  NEW (${newDesc.length}): ${newDesc}`);
      if (commit) {
        const { error: upErr } = await supabase
          .from("documents")
          .update({ description: newDesc })
          .eq("id", doc.id);
        if (upErr) {
          console.log(`  [error] UPDATE failed: ${upErr.message}`);
          failed++;
        } else {
          ok++;
        }
      } else {
        ok++;
      }
    } catch (e) {
      console.log(`[error] ${doc.slug}: ${(e as Error).message}`);
      failed++;
    }
  }
  console.log(`\n[done] ok=${ok} failed=${failed} committed=${commit}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
