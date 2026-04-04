import type { NextConfig } from "next";
import { archbeeRedirects } from "./src/lib/archbee-redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return archbeeRedirects;
  },
};

export default nextConfig;
