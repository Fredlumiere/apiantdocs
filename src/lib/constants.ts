export const PRODUCT_LABELS: Record<string, string> = {
  platform: "Platform",
  "api-apps": "API Apps",
  mcp: "MCP",
  general: "General",
  "getting-started": "Getting Started",
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  guide: "Guide",
  "api-ref": "API Reference",
  tutorial: "Tutorial",
  changelog: "Changelog",
  overview: "Overview",
  reference: "Reference",
};

export const PRODUCTS = [
  { key: "getting-started", label: "Getting Started", description: "New to APIANT? Start here.", icon: "rocket" },
  { key: "platform", label: "Platform", description: "Build automations, assemblies, and integrations", icon: "cpu" },
  { key: "api-apps", label: "API Apps", description: "Pre-built integration products", icon: "zap" },
  { key: "mcp", label: "MCP", description: "Model Context Protocol tools", icon: "terminal" },
] as const;

// App product families for the apps section
export const APP_FAMILIES = [
  { key: "crmconnect", label: "CRMConnect", description: "CRM integrations (Mindbody, Cliniko, DonorPerfect \u2192 HubSpot, ActiveCampaign, etc.)" },
  { key: "shopconnect", label: "ShopConnect", description: "E-commerce integrations (Shopify \u2192 Mindbody)" },
  { key: "zoomconnect", label: "ZoomConnect", description: "Video conferencing integrations" },
  { key: "mailconnect", label: "MailConnect", description: "Email marketing integrations" },
  { key: "calendarconnect", label: "CalendarConnect", description: "Calendar integrations" },
  { key: "appconnect", label: "AppConnect", description: "Zapier-compatible connectors" },
] as const;
