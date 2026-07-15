/**
 * set-product-ctas.ts — Attach an apiant.com product-page CTA to each API App parent doc.
 *
 * Usage:
 *   npx tsx scripts/set-product-ctas.ts            # dry run: verify URLs, print planned writes
 *   npx tsx scripts/set-product-ctas.ts --commit   # verify URLs, then write metadata.product_url
 *
 * Writes into documents.metadata (merged, never clobbered):
 *   product_url        — the apiant.com marketing page for this integration
 *   product_cta_label  — optional button copy override (not set here; defaults in the component)
 *
 * The doc page renders <ProductCta> whenever product_url is present, so adding a new
 * API App means adding one row below (or setting metadata via the API/MCP) — no code change.
 */

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env: Record<string, string> = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const commit = process.argv.includes("--commit");

const P = "https://apiant.com/apipartners";

// doc slug -> apiant.com product page. Every URL below was verified to return 200.
// Note the URL shape is NOT reliably derivable from the slug: Calendly and Shopify
// pages live under /mindbody/ with the app order reversed, and cliniko-hubspot omits
// the "and-" that every other page includes. Hence an explicit table.
const PRODUCT_URLS: Record<string, string> = {
  "appconnect": "https://apiant.com/appconnect",
  "zoomconnect": "https://apiant.com/zoomconnect",
  "calendarconnect-calendly-to-mindbody": `${P}/mindbody/mindbody-calendly-integration-and-automation-apiant`,
  // Both sync directions (Calendly→Mindbody and Mindbody→Calendly) share one apiant.com marketing page.
  "calendarconnect-mindbody-to-calendly": `${P}/mindbody/mindbody-calendly-integration-and-automation-apiant`,
  "crmconnect-cliniko-to-activecampaign": `${P}/cliniko/cliniko-activecampaign-integration-and-automation-apiant`,
  "crmconnect-cliniko-to-hubspot": `${P}/cliniko/cliniko-hubspot-integration-automation-apiant`,
  "crmconnect-cliniko-to-salesforce": `${P}/cliniko/cliniko-salesforce-integration-and-automation-apiant`,
  // Duplicate of the doc above; same integration, same marketing page.
  "crmconnect-cliniko-to-salesforce-cloned": `${P}/cliniko/cliniko-salesforce-integration-and-automation-apiant`,
  "crmconnect-donorperfect-to-activecampaign": `${P}/donorperfect/donorperfect-activecampaign-integration-and-automation-apiant`,
  "crmconnect-donorperfect-to-hubspot": `${P}/donorperfect/donorperfect-hubspot-integration-and-automation-apiant`,
  "crmconnect-donorperfect-to-keap": `${P}/donorperfect/donorperfect-keap-integration-and-automation-apiant`,
  "crmconnect-mindbody-to-activecampaign": `${P}/mindbody/mindbody-activecampaign-integration-and-automation-apiant`,
  "crmconnect-mindbody-to-highlevel": `${P}/mindbody/mindbody-highlevel-integration-and-automation-apiant`,
  "crmconnect-mindbody-to-hubspot": `${P}/mindbody/mindbody-hubspot-integration-and-automation-apiant`,
  "crmconnect-mindbody-to-keap": `${P}/mindbody/mindbody-keap-integration-and-automation-apiant`,
  "crmconnect-mindbody-to-klaviyo": `${P}/mindbody/mindbody-klaviyo-integration-and-automation-apiant`,
  "crmconnect-mindbody-to-zoho-crm": `${P}/mindbody/mindbody-zoho-crm-integration-and-automation-apiant`,
  "mailconnect-donorperfect-to-mailchimp": `${P}/donorperfect/donorperfect-mailchimp-integration-and-automation-apiant`,
  "shopconnect-shopify-to-mindbody": `${P}/mindbody/mindbody-shopify-integration-and-automation-apiant`,
};

async function checkUrl(url: string): Promise<number> {
  const res = await fetch(url, { redirect: "follow" });
  return res.status;
}

async function main() {
  const { data: parents, error } = await supabase
    .from("documents")
    .select("id, slug, title, metadata, status")
    .eq("product", "api-apps")
    .is("parent_id", null)
    .eq("status", "published")
    .order("slug");
  if (error) throw error;

  const bySlug = new Map(parents!.map((d) => [d.slug, d]));

  // Every published API App parent should have a CTA. Flag any that don't.
  const uncovered = parents!.filter((d) => !PRODUCT_URLS[d.slug]);
  if (uncovered.length > 0) {
    console.log("\nNo product URL mapped (skipped):");
    for (const d of uncovered) console.log(`  ${d.slug}`);
  }

  console.log(`\n${commit ? "Writing" : "Dry run"} — ${Object.keys(PRODUCT_URLS).length} mappings:\n`);

  let written = 0;
  let broken = 0;

  for (const [slug, url] of Object.entries(PRODUCT_URLS)) {
    const doc = bySlug.get(slug);
    if (!doc) {
      console.log(`  MISSING DOC  ${slug}`);
      continue;
    }

    const status = await checkUrl(url);
    if (status !== 200) {
      console.log(`  ${status} DEAD URL  ${slug} -> ${url}`);
      broken++;
      continue;
    }

    const metadata = (doc.metadata || {}) as Record<string, unknown>;
    if (metadata.product_url === url) {
      console.log(`  ok (unchanged) ${slug}`);
      continue;
    }

    if (commit) {
      const { error: upErr } = await supabase
        .from("documents")
        .update({ metadata: { ...metadata, product_url: url } })
        .eq("id", doc.id);
      if (upErr) throw upErr;
    }
    console.log(`  ${commit ? "SET" : "would set"}  ${slug} -> ${url}`);
    written++;
  }

  console.log(
    `\n${commit ? "Wrote" : "Would write"} ${written} doc(s). ${broken} dead URL(s).` +
      (commit ? "" : "\nRe-run with --commit to apply.")
  );
}

main();
