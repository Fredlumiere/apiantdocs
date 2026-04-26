/**
 * Sync local Supabase docs (description + body) to a target Supabase (prod or staging).
 *
 * Compares each published doc by slug. For any doc where local differs from target,
 * UPDATEs target to match local and writes a doc_versions row for rollback.
 *
 * Usage:
 *   npx tsx scripts/sync-to-prod.ts                              # dry-run, prod target, prints diff summary
 *   npx tsx scripts/sync-to-prod.ts --commit                     # apply changes to prod
 *   npx tsx scripts/sync-to-prod.ts --target=staging --commit    # apply changes to staging (.env.staging)
 *   npx tsx scripts/sync-to-prod.ts --insert --commit            # also insert missing-on-target docs
 *   npx tsx scripts/sync-to-prod.ts --slug=foo/bar               # single doc (dry-run unless --commit)
 *   npx tsx scripts/sync-to-prod.ts --field=description          # sync description only (no insert)
 *
 * Insert behavior (--insert):
 *   - Inserts docs that exist on local but not on target, in topological order
 *     (parents before children). Lets target generate fresh UUIDs and remaps
 *     parent_id from local-id to target-id by slug lookup.
 *   - Writes a doc_versions audit row per insert (no prior body, version=0).
 *   - Embedding regen for new bodies is NOT handled here — run the embed script
 *     separately if needed.
 */

import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const insertMissing = args.includes("--insert");
const slugArg = args.find((a) => a.startsWith("--slug="));
const fieldArg = args.find((a) => a.startsWith("--field="));
const targetArg = args.find((a) => a.startsWith("--target="));
const forcedSlug = slugArg?.split("=")[1] ?? null;
const field = (fieldArg?.split("=")[1] ?? "both") as "description" | "body" | "both";
const target = (targetArg?.split("=")[1] ?? "prod") as "prod" | "staging";

if (target !== "prod" && target !== "staging") {
  throw new Error(`--target must be 'prod' or 'staging' (got '${target}')`);
}

const localEnv = loadEnv(".env.local");
const targetEnv = loadEnv(`.env.${target}`);

const local = createClient(
  localEnv.NEXT_PUBLIC_SUPABASE_URL,
  localEnv.SUPABASE_SERVICE_ROLE_KEY
);
const targetClient: SupabaseClient = createClient(
  targetEnv.NEXT_PUBLIC_SUPABASE_URL,
  targetEnv.SUPABASE_SERVICE_ROLE_KEY
);

interface Doc {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  doc_type: string | null;
  product: string | null;
  parent_id: string | null;
  sort_order: number | null;
  status: string;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
  version: number;
}

async function fetchAll(client: SupabaseClient): Promise<Doc[]> {
  const out: Doc[] = [];
  let from = 0;
  const pageSize = 500;
  while (true) {
    let q = client
      .from("documents")
      .select("id, slug, title, description, body, doc_type, product, parent_id, sort_order, status, tags, metadata, updated_at, version")
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

async function applyInserts(
  localDocs: Doc[],
  targetDocs: Doc[],
): Promise<{ inserted: number; failed: number; deferred: string[] }> {
  // Build slug→target-id map. New target IDs are added as inserts succeed.
  const targetIdBySlug = new Map<string, string>(targetDocs.map((d) => [d.slug, d.id]));
  // Local id→slug helps remap parent_id when local references local UUIDs.
  const localSlugById = new Map<string, string>(localDocs.map((d) => [d.id, d.slug]));

  // Initial pending set: locals not yet on target.
  const pending = localDocs.filter((d) => !targetIdBySlug.has(d.slug));
  console.log(`[insert] ${pending.length} docs missing on ${target}, attempting topological insert`);

  let inserted = 0;
  let failed = 0;
  let pass = 0;

  // Iterative passes: in each pass, insert any pending doc whose parent is
  // either null or already present on target. Stop when no progress is made.
  while (pending.length > 0) {
    pass++;
    const before = pending.length;
    for (let i = 0; i < pending.length; ) {
      const ld = pending[i];

      // Resolve target parent_id by walking local parent_id → local slug → target id.
      let targetParentId: string | null = null;
      if (ld.parent_id) {
        const parentSlug = localSlugById.get(ld.parent_id);
        if (!parentSlug) {
          console.log(`  [skip] ${ld.slug}: parent_id ${ld.parent_id} not found in local docs`);
          failed++;
          pending.splice(i, 1);
          continue;
        }
        const parentTargetId = targetIdBySlug.get(parentSlug);
        if (!parentTargetId) {
          // Parent not yet on target — defer to next pass.
          i++;
          continue;
        }
        targetParentId = parentTargetId;
      }

      const insertRow = {
        slug: ld.slug,
        title: ld.title,
        description: ld.description,
        body: ld.body,
        doc_type: ld.doc_type,
        product: ld.product,
        parent_id: targetParentId,
        sort_order: ld.sort_order ?? 0,
        status: ld.status,
        tags: ld.tags,
        metadata: ld.metadata,
        version: 1,
      };

      if (!commit) {
        console.log(`  [insert dry-run] ${ld.slug} (parent=${targetParentId ?? "null"})`);
        targetIdBySlug.set(ld.slug, "(dry-run)");  // pretend it's in target so children resolve
        inserted++;
        pending.splice(i, 1);
        continue;
      }

      const { data: ins, error: insErr } = await targetClient
        .from("documents")
        .insert(insertRow)
        .select("id")
        .single();
      if (insErr || !ins) {
        console.log(`  [error] insert failed for ${ld.slug}: ${insErr?.message}`);
        failed++;
        pending.splice(i, 1);
        continue;
      }

      targetIdBySlug.set(ld.slug, ins.id);

      // Audit row — version 0 = "no prior version, this is the first publish on target".
      const { error: verErr } = await targetClient.from("doc_versions").insert({
        document_id: ins.id,
        version: 0,
        title: ld.title,
        body: null,
        changed_by: `sync-to-${target}`,
        change_summary: `initial insert from local`,
      });
      if (verErr) {
        console.log(`  [warn] doc_versions insert failed for ${ld.slug}: ${verErr.message}`);
      }

      console.log(`  [insert] ${ld.slug}`);
      inserted++;
      pending.splice(i, 1);
    }

    if (pending.length === before) {
      // No progress — remaining have unresolvable parents.
      break;
    }
  }

  const deferred = pending.map((d) => d.slug);
  if (deferred.length > 0) {
    console.log(`[insert] ${deferred.length} docs could not be inserted (parent chain broken):`);
    for (const s of deferred) console.log(`  ${s}`);
  }

  return { inserted, failed, deferred };
}

async function main() {
  console.log(`[info] target=${target}  url=${targetEnv.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`[info] field=${field}  commit=${commit}  insert=${insertMissing}  slug=${forcedSlug || "*"}`);

  const [localDocs, targetDocs] = await Promise.all([fetchAll(local), fetchAll(targetClient)]);
  console.log(`[info] local=${localDocs.length} docs  ${target}=${targetDocs.length} docs`);

  const targetBySlug = new Map(targetDocs.map((d) => [d.slug, d]));

  let descChanges = 0;
  let bodyChanges = 0;
  let missingOnTarget = 0;
  let applied = 0;
  let failed = 0;

  for (const ld of localDocs) {
    const td = targetBySlug.get(ld.slug);
    if (!td) {
      missingOnTarget++;
      if (!insertMissing) console.log(`[missing-on-${target}] ${ld.slug}`);
      continue;
    }

    const patch: { description?: string | null; body?: string | null } = {};
    const descDiff = (field === "description" || field === "both") && (ld.description || "") !== (td.description || "");
    const bodyDiff = (field === "body" || field === "both") && (ld.body || "") !== (td.body || "");

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
      console.log(`\n[${ld.slug}] description changed (${(td.description || "").length} → ${(ld.description || "").length})${diffSnippet(td.description, ld.description)}`);
    }
    if (bodyDiff) {
      const oldLen = (td.body || "").length;
      const newLen = (ld.body || "").length;
      console.log(`\n[${ld.slug}] body changed (${oldLen} → ${newLen} chars)`);
    }

    if (!commit) continue;

    const { error: verErr } = await targetClient.from("doc_versions").insert({
      document_id: td.id,
      version: td.version,
      title: td.title,
      body: td.body,
      changed_by: `sync-to-${target}`,
      change_summary: `pre-sync snapshot (${changedFields})`,
    });
    if (verErr) {
      console.log(`  [warn] doc_versions insert failed: ${verErr.message}`);
    }

    const { error: upErr } = await targetClient
      .from("documents")
      .update(patch)
      .eq("id", td.id);
    if (upErr) {
      console.log(`  [error] UPDATE failed: ${upErr.message}`);
      failed++;
    } else {
      applied++;
    }
  }

  // Inserts run after updates (some inserted docs might reference parents that
  // were also just updated — order doesn't matter for parent_id since target's
  // parent UUIDs are unchanged by UPDATEs).
  let insertResult = { inserted: 0, failed: 0, deferred: [] as string[] };
  if (insertMissing) {
    insertResult = await applyInserts(localDocs, targetDocs);
  }

  console.log(`\n[summary] target=${target}`);
  console.log(`  description diffs: ${descChanges}`);
  console.log(`  body diffs:        ${bodyChanges}`);
  console.log(`  missing on target: ${missingOnTarget}`);
  console.log(`  updates applied:   ${applied}`);
  console.log(`  updates failed:    ${failed}`);
  if (insertMissing) {
    console.log(`  inserts applied:   ${insertResult.inserted}`);
    console.log(`  inserts failed:    ${insertResult.failed}`);
    console.log(`  inserts deferred:  ${insertResult.deferred.length}`);
  }
  console.log(`  committed:         ${commit}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
