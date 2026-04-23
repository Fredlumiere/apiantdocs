/**
 * Sync local Supabase docs (description + body) to prod Supabase.
 *
 * Compares each published doc by slug. For any doc where local differs from prod,
 * UPDATEs prod to match local and writes a doc_versions row for rollback.
 *
 * Usage:
 *   npx tsx scripts/sync-to-prod.ts                # dry-run, prints diff summary
 *   npx tsx scripts/sync-to-prod.ts --commit       # apply changes to prod
 *   npx tsx scripts/sync-to-prod.ts --slug=foo/bar # single doc (dry-run unless --commit)
 *   npx tsx scripts/sync-to-prod.ts --field=description  # sync description only
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file: string): Record<string, string> {
  const p = path.resolve(process.cwd(), file);
  const out: Record<string, string> = {};
  if (!fs.existsSync(p)) throw new Error(`missing ${file}`);
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const localEnv = loadEnv(".env.local");
const prodEnv = loadEnv(".env.prod");

const local = createClient(
  localEnv.NEXT_PUBLIC_SUPABASE_URL,
  localEnv.SUPABASE_SERVICE_ROLE_KEY
);
const prod = createClient(
  prodEnv.NEXT_PUBLIC_SUPABASE_URL,
  prodEnv.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const slugArg = args.find((a) => a.startsWith("--slug="));
const fieldArg = args.find((a) => a.startsWith("--field="));
const forcedSlug = slugArg?.split("=")[1] ?? null;
const field = (fieldArg?.split("=")[1] ?? "both") as "description" | "body" | "both";

interface Doc {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  updated_at: string;
  version: number;
}

async function fetchAll(client: ReturnType<typeof createClient>): Promise<Doc[]> {
  const out: Doc[] = [];
  let from = 0;
  const pageSize = 500;
  while (true) {
    let q = client
      .from("documents")
      .select("id, slug, title, description, body, updated_at, version")
      .eq("status", "published")
      .order("slug", { ascending: true })
      .range(from, from + pageSize - 1);
    if (forcedSlug) q = q.eq("slug", forcedSlug);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as Doc[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

function diffSnippet(oldVal: string | null, newVal: string | null, max = 120): string {
  const o = (oldVal || "").slice(0, max);
  const n = (newVal || "").slice(0, max);
  return `\n    OLD: ${JSON.stringify(o)}${(oldVal || "").length > max ? "…" : ""}\n    NEW: ${JSON.stringify(n)}${(newVal || "").length > max ? "…" : ""}`;
}

async function main() {
  console.log(`[info] connecting — local=${localEnv.NEXT_PUBLIC_SUPABASE_URL}  prod=${prodEnv.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`[info] field=${field}  commit=${commit}  slug=${forcedSlug || "*"}`);

  const [localDocs, prodDocs] = await Promise.all([fetchAll(local), fetchAll(prod)]);
  console.log(`[info] local=${localDocs.length} docs  prod=${prodDocs.length} docs`);

  const prodBySlug = new Map(prodDocs.map((d) => [d.slug, d]));

  let descChanges = 0;
  let bodyChanges = 0;
  let missingOnProd = 0;
  let applied = 0;
  let failed = 0;

  for (const ld of localDocs) {
    const pd = prodBySlug.get(ld.slug);
    if (!pd) {
      missingOnProd++;
      console.log(`[missing-on-prod] ${ld.slug}`);
      continue;
    }

    const patch: { description?: string | null; body?: string | null } = {};
    const descDiff = (field === "description" || field === "both") && (ld.description || "") !== (pd.description || "");
    const bodyDiff = (field === "body" || field === "both") && (ld.body || "") !== (pd.body || "");

    if (descDiff) {
      descChanges++;
      patch.description = ld.description;
    }
    if (bodyDiff) {
      bodyChanges++;
      patch.body = ld.body;
    }
    if (Object.keys(patch).length === 0) continue;

    const changedFields = Object.keys(patch).join(",");
    if (descDiff) {
      console.log(`\n[${ld.slug}] description changed (${(pd.description || "").length} → ${(ld.description || "").length})${diffSnippet(pd.description, ld.description)}`);
    }
    if (bodyDiff) {
      const oldLen = (pd.body || "").length;
      const newLen = (ld.body || "").length;
      console.log(`\n[${ld.slug}] body changed (${oldLen} → ${newLen} chars)`);
    }

    if (!commit) continue;

    // Write audit row to doc_versions
    const { error: verErr } = await prod.from("doc_versions").insert({
      document_id: pd.id,
      version: pd.version,
      title: pd.title,
      description: pd.description,
      body: pd.body,
      changed_by: "sync-to-prod",
      change_note: `pre-sync snapshot (${changedFields})`,
    });
    if (verErr) {
      console.log(`  [warn] doc_versions insert failed: ${verErr.message}`);
    }

    const { error: upErr } = await prod
      .from("documents")
      .update(patch)
      .eq("id", pd.id);
    if (upErr) {
      console.log(`  [error] UPDATE failed: ${upErr.message}`);
      failed++;
    } else {
      applied++;
    }
  }

  console.log(`\n[summary]`);
  console.log(`  description diffs: ${descChanges}`);
  console.log(`  body diffs:        ${bodyChanges}`);
  console.log(`  missing on prod:   ${missingOnProd}`);
  console.log(`  applied:           ${applied}`);
  console.log(`  failed:            ${failed}`);
  console.log(`  committed:         ${commit}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
