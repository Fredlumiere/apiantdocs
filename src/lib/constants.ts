export const PRODUCT_LABELS: Record<string, string> = {
  platform: "Platform",
  "api-apps": "API Apps",
  mcp: "MCP",
  general: "General",
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  guide: "Guide",
  "api-ref": "API Reference",
  tutorial: "Tutorial",
  changelog: "Changelog",
};

export const PRODUCTS = [
  { key: "platform", label: "Platform", description: "Core integration platform docs" },
  { key: "api-apps", label: "API Apps", description: "Build and use API Apps" },
  { key: "mcp", label: "MCP", description: "Model Context Protocol integration" },
] as const;
