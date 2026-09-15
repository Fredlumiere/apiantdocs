/**
 * apiant.ai brand for the docs zone (DOCS_SITE=apiant-ai only).
 *
 * Nothing here reaches the classic site: every consumer renders it behind
 * isApiantAiSite(), and the CSS ships as an inline <style> string from the
 * root layout instead of a stylesheet import, so the classic CSS bundle and
 * HTML stay exactly as they were.
 *
 * Sources of truth, keep in sync by hand:
 * - Menu bar and footer (markup, classes, CSS): apiant.ai `site.js`
 *   (repo APIANT/apiant-ai-website, branch main).
 * - Colour tokens and fonts: the `:root` block and Google Fonts link in
 *   apiant.ai `index.html`.
 * - App conventions (DM Sans for UI text, radii, brand button, the 2px
 *   gradient rule under the header): go-apiant `web/assets/theme.css`,
 *   `web/editor/assets/input.css` and `web/ui/appheader.templ`.
 */

export const APIANT_AI_ORIGIN = "https://apiant.ai";

/** Absolute, so the logo resolves on apiant.ai/docs and on the zone's own vercel.app host. */
export const APIANT_AI_LOGO_URL = `${APIANT_AI_ORIGIN}/images/apiant-logo-dark.svg`;

/** apiant.ai's Google Fonts request, plus DM Sans for body and UI text (the app's face). */
export const APIANT_AI_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500&display=swap";

export const APIANT_AI_THEME_COLOR = "#0a0a0a";

export const APIANT_AI_ICONS = {
  icon: [
    { url: `${APIANT_AI_ORIGIN}/favicon.ico`, sizes: "any" },
    { url: `${APIANT_AI_ORIGIN}/images/favicon-32x32.png`, type: "image/png", sizes: "32x32" },
    { url: `${APIANT_AI_ORIGIN}/images/favicon-16x16.png`, type: "image/png", sizes: "16x16" },
  ],
  apple: [{ url: `${APIANT_AI_ORIGIN}/images/apple-touch-icon.png`, sizes: "180x180" }],
};

export interface BrandLink {
  href: string;
  label: string;
  rel?: string;
  current?: boolean;
}

/** site.js LINKS, made absolute. Docs is the current page everywhere in the zone. */
export const MENU_LINKS: BrandLink[] = [
  { href: `${APIANT_AI_ORIGIN}/apps`, label: "Apps" },
  { href: `${APIANT_AI_ORIGIN}/pricing`, label: "Pricing" },
  { href: `${APIANT_AI_ORIGIN}/docs`, label: "Docs", current: true },
  { href: "https://discord.gg/qPakRsr28K", label: "Community", rel: "noopener" },
];

export const SIGN_IN_URL = "https://app.apiant.ai";
export const START_FREE_URL = "https://app.apiant.ai/register";

export const FOOTER_PRODUCT_LINKS: BrandLink[] = [
  { href: `${APIANT_AI_ORIGIN}/apps`, label: "Apps" },
  { href: `${APIANT_AI_ORIGIN}/pricing`, label: "Pricing" },
  { href: `${APIANT_AI_ORIGIN}/docs`, label: "Docs" },
  { href: "https://discord.gg/qPakRsr28K", label: "Community", rel: "noopener" },
];

export const FOOTER_COMPANY_LINKS: BrandLink[] = [
  { href: `${APIANT_AI_ORIGIN}/tos`, label: "Terms" },
  { href: `${APIANT_AI_ORIGIN}/privacy`, label: "Privacy" },
  { href: "https://www.linkedin.com/company/apiantinc/", label: "LinkedIn", rel: "noopener" },
];

/**
 * site.js CSS, verbatim for the dark menu and footer. The [data-menu="light"]
 * variants are left out: the docs zone is dark only. One addition is marked
 * below.
 */
const SITE_JS_CSS =
  '.sm{position:sticky;top:0;z-index:50;background:rgba(10,10,10,.92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.06);width:100%;align-self:stretch;font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;text-align:left;line-height:1}' +
  ".sm{margin:0;padding:0;border-top:0;border-left:0;border-right:0;border-radius:0;box-shadow:none;height:auto;min-height:0;max-width:none;display:block}" +
  ".sm *{box-sizing:border-box}" +
  ".sm-bar{display:flex;align-items:center;height:64px;gap:40px;max-width:1200px;margin:0 auto;padding:0 24px}" +
  ".sm-brand{display:inline-flex;align-items:flex-end;gap:7px;text-decoration:none;flex:none;line-height:1}" +
  ".sm-brand img{height:26px;width:auto;display:block}" +
  '.sm-brand i{font-style:normal;font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;font-weight:700;font-size:10px;line-height:1;padding:.36em .46em .3em;border-radius:.3em;letter-spacing:.04em;color:#2a1503;background:linear-gradient(160deg,#facd61 0%,#f8a434 47%,#d96c27 100%);transform:translateY(-1px)}' +
  ".sm-links{flex:1;display:flex;min-width:0}" +
  ".sm-links ul{display:flex;align-items:center;gap:28px;width:100%;list-style:none;margin:0;padding:0}" +
  ".sm-links li{margin:0;padding:0}" +
  ".sm-links a{font-size:15px;color:#8b908d;text-decoration:none;display:inline-flex;align-items:center;min-height:44px;white-space:nowrap;border-bottom:2px solid transparent;padding-top:2px}" +
  ".sm-links a:hover,.sm-links a:focus-visible{color:#f7f8f8}" +
  ".sm-links a[aria-current]{color:#f7f8f8;border-bottom-color:#f8a434}" +
  ".sm-links .sm-signin{margin-left:auto}" +
  ".sm-actions{display:flex;align-items:center;gap:12px;flex:none}" +
  ".sm-start{display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 16px;border-radius:8px;background:#f7f8f8;color:#0a0a0a;font-weight:700;font-size:14px;text-decoration:none;white-space:nowrap}" +
  ".sm-start:hover{background:#e6e7e8;color:#0a0a0a}" +
  ".sm-btn{display:none}" +
  "@media (max-width:1024px){.sm-bar{gap:24px}.sm-links ul{gap:18px}}" +
  "@media (max-width:720px){" +
  ".sm-bar{height:56px;gap:12px;justify-content:space-between;padding:0 16px}" +
  ".sm-links{position:absolute;left:0;right:0;top:56px;background:#0a0a0a;border-bottom:1px solid rgba(255,255,255,.06);padding:0 16px 8px}" +
  ".sm-links[hidden]{display:none}" +
  // Addition: site.js hides the closed mobile menu by setting `hidden` from
  // script after load. React renders it closed from the first paint instead,
  // keyed on data-open, so desktop never flashes a hidden menu.
  '.sm-links:not([data-open="true"]){display:none}' +
  ".sm-links ul{flex-direction:column;align-items:stretch;gap:0}" +
  ".sm-links li{border-top:1px solid rgba(255,255,255,.06)}" +
  ".sm-links a{min-height:56px;font-size:17px;color:#f7f8f8;border-bottom:0;padding-top:0}" +
  ".sm-links a[aria-current]{color:#f8a434}" +
  ".sm-links .sm-signin{margin-left:0}" +
  ".sm-start{padding:0 14px}" +
  '.sm-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:transparent;color:#f7f8f8;font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;font-size:12px;cursor:pointer}' +
  "}" +
  '.sf{position:relative;z-index:3;width:min(92vw,1120px);margin:64px auto 0;padding:32px 24px 40px;text-align:left;border-top:1px solid rgba(255,255,255,.06);font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.5;color:#8b908d;background:transparent}' +
  ".sf *{box-sizing:border-box}" +
  ".sf,.sf a,.sf li,.sf p{text-transform:none;letter-spacing:0;opacity:1;animation:none}.sf a,.sf li{font-size:14px}" +
  ".sf-cols{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:32px}" +
  ".sf-brand{display:inline-flex;align-items:flex-end;gap:6px;text-decoration:none;line-height:1}" +
  ".sf-brand img{height:22px;width:auto;display:block}" +
  '.sf-brand i{font-style:normal;font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;font-weight:700;font-size:9px;line-height:1;padding:.36em .46em .3em;border-radius:.3em;letter-spacing:.04em;color:#2a1503;background:linear-gradient(160deg,#facd61 0%,#f8a434 47%,#d96c27 100%);transform:translateY(-1px)}' +
  '.sf-h{font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#5f6361;margin:0 0 12px}' +
  ".sf ul{list-style:none;margin:0;padding:0}.sf li{margin:0;padding:0}" +
  ".sf a{color:#8b908d;text-decoration:none;display:inline-flex;align-items:center;min-height:32px}" +
  ".sf a:hover,.sf a:focus-visible{color:#f7f8f8}" +
  '.sf-copy{margin:32px 0 0;font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#4a4e4c}' +
  "@media (max-width:720px){.sf{padding:28px 16px 36px}.sf-cols{grid-template-columns:1fr 1fr;gap:24px}.sf-cols > div:first-child{grid-column:1 / -1}}";

/**
 * The docs zone theme: apiant.ai's tokens mapped onto the docs app's own
 * variables, the app's radii and brand button, and the sticky chrome offsets.
 * Scoped to html[data-site="apiant-ai"], which also outranks the classic
 * [data-theme="light"] block, so the zone stays dark whatever localStorage says.
 */
const THEME_CSS = `
html[data-site="apiant-ai"]{
  color-scheme:dark;
  background:#0a0a0a;
  --aai-ink:#f7f8f8;
  --aai-muted:#8b908d;
  --aai-dim:#6a6f6c;
  --aai-v1:#f8a434;
  --aai-v2:#facd61;
  --aai-v3:#d96c27;
  --aai-on-accent:#2a1503;
  --aai-grad:linear-gradient(160deg,#facd61 0%,#f8a434 47%,#d96c27 100%);
  --aai-grad-hover:linear-gradient(160deg,#fcd97e 0%,#ffb452 47%,#e87d34 100%);
  --aai-wash:rgba(248,164,52,.12);
  --aai-drop:rgba(248,164,52,.45);
  --aai-display:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;
  --aai-menu-h:65px;
  --aai-submenu-h:48px;
  --aai-chrome-h:calc(var(--aai-menu-h) + var(--aai-submenu-h) + 2px);

  --bg-primary:#0a0a0a;
  --bg-secondary:#141414;
  --bg-tertiary:#1e1e1e;
  --bg-surface:rgba(255,255,255,.03);
  --bg-surface-hover:rgba(255,255,255,.06);
  --text-primary:#f7f8f8;
  --text-secondary:#8b908d;
  --text-tertiary:#6a6f6c;
  --text-disabled:#4a4e4c;
  --accent-primary:#f8a434;
  --accent-primary-hover:#facd61;
  --accent-primary-muted:rgba(248,164,52,.12);
  --accent-primary-subtle:rgba(248,164,52,.06);
  --accent-gold:#facd61;
  --accent-gold-muted:rgba(250,205,97,.08);
  --accent-purple:#f7f8f8;
  --accent-cyan:#c7c4be;
  --accent-amber:#f8a434;
  --border-primary:rgba(255,255,255,.07);
  --border-secondary:rgba(255,255,255,.13);
  --border-hover:rgba(255,255,255,.24);
  --border-accent:rgba(248,164,52,.35);
  --focus-ring:rgba(248,164,52,.75);
  --radius-sm:.5rem;
  --radius-md:.625rem;
  --radius-lg:1rem;
  --radius-xl:1rem;
  --background:#0a0a0a;
  --foreground:#f7f8f8;
  --font-geist-sans:"DM Sans",ui-sans-serif,system-ui,sans-serif;
  --font-geist-mono:"JetBrains Mono",ui-monospace,Menlo,monospace;
}
@media (max-width:720px){html[data-site="apiant-ai"]{--aai-menu-h:57px}}
html[data-site="apiant-ai"] body{background:#0a0a0a;color:#f7f8f8;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
html[data-site="apiant-ai"] ::selection{background:rgba(248,164,52,.3);color:#f7f8f8}
html[data-site="apiant-ai"] mark{background:rgba(248,164,52,.22);color:#facd61;border-radius:3px;padding:0 2px}
html[data-site="apiant-ai"] :is(h1,h2,h3,h4,h5,h6){font-family:var(--aai-display)}
html[data-site="apiant-ai"] :is(.toc-aside h4,.chat-markdown h1,.chat-markdown h2,.chat-markdown h3){font-family:var(--font-geist-sans)}
html[data-site="apiant-ai"] .skip-to-content{background-image:var(--aai-grad);color:var(--aai-on-accent)}

/* Sticky chrome: apiant.ai menu + docs submenu + the app's 2px gradient rule */
.aai-chrome{position:sticky;top:0;z-index:50}
.aai-rule{height:2px;background-image:var(--aai-grad)}
.aai-sub{background:#0a0a0a;font-family:var(--font-geist-sans)}
.aai-sub-bar{height:var(--aai-submenu-h);display:flex;align-items:center;gap:20px;max-width:1200px;margin:0 auto;padding:0 24px}
.aai-sub *{box-sizing:border-box}
.aai-sub-home{font-family:var(--aai-display);font-weight:600;font-size:15px;letter-spacing:-.01em;color:#f7f8f8;text-decoration:none;flex:none;display:inline-flex;align-items:center;min-height:44px}
.aai-sub-home:hover{color:#facd61}
.aai-sub-sep{width:1px;height:20px;background:rgba(255,255,255,.13);flex:none}
.aai-tabs{flex:1;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 24px),transparent)}
.aai-tabs::-webkit-scrollbar{display:none}
.aai-tabs ul{display:flex;align-items:stretch;gap:18px;list-style:none;margin:0;padding:0 16px 0 0;height:var(--aai-submenu-h);white-space:nowrap}
.aai-tabs li{display:flex}
.aai-tab{display:inline-flex;align-items:center;font-size:14px;color:#8b908d;text-decoration:none;white-space:nowrap;border-bottom:2px solid transparent;padding-top:2px}
.aai-tab:hover,.aai-tab:focus-visible{color:#f7f8f8}
.aai-tab[aria-current]{color:#f8a434;border-bottom-color:#f8a434}
.aai-sub-actions{display:flex;align-items:center;gap:8px;flex:none}
.aai-search{display:inline-flex;align-items:center;gap:8px;height:34px;width:176px;padding:0 8px 0 10px;border-radius:var(--radius-md);border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.03);color:#8b908d;font:inherit;font-size:13px;cursor:pointer;transition:border-color .15s,color .15s}
.aai-search:hover{border-color:rgba(255,255,255,.24);color:#f7f8f8}
.aai-search-text{flex:1;text-align:left}
.aai-search kbd{font-family:var(--font-geist-mono);font-size:11px;padding:1px 5px;border-radius:5px;border:1px solid rgba(255,255,255,.13);color:#6a6f6c}
.aai-btn-brand{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:none;background-color:transparent;background-image:var(--aai-grad);color:var(--aai-on-accent);font-family:var(--font-geist-sans);font-weight:600;cursor:pointer;box-shadow:0 1px 0 0 rgba(255,255,255,.08) inset,0 6px 18px -6px var(--aai-drop);transition:transform 180ms cubic-bezier(.34,1.56,.64,1)}
.aai-btn-brand:hover{background-image:var(--aai-grad-hover)}
.aai-btn-brand:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
.aai-ask{height:34px;padding:0 12px;border-radius:var(--radius-md);font-size:13px}
.aai-sub-mobile{display:none}
@media (max-width:767px){
  .aai-sub-bar{gap:8px}
  .aai-sub-home,.aai-sub-sep,.aai-tabs{display:none}
  .aai-sub-mobile{display:inline-flex;align-items:center;gap:6px;flex:1;min-width:0;min-height:44px;padding:0;border:0;background:transparent;color:#f7f8f8;font:inherit;font-size:14px;cursor:pointer;text-align:left}
  .aai-sub-mobile b{font-family:var(--aai-display);font-weight:600;flex:none}
  .aai-sub-mobile em{font-style:normal;color:#6a6f6c;flex:none}
  .aai-sub-mobile span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f8a434}
  .aai-sub-mobile svg{flex:none;color:#8b908d}
  .aai-search{width:40px;height:40px;padding:0;justify-content:center}
  .aai-search-text,.aai-search kbd{display:none}
  .aai-ask{height:40px}
}

@media (max-width:720px){.aai-sub-bar{padding:0 16px}}

/* Docs body on apiant.ai's row: 1200px max, 24px gutters, sidebar left edge under the logo */
.aai-body{display:flex;flex:1;width:100%;max-width:1200px;margin:0 auto;padding:0 24px}
@media (max-width:767px){.aai-body{padding:0 8px}}
@media (max-width:720px){.aai-body{padding:0}}
html[data-site="apiant-ai"] .sidebar-wrapper{width:256px}
html[data-site="apiant-ai"] .desktop-sidebar{padding:24px 16px 24px 2px !important}
html[data-site="apiant-ai"] .sidebar-resize-handle{display:none !important}

/* Layout offsets under the chrome */
html[data-site="apiant-ai"] .sidebar-wrapper{top:var(--aai-chrome-h);height:calc(100vh - var(--aai-chrome-h))}
html[data-site="apiant-ai"] .desktop-sidebar{background:transparent !important}
html[data-site="apiant-ai"] .toc-aside{top:calc(var(--aai-chrome-h) + 32px) !important;max-height:calc(100vh - var(--aai-chrome-h) - 64px) !important}
html[data-site="apiant-ai"] .prose :is(h1,h2,h3,h4,h5,h6){scroll-margin-top:calc(var(--aai-chrome-h) + 16px)}
html[data-site="apiant-ai"] .mobile-sidebar-toggle{display:none !important}
html[data-site="apiant-ai"] .mobile-sidebar-drawer{z-index:60 !important}

/* Prose */
html[data-site="apiant-ai"] .prose{--tw-prose-pre-bg:#141414}
html[data-site="apiant-ai"] .prose :is(h1,h2,h3){letter-spacing:-.02em}
/* rehype-autolink-headings wraps each heading in a link; keep headings ink, not link amber */
html[data-site="apiant-ai"] .prose :is(h1,h2,h3,h4,h5,h6) a{color:inherit;font-weight:inherit}
html[data-site="apiant-ai"] .prose :where(code):not(:where(pre *)){border-radius:5px;background:#1e1e1e}
html[data-site="apiant-ai"] .prose blockquote{font-style:normal;border-left:2px solid #f8a434;background:rgba(255,255,255,.03);border-radius:0 var(--radius-md) var(--radius-md) 0;padding:.6em 1em}
html[data-site="apiant-ai"] .prose blockquote p{margin:.4em 0}

/* Syntax highlighting: amber ramp plus neutrals, no other hue */
html[data-site="apiant-ai"] :is(.hljs-keyword,.hljs-built_in,.hljs-literal,.hljs-number,.hljs-name,.hljs-selector-tag){color:#f8a434}
html[data-site="apiant-ai"] :is(.hljs-attr,.hljs-attribute,.hljs-symbol){color:#facd61}
html[data-site="apiant-ai"] :is(.hljs-string,.hljs-regexp){color:#c7c4be}
html[data-site="apiant-ai"] :is(.hljs-function,.hljs-title,.hljs-type,.hljs-class){color:#f7f8f8}
html[data-site="apiant-ai"] .hljs-params{color:#8b908d}
html[data-site="apiant-ai"] :is(.hljs-comment,.hljs-meta,.hljs-quote){color:#6a6f6c}

/* Translucent radius-box cards (app convention) */
html[data-site="apiant-ai"] :is(.doc-list-card,.child-card){border-radius:var(--radius-lg);background:rgba(255,255,255,.02)}
html[data-site="apiant-ai"] :is(.doc-list-card,.child-card):hover{border-color:rgba(248,164,52,.45);background:rgba(255,255,255,.04)}
html[data-site="apiant-ai"] .callout{border:1px solid rgba(255,255,255,.13);border-radius:var(--radius-lg);background:rgba(255,255,255,.03);padding:14px 18px}
html[data-site="apiant-ai"] :is(.callout-success,.callout-tip){border-color:rgba(248,164,52,.4);background:rgba(248,164,52,.06)}
html[data-site="apiant-ai"] .callout-warning{border-color:rgba(228,87,46,.5);background:rgba(228,87,46,.07)}
html[data-site="apiant-ai"] .callout-danger{border-color:rgba(248,113,113,.5);background:rgba(248,113,113,.07)}
html[data-site="apiant-ai"] .chat-panel{background:rgba(20,20,20,.94) !important;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-color:rgba(255,255,255,.13) !important}
`;

export const APIANT_AI_CSS = SITE_JS_CSS + THEME_CSS;
