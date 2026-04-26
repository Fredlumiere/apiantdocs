// Find pages where the page subtitle (description) and the body's first sentence
// overlap by 3+ consecutive non-trivial words anywhere — catches verbatim openers
// AND semantic restatements like "Operating in production is what comes after..."
// when the description starts with "What comes after...".
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file: string): Record<string, string> {
  const p = path.resolve(process.cwd(), file);
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function firstParagraph(body: string | null): string {
  if (!body) return "";
  const para = body.split(/\n\n+/).find((p) => p.trim() && !p.startsWith("##")) || "";
  return para.replace(/\n/g, " ").trim();
}

const STOP = new Set([
  "a","an","the","of","to","in","on","at","for","is","are","be","by","with","from",
  "and","or","but","as","that","this","it","its","you","your","not","no","do","does",
  "what","when","where","how","why","which","who","then","than","so","up","out","into",
  "we","i","they","their","our","my","me","him","her","he","she","them","us"
]);

function tokens(s: string): string[] {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function contentTokens(s: string): string[] {
  return tokens(s).filter((t) => !STOP.has(t) && t.length > 1);
}

// Find any 3-gram from `aTokens` that also appears in `bTokens`
function findOverlap(aTokens: string[], bTokens: string[]): string | null {
  if (aTokens.length < 3 || bTokens.length < 3) return null;
  const bSet = new Set<string>();
  for (let i = 0; i + 2 < bTokens.length; i++) {
    bSet.add(bTokens.slice(i, i + 3).join(" "));
  }
  for (let i = 0; i + 2 < aTokens.length; i++) {
    const ngram = aTokens.slice(i, i + 3).join(" ");
    if (bSet.has(ngram)) return ngram;
  }
  return null;
}

const env = loadEnv(".env.local");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: docs } = await sb
    .from("documents")
    .select("slug, description, body")
    .eq("product", "platform");
  if (!docs) return;

  for (const d of docs as any[]) {
    if (!d.description || !d.body) continue;
    const fp = firstParagraph(d.body);
    if (!fp) continue;

    const descContent = contentTokens(d.description);
    const bodyContent = contentTokens(fp);
    const overlap = findOverlap(descContent, bodyContent);
    if (!overlap) continue;

    console.log(`\n${d.slug}`);
    console.log(`  desc: ${d.description}`);
    console.log(`  body: ${fp}`);
    console.log(`  overlap 3-gram: "${overlap}"`);
  }
})();
