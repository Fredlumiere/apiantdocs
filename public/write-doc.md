---
name: write-doc
description: Write or update APIANT documentation with images via the docs MCP server. Use when creating step-by-step guides, tutorials, or any doc that needs images.
---

You are writing documentation for APIANT's docs platform (info.apiant.com) using the `apiant-docs` MCP tools.

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `docs_list` | List existing docs (filter by product, type) |
| `docs_read` | Read a doc by slug |
| `docs_search` | Search docs by keyword |
| `docs_create` | Create a new doc |
| `docs_update` | Update an existing doc |
| `docs_upload_image` | Upload a local image file, get a public URL |
| `docs_screenshot` | Capture a web page or element, auto-upload (requires Playwright) |
| `docs_chat` | Ask questions about existing docs |
| `docs_version` | Check for MCP server updates |

## Workflow: Writing a Doc with Images

### Step 1 — Gather images

**Option A: Screenshot a web page or element (preferred for UI docs)**
```
docs_screenshot(
  url: "https://example.com/page",
  selector: ".main-content",          // optional: capture specific element
  filename: "step1-dashboard.png",
  wait_for: ".loaded-indicator",       // optional: wait for element
  dark_mode: true                      // optional: match dark theme
)
```
Returns the URL and markdown tag automatically.

**Option B: Upload a local image file**
```
docs_upload_image(file_path="/path/to/image.png", filename="descriptive-name.png")
```

Save the returned URL for each image.

**Screenshot tips:**
- Use `selector` to capture just the relevant UI element, not the full page
- Use `wait_for` if content loads dynamically
- Use `delay_ms: 1000` if animations need to finish
- Use `full_page: true` for long scrollable pages
- Requires Playwright: `npm install -g playwright && npx playwright install chromium`

### Step 2 — Write the markdown
Structure the doc with:
- Clear heading hierarchy (H2 for steps, H3 for sub-sections)
- Concise instructions before each image
- Images embedded as `![Alt text](url)` on their own line
- Code blocks with language tags where relevant

### Step 3 — Create or update
For new docs:
```
docs_create(
  slug: "product/my-doc-slug",
  title: "Document Title",
  doc_body: "...markdown...",
  doc_type: "guide",      // guide | api-ref | tutorial | changelog
  product: "platform",    // api-apps | platform | mcp
  status: "published"     // draft | published
)
```

For existing docs:
```
docs_update(
  slug: "product/my-doc-slug",
  doc_body: "...updated markdown...",
  change_summary: "Added step 3 with screenshot"
)
```

## Doc Structure Template

```markdown
## Overview
Brief description of what this guide covers and who it's for.

## Prerequisites
- Requirement 1
- Requirement 2

## Step 1: [Action]
Instructions for this step.

![Step 1 screenshot](https://...url...)

## Step 2: [Action]
Instructions for this step.

![Step 2 screenshot](https://...url...)

## Troubleshooting
Common issues and solutions.
```

## Rules
- Always check if the doc exists first with `docs_search` or `docs_read` before creating
- Use descriptive filenames for images (not "screenshot.png" — use "dashboard-api-keys.png")
- Keep slugs lowercase, hyphenated, and nested under the product (e.g. "platform/getting-started")
- Set status to "draft" unless the user says to publish
- Upload ALL images before creating/updating the doc (so all URLs are ready)
- Include alt text on every image for accessibility

## Product Categories
- `api-apps` — API Apps, connectors, assemblies
- `platform` — APIANT platform features, editor, dashboard
- `mcp` — MCP server, Claude Code integration

## Doc Types
- `guide` — How-to guides and walkthroughs
- `api-ref` — API reference documentation
- `tutorial` — Step-by-step tutorials
- `changelog` — Release notes and changelogs

$ARGUMENTS
