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

const env = loadEnv(".env.local");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

interface Doc {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  parent_id: string | null;
}

(async () => {
  const { data: docs } = await sb
    .from("documents")
    .select("id, slug, title, description, body, parent_id")
    .eq("product", "platform");
  if (!docs) return;

  const byId = new Map<string, Doc>(docs.map((d: any) => [d.id, d as Doc]));

  // Find parents with children
  const parentIds = new Set<string>();
  for (const d of docs) if (d.parent_id) parentIds.add(d.parent_id);

  for (const parentId of parentIds) {
    const parent = byId.get(parentId);
    if (!parent || !parent.body) continue;

    const children = (docs as Doc[]).filter((d) => d.parent_id === parentId);

    // Extract bullets from parent body that link to children
    const bulletRe = /^- \[([^\]]+)\]\(\/docs\/([^)]+)\) — (.+)$/gm;
    const bullets = new Map<string, { linkText: string; tail: string }>();
    let m: RegExpExecArray | null;
    while ((m = bulletRe.exec(parent.body)) !== null) {
      bullets.set(m[2], { linkText: m[1], tail: m[3].trim().replace(/\.$/, "") });
    }

    if (bullets.size === 0) continue;

    let header = false;
    for (const child of children) {
      const bullet = bullets.get(child.slug);
      if (!bullet) continue;
      const descNorm = (child.description || "").trim().replace(/\.$/, "");
      const tailNorm = bullet.tail;

      // Compare loosely — same first 40 chars after lowercasing
      const a = descNorm.toLowerCase().slice(0, 60);
      const b = tailNorm.toLowerCase().slice(0, 60);
      if (a !== b) {
        if (!header) {
          console.log(`\n# Parent: ${parent.slug}`);
          header = true;
        }
        console.log(`  child:  ${child.slug}`);
        console.log(`    bullet:      ${bullet.tail}`);
        console.log(`    description: ${child.description || "(empty)"}`);
      }
    }
  }
})();
