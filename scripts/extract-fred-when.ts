// Extract data-name + related attrs from Fred's ai-operability.html.
// Output: src/lib/card-metadata.ts with a CARD_METADATA record the drawer reads.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("/Users/rcyeager/appdev_root/apiant-website/ai-operability.html", "utf8");

// Match the opening tag of any element that has data-name. Attributes may appear
// in any order; grab the whole tag then pluck individual attrs.
const tagRe = /<[a-z][a-z0-9]*\b([^>]*\bdata-name=[^>]*)>/gi;

const decode = (s: string): string => s
  .replace(/&gt;/g, ">")
  .replace(/&lt;/g, "<")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&")
  .replace(/&apos;/g, "'")
  .replace(/&#39;/g, "'")
  .trim();

const pluckAttr = (attrs: string, name: string): string | undefined =>
{
  const re = new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`);
  const m = attrs.match(re);
  if (!m) return undefined;
  return decode(m[1] ?? m[2] ?? "");
};

const pluckList = (attrs: string, name: string): string[] | undefined =>
{
  const raw = pluckAttr(attrs, name);
  if (!raw) return undefined;
  const items = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return items.length ? items : undefined;
};

type Entry = {
  title?: string;
  desc?: string;
  when?: string;
  category?: string;
  mutation?: string;
  kind?: string;
  invokes?: string[];
  usedBy?: string[];
};

const out: Record<string, Entry> = {};

for (const m of src.matchAll(tagRe))
{
  const attrs = m[1];
  const name = pluckAttr(attrs, "data-name");
  if (!name) continue;
  // First occurrence wins: Fred's hidden <template id="tool-details-data"> sits
  // above the visible cards and carries richer metadata for hero tools that
  // never get their own grid card.
  if (out[name]) continue;
  const entry: Entry = {
    title: pluckAttr(attrs, "data-title"),
    desc: pluckAttr(attrs, "data-desc"),
    when: pluckAttr(attrs, "data-when"),
    category: pluckAttr(attrs, "data-category"),
    mutation: pluckAttr(attrs, "data-mutation"),
    kind: pluckAttr(attrs, "data-kind"),
    invokes: pluckList(attrs, "data-invokes"),
    usedBy: pluckList(attrs, "data-used-by"),
  };
  // Skip entries that have no useful content.
  if (!entry.when && !entry.title && !entry.invokes && !entry.usedBy) continue;
  out[name] = entry;
}

const names = Object.keys(out).sort();
console.log(`extracted ${names.length} entries`);

const lines: string[] = [];
lines.push("// AUTO-GENERATED from /Users/rcyeager/appdev_root/apiant-website/ai-operability.html");
lines.push("// by scripts/extract-fred-when.ts. Do not hand-edit; re-run the script.");
lines.push("// Source of truth is Fred's page data-* attrs on every .card and on the");
lines.push("// hidden <template id=\"tool-details-data\"> block.");
lines.push("");
lines.push("export type CardMetadata = {");
lines.push("  title?: string;");
lines.push("  desc?: string;");
lines.push("  when?: string;");
lines.push("  category?: string;");
lines.push("  mutation?: \"read\" | \"write\";");
lines.push("  kind?: \"skill\" | \"tool\";");
lines.push("  invokes?: string[];");
lines.push("  usedBy?: string[];");
lines.push("};");
lines.push("");
lines.push("export const CARD_METADATA: Record<string, CardMetadata> = {");
for (const n of names)
{
  const e = out[n];
  const safeName = JSON.stringify(n);
  lines.push(`  [${safeName}]: {`);
  if (e.title) lines.push(`    title: ${JSON.stringify(e.title)},`);
  if (e.desc) lines.push(`    desc: ${JSON.stringify(e.desc)},`);
  if (e.when) lines.push(`    when: ${JSON.stringify(e.when)},`);
  if (e.category) lines.push(`    category: ${JSON.stringify(e.category)},`);
  if (e.mutation) lines.push(`    mutation: ${JSON.stringify(e.mutation)},`);
  if (e.kind) lines.push(`    kind: ${JSON.stringify(e.kind)},`);
  if (e.invokes) lines.push(`    invokes: ${JSON.stringify(e.invokes)},`);
  if (e.usedBy) lines.push(`    usedBy: ${JSON.stringify(e.usedBy)},`);
  lines.push("  },");
}
lines.push("};");
lines.push("");

writeFileSync("/Users/rcyeager/appdev_root/apiantdocs/src/lib/card-metadata.ts", lines.join("\n"));
console.log("wrote src/lib/card-metadata.ts");
