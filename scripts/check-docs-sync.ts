/**
 * check-docs-sync.ts — Verify plugin skills + MCP tools stay in sync with docs.
 *
 * Usage:
 *   npx tsx scripts/check-docs-sync.ts            # report drift, exit 1 if any
 *   npx tsx scripts/check-docs-sync.ts --fix      # regenerate desc= on SkillCards from SKILL.md
 *   npx tsx scripts/check-docs-sync.ts --tools    # only MCP tool catalog check
 *   npx tsx scripts/check-docs-sync.ts --skills   # only skills index check
 *
 * Data sources:
 *   - Plugin:  /Users/rcyeager/appdev_root/apiant-claude-plugin/skills/*\/SKILL.md
 *   - Skills doc (Supabase local):  documents row where slug='reference/skills-index'
 *   - MCP servlets:  /Users/rcyeager/appdev_root/appServer/appServer/ServletMCP{Automation,Assembly}Assistant.java
 *   - Node proxy:    /Users/rcyeager/appdev_root/appUI/appNodeJS/MCP_server/server.js  (activate_toolset, VALID_TOOLSETS)
 *   - Tools doc:     documents row where slug='reference/mcp-tools'
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";
import { readFileSync as fsReadFileSync, existsSync as fsExistsSync } from "node:fs";
import { resolve as pathResolve } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PLUGIN_SKILLS_DIR = "/Users/rcyeager/appdev_root/apiant-claude-plugin/skills";
const AUTOMATION_SERVLET = "/Users/rcyeager/appdev_root/appServer/appServer/ServletMCPAutomationAssistant.java";
const ASSEMBLY_SERVLET = "/Users/rcyeager/appdev_root/appServer/appServer/ServletMCPAssemblyAssistant.java";
const NODE_PROXY = "/Users/rcyeager/appdev_root/appUI/appNodeJS/MCP_server/server.js";

// Load Supabase creds from .env.local if present, falling back to env vars.
// Mirrors sync-to-prod.ts so secrets stay out of source control.
function loadEnvFile(file: string): Record<string, string>
{
  const p = pathResolve(process.cwd(), file);
  const out: Record<string, string> = {};
  if (!fsExistsSync(p)) return out;
  for (const line of fsReadFileSync(p, "utf8").split("\n"))
  {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const localEnv = loadEnvFile(".env.local");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_SERVICE_KEY)
{
  throw new Error("SUPABASE_SERVICE_ROLE_KEY missing — set in env or .env.local");
}

const SKILLS_SLUG = "reference/skills-index";
const TOOLS_SLUG = "reference/mcp-tools";

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

const USE_COLOR = process.stdout.isTTY;
const c = {
  red:    (s: string) => USE_COLOR ? `\x1b[31m${s}\x1b[0m` : s,
  green:  (s: string) => USE_COLOR ? `\x1b[32m${s}\x1b[0m` : s,
  yellow: (s: string) => USE_COLOR ? `\x1b[33m${s}\x1b[0m` : s,
  cyan:   (s: string) => USE_COLOR ? `\x1b[36m${s}\x1b[0m` : s,
  bold:   (s: string) => USE_COLOR ? `\x1b[1m${s}\x1b[0m` : s,
  dim:    (s: string) => USE_COLOR ? `\x1b[2m${s}\x1b[0m` : s,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PluginSkill = {
  name: string;          // folder name, e.g. "build-automation"
  command: string;       // e.g. "/build-automation"
  title: string;         // from "# /name — Title"
  description: string;   // from YAML frontmatter
  path: string;
};

type DocSkillCard = {
  name: string;
  title: string;
  desc: string;
  raw: string;           // full original <SkillCard ... /> block
  descIsTemplate: boolean; // true if `desc={\`...\`}`
  startIdx: number;
  endIdx: number;
};

type ServletTool = {
  name: string;
  toolset: string;
};

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

function supabase()
{
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

async function loadDocBody(slug: string): Promise<{ body: string; description: string | null }>
{
  const sb = supabase();
  const { data, error } = await sb
    .from("documents")
    .select("body, description")
    .eq("slug", slug)
    .single();

  if (error || !data)
  {
    throw new Error(`Failed to load doc ${slug}: ${error?.message ?? "no row"}`);
  }

  return { body: data.body as string, description: (data.description as string | null) ?? null };
}

async function saveDocBody(slug: string, body: string): Promise<void>
{
  const sb = supabase();
  const { error } = await sb
    .from("documents")
    .update({ body })
    .eq("slug", slug);

  if (error)
  {
    throw new Error(`Failed to save doc ${slug}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Plugin skills reader
// ---------------------------------------------------------------------------

function readPluginSkills(): PluginSkill[]
{
  const out: PluginSkill[] = [];
  const entries = readdirSync(PLUGIN_SKILLS_DIR);

  for (const entry of entries)
  {
    const skillPath = join(PLUGIN_SKILLS_DIR, entry, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    const stat = statSync(skillPath);
    if (!stat.isFile()) continue;

    const raw = readFileSync(skillPath, "utf8");
    const parsed = matter(raw);
    const description = typeof parsed.data.description === "string"
      ? parsed.data.description.trim()
      : "";

    // First H1 line: "# /name — Title" or "# /name - Title"
    let title = "";
    const h1 = parsed.content.split("\n").find((l) => l.startsWith("# "));
    if (h1)
    {
      // strip leading "# " and the "/name — " prefix
      const rest = h1.slice(2).trim();
      const dashIdx = rest.search(/[—–-]\s/);
      if (dashIdx > 0)
      {
        title = rest.slice(dashIdx + 1).trim().replace(/^[—–-]\s*/, "");
      }
      else
      {
        title = rest;
      }
    }

    out.push({
      name: entry,
      command: `/${entry}`,
      title,
      description,
      path: skillPath,
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// SkillCard parser for MDX body
// ---------------------------------------------------------------------------

// Regex that matches a full <SkillCard ... /> block. JSX attributes can be
// `attr="..."` (double-quote string) or `attr={`...`}` (template literal).
const SKILLCARD_RE = /<SkillCard\s+([\s\S]*?)\/>/g;

function parseSkillCards(body: string): DocSkillCard[]
{
  const out: DocSkillCard[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(SKILLCARD_RE.source, "g");

  while ((m = re.exec(body)) !== null)
  {
    const attrsBlob = m[1];
    const name = extractAttr(attrsBlob, "name") ?? "";
    const title = extractAttr(attrsBlob, "title") ?? "";
    const descRaw = extractDescAttr(attrsBlob);

    out.push({
      name,
      title,
      desc: descRaw.value,
      descIsTemplate: descRaw.isTemplate,
      raw: m[0],
      startIdx: m.index,
      endIdx: m.index + m[0].length,
    });
  }

  return out;
}

// Extract a plain string attribute (double-quote form).
function extractAttr(blob: string, attr: string): string | null
{
  const re = new RegExp(`${attr}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const m = re.exec(blob);
  if (!m) return null;
  return m[1];
}

// Extract desc, which may be either `desc="..."` or `desc={`...`}`.
function extractDescAttr(blob: string): { value: string; isTemplate: boolean }
{
  // template literal form first
  const tpl = /desc\s*=\s*\{\s*`((?:[^`\\]|\\.)*)`\s*\}/.exec(blob);
  if (tpl)
  {
    return { value: tpl[1], isTemplate: true };
  }

  const plain = /desc\s*=\s*"((?:[^"\\]|\\.)*)"/.exec(blob);
  if (plain)
  {
    return { value: plain[1], isTemplate: false };
  }

  return { value: "", isTemplate: false };
}

// Normalize a description string for drift comparison.
function normDesc(s: string): string
{
  return s
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, ""); // ignore punctuation-only tail
}

// Render a SkillCard attribute value. Picks template-literal form when the
// desc contains a `"` character; otherwise uses plain double-quote form.
function renderDescAttr(desc: string): { attr: string; isTemplate: boolean }
{
  if (desc.includes(`"`))
  {
    const escaped = desc.replace(/`/g, "\\`");
    return { attr: `desc={\`${escaped}\`}`, isTemplate: true };
  }
  return { attr: `desc="${desc}"`, isTemplate: false };
}

// Rewrite only the desc= attribute inside a <SkillCard .../> block.
function replaceDescInCard(cardRaw: string, newDesc: string): string
{
  const rendered = renderDescAttr(newDesc);

  // Try template literal first
  const tplRe = /desc\s*=\s*\{\s*`(?:[^`\\]|\\.)*`\s*\}/;
  if (tplRe.test(cardRaw))
  {
    return cardRaw.replace(tplRe, rendered.attr);
  }

  const plainRe = /desc\s*=\s*"(?:[^"\\]|\\.)*"/;
  if (plainRe.test(cardRaw))
  {
    return cardRaw.replace(plainRe, rendered.attr);
  }

  // no desc in card — insert after name attribute as a fallback
  return cardRaw.replace(/(name\s*=\s*"[^"]*")/, `$1\n    ${rendered.attr}`);
}

// ---------------------------------------------------------------------------
// Skills drift detection + fix
// ---------------------------------------------------------------------------

type SkillDrift = {
  missing: PluginSkill[];                 // plugin has it, doc doesn't
  extra: DocSkillCard[];                  // doc has it, plugin doesn't
  descDrift: Array<{
    name: string;
    pluginDesc: string;
    docDesc: string;
    pluginSkill: PluginSkill;
    docCard: DocSkillCard;
  }>;
};

// Normalize a SkillCard `name` or plugin command by stripping any leading slash.
// The Skills Index doc uses slash-less names for subskills (assembly-*, pattern-*)
// and slash-prefixed for top-level commands. Treat both as equivalent.
function normName(s: string): string
{
  return s.replace(/^\//, "");
}

function diffSkills(plugin: PluginSkill[], cards: DocSkillCard[]): SkillDrift
{
  const pluginByName = new Map(plugin.map((s) => [normName(s.command), s]));
  const cardByName = new Map(cards.map((c) => [normName(c.name), c]));

  const missing: PluginSkill[] = [];
  const extra: DocSkillCard[] = [];
  const descDrift: SkillDrift["descDrift"] = [];

  for (const skill of plugin)
  {
    const card = cardByName.get(normName(skill.command));
    if (!card)
    {
      missing.push(skill);
      continue;
    }
    if (normDesc(card.desc) !== normDesc(skill.description))
    {
      descDrift.push({
        name: skill.command,
        pluginDesc: skill.description,
        docDesc: card.desc,
        pluginSkill: skill,
        docCard: card,
      });
    }
  }

  for (const card of cards)
  {
    if (!pluginByName.has(normName(card.name)))
    {
      extra.push(card);
    }
  }

  return { missing, extra, descDrift };
}

async function fixSkills(plugin: PluginSkill[], body: string, drift: SkillDrift): Promise<string>
{
  let newBody = body;

  // 1. Rewrite descs for drifted cards — work back-to-front to avoid index shift
  const sortedDrift = [...drift.descDrift].sort(
    (a, b) => b.docCard.startIdx - a.docCard.startIdx,
  );
  for (const d of sortedDrift)
  {
    const newCard = replaceDescInCard(d.docCard.raw, d.pluginSkill.description);
    newBody = newBody.slice(0, d.docCard.startIdx) + newCard + newBody.slice(d.docCard.endIdx);
  }

  // 2. Append missing skills to the NEEDS-MANUAL-PLACEMENT block
  if (drift.missing.length > 0)
  {
    const placeholderMarker = "{/* NEW-SKILLS-BEGIN */}";
    if (!newBody.includes(placeholderMarker))
    {
      newBody = newBody.trimEnd() + `\n\n${placeholderMarker}\n` +
        `{/* New Skills — assign workflow manually. */}\n` +
        `<WorkflowSection icon="setup" title="Unassigned" desc="Skills added since the last doc sync. Move each card into the right WorkflowSection manually." count={0}>\n` +
        `</WorkflowSection>\n` +
        `{/* NEW-SKILLS-END */}\n`;
    }

    const endMarker = "{/* NEW-SKILLS-END */}";
    const endIdx = newBody.indexOf(endMarker);
    const closeIdx = newBody.lastIndexOf("</WorkflowSection>", endIdx);

    const insertCards = drift.missing.map((s) =>
    {
      const rendered = renderDescAttr(s.description);
      return `  {/* NEEDS-MANUAL-PLACEMENT */}\n` +
             `  <SkillCard\n` +
             `    name="${s.command}"\n` +
             `    title="${escapeJsxAttr(s.title || s.name)}"\n` +
             `    ${rendered.attr}\n` +
             `    glyph="setup-check"\n` +
             `    href="/docs/building-with-the-plugin"\n` +
             `  />\n`;
    }).join("");

    newBody = newBody.slice(0, closeIdx) + insertCards + newBody.slice(closeIdx);

    // Also update the count={...} in the NEW-SKILLS Unassigned WorkflowSection
    newBody = newBody.replace(
      /title="Unassigned"\s+desc="[^"]*"\s+count=\{\d+\}/,
      `title="Unassigned" desc="Skills added since the last doc sync. Move each card into the right WorkflowSection manually." count={${
        countExistingUnassigned(newBody) + drift.missing.length
      }}`,
    );
  }

  return newBody;
}

function countExistingUnassigned(body: string): number
{
  const beginIdx = body.indexOf("{/* NEW-SKILLS-BEGIN */}");
  const endIdx = body.indexOf("{/* NEW-SKILLS-END */}");
  if (beginIdx < 0 || endIdx < 0) return 0;
  const slice = body.slice(beginIdx, endIdx);
  return (slice.match(/<SkillCard\s/g) ?? []).length;
}

function escapeJsxAttr(s: string): string
{
  return s.replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// MCP tool catalog extraction
// ---------------------------------------------------------------------------

function readServletTools(path: string): ServletTool[]
{
  const txt = readFileSync(path, "utf8");
  const nameRe = /objTool\.put\("name",\s*"([a-zA-Z0-9_]+)"\s*\)/g;
  const toolsetRe = /objTool\.put\("toolset",\s*"([a-zA-Z0-9_]+)"\s*\)/g;

  const names: Array<{ pos: number; name: string }> = [];
  const toolsets: Array<{ pos: number; toolset: string }> = [];

  let m: RegExpExecArray | null;
  while ((m = nameRe.exec(txt)) !== null) names.push({ pos: m.index, name: m[1] });
  while ((m = toolsetRe.exec(txt)) !== null) toolsets.push({ pos: m.index, toolset: m[1] });

  const out: ServletTool[] = [];
  for (let i = 0; i < names.length; i++)
  {
    const cur = names[i];
    const next = names[i + 1]?.pos ?? txt.length;
    const prev = names[i - 1]?.pos ?? 0;
    // toolset put falls between this name and the next; some declarations place
    // toolset before name, so also search back to previous.
    const ts =
      toolsets.find((t) => t.pos > cur.pos && t.pos < next) ??
      toolsets.find((t) => t.pos > prev && t.pos < cur.pos);
    out.push({ name: cur.name, toolset: ts?.toolset ?? "(unknown)" });
  }
  return out;
}

function readAllServletTools(): ServletTool[]
{
  const a = readServletTools(AUTOMATION_SERVLET);
  const b = readServletTools(ASSEMBLY_SERVLET);
  return [...a, ...b];
}

function readValidToolsets(): string[]
{
  // Static list derived from server.js plus common toolsets the proxy enumerates.
  // The runtime derives VALID_TOOLSETS from servlet responses at boot; we replicate
  // the logic here by unioning whatever toolsets the servlets declare.
  const tools = readAllServletTools();
  return Array.from(new Set(tools.map((t) => t.toolset))).sort();
}

// ---------------------------------------------------------------------------
// MCP tool drift detection
// ---------------------------------------------------------------------------

// Extract per-tool card name attributes from the MCP tools doc MDX.
//
// Toolset-level drift detection (counts, missing-in-doc, extra-in-doc) was
// removed when the live MDX swapped <ToolsetCard count={N}> for
// <WorkflowSection> wrappers whose count is derived from children. With the
// count guaranteed-in-sync by construction, there is nothing to detect at the
// toolset level. Per-tool name drift still catches typos and is preserved.
type DocTool = { name: string };

function parseToolsDoc(body: string): { tools: DocTool[] }
{
  // Per-tool cards live inside WorkflowSection wrappers with `unit="tool"`.
  // Sections with `unit="toolset"` carry toolset-level cards (one per toolset)
  // and must be skipped — those `name` attributes are toolset names, not tools.
  const tools: DocTool[] = [];
  const sectionRe = /<WorkflowSection\s+([^>]*?)>([\s\S]*?)<\/WorkflowSection>/g;
  const cardRe = /<(?:SkillCard|ToolCard)\s+([\s\S]*?)\/>/g;
  let sm: RegExpExecArray | null;
  while ((sm = sectionRe.exec(body)) !== null)
  {
    const sectionAttrs = sm[1];
    const sectionBody = sm[2];
    const unit = extractAttr(sectionAttrs, "unit") ?? "skill";
    if (unit !== "tool") continue;

    let cm: RegExpExecArray | null;
    while ((cm = cardRe.exec(sectionBody)) !== null)
    {
      const name = extractAttr(cm[1], "name") ?? "";
      // tool names use snake_case and no leading slash; skill names have a leading slash
      if (name && !name.startsWith("/"))
      {
        tools.push({ name });
      }
    }
  }

  return { tools };
}

type ToolDrift = {
  toolsInServletNotInDoc: string[];
  toolsInDocNotInServlet: string[];
};

function diffTools(servletTools: ServletTool[], docParsed: ReturnType<typeof parseToolsDoc>): ToolDrift
{
  // Per-tool drift: only applies to the subset of tools enumerated in the doc
  // (Core + Knowledge Base). Other toolsets are deliberately not enumerated
  // individually in the doc; they render as cards inside WorkflowSection.
  const servletNames = new Set(servletTools.map((t) => t.name));

  // `activate_toolset` lives in server.js, not in either servlet. Add it to the
  // servlet surface for doc-comparison purposes.
  servletNames.add("activate_toolset");

  const docToolNames = new Set(docParsed.tools.map((t) => t.name));
  const toolsInDocNotInServlet: string[] = [];
  for (const name of docToolNames)
  {
    // Docs tools (docs_*) live in the apiant-docs MCP server, not the platform
    // servlets; skip them for the servlet-drift check.
    if (name.startsWith("docs_")) continue;
    if (!servletNames.has(name)) toolsInDocNotInServlet.push(name);
  }
  // We do NOT enumerate every "tool in servlet not in doc" because the doc
  // intentionally only lists Core + Knowledge Base individually.
  const toolsInServletNotInDoc: string[] = [];

  return {
    toolsInServletNotInDoc,
    toolsInDocNotInServlet,
  };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

// Returns `true` if there is blocking drift (names missing/extra). Description
// drift is reported as informational only — the SkillCard descs are editorial
// (short marketing blurbs) while SKILL.md descriptions are triage triggers, so
// they are intentionally different. `--fix-descs` (not `--fix`) is the opt-in
// to rewrite them.
function reportSkillsDrift(plugin: PluginSkill[], drift: SkillDrift, showDescDrift: boolean): boolean
{
  const total = plugin.length;
  const blockingCount = drift.missing.length + drift.extra.length;
  const infoCount = drift.descDrift.length;

  if (blockingCount === 0 && infoCount === 0)
  {
    console.log(c.green(`[OK] ${total} skills in sync`));
    return false;
  }

  if (blockingCount === 0)
  {
    console.log(c.green(`[OK] ${total} skills in sync`) + c.dim(` (${infoCount} desc variations — editorial, not blocking)`));
  }
  else
  {
    console.log(c.bold(c.yellow(`\n=== Skills Index drift (${blockingCount} blocking, ${infoCount} informational) ===`)));
  }

  if (drift.missing.length > 0)
  {
    console.log(c.red(`\nMissing in docs (${drift.missing.length}):`));
    for (const s of drift.missing)
    {
      console.log(`  ${c.cyan(s.command.padEnd(34))}  ${c.dim(truncate(s.description, 90))}`);
    }
  }

  if (drift.extra.length > 0)
  {
    console.log(c.red(`\nExtra in docs (${drift.extra.length}):`));
    for (const card of drift.extra)
    {
      console.log(`  ${c.cyan(card.name.padEnd(34))}  ${c.dim(truncate(card.desc, 90))}`);
    }
  }

  if (drift.descDrift.length > 0 && showDescDrift)
  {
    console.log(c.yellow(`\nDescription variation (${drift.descDrift.length}, informational — doc descs are editorial):`));
    for (const d of drift.descDrift)
    {
      console.log(`  ${c.cyan(d.name)}`);
      console.log(`    ${c.dim("plugin:")} ${truncate(d.pluginDesc, 120)}`);
      console.log(`    ${c.dim("doc:   ")} ${truncate(d.docDesc, 120)}`);
    }
  }

  return blockingCount > 0;
}

function reportToolDrift(drift: ToolDrift, servletTotal: number): boolean
{
  const issueCount =
    drift.toolsInDocNotInServlet.length +
    drift.toolsInServletNotInDoc.length;

  if (issueCount === 0)
  {
    console.log(c.green(`[OK] MCP tool catalog in sync (${servletTotal} tools)`));
    return false;
  }

  console.log(c.bold(c.yellow(`\n=== MCP Tool Catalog drift (${issueCount} issue(s)) ===`)));

  if (drift.toolsInDocNotInServlet.length > 0)
  {
    console.log(c.red(`\nTool in doc but not in servlet (${drift.toolsInDocNotInServlet.length}):`));
    for (const t of drift.toolsInDocNotInServlet) console.log(`  ${c.cyan(t)}`);
  }

  return true;
}

function truncate(s: string, n: number): string
{
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main()
{
  const args = new Set(process.argv.slice(2));
  const fix = args.has("--fix");
  const fixDescs = args.has("--fix-descs");
  const verbose = args.has("--verbose") || args.has("-v");
  const onlySkills = args.has("--skills");
  const onlyTools = args.has("--tools");
  const runSkills = onlySkills || !onlyTools;
  const runTools = onlyTools || !onlySkills;

  let anyDrift = false;

  // --- SKILLS -------------------------------------------------------------
  if (runSkills)
  {
    const plugin = readPluginSkills();
    const { body } = await loadDocBody(SKILLS_SLUG);
    const cards = parseSkillCards(body);
    const drift = diffSkills(plugin, cards);
    const hasBlockingDrift = reportSkillsDrift(plugin, drift, verbose || fixDescs);

    const shouldFix = (hasBlockingDrift && fix) || (fixDescs && drift.descDrift.length > 0);
    if (shouldFix)
    {
      // --fix adds missing cards only; --fix-descs additionally rewrites descs.
      const driftForFix: SkillDrift = {
        missing: fix ? drift.missing : [],
        extra: drift.extra,
        descDrift: fixDescs ? drift.descDrift : [],
      };
      const newBody = await fixSkills(plugin, body, driftForFix);
      if (newBody !== body)
      {
        await saveDocBody(SKILLS_SLUG, newBody);
        const addedN = driftForFix.missing.length;
        const descN = driftForFix.descDrift.length;
        console.log(c.green(`\n[FIX] Updated ${SKILLS_SLUG} — ${descN} desc rewrites, ${addedN} new cards added.`));

        // Re-check to see what residual blocking drift remains
        const { body: body2 } = await loadDocBody(SKILLS_SLUG);
        const drift2 = diffSkills(plugin, parseSkillCards(body2));
        const remaining = drift2.missing.length + drift2.extra.length;
        if (remaining === 0)
        {
          console.log(c.green(`[OK] ${plugin.length} skills in sync after fix`));
        }
        else
        {
          anyDrift = true;
          console.log(c.yellow(`[WARN] ${remaining} residual issue(s) after fix — re-run without --fix for detail.`));
        }
      }
    }
    else if (hasBlockingDrift)
    {
      anyDrift = true;
    }
  }

  // --- TOOLS --------------------------------------------------------------
  if (runTools)
  {
    const servletTools = readAllServletTools();
    const { body } = await loadDocBody(TOOLS_SLUG);
    const parsed = parseToolsDoc(body);
    const drift = diffTools(servletTools, parsed);
    const hasDrift = reportToolDrift(drift, servletTools.length + 1 /* activate_toolset */);
    if (hasDrift) anyDrift = true;
  }

  process.exit(anyDrift ? 1 : 0);
}

main().catch((err) =>
{
  console.error(c.red(`[ERROR] ${err.message}`));
  if (err.stack) console.error(c.dim(err.stack));
  process.exit(2);
});
