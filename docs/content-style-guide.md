# Content Style Guide — apiantdocs

## Audience

Primary readers are plugin-first integrators: technically capable adults who configure SaaS, read JSON, and understand APIs at a high level. They are not necessarily engineers writing application code. They use the platform through Claude Code; the UI is the fallback.

Write to that reader:

- Assume they know what an API key is. Don't assume they've read the OAuth 2.1 spec.
- Assume they can run a `curl` command. Don't assume they have a Node.js project handy.
- Assume they want to ship an integration today. Don't assume they have a week to study.
- Don't oversimplify. Tutorials that explain what HTTP is condescend. Tutorials that skip "where does the webhook URL come from" frustrate.

## Voice & Tone

**Technical, confident, direct.**

- State what things do, not what they "help you" do
- No marketing fluff in docs — save that for apiant.com
- Define APIANT-specific concepts once and link back
- "You" for the reader, "APIANT" or "the platform" for the product (not "we")

## Naming the actor

Claude is the actor that drives the platform on the user's behalf. Use "Claude" as the noun. Never "the AI", "the assistant", or "the agent".

The chain to keep visible when relevant: the user directs Claude in plain English → Claude invokes MCP tools → the tools perform actions on APIANT (build, test, deploy, inspect).

Adjective uses of "AI" are fine when describing categories rather than actors: "AI-first integration platform", "AI-powered chat widget". The rule applies to the noun.

## The Lede

The first sentence commits to a concrete fact about the page's subject. It does not introduce, frame, or summarize.

Bad:
- *"This guide walks you through configuring webhooks in APIANT."*
- *"Webhooks are an important part of any integration platform."*
- *"In this section, we'll cover everything you need to know about credentials."*

Good:
- *"A webhook trigger fires an automation when an external system sends an HTTP POST to a URL APIANT generates for you."*
- *"The keyvault stores credentials per tenant. Claude prompts you to paste them when a build needs them."*

Rule: if your first sentence could be deleted without losing information, delete it.

## Forbidden Patterns

Never write:

1. **AI marketing prose.** No "AI builds, tests, ships." No "supercharge." No "powerful." No "seamlessly." No "harness."
2. **Meta-framing.** No "in this guide we'll," "let's dive in," "this page covers," "we'll start by."
3. **Faux-engagement.** No "Whether you're X or Y, this page is for you." No "You might be wondering."
4. **Em dashes for cadence.** Em dashes are for parenthetical clauses only. Two per page is a smell; five is broken.
5. **Three-clause throat-clearing.** "APIANT is a powerful, flexible, and modern integration platform" is three adjectives doing the work of zero. Pick one or none.
6. **"Simply" / "just."** They lie about effort and patronize the reader. Watch the second-clause leak too: "...like any other field" → "just like any other field" sneaks "just" in mid-sentence. ✗ *"as just another action in the flow"* ✓ *"as another action in the automation"*
7. **The royal "we."** "We" appears only in changelogs to attribute decisions.
8. **Hidden conditionals.** "When working with X, Y is Z" — say "X requires Z" or "X behaves Z because…". ✗ *"These show up as actions in the catalog whenever the vendor's API supports them."* ✓ *"Whatever the vendor's API supports shows up as an action in the catalog."*
9. **MCP tool names in instructional prose.** Don't expose plugin internals (`auto_*`, `catalog_*`, `exec_*`, `asm_*`, etc.) when telling the reader what to ask Claude or what Claude does. The integrator never invokes these tools themselves; the leak is noise. ✗ *"Ask Claude 'set this active' (it calls `auto_set_active`)."* ✓ *"Ask Claude 'set this active'."*

   **Skill-trigger slash-commands are also off-limits.** Slash-commands like `/build-automation`, `/test-automation`, `/register-oauth-app`, `/deploy-automation`, `/build-form` are aliases for natural-language phrases the integrator already says ("test it", "build me an automation"). Real integrators don't type them — they describe what they want. Referencing the slash-command in prose makes the doc sound machine-flavored and pushes a UX no one uses. Describe what Claude does, not the trigger. ✗ *"Run `/test-automation` to verify it works."* ✓ *"Ask Claude to test it."*

   **Utility/setup commands the integrator types directly are fine.** `/apiant-setup` is a verification check the integrator runs by hand — keep referencing it. Same goes for env vars (`APIANT_DEV_URL`), file paths (`~/.claude/.mcp.json`), and UI labels the integrator actually sees.

   **Exception:** terminal transcripts showing tool calls scrolling past as a teaching aid — inside those, MCP tool names and skill-trigger slash-commands are content, not prose.

10. **Anti-instructive contrasts.** Don't introduce concepts only to dismiss them. The pattern looks like *"You don't have to know X"* / *"You don't think in terms of Y"* — but X and Y are now in the reader's head. If the concept doesn't matter to them, don't name it. ✗ *"You don't have to know which file or table the credential lives in."* ✗ *"You don't think in terms of XML, modules, or wires."* ✓ *just delete the sentence; the surrounding prose already establishes what the integrator does instead.*

11. **Anthropomorphizing Claude for platform mechanisms.** Claude is the actor for things Claude actually does at runtime — calling tools, asking questions, reading a vendor portal. Platform infrastructure (keyvault stores credentials, the engine deduplicates polling triggers, the run engine persists state to XML) has its own mechanisms; name those. Distinct from runtime behavior claims, which still need SKILL.md grounding. ✗ *"Claude has to remember the credentials."* ✓ *"The keyvault stores credentials."* ✗ *"Claude knows."* ✓ *"Claude wires up storage for them as it builds."* ✗ *"Claude compresses that."* ✓ *"Claude does it in days."*

12. **Terminology drift.** APIANT calls them **automations** and **runs** (the unit of execution). Don't switch to "flow" or "workflow" mid-page. Same for *connector* (not "integration" or "app" interchangeably), *trigger*, *action*, *step*. Pick the term the rest of the page uses and stay there. ✗ *"as another action in the flow"* ✓ *"as another action in the automation"*

13. **Defensive framing.** Telling the reader the examples are real ("These aren't toy examples") is a tell that the writing isn't trusting itself. Cut the defense; let the example carry itself. ✗ *"These aren't toy examples. They're customer-facing products running at scale."* ✓ *"These are customer-facing products running at scale."* (or just lead with the example.)

14. **Future tense for present behavior, and actor-hiding passives.** Use present tense when describing what the platform/Claude does. Future tense is for what *will* happen after a not-yet-taken action. Passive voice is fine when the actor genuinely doesn't matter ("the request is encrypted") but not when it hides who or what acts. ✗ *"Claude will pick a sensible error policy."* ✓ *"Claude picks a sensible error policy."* ✗ *"the linked-account behavior is handled."* ✓ *"the platform routes each event to the right linked account."*

If you wrote one of these, delete the sentence and start the paragraph over.

## Exemplars

Read these pages before drafting new content. New content should sit alongside them without sounding off.

- `/docs/understanding-apiant/the-four-core-objects/integration-suites` — production proof-points with live links; commits to specific automation counts.
- `/docs/building-with-the-plugin` — strongest one-liner lede; suite-of-automations framing as the goal.
- `/docs/get-started` — tight scope, no preamble, lists pages with concrete time estimates.

When in doubt about voice, structure, or specificity, check against these.

## Document Structure by Type

These templates are starting points for the four common page types. Many pages don't fit any of them; see "When the templates don't apply" below.

### guide

```markdown
# {Feature Name}

{1-2 sentence description.}

## Overview
## Key Concepts
## How It Works
## Configuration
## Examples
## Related
```

### api-ref

```markdown
# {Endpoint/Module Name}

{One-line description.}

## Endpoint
## Authentication
## Parameters
## Request Body
## Response
## Errors
## Example
```

### tutorial

```markdown
# {Task: Verb + Object}

{What you'll accomplish and estimated time.}

## Prerequisites
## Steps
### 1. {First action}
### 2. {Second action}
## Result
## Next Steps
```

### changelog

```markdown
# {Product} {Version} — {Date}

{One-line summary.}

## New Features
## Improvements
## Bug Fixes
## Breaking Changes
```

## When the templates don't apply

Landing pages, concept overviews, skill catalogs, suite descriptions, and most cross-cutting reference pages don't fit the four templates above. Don't jam them in.

Use the structure the content actually needs. The check: does the page answer one specific reader question well? If yes, the structure is fine. If no, the problem is scope, not structure.

## Skill page pattern

Pages that document a single Claude Code skill (one per `appdev_root/apiant-claude-plugin/skills/*/SKILL.md`) follow a fixed shape so readers can scan across them:

```markdown
{1-2 sentence description: what task the skill performs, in plain English.}

## When to use it

{When this skill is the right tool. Concrete situations, not "any time you want to X".}

## How it works

{The skill's procedure in phases, matching SKILL.md. What Claude does at each step. What it asks the user. What it does not do.}

## Example

{One short, realistic transcript or prompt → outcome. Redact UUIDs and tenant names.}

## Tools and skills it invokes

{Bulleted list pulled from SKILL.md's tool and skill references. Internal cross-links where the targets exist.}

## Where it's used from

{Skills and plugin entry points that delegate to this one. Symmetric to "Tools and skills it invokes".}
```

Skill pages skip the generic Overview / Key Concepts / Configuration sections — SKILL.md is canonical.

## Tutorial pages must address failure

Any page that walks the reader through a numbered procedure must include a `## Troubleshooting` section listing the most common ways the procedure fails and what to do. A tutorial that only documents the happy path is not finished.

## Length budgets

| Page type | Target | Cap |
|-----------|--------|-----|
| Skill page | 300–800 words | 1000 |
| Concept / overview | 500–1500 words | 2000 |
| Tutorial / how-to | 600–1200 words | 1500 |

Pages over the cap usually hide weak prose, scope creep, or content that belongs on a subpage. When a draft runs over, split rather than compress — peel off the section that is tangential to the page's reader-question.

## Heading Rules

- **H1**: Document title only. One per page. (The renderer outputs the title separately — never start a doc body with `# Title`.)
- **H2**: Major sections. Powers sidebar TOC.
- **H3**: Subsections. Powers on-page TOC.
- **H4**: Rarely. Only if H3 sections need subdivision.
- Never skip levels (no H1 → H3).
- Descriptive nouns/phrases, not questions.

## Code Samples

- Always specify language: ` ```typescript `, ` ```bash `, ` ```sql `
- Minimum: curl + JavaScript for API examples
- Realistic values, not foo/bar — use APIANT-relevant data
- CLI commands: prefix with `$`, show output separately
- Comments for non-obvious lines

## Cross-References

- Link by slug: `[Automation Editor](/docs/automation-editor)`
- Descriptive link text, not "click here"
- A reference to another page is always a markdown link, never bold. Bold is reserved for term-definition emphasis.

## Metadata Requirements

| Field | Required | Notes |
|-------|----------|-------|
| title | Yes | Clear, concise, searchable |
| description | Yes | 1-2 sentences for search/meta |
| doc_type | Yes | guide, api-ref, tutorial, changelog |
| product | Recommended | api-apps, platform, mcp |
| metadata.tags | Recommended | 2-5 tags |
| metadata.audience | Recommended | end-user, builder, saas, enterprise |

## AI Optimization Rules

1. **Front-load key info** — first paragraph summarizes the page
2. **Descriptive headings** — "CRMConnect Configuration" not just "Configuration"
3. **Define terms on first use** — "The Assembly Editor (APIANT's low-code visual tool for building API integrations) allows..."
4. **Avoid ambiguous pronouns** — repeat the noun instead of "it" when referent is unclear
5. **One concept per section** — don't mix auth and rate limiting under one heading
6. **Include product name** — "CRMConnect syncs contacts..." not "It syncs contacts..."
7. **Tables for structured data** — parameters, options, comparisons
8. **Self-documenting code** — comments, realistic values, expected output

## Images & Diagrams

- SVG for diagrams (scalable, matches brand)
- Screenshots: dark mode only
- Alt text required
- Store in Supabase Storage `images` bucket (public)
- Reference by Supabase public URL

## Formatting

- **Bold**: UI labels, product names on first mention, key terms (never for cross-references — see Cross-References)
- `Code`: file names, commands, parameters, values, endpoints
- *Italic*: emphasis (sparingly)
- Ordered lists: sequential steps
- Unordered lists: non-sequential items
- Tables: structured data
- **Callouts** for "pay attention to this" content: `<hint type="info|note|success|tip|warning|danger">…</hint>` in markdown body, `<Callout type="…">…</Callout>` in MDX. Never use a `>` blockquote or a bold paragraph as a substitute.
