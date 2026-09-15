import type { NextConfig } from "next";
import { archbeeRedirects } from "./src/lib/archbee-redirects";

// DOCS_SITE=apiant-ai builds the apiant.ai docs zone (served at
// https://apiant.ai/docs through a rewrite on the apiant.ai project). Unset,
// this is the classic info.apiant.com build and nothing below differs from
// what it was before site modes existed. See src/lib/site.ts.
const isApiantAiSite = process.env.DOCS_SITE === "apiant-ai";

const classicConfig: NextConfig = {
  // Next 16 blocks cross-origin HMR from non-localhost dev URLs by default,
  // which silently kills client-side hydration (visible symptom: DEV/PROD
  // toggle on MCP Tool Catalog cards doesn't respond to clicks).
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      ...archbeeRedirects,
      // Catch-all: any bare slug not matching a known route → /docs/...
      // Covers old Archbee URLs that didn't have the /docs/ prefix
      {
        source: "/:slug((?!docs|api|login|signup|auth|dashboard|edit|reset-password|api-reference|_next|favicon\\.ico|apiant)(?!.*\\.[a-zA-Z]{2,5}$).*)",
        destination: "/docs/:slug",
        permanent: true,
      },
    ];
  },
};

// Multi-zone setup per Next's multi-zones guide: the pages already live at
// /docs and /docs/<slug>, so no basePath is needed (a basePath of /docs would
// turn them into /docs/docs/<slug>). assetPrefix moves /_next/* under
// /docs/_next/*, which the apiant.ai rewrite forwards; Next 15+ serves the
// prefixed asset paths itself. The browser's search and chat calls go to
// /docs/api/{search,chat} (see apiPath in src/lib/site.ts) so they never
// touch apiant.ai's own /api/*; only those two public read endpoints are
// exposed under /docs. The write, key and upload APIs stay on the zone's own
// domain and the classic site.
const apiantAiConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  assetPrefix: "/docs",
  env: {
    NEXT_PUBLIC_DOCS_SITE: "apiant-ai",
  },
  async redirects() {
    // No Archbee redirects: those slugs belong to the classic site. The zone
    // root is only reachable on the zone's own domain; send it to /docs.
    return [{ source: "/", destination: "/docs", permanent: false }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/docs/api/search", destination: "/api/search" },
        { source: "/docs/api/chat", destination: "/api/chat" },
        { source: "/docs/sitemap.xml", destination: "/api/sitemap" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

const nextConfig: NextConfig = isApiantAiSite ? apiantAiConfig : classicConfig;

export default nextConfig;
