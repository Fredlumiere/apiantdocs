import type { NextConfig } from "next";
import { archbeeRedirects } from "./src/lib/archbee-redirects";

const nextConfig: NextConfig = {
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

export default nextConfig;
