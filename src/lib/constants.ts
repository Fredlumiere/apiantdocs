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

// App product families with their individual apps
export interface AppProduct {
  slug: string;
  label: string;
  source: string;
  destination: string;
}

export interface AppFamily {
  key: string;
  label: string;
  description: string;
  apps: AppProduct[];
}

export const APP_FAMILIES: AppFamily[] = [
  {
    key: "crmconnect",
    label: "CRMConnect",
    description: "Bi-directional CRM sync — client data, visits, purchases, memberships, and more.",
    apps: [
      { slug: "crmconnect-mindbody-to-highlevel", label: "Mindbody → HighLevel", source: "Mindbody", destination: "HighLevel" },
      { slug: "crmconnect-mindbody-to-hubspot", label: "Mindbody → HubSpot", source: "Mindbody", destination: "HubSpot" },
      { slug: "crmconnect-mindbody-to-activecampaign", label: "Mindbody → ActiveCampaign", source: "Mindbody", destination: "ActiveCampaign" },
      { slug: "crmconnect-mindbody-to-keap", label: "Mindbody → Keap", source: "Mindbody", destination: "Keap" },
      { slug: "crmconnect-mindbody-to-klaviyo", label: "Mindbody → Klaviyo", source: "Mindbody", destination: "Klaviyo" },
      { slug: "crmconnect-mindbody-to-zoho-crm", label: "Mindbody → Zoho CRM", source: "Mindbody", destination: "Zoho CRM" },
      { slug: "crmconnect-cliniko-to-hubspot", label: "Cliniko → HubSpot", source: "Cliniko", destination: "HubSpot" },
      { slug: "crmconnect-cliniko-to-activecampaign", label: "Cliniko → ActiveCampaign", source: "Cliniko", destination: "ActiveCampaign" },
      { slug: "crmconnect-cliniko-to-salesforce-cloned", label: "Cliniko → Salesforce", source: "Cliniko", destination: "Salesforce" },
      { slug: "crmconnect-donorperfect-to-hubspot", label: "DonorPerfect → HubSpot", source: "DonorPerfect", destination: "HubSpot" },
      { slug: "crmconnect-donorperfect-to-activecampaign", label: "DonorPerfect → ActiveCampaign", source: "DonorPerfect", destination: "ActiveCampaign" },
      { slug: "crmconnect-donorperfect-to-keap", label: "DonorPerfect → Keap", source: "DonorPerfect", destination: "Keap" },
    ],
  },
  {
    key: "shopconnect",
    label: "ShopConnect",
    description: "E-commerce integrations — sync products, pricing, and orders.",
    apps: [
      { slug: "shopconnect-shopify-to-mindbody", label: "Shopify → Mindbody", source: "Shopify", destination: "Mindbody" },
    ],
  },
  {
    key: "zoomconnect",
    label: "ZoomConnect",
    description: "Automated Zoom meeting management — scheduling, recordings, reminders, and attendance.",
    apps: [
      { slug: "zoomconnect", label: "ZoomConnect", source: "Zoom", destination: "Mindbody" },
    ],
  },
  {
    key: "mailconnect",
    label: "MailConnect",
    description: "Email marketing sync — contacts, lists, and campaigns.",
    apps: [
      { slug: "mailconnect-donorperfect-to-mailchimp", label: "DonorPerfect → Mailchimp", source: "DonorPerfect", destination: "Mailchimp" },
    ],
  },
  {
    key: "calendarconnect",
    label: "CalendarConnect",
    description: "Calendar booking integrations.",
    apps: [
      { slug: "calendarconnect-calendly-to-mindbody", label: "Calendly → Mindbody", source: "Calendly", destination: "Mindbody" },
    ],
  },
  {
    key: "appconnect",
    label: "AppConnect",
    description: "Zapier-compatible instant triggers and actions for Mindbody.",
    apps: [
      { slug: "appconnect", label: "AppConnect for Zapier", source: "Mindbody", destination: "Zapier" },
    ],
  },
];
