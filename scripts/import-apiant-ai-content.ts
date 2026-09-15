/**
 * Import a directory of apiant.ai Markdown pages into a docs database as
 * product "apiant-ai". Frontmatter and rules: src/lib/content-import.ts.
 *
 * Usage:
 *   npx tsx scripts/import-apiant-ai-content.ts --dir=<folder> --env=.env.staging            # dry run
 *   npx tsx scripts/import-apiant-ai-content.ts --dir=<folder> --env=.env.staging --commit   # write
 *
 * Options:
 *   --status=published|draft   Status to set. Without it, new pages are drafts
 *                              and existing pages keep their status.
 *   --claim=<slug>[,<slug>]    Existing pages of another product (e.g. classic
 *                              'platform' pages) to take over: updated in place
 *                              with product apiant-ai, so they leave
 *                              info.apiant.com. Unlisted conflicts are refused.
 *
 * Behavior:
 * - Dry run by default. It reads the target (to find existing slugs and
 *   parents) and prints what it would do; nothing is written without --commit.
 * - New pages are inserted with a doc_versions row (version 1), as drafts
 *   unless --status=published.
 * - An existing apiant-ai page with the same slug (or a claimed page) gets
 *   its title, description, body, doc_type, parent, sort_order and
 *   render_mode (markdown) updated, product set to apiant-ai, version
 *   incremented and a doc_versions row written. Its status changes only with
 *   --status, so a plain re-run never unpublishes a page.
 * - A slug already used by a page of another product is refused unless
 *   claimed: slugs are unique across info.apiant.com and apiant.ai. The dry
 *   run lists pages of other products left under a claimed parent.
 * - Parents are resolved by parent_slug, from this import or the target, and
 *   must be apiant-ai pages.
 * - Embeddings are not generated. Run scripts/embed-all-docs.ts against the
 *   same database afterwards for semantic search and Ask AI.
 * - Refuses the production apiantdocs project (ref lptryjqgqoknvmzotyvz)
 *   unless --allow-prod is passed. Production imports need Fred's approval.
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { planImport, resolveActions, type TargetDoc } from "../src/lib/content-import";

const PROD_PROJECT_REF = "lptryjqgqoknvmzotyvz";

function arg(name: string): string | null {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}
const flag = (name: string) => process.argv.slice(2).includes(`--${name}`);

function loadEnv(file: string): Record<string, string> {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) throw new Error(`missing env file ${file}`);
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return out;
}

function listMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out.sort();
}

async function main() {
  const dir = arg("dir");
  const envFile = arg("env");
  const commit = flag("commit");
  const statusArg = arg("status");
  if (statusArg !== null && statusArg !== "published" && statusArg !== "draft") {
    console.error("--status must be published or draft");
    process.exit(2);
  }
  const claim = new Set((arg("claim") || "").split(",").map((x) => x.trim()).filter(Boolean));
  if (!dir || !envFile) {
    console.error("Usage: npx tsx scripts/import-apiant-ai-content.ts --dir=<folder> --env=<env file> [--status=published|draft] [--claim=<slug,...>] [--commit]");
    process.exit(2);
  }

  const env = loadEnv(envFile);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`${envFile} must define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`);
  if (url.includes(PROD_PROJECT_REF) && !flag("allow-prod")) {
    console.error(`Refusing: ${envFile} points at the production docs database (${PROD_PROJECT_REF}). Pass --allow-prod only with approval.`);
    process.exit(2);
  }

  const files = listMarkdown(path.resolve(dir)).map((file) => ({
    file: path.relative(process.cwd(), file),
    raw: fs.readFileSync(file, "utf8"),
  }));
  console.log(`[plan] ${files.length} Markdown files in ${dir}`);
  const plan = planImport(files);
  if (plan.errors.length) {
    for (const e of plan.errors) console.error(`  [invalid] ${e}`);
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const slugs = [...new Set(plan.docs.flatMap((d) => [d.slug, ...(d.parent_slug ? [d.parent_slug] : [])]))];
  const existing: (TargetDoc & { published_at: string | null })[] = [];
  for (let i = 0; i < slugs.length; i += 100) {
    const { data, error } = await supabase
      .from("documents")
      .select("id, slug, product, version, published_at")
      .in("slug", slugs.slice(i, i + 100));
    if (error) throw error;
    existing.push(...((data || []) as (TargetDoc & { published_at: string | null })[]));
  }
  const existingBySlug = new Map(existing.map((d) => [d.slug, d]));
  const actions = resolveActions(plan.docs, existingBySlug, { claim });
  for (const slug of claim) {
    if (!plan.docs.some((d) => d.slug === slug)) console.error(`  [warn] --claim=${slug} is not a page in this import; ignored`);
  }

  // A claimed page leaves info.apiant.com. Children that stay in another
  // product lose their parent there and show at the root of that sidebar.
  const claimedIds = actions.flatMap((a) => (a.kind === "update" && a.claimed ? [a.existing.id] : []));
  if (claimedIds.length) {
    const importing = new Set(plan.docs.map((d) => d.slug));
    const { data: kids, error } = await supabase
      .from("documents")
      .select("slug, product, status, parent_id")
      .in("parent_id", claimedIds);
    if (error) throw error;
    for (const k of (kids || []) as { slug: string; product: string | null; status: string }[]) {
      if (!importing.has(k.slug) && k.product !== "apiant-ai") {
        console.error(`  [warn] ${k.slug} (${k.product}, ${k.status}) stays on info.apiant.com but its parent is claimed; it will show at the root there`);
      }
    }
  }

  const idBySlug = new Map(existing.map((d) => [d.slug, d.id]));
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  for (const action of actions) {
    const { doc } = action;
    if (action.kind === "error") {
      console.error(`  [refused] ${doc.slug} (${doc.file}): ${action.message}`);
      failed++;
      continue;
    }
    const parentId = action.parentSlug ? idBySlug.get(action.parentSlug) ?? null : null;
    if (action.parentSlug && !parentId && commit) {
      console.error(`  [refused] ${doc.slug}: parent ${action.parentSlug} has no id in the target`);
      failed++;
      continue;
    }
    const fields = {
      title: doc.title,
      description: doc.description,
      body: doc.body,
      doc_type: doc.doc_type,
      product: "apiant-ai",
      render_mode: "markdown",
      parent_id: parentId,
      ...(doc.sort_order !== null ? { sort_order: doc.sort_order } : {}),
    };

    if (!commit) {
      const note = action.kind === "update" && action.claimed ? `, claims ${action.existing.product} page` : "";
      console.log(`  [${action.kind} dry-run] ${doc.slug} (parent=${action.parentSlug ?? "none"}${note}, status=${statusArg ?? (action.kind === "insert" ? "draft" : "unchanged")})`);
      if (action.kind === "insert") idBySlug.set(doc.slug, "(dry-run)");
      if (action.kind === "insert") inserted++;
      else updated++;
      continue;
    }

    if (action.kind === "insert") {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          slug: doc.slug,
          ...fields,
          status: statusArg ?? "draft",
          published_at: statusArg === "published" ? new Date().toISOString() : null,
          version: 1,
        })
        .select("id")
        .single();
      if (error || !data) {
        console.error(`  [error] insert ${doc.slug}: ${error?.message}`);
        failed++;
        continue;
      }
      idBySlug.set(doc.slug, data.id);
      await supabase.from("doc_versions").insert({
        document_id: data.id, version: 1, title: doc.title, body: doc.body,
        changed_by: "script:import-apiant-ai-content", change_summary: `Imported from ${doc.file}`,
      });
      console.log(`  [inserted] ${doc.slug}`);
      inserted++;
    } else {
      const version = (action.existing.version ?? 1) + 1;
      const prior = existingBySlug.get(doc.slug) as (TargetDoc & { published_at: string | null }) | undefined;
      const statusFields = statusArg
        ? {
            status: statusArg,
            ...(statusArg === "published" && !prior?.published_at ? { published_at: new Date().toISOString() } : {}),
          }
        : {};
      const { error } = await supabase
        .from("documents")
        .update({ ...fields, ...statusFields, version })
        .eq("id", action.existing.id);
      if (error) {
        console.error(`  [error] update ${doc.slug}: ${error.message}`);
        failed++;
        continue;
      }
      await supabase.from("doc_versions").insert({
        document_id: action.existing.id, version, title: doc.title, body: doc.body,
        changed_by: "script:import-apiant-ai-content",
        change_summary: action.claimed
          ? `Claimed from product ${action.existing.product} and imported from ${doc.file}`
          : `Re-imported from ${doc.file}`,
      });
      console.log(`  [updated] ${doc.slug} (v${version}${action.claimed ? `, was ${action.existing.product}` : ""})`);
      updated++;
    }
  }

  console.log(`[done] ${commit ? "" : "dry run: "}${inserted} insert, ${updated} update, ${failed} refused or failed`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
