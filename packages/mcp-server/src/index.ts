#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.APIANTDOCS_API_URL || "https://apiantdocs.vercel.app";

// Auth state — supports API key or session token
let authApiKey = process.env.APIANTDOCS_API_KEY || "";
let authSessionToken = "";

function getAuthHeaders(): Record<string, string> {
  if (authApiKey) {
    return { Authorization: `Bearer ${authApiKey}` };
  }
  if (authSessionToken) {
    return { Authorization: `Bearer ${authSessionToken}` };
  }
  return {};
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    "X-Changed-By": "mcp:claude-code",
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  return response.json();
}

const server = new McpServer({
  name: "apiant-docs",
  version: "0.1.0",
});

// docs_login — authenticate with email + password
server.tool(
  "docs_login",
  "Authenticate with APIANT docs using email and password. Stores session token for subsequent calls.",
  {
    email: z.string().describe("Your email address"),
    password: z.string().describe("Your password"),
  },
  async ({ email, password }) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || API_BASE.replace("apiantdocs.vercel.app", "supabase.co");

      // Use Supabase auth REST API directly
      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.access_token) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Login failed: ${data.error_description || data.msg || "Unknown error"}`,
            },
          ],
        };
      }

      authSessionToken = data.access_token;
      authApiKey = ""; // Clear API key in favor of session

      return {
        content: [
          {
            type: "text" as const,
            text: `Logged in as ${email}. Session token stored for subsequent calls.`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Login error: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// docs_api_key — set an API key for subsequent calls
server.tool(
  "docs_api_key",
  "Set an API key for authenticating with APIANT docs. Use this instead of login for programmatic access.",
  {
    api_key: z.string().describe("API key starting with 'ak_'"),
  },
  async ({ api_key }) => {
    if (!api_key.startsWith("ak_")) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Invalid API key format. Keys should start with 'ak_'.",
          },
        ],
      };
    }

    authApiKey = api_key;
    authSessionToken = ""; // Clear session in favor of API key

    return {
      content: [
        {
          type: "text" as const,
          text: `API key set (prefix: ${api_key.slice(0, 11)}...). Will be used for subsequent calls.`,
        },
      ],
    };
  }
);

// docs_list — list documents with optional filters
server.tool(
  "docs_list",
  "List documentation pages with optional filters",
  {
    type: z.string().optional().describe("Filter by doc type: guide, api-ref, tutorial, changelog"),
    product: z.string().optional().describe("Filter by product: api-apps, platform, mcp"),
    limit: z.number().optional().describe("Max results (default 50)"),
  },
  async ({ type, product, limit }) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (product) params.set("product", product);
    if (limit) params.set("limit", String(limit));

    const data = await apiFetch(`/api/docs?${params}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// docs_read — get a single document by slug
server.tool(
  "docs_read",
  "Read a specific documentation page by its slug",
  {
    slug: z.string().describe("The document slug (e.g., 'getting-started' or 'api-apps/oauth')"),
  },
  async ({ slug }) => {
    const data = await apiFetch(`/api/docs/${encodeURIComponent(slug)}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// docs_search — search documentation
server.tool(
  "docs_search",
  "Search documentation by keyword or natural language query",
  {
    query: z.string().describe("Search query"),
    product: z.string().optional().describe("Filter by product"),
    limit: z.number().optional().describe("Max results (default 10)"),
  },
  async ({ query, product, limit }) => {
    const params = new URLSearchParams({ q: query });
    if (product) params.set("product", product);
    if (limit) params.set("limit", String(limit));

    const data = await apiFetch(`/api/search?${params}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// docs_create — create a new document
server.tool(
  "docs_create",
  "Create a new documentation page",
  {
    slug: z.string().describe("URL slug for the document"),
    title: z.string().describe("Document title"),
    doc_body: z.string().describe("Document body in Markdown"),
    doc_type: z.enum(["guide", "api-ref", "tutorial", "changelog"]).describe("Document type"),
    description: z.string().optional().describe("Short description"),
    product: z.enum(["api-apps", "platform", "mcp"]).optional().describe("Product category"),
    status: z.enum(["draft", "published"]).optional().describe("Publication status (default: draft)"),
  },
  async ({ slug, title, doc_body, doc_type, description, product, status }) => {
    const data = await apiFetch("/api/docs", {
      method: "POST",
      body: JSON.stringify({ slug, title, doc_body, doc_type, description, product, status }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// docs_update — update an existing document
server.tool(
  "docs_update",
  "Update an existing documentation page",
  {
    slug: z.string().describe("Current slug of the document to update"),
    title: z.string().optional().describe("New title"),
    doc_body: z.string().optional().describe("New body in Markdown"),
    description: z.string().optional().describe("New description"),
    status: z.enum(["draft", "published", "archived"]).optional().describe("New status"),
    change_summary: z.string().optional().describe("Summary of what changed"),
  },
  async ({ slug, title, doc_body, description, status, change_summary }) => {
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (doc_body !== undefined) updates.doc_body = doc_body;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (change_summary !== undefined) updates.change_summary = change_summary;

    const data = await apiFetch(`/api/docs/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// docs_chat — ask a question about the documentation
server.tool(
  "docs_chat",
  "Ask a question and get an AI-generated answer based on APIANT documentation",
  {
    question: z.string().describe("The question to ask"),
    product: z.string().optional().describe("Limit search to a specific product"),
  },
  async ({ question, product }) => {
    const data = await apiFetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ question, product }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
