# APIANT Documentation Content Strategy

**Prepared by:** Joy (Senior Product Manager)
**Date:** 2026-04-04
**Scope:** Full content audit and forward strategy for docs.apiant.com

---

## Executive Summary

APIANT's documentation has 444 published pages migrated from Archbee. The content is heavily weighted toward reference-style feature docs (391 guides) with minimal tutorials (5), no proper getting-started path, no API reference for the docs platform itself, and no MCP integration guide. The content quality is uneven -- platform docs are generally solid but terse, while product-specific docs (api-apps) mix marketing copy, support articles, and configuration guides without clear boundaries. The biggest strategic gap: there is no content that helps a new user go from "I signed up" to "I have a working automation" in under 30 minutes.

---

## 1. User Personas

### Persona A: End-User Customer ("The Subscriber")

**Who:** Non-technical business user who purchased a turnkey product (ShopConnect, ZoomConnect, CRMConnect, MailConnect, CalendarConnect). Runs a fitness studio, clinic, nonprofit, or small business.

**Needs:**
- Configure their subscription settings
- Understand what the integration does and does not sync
- Troubleshoot sync errors without contacting support
- Understand billing and account management

**Current journey:** Lands on "Explore our documentation" (which still links to old info.apiant.com URLs), then has to figure out which product section applies. No onboarding flow. No "I just bought ShopConnect, now what?" page.

**Content they read:** ZoomConnect settings, ShopConnect troubleshooting, CRMConnect matching rules, account management.

### Persona B: Automation Builder ("The Builder")

**Who:** Technical business user or consultant building custom automations on APIANT. Knows APIs conceptually but may not code. Uses the drag-drop automation editor.

**Needs:**
- Learn how the automation editor works end-to-end
- Understand triggers, actions, field mappings, conditional logic, subroutines
- Build and debug complex workflows
- Connect third-party apps via OAuth/API keys

**Current journey:** Starts at Automation Editor or Key Concepts. Has ~180 pages of granular feature docs but no guided learning path. "Your first automation" exists but isn't surfaced prominently.

**Content they read:** Automation Editor hierarchy (building, managing, troubleshooting), Forms, AI chatbots, MCP tools.

### Persona C: Integration Developer ("The Integrator")

**Who:** Developer building app connectors and assemblies on APIANT. Understands HTTP, REST, OAuth, XML/XPath. May be an APIANT partner or internal developer.

**Needs:**
- Build app assemblies (connectors, triggers, actions)
- Understand the assembly development lifecycle
- Manage content publishing (dev to prod)
- Build and deploy automation templates for customers
- Use the Module IDE

**Current journey:** "APIANT for Builders" section exists but is sparse (api-ref type, short). Assembly Editor has ~80 pages of good content but no clear curriculum.

**Content they read:** Assembly Editor, Building Assemblies, API Integrations, Module IDE, Templates.

### Persona D: AI/MCP Developer ("The AI Builder")

**Who:** Developer integrating APIANT with AI systems via MCP, building AI chatbots, or using APIANT as tool infrastructure for LLMs.

**Needs:**
- Understand how APIANT's MCP server works
- Build MCP tool automations
- Deploy AI chatbots with conversation memory
- Connect external AI models to APIANT workflows

**Current journey:** Single "MCP Tools" page exists. "AI chatbots" section has 5 pages. No mention of the docs MCP server, no architecture overview, no integration patterns.

**Content they read:** MCP Tools, AI chatbots, Building an AI chatbot.

### Persona E: SaaS/Enterprise Decision-Maker ("The Evaluator")

**Who:** CTO, VP Engineering, or technical PM evaluating APIANT as an integration platform for their organization.

**Needs:**
- Understand APIANT's capabilities vs. competitors (Zapier, Make, Workato)
- Evaluate security, scalability, compliance
- Understand the builder/integrator model
- See architecture diagrams and integration patterns

**Current journey:** "What is APIANT?" is classified as api-ref (wrong type), reads like a feature list without depth. No architecture overview, no security page, no comparison content.

**Content they read:** What is APIANT, APIANT for Builders, Key Concepts.

---

## 2. Content Gaps

### Critical Gaps (blocking user success)

| Gap | Impact | Notes |
|-----|--------|-------|
| **Getting Started guide per persona** | High | No onboarding path for any persona. "Your first automation" is buried 3 levels deep. |
| **Product setup guides** (ShopConnect, CRMConnect, etc.) | High | Subscribers have no "Day 1" doc. The "Explore our documentation" page still links to info.apiant.com. |
| **Broken internal links** | High | Many docs still reference `./Assembly Editor.mdx`, `./Automation Editor/...` -- Archbee-style relative paths that don't resolve. |
| **Proper "What is APIANT?" overview** | Medium | Current version reads like a bullet list. Needs architecture diagram, use cases, ecosystem overview. |

### Significant Gaps (limiting growth)

| Gap | Impact | Notes |
|-----|--------|-------|
| **API reference for APIANT's own APIs** | Medium | The docs platform has REST endpoints (`/api/docs`, `/api/search`, `/api/chat`). No public API documentation. |
| **MCP integration guide** | Medium | Only one page. No architecture diagram, no setup instructions for Claude/other MCP clients, no examples. |
| **Security & compliance page** | Medium | Nothing on data handling, encryption, SOC2, GDPR. Evaluators need this. |
| **Glossary / terminology page** | Medium | APIANT has unique terminology (assemblies, modules, gated triggers, protocol threads). No central glossary. |
| **Migration guides** | Low-Med | No content for users moving from Zapier, Make, or other platforms. |

### Missing Content Types

| Type | Current count | Target | Notes |
|------|--------------|--------|-------|
| Tutorials (step-by-step) | 5 | 25+ | Almost everything is a "guide" (reference-style). Users need walkthroughs. |
| API references | 37 | 50+ | Mostly AppConnect/Zapier connector refs. No platform API docs. |
| Changelogs | 11 | Ongoing | Only product-specific. No platform changelog. |
| Troubleshooting | 2 parent pages | 15+ | Need dedicated troubleshooting guides per product and common error patterns. |
| Architecture/conceptual | 0 | 5-10 | No system architecture docs, no data flow diagrams, no integration pattern guides. |
| Video content | 0 | 15+ | Zero embedded videos across 444 pages. |

---

## 3. Content Quality Assessment

### What works

- **Platform docs (Automation Editor, Assembly Editor):** Well-structured hierarchically. Consistent parent-child relationships. Individual feature pages are concise and focused.
- **Headings and scannability:** Most pages follow a clear heading structure that works well for sidebar navigation.
- **Screenshot coverage:** Many pages include screenshots, which is essential for a visual editor product.

### What needs rewriting

| Issue | Affected pages | Action |
|-------|---------------|--------|
| **Archbee link syntax** | 50+ pages | `<./Assembly Editor.mdx>` style links need migration to slug-based `/docs/assembly-editor` links. |
| **Archbee hint syntax** | 30+ pages | `<hint type="info">` is custom MDX, not standard Markdown. Needs conversion to blockquote callouts per style guide. |
| **Marketing copy in docs** | CRMConnect, ShopConnect landing pages | Product pages start with marketing language ("turnkey integration solution", "maximize your efficiency"). Docs should be factual. |
| **Mistyped doc_type** | ~10 pages | "What is APIANT?" is `api-ref` (should be `guide`). "Contact APIANT support" is `api-ref`. "APIANT for Builders" is `api-ref` (should be `guide`). Several pages have wrong types. |
| **Empty/thin pages** | ~20 pages | Automation Editor (392 chars), Assembly Editor (473 chars) -- these are landing pages with just one sentence and a screenshot. Should be substantive overviews. |
| **Dead external links** | Explore our documentation | Still links to `info.apiant.com` URLs. Must be updated to new slug-based paths. |
| **Inconsistent descriptions** | Many pages | Descriptions are SEO-stuffed from Archbee era. Should be concise 1-2 sentence summaries per style guide. |
| **Missing `product` field** | 5 pages | "What is APIANT?", "Explore our documentation", "Contact support", "Feature requests", "Sandbox" have no product tag. |

### Structural issues

1. **Flat vs. hierarchical:** The sidebar renders flat by product, but the content has deep nesting (up to 6 levels: `automation-editor/building-automations/editor-functionality/searching/replace-text-in-action-field-mappings`). This creates navigation problems.

2. **Duplicate content:** "Account Management" appears under both Automation Editor and Assembly Editor. "Automation Alert Reports" appears in both platform and multiple api-apps sections.

3. **Granularity imbalance:** Some topics are split into absurdly granular pages (e.g., "Add a folder", "Delete a folder", "Rename a folder", "Find a folder" as 4 separate docs). These should be consolidated into single comprehensive pages.

---

## 4. Tag Taxonomy

### Proposed tag dimensions

#### By Feature Area
- `triggers` -- trigger types, configuration, filters
- `actions` -- action types, field mappings, settings
- `subroutines` -- creating, testing, sharing
- `forms` -- form designer, form actions, form apps
- `ai` -- chatbots, MCP tools, AI field mapping
- `two-way-sync` -- sync patterns, conflict resolution
- `error-handling` -- error handlers, retries, alerts
- `data-transforms` -- data manipulation, lookup tables
- `editor` -- editor UI, navigation, search, groups

#### By App/Integration
- `mindbody` -- all Mindbody-related content
- `hubspot` -- all HubSpot-related content
- `shopify` -- all Shopify-related content
- `zoom` -- all Zoom-related content
- `activecampaign` -- all ActiveCampaign content
- `cliniko` -- all Cliniko content
- `donorperfect` -- all DonorPerfect content
- `zapier` -- AppConnect/Zapier connectors
- `mailchimp` -- MailConnect content

#### By Audience
- `end-user` -- subscriber-facing operational docs
- `builder` -- automation builder docs
- `integrator` -- assembly/connector developer docs
- `admin` -- account management, billing, security

#### By Content Purpose
- `getting-started` -- onboarding and first-steps content
- `how-to` -- task-oriented procedural content
- `reference` -- lookup information (settings, parameters, API specs)
- `conceptual` -- explanatory content (architecture, patterns, key concepts)
- `troubleshooting` -- diagnosis and resolution of common issues
- `changelog` -- version history and release notes

---

## 5. Homepage Redesign

The current docs homepage should serve as a routing hub, not a content dump. Each persona should find their path within 5 seconds.

### Proposed layout

```
[Search bar -- prominent, full-width]

[Hero section]
"APIANT Documentation"
"Build, manage, and scale automated workflows and API integrations."

[4 persona entry points -- card grid]

  +---------------------------+  +---------------------------+
  | I HAVE A SUBSCRIPTION     |  | I BUILD AUTOMATIONS       |
  | ShopConnect, ZoomConnect, |  | Learn the automation      |
  | CRMConnect, MailConnect   |  | editor and build workflows|
  | > Setup guides            |  | > Getting started         |
  | > Settings & config       |  | > Key concepts            |
  | > Troubleshooting         |  | > Your first automation   |
  +---------------------------+  +---------------------------+

  +---------------------------+  +---------------------------+
  | I BUILD INTEGRATIONS      |  | I BUILD WITH AI           |
  | Assembly editor, app      |  | MCP tools, AI chatbots,   |
  | connectors, templates     |  | AI-powered automations    |
  | > Assembly Editor guide   |  | > MCP integration guide   |
  | > Your first assembly     |  | > Build an AI chatbot     |
  | > Templates & deployment  |  | > Tool automations        |
  +---------------------------+  +---------------------------+

[Product sections -- collapsible]
  ShopConnect | ZoomConnect | CRMConnect | MailConnect | AppConnect | CalendarConnect

[Popular pages -- auto-generated from analytics or curated]
  Key Concepts | Trigger Types | Field Mappings | Error Handling | ...

[Recently updated -- auto-generated]
  Last 5-10 updated docs with timestamps
```

### Key changes from current state

1. **Remove the "Explore our documentation" page** entirely. The homepage IS the exploration page.
2. **Kill the info.apiant.com links.** Every link points to internal slugs.
3. **Surface "Your first X" content prominently.** Getting-started paths should be one click from the homepage.
4. **Product cards link directly to product landing pages** that have been rewritten as proper onboarding hubs (not the current thin landing pages).

---

## 6. Video Strategy

### Where video has highest impact

| Priority | Topic | Type | Est. length | Rationale |
|----------|-------|------|-------------|-----------|
| **P0** | Your first automation (end-to-end) | Screencast tutorial | 8-12 min | The #1 thing every new user needs. Text + screenshots isn't enough for a visual drag-drop editor. |
| **P0** | Automation Editor overview tour | Product walkthrough | 5-7 min | Orient users before they dive into docs. Show the UI, name the parts. |
| **P1** | Your first assembly | Screencast tutorial | 10-15 min | Critical for integrator onboarding. Current text doc is 12K chars -- dense. |
| **P1** | Building an AI chatbot | Screencast tutorial | 8-10 min | AI is a differentiator. Show the full build-to-deploy cycle. |
| **P1** | Product setup: ShopConnect | Screencast tutorial | 5-8 min | Subscriber onboarding. Show initial configuration and first sync. |
| **P1** | Product setup: ZoomConnect | Screencast tutorial | 5-8 min | Same rationale. ZoomConnect has the most api-apps content. |
| **P2** | Two-way sync explained | Conceptual animation | 3-5 min | Hard to understand from text alone. Animated data flow diagram. |
| **P2** | Debugging an automation (error to fix) | Screencast tutorial | 8-10 min | Processing history, graphical history, retry -- complex workflow. |
| **P2** | MCP tools: connecting APIANT to Claude | Screencast tutorial | 6-8 min | New capability, new audience. Visual demo is compelling. |
| **P3** | Field mappings deep dive | Screencast tutorial | 10-12 min | Core skill. 7 sub-pages of content that would benefit from video. |
| **P3** | Deploying templates to customers | Screencast tutorial | 8-10 min | Key workflow for integrators running multi-tenant setups. |
| **P3** | CRMConnect matching rules explained | Screencast + diagram | 5-7 min | The matching rules doc is 27K chars. A visual walkthrough would prevent support tickets. |

### Video production guidelines

- Host on a dedicated channel (YouTube or Wistia) for SEO; embed on doc pages via iframe
- Include chapter markers / timestamps for in-video navigation
- Keep branding minimal -- dark UI matches docs dark mode
- Every video gets a companion text doc (the video supplements the doc, not replaces it)
- Update cadence: re-record when UI changes significantly; add version badge to video embed

---

## 7. Priority Content to Create (Top 10)

Ranked by impact on user activation, support ticket deflection, and platform growth.

### 1. Getting Started: Your First Automation (rewrite)
**Type:** Tutorial | **Product:** platform | **Audience:** builder
**Why:** The existing "Your first automation" page is decent but buried. Needs to be a flagship tutorial: estimated time, prerequisites, a real-world use case (not just "click plus"), and a clear success state. This is the #1 page that determines whether a new user activates or churns.

### 2. Getting Started: Product Setup Guides (one per product)
**Type:** Tutorial | **Products:** ShopConnect, ZoomConnect, CRMConnect, MailConnect, CalendarConnect
**Why:** Every subscriber needs a "Day 1" doc. Currently there is no post-purchase onboarding content. Each guide: prerequisites, initial configuration, verify first sync, common settings, where to get help. Create 5 docs, templatized.

### 3. APIANT Platform Overview (rewrite "What is APIANT?")
**Type:** Guide | **Product:** platform | **Audience:** all
**Why:** The current page is a bullet list. Needs: architecture diagram (automation editor + assembly editor + apps + MCP), ecosystem overview, use cases by vertical, positioning vs. Zapier/Make/Workato (factual, not marketing). This is the page every evaluator and new user reads first.

### 4. MCP Integration Guide
**Type:** Guide | **Product:** platform/mcp | **Audience:** ai-builder
**Why:** MCP is a differentiator and the current single page is insufficient. Needs: what MCP is, how APIANT implements it, setup instructions for Claude Desktop / other MCP clients, building MCP tool automations, architecture diagram, example use cases.

### 5. Troubleshooting Guide: Common Errors and Fixes
**Type:** Guide | **Product:** platform | **Audience:** builder, end-user
**Why:** No centralized troubleshooting content. Build a page covering: reading error alerts, using processing history to diagnose, common error patterns (auth failures, rate limits, field mapping mismatches, webhook delivery failures), resolution steps.

### 6. Glossary of APIANT Terminology
**Type:** Reference | **Product:** platform | **Audience:** all
**Why:** APIANT has 20+ unique terms (assembly, module, subroutine, gated trigger, protocol thread, latch group, collector, etc.). New users encounter these everywhere. A single glossary page with anchor links enables cross-referencing from every doc.

### 7. Assembly Development Lifecycle (expanded)
**Type:** Guide | **Product:** platform | **Audience:** integrator
**Why:** The current "Assembly development cycle" page exists but is thin. Needs: full lifecycle from concept to production, dev/test/prod environments, versioning, publishing, deploying templates to customer accounts. This is the integrator's playbook.

### 8. AI Capabilities Overview
**Type:** Guide | **Product:** platform | **Audience:** builder, ai-builder
**Why:** APIANT has AI chatbots, AI field mapping, MCP tools, and conversation memory -- scattered across different sections with no unified view. Create a landing page that maps the full AI feature set and links to each capability.

### 9. Automation Patterns Cookbook
**Type:** Tutorial collection | **Product:** platform | **Audience:** builder
**Why:** Common patterns that users repeatedly ask about: two-way sync setup, webhook-to-action pipeline, form-to-automation flow, scheduled batch processing, error handling with retry logic, subroutine patterns. Each pattern: problem, solution diagram, step-by-step, example.

### 10. Docs Platform API Reference
**Type:** API-ref | **Product:** platform | **Audience:** integrator, ai-builder
**Why:** The docs platform itself has REST endpoints and an MCP server. Document them: `GET/POST /api/docs`, `GET /api/search`, `POST /api/chat`, MCP tools (list, read, search, create, update, chat). Enables programmatic access and AI integration with the docs.

---

## Appendix: Content Distribution Summary

| Product | Count | % of total |
|---------|-------|------------|
| platform | 301 | 68% |
| api-apps | 138 | 31% |
| none | 5 | 1% |

| Doc type | Count | % of total |
|----------|-------|------------|
| guide | 391 | 88% |
| api-ref | 37 | 8% |
| changelog | 11 | 2.5% |
| tutorial | 5 | 1% |

| api-apps breakdown (approximate) | Count |
|-----------------------------------|-------|
| ZoomConnect | ~45 |
| ShopConnect | ~25 |
| CRMConnect (all variants) | ~25 |
| AppConnect/Zapier connectors | ~25 |
| MailConnect | ~3 |
| CalendarConnect | ~1 |
| Other | ~14 |

---

## Appendix: Immediate Fixes (pre-strategy)

These should be done before new content is created:

1. **Fix all internal links** -- batch-replace `<./Something.mdx>` patterns with `/docs/slug` format
2. **Convert `<hint>` tags** -- replace with blockquote callout syntax per style guide
3. **Fix `doc_type` mismatches** -- "What is APIANT?" and "Contact APIANT support" are not api-refs
4. **Set `product` field** on the 5 untagged docs
5. **Redirect "Explore our documentation"** -- replace info.apiant.com links with internal slugs
6. **Consolidate micro-pages** -- merge "Add a folder" + "Delete a folder" + "Rename a folder" + "Find a folder" into one "Managing folders" page. Apply same pattern to other 3-4 page clusters.
7. **Rewrite thin landing pages** -- Automation Editor (392 chars) and Assembly Editor (473 chars) need to be substantive 1000+ char overviews with navigation guidance.
