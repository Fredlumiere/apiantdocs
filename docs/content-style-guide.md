# Content Style Guide — apiantdocs

## Voice & Tone

**Technical, confident, direct.** Audience is developers, builders, and technical decision-makers.

- Write for someone who already knows APIs and integrations
- State what things do, not what they "help you" do
- No marketing fluff in docs — save that for apiant.com
- Define APIANT-specific concepts once and link back
- "You" for the reader, "APIANT" or "the platform" for the product (not "we")

## Document Structure by Type

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

## Heading Rules

- **H1**: Document title only. One per page.
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
- Related docs section at bottom of every page

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

- **Bold**: UI labels, product names on first mention, key terms
- `Code`: file names, commands, parameters, values, endpoints
- *Italic*: emphasis (sparingly)
- Ordered lists: sequential steps
- Unordered lists: non-sequential items
- Tables: structured data
- Blockquotes + emoji prefix for callouts: ℹ️ ⚠️ 🚨 💡 ⚖
