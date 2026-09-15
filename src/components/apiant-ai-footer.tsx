import {
  APIANT_AI_LOGO_URL,
  APIANT_AI_ORIGIN,
  FOOTER_COMPANY_LINKS,
  FOOTER_PRODUCT_LINKS,
} from "@/lib/apiant-ai-brand";

/**
 * apiant.ai's site footer for the docs zone. Source to keep in sync: the
 * FOOTER markup in apiant.ai `site.js`; its CSS is in src/lib/apiant-ai-brand.ts.
 * Links are absolute for the same reason as the menu's.
 */
export function ApiantAiFooter() {
  return (
    <footer className="sf" id="siteFooter">
      <div className="sf-cols">
        <div>
          <a className="sf-brand" href={`${APIANT_AI_ORIGIN}/`} aria-label="APIANT.AI home">
            {/* eslint-disable-next-line @next/next/no-img-element -- cross-origin SVG, same tag site.js renders */}
            <img src={APIANT_AI_LOGO_URL} alt="" width={1158} height={213} />
            <i aria-hidden="true">.AI</i>
          </a>
        </div>
        <nav aria-labelledby="sf-prod">
          <p className="sf-h" id="sf-prod">
            Product
          </p>
          <ul>
            {FOOTER_PRODUCT_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} rel={l.rel}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="sf-co">
          <p className="sf-h" id="sf-co">
            Company
          </p>
          <ul>
            {FOOTER_COMPANY_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} rel={l.rel}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="sf-copy">&copy; 2026 APIANT, Inc.</p>
    </footer>
  );
}
