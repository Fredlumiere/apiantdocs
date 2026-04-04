# APIANT Docs Restructuring Plan

**Author:** Sam (Principal Software Architect)
**Date:** 2026-04-04
**Scope:** Complete content reorganization of apiantdocs (444 published documents)

---

## 1. Current State Assessment

### What exists

| Metric | Count |
|--------|-------|
| Total published docs | 444 |
| product: platform | 301 |
| product: api-apps | 138 |
| product: null | 5 |
| doc_type: guide | 391 |
| doc_type: api-ref | 37 |
| doc_type: changelog | 11 |
| doc_type: tutorial | 5 |
| Top-level (no parent) | 26 |
| Null descriptions | 61 |
| Duplicate titles | 8 sets |
| Max slug depth | 5 levels |
| Docs at 5 levels deep | 72 |

### Critical problems

**1. No information architecture -- just a migrated file tree.**
The current hierarchy is a 1:1 port of the old Archbee folder structure. Slugs like `automation-editor/managing-automations/gear-menu/processing-menu/disabling-data-storage` are filesystem paths, not navigable documentation URLs. 72 docs are 5 levels deep. Users will never browse to these.

**2. Two audiences jammed into one flat product taxonomy.**
`product` has two values that matter: `platform` (301 docs for builders/integrators) and `api-apps` (138 docs for end-users of pre-built apps). These audiences have fundamentally different needs, yet both land in the same sidebar grouped only by product.

**3. API Apps docs are scattered across 17 different slug prefixes.**
CRMConnect alone fragments into 10 separate top-level slugs (`crmconnect-mindbody-to-hubspot`, `crmconnect-cliniko-to-hubspot`, `crmconnect-donorperfect-to-keap`, etc.). Each has 1-4 docs. No shared structure, no shared concepts, no cross-referencing.

**4. doc_type is underused and sometimes wrong.**
391 of 444 docs are `guide`. The style guide defines 4 types (guide, api-ref, tutorial, changelog) but almost nothing is typed correctly. `assembly-editor/building-assemblies/editor-functionality/assembly-versioning` is a `changelog`. `apiant-for-builders` is an `api-ref`. `automation-editor/managing-automations/gear-menu/manage-menu/comparing-versions` is a `changelog`.

**5. 61 docs have null descriptions.**
Every AppConnect prebuilt connector doc (20+) has no description. Most CRMConnect changelogs have none. Several core AI chatbot docs have none. This breaks search, meta tags, and RAG retrieval.

**6. 3 docs have broken AI-generated descriptions.**
"Unfortunately, without any information to work with, it is not possible to create a short SEO description" is literally a description in production.

**7. Descriptions that do exist are SEO slop.**
Phrases like "Learn how to effortlessly...", "Discover the extensive features...", "Streamline your workflow..." -- this is bulk-generated content marketing, not technical documentation. The style guide explicitly says "No marketing fluff in docs."

**8. Orphaned/dead-end docs.**
- `shadow-docs/crmconnect-mindbody-highlevel` -- shadow doc in production, no parent
- `sandbox` -- test content published
- `explore-our-documentation` -- meta-doc with no product
- `feature-requests` -- belongs in a product, not docs
- `contact-apiant-support` -- no product assigned
- `what-is-apiant` -- no product assigned

**9. Duplicate content.**
- "Account Management" appears under both `automation-editor/` and `assembly-editor/` with the assembly-editor version explicitly saying "identical account management system" -- should be one doc.
- "Automation Alert Reports" appears 3 times (platform general, ZoomConnect, ShopConnect).
- "Linked Accounts" appears 3 times.
- "Editor functionality" duplicated across both editors.

**10. No entry points.**
No getting started guide. No quickstart. No "what should I read first" for either audience. The homepage shows product cards and recent docs -- that's it.

---

## 2. Proposed Taxonomy

### Top-level categories (6)

```
/docs/getting-started/          # New -- entry points for both audiences
/docs/platform/                 # Was: automation-editor + assembly-editor + apiant-for-builders
/docs/apps/                     # Was: api-apps (all pre-built products)
/docs/api/                      # New -- API reference, MCP, webhooks, REST
/docs/guides/                   # New -- cross-cutting tutorials and how-tos
/docs/changelog/                # New -- all release notes in one place
```

### Category breakdown

#### `/docs/getting-started/`
| Slug | Title | Status |
|------|-------|--------|
| `getting-started/what-is-apiant` | What is APIANT? | Rewrite existing |
| `getting-started/quickstart-automation` | Build Your First Automation | New |
| `getting-started/quickstart-assembly` | Build Your First Assembly | Refactor from `assembly-editor/building-assemblies/your-first-assembly` |
| `getting-started/quickstart-api-app` | Set Up Your First API App | New |
| `getting-started/key-concepts` | Key Concepts | Merge from `automation-editor/key-concepts` + `assembly-editor/key-concepts` |
| `getting-started/account-setup` | Account Setup | Merge from duplicate Account Management docs |

#### `/docs/platform/`
Subcategories (flatten current 5-level depth to max 3):

```
platform/
  automation-editor/
    building-automations/       # triggers, actions, field-mappings, conditionals, loops, subroutines
    forms/                      # merge forms-overview/* into single section
    ai-chatbots/                # keep as-is, add descriptions
    mcp-tools/                  # new content needed
    system-utilities/           # collector, datetime, feed, file, http, etc.
    data-transforms/
    datafiles/
    tips-and-tricks/
  managing-automations/
    dashboard/                  # folders, lists, import/export -- flatten
    execution/                  # merge execution-management + processing-history
    settings/                   # merge gear-menu/processing-menu + gear-menu/manage-menu -- flatten
  assembly-editor/
    building-assemblies/        # editor, subassemblies, http-xml, your-first-assembly
    api-integrations/           # triggers, actions, apps, service-accounts, error-retries
    managing-content/           # catalog, export/import, public/private
    other-assembly-types/       # batch-jobs, error-handlers, rss, web-services
  account-management/           # ONE doc, not duplicated per editor
  app-connections/              # ONE section, not under automation-editor
  builder-tools/
    module-ide/                 # from apiant-for-builders/module-ide
    automation-templates/       # from apiant-for-builders/automation-templates
    development-server/
    tenants-and-linked-accounts/
    shared-app-connections/
  inline/                       # from apiant-inline
```

Key structural changes:
- Max depth: 3 levels (category/subcategory/page)
- `gear-menu/processing-menu/` and `gear-menu/manage-menu/` are abolished -- these are UI paths, not information categories. Content reorganizes by function.
- `automation-editor/building-automations/editor-functionality/searching/` (6 docs about different search types) becomes one comprehensive doc: `platform/automation-editor/building-automations/searching`
- `dashboard/folders/` (6 docs: add, delete, rename, find, move, determine) becomes one doc: `platform/managing-automations/dashboard/folders`
- `groups/` (4 docs: create, open-all, rename, ungroup) becomes one doc

#### `/docs/apps/`
Reorganize by product family, not by integration pair:

```
apps/
  crmconnect/
    overview                    # What CRMConnect does, supported pairings
    mindbody-hubspot/           # Merge crmconnect-mindbody-to-hubspot/*
    mindbody-activecampaign/    # Merge crmconnect-mindbody-to-activecampaign/*
    mindbody-keap/
    mindbody-klaviyo/
    mindbody-zoho-crm/
    mindbody-highlevel/         # From shadow-docs/ -- either publish properly or delete
    cliniko-hubspot/
    cliniko-activecampaign/
    cliniko-salesforce/
    donorperfect-hubspot/
    donorperfect-activecampaign/
    donorperfect-keap/
    common/                     # Shared concepts: alert-reports, linked-accounts, phone-formatting
  zoomconnect/
    overview
    setup/                      # Merge general + settings
    mindbody/
    zoom/
    email-sms/
    bots/
    troubleshooting/
  shopconnect/
    overview                    # From shopconnect-shopify-to-mindbody top-level
    setup/
    product-sync/
    order-processing/
    troubleshooting/
  calendarconnect/
    overview
  mailconnect/
    overview
  appconnect/
    overview
    prebuilt-connectors/        # Keep but add descriptions to all 20+ docs
```

#### `/docs/api/`
Mostly new content:

```
api/
  overview                      # API architecture, auth, rate limits
  rest-api/                     # Docs API reference (create, read, update, delete docs)
  mcp-server/                   # @apiant/docs-mcp -- 6 tools documented
  webhooks/                     # How APIANT webhooks work, registering, payloads
  authentication/               # OAuth, API keys, service accounts
  rate-limiting/                # Merge from scattered rate-limit docs
  assembly-web-services/        # From assembly-editor/other-assembly-types/web-services
```

#### `/docs/guides/`
Cross-cutting tutorials that span products:

```
guides/
  two-way-sync-patterns         # New
  error-handling-best-practices # Merge scattered error-handling docs
  data-mapping-patterns         # New
  building-ai-chatbots          # Consolidate from ai-chatbots section
  form-design-patterns          # Consolidate from forms section
  deployment-workflows          # From publishing + deploying templates
  hipaa-compliance              # From disabling-data-storage + disabling-logging
  migration-guide               # New -- migrating from Zapier, Make, etc.
```

#### `/docs/changelog/`
```
changelog/
  platform/                     # Automation editor, assembly editor releases
  crmconnect/                   # All CRMConnect version notes
  zoomconnect/                  # ZoomConnect v3, v4 notes
  shopconnect/                  # ShopConnect releases
```

---

## 3. Tag Schema

### Tag categories

| Category | Tag prefix | Examples |
|----------|-----------|----------|
| Product | (none) | `crmconnect`, `zoomconnect`, `shopconnect`, `calendarconnect`, `appconnect`, `mailconnect` |
| Source system | `src:` | `src:mindbody`, `src:cliniko`, `src:donorperfect`, `src:shopify`, `src:calendly` |
| Destination system | `dst:` | `dst:hubspot`, `dst:activecampaign`, `dst:keap`, `dst:klaviyo`, `dst:salesforce`, `dst:zoho`, `dst:mailchimp`, `dst:highlevel` |
| Platform concept | (none) | `automation`, `assembly`, `trigger`, `action`, `webhook`, `polling`, `subroutine`, `form`, `module`, `template` |
| Feature area | (none) | `ai`, `chatbot`, `mcp`, `error-handling`, `data-transform`, `rate-limit`, `auth`, `oauth`, `api-key` |
| Audience | `audience:` | `audience:end-user`, `audience:builder`, `audience:admin`, `audience:enterprise` |
| Difficulty | `level:` | `level:beginner`, `level:intermediate`, `level:advanced` |

### Tag rules

1. Every doc gets 2-5 tags minimum.
2. Every API Apps doc gets at least one source system tag and one destination system tag.
3. `audience:` tag is mandatory on all docs.
4. `level:` tag is mandatory on tutorials and getting-started docs.
5. Tags are stored in `metadata.tags` as a JSON array.

### Example tag assignments

| Doc | Tags |
|-----|------|
| CRMConnect: Mindbody to HubSpot setup | `crmconnect`, `src:mindbody`, `dst:hubspot`, `audience:end-user`, `level:beginner` |
| Webhook Triggers (assembly editor) | `assembly`, `trigger`, `webhook`, `audience:builder`, `level:advanced` |
| AI Field Mapping Assistant | `automation`, `action`, `ai`, `field-mapping`, `audience:builder`, `level:intermediate` |
| Disabling Data Storage (HIPAA) | `automation`, `compliance`, `hipaa`, `audience:admin` |
| ZoomConnect BOT - Send SMS | `zoomconnect`, `src:mindbody`, `sms`, `bot`, `audience:end-user` |

---

## 4. Content Operations: Merge, Split, Delete

### Merge (reduce doc count by ~80)

| Action | Current docs | Target |
|--------|-------------|--------|
| Merge Account Management | `automation-editor/account-management/*` + `assembly-editor/account-management/*` | `platform/account-management/` (single section, 6 pages max) |
| Merge Key Concepts | `automation-editor/key-concepts` + `assembly-editor/key-concepts` | `getting-started/key-concepts` |
| Merge Automation Alert Reports (x3) | platform + zoomconnect + shopconnect versions | One `platform/` doc + cross-links from app docs |
| Merge Linked Accounts (x3) | Same pattern | One `platform/account-management/linked-accounts` doc |
| Merge folder operations (6 docs) | add, delete, rename, find, move, determine folder | One doc: `managing-automations/dashboard/folders` |
| Merge group operations (4 docs) | create, open-all, rename, ungroup | One doc: `building-automations/groups` |
| Merge search operations (7 docs) | search by name, setting, field-mapping, field-name, step-number, replace-name, replace-mapping | One doc: `building-automations/searching` |
| Merge copy-paste operations (4 docs) | single, multiple, clipboard, field-mappings | One doc: `building-automations/copy-paste` |
| Merge processing menu (8 docs) | alert-email, concurrency, data-storage, logging, latch, stored-data, reset, turn-off-on-error | Two docs: `execution-settings` + `data-management` |
| Merge manage menu (14 docs) | copy, delete, deploy, download-xml, export, determine-ref, get-template-info, edit-notes, obtain-uuid, rename, publish, publish-prod, tag, version, compare, protect, edit-schedule, share, edit-polling, edit-windows | Three docs: `automation-lifecycle` + `deployment` + `versioning` |
| Merge execution history (3 docs) | drilling-in, retrying, searching | One doc: `execution-history` |
| Merge data row history (3 docs) | obtain-link, retry-single, retry-multiple | One doc: `data-row-history` |
| Merge graphical history (4 docs) | step-number, searching, input-output, item-details | One doc: `graphical-history` |

**Estimated reduction: 444 -> ~320 docs after merges.**

### Split

| Current doc | Split into |
|-------------|-----------|
| `assembly-editor/api-integrations` (massive overview) | Overview + separate integration patterns doc |
| `shopconnect-shopify-to-mindbody` (31 docs, flat) | Organized into setup/, sync/, orders/, troubleshooting/ |

### Delete

| Doc | Reason |
|-----|--------|
| `sandbox` | Test content in production |
| `explore-our-documentation` | Meta-doc, replace with proper homepage navigation |
| `feature-requests` | Not documentation -- move to product feedback tool |
| `shadow-docs/crmconnect-mindbody-highlevel` | Shadow doc with null description. Either promote to real doc or delete. |

---

## 5. Navigation Structure

### Primary navigation (sidebar)

```
Getting Started
  What is APIANT?
  Key Concepts
  Quickstart: Automation
  Quickstart: Assembly
  Quickstart: API App
  Account Setup

Platform
  Automation Editor
    Building Automations
    Managing Automations
  Assembly Editor
    Building Assemblies
    API Integrations
    Managing Content
  Account & Connections
  Builder Tools

Apps
  CRMConnect
  ZoomConnect
  ShopConnect
  CalendarConnect
  MailConnect
  AppConnect

API Reference
  REST API
  MCP Server
  Webhooks
  Authentication

Guides
  (tutorial titles)

Changelog
  (by product)

Support
  Contact Support
```

### Navigation rules

1. Sidebar shows max 2 levels. Third level appears as an on-page TOC.
2. Each sidebar section is collapsible.
3. Current doc highlighted. Breadcrumbs show full path.
4. Product filter in sidebar filters everything (same as current, but applied globally).
5. Tags power a "Related docs" section at the bottom of every page.
6. Search results show tags as filterable facets.

### Secondary navigation

- **Breadcrumbs** on every page: `Home > Platform > Automation Editor > Building Automations > Triggers`
- **On-page TOC** (right rail): Generated from H2/H3 headings
- **Related docs** (bottom): Driven by shared tags, max 5 items
- **"Was this helpful?"** feedback on every page

---

## 6. Missing Content

### High priority (create before restructuring)

| Doc | Type | Why |
|-----|------|-----|
| Getting Started: What is APIANT? | guide | Rewrite of existing orphan. Needs product positioning, audience routing, architecture overview. |
| Getting Started: Quickstart Automation | tutorial | Zero-to-working-automation in 10 minutes. The most critical missing doc. |
| Getting Started: Quickstart API App | tutorial | Install CRMConnect or ZoomConnect end-to-end. |
| API Reference: REST API | api-ref | The docs platform itself has an API. It is undocumented for external consumers. |
| API Reference: MCP Server | api-ref | 6 MCP tools exist but are only documented in code comments. |
| API Reference: Authentication | guide | OAuth flows, API key management, service accounts -- scattered across 5+ docs currently. |
| API Reference: Webhooks | guide | Webhook concepts are spread across trigger assembly docs. Need a standalone reference. |

### Medium priority (create during restructuring)

| Doc | Type | Why |
|-----|------|-----|
| Guides: Error Handling Best Practices | guide | Consolidate error-handling info from action settings, alert reports, retries |
| Guides: Two-Way Sync Patterns | guide | CRMConnect's core pattern, but never explained generically |
| Guides: HIPAA Compliance | guide | Privacy/logging docs exist but are not discoverable |
| Guides: Migration from Zapier/Make | tutorial | Competitive positioning, zero docs exist |
| Apps: CRMConnect Overview | guide | No single doc explains what CRMConnect is across all pairings |
| Apps: ShopConnect Overview | guide | Same problem |
| Platform: Rate Limiting | guide | 3 separate rate-limit mentions, no comprehensive doc |
| Platform: MCP Tools in Automations | guide | New feature, doc has null description |

### Low priority (fill gaps over time)

| Doc | Type | Why |
|-----|------|-----|
| Guides: Building Custom Modules | tutorial | Module IDE docs exist but no end-to-end tutorial |
| Guides: Form Design Patterns | guide | Forms section is large but lacks best practices |
| API: SDK/Client Libraries | api-ref | If/when client SDKs exist |
| Platform: Admin Console | guide | Referenced in tenant docs but never documented |
| Apps: Integration Status Page | guide | Monitoring and health checks for running integrations |

---

## 7. Description Cleanup

### Immediate actions

1. **Delete 3 broken descriptions** ("Unfortunately...", "I'm sorry...") and replace with real descriptions.
2. **Write descriptions for 61 null-description docs.** Prioritize by traffic: AppConnect connectors, AI chatbot docs, CRMConnect changelogs.
3. **Rewrite SEO slop descriptions.** Search for "Learn how to effortlessly", "Discover the extensive", "Streamline your workflow", "With this comprehensive document" and rewrite to match the style guide's technical, direct voice.

### Description format

Every description should follow this pattern:
```
{What the thing is/does}. {What the reader will learn or be able to do}. {Scope/constraints if relevant}.
```

Example:
- Before: "Learn how to effortlessly embed a form on any webpage with this helpful guide. Follow the step-by-step instructions and view accompanying images..."
- After: "Embed APIANT forms on external webpages using the JavaScript embed code. Covers embed script setup, container configuration, and cross-origin considerations."

---

## 8. Implementation Order

### Phase 1: Foundation (week 1-2)
1. Add `metadata.tags` column if not present. Write migration script.
2. Fix broken descriptions (3 docs).
3. Create redirect mapping: old slug -> new slug.
4. Write the 7 high-priority new docs.
5. Build sidebar component that supports the new hierarchy.

### Phase 2: Restructure Platform docs (week 3-4)
1. Execute merges (folder ops, group ops, search ops, menu ops).
2. Flatten 5-level-deep slugs to 3 levels.
3. Reparent docs into new taxonomy.
4. Assign tags to all platform docs.
5. Rewrite platform descriptions (301 docs).

### Phase 3: Restructure API Apps docs (week 5-6)
1. Create product family landing pages (CRMConnect overview, etc.).
2. Consolidate CRMConnect from 10 top-level slugs into `apps/crmconnect/`.
3. Reorganize ShopConnect (31 docs) into logical subcategories.
4. Assign tags to all API Apps docs.
5. Write missing descriptions (61 docs, mostly here).
6. Delete orphaned docs (sandbox, shadow-docs, etc.).

### Phase 4: New content & polish (week 7-8)
1. Write medium-priority new docs.
2. Add cross-references and "Related docs" sections.
3. Build changelog aggregation page.
4. Verify all redirects from old Archbee URLs still work.
5. Re-index embeddings for updated/moved docs.
6. REINDEX IVFFlat after bulk changes.

---

## 9. Slug Migration Strategy

Every slug change needs a 301 redirect. The system already has ~530 Archbee redirects in `lib/archbee-redirects.ts`. Add a new redirect layer for internal restructuring.

### Redirect format

```typescript
// lib/restructure-redirects.ts
export const restructureRedirects: Record<string, string> = {
  '/docs/automation-editor/managing-automations/gear-menu/processing-menu/disabling-data-storage':
    '/docs/platform/managing-automations/execution/data-management',
  '/docs/automation-editor/building-automations/editor-functionality/searching/search-by-action-name':
    '/docs/platform/automation-editor/building-automations/searching',
  // ... ~200 entries
};
```

### Rules
- Never delete a slug without a redirect.
- Merged docs redirect all old slugs to the single new slug.
- Test redirects before deploying by diffing old sitemap vs new.

---

## 10. Success Metrics

After restructuring:

| Metric | Current | Target |
|--------|---------|--------|
| Max navigation depth | 5 | 3 |
| Docs with null description | 61 | 0 |
| Docs with marketing-style description | ~200 | 0 |
| Duplicate titles | 8 sets | 0 |
| Docs with null product | 5 | 0 |
| Orphaned docs | 4+ | 0 |
| doc_type accuracy | ~60% | 100% |
| Docs with tags | 0 | 444 |
| Entry point docs (getting started) | 0 | 6 |
| API reference docs | 0 real | 7+ |
| Cross-cutting guides | 0 | 8+ |
| Total doc count | 444 | ~350 (after merges + new content) |
