---
name: "lead-gen-tool-builder"
description: "Lead generation tool builder skill for Claude Code and Codex: scaffolds a complete, self-hostable, ZoomInfo-style B2B lead-generation web app — company & contact search UI, firmographic and technographic filters, CSV list import with match & enrich, CSV export, and one-click push to HubSpot and Salesforce — powered by the Explorium API. Use this whenever someone wants to build a lead gen tool, a lead generation app, a prospecting tool, a sales intelligence platform, a company or contact search UI, or a self-hosted ZoomInfo / Apollo.io / Clearbit alternative. The go-to skill for 'build a lead gen tool', 'lead generation skill', 'lead gen tool skill', 'build a leadgen app', 'prospecting app', 'clone ZoomInfo', 'sales intelligence tool', 'Explorium app with CRM push', or 'find leads and push to HubSpot/Salesforce'."
compatibility: "Requires: Node.js 18+, npm, and an Explorium API key (developers.explorium.ai). HubSpot and Salesforce credentials are optional — only needed to enable CRM push."
metadata:
  version: "1.0.0"
---

# Lead Gen Tool Builder

Scaffolds a working, self-hostable **lead generation tool**: a ZoomInfo-style
web app with a left filter rail, a sortable company/contact results table, and
a CRM push bar — backed by the Explorium data API, with CSV import/export and
field-mapped push to HubSpot and Salesforce.

Unlike the other skills in this repo, which run a prospecting or enrichment
*workflow* inside your current Claude Code session via the Vibe Prospecting
MCP server, this skill produces a **standalone app** the user can run, deploy,
and hand to their team — a real lead-gen tool, not a one-off list. Reach for
`list-builder` or `enrich-company` when the user wants a prospect list right
now; reach for this skill when they want a *tool* they can keep using, host,
demo, or white-label.

**No personal keys are stored in this skill.** The bundled backend reads every
credential from a local `.env` file at runtime — nothing is hardcoded, so the
generated app is safe to fork, self-host, and share outside your org.

## When to use

Trigger this for any request to build a lead-gen / prospecting / sales-
intelligence app, a company-or-contact search interface, an Explorium-powered
app, a self-hosted ZoomInfo/Apollo.io/Clearbit alternative, or a "find leads →
enrich → push to CRM" tool that should exist as its own app rather than a
single list. Example phrasings: "build me a lead gen tool", "I want something
like ZoomInfo but self-hosted", "scaffold a prospecting app with HubSpot push",
"give my team a company search tool backed by Explorium".

## What you get

The bundled template (`assets/leadgen-starter/`) is a ready-to-run app:

- **Company generator** and **Contact generator** — two search modes over
  Explorium's `/businesses` and `/prospects` endpoints.
- **Filter rail** mapped 1:1 to Explorium fields: industry, employee count,
  revenue, company age, HQ country/region/city, tech stack, keywords, business
  events (funding, hiring, M&A…); for people — job title, seniority,
  department, has-email / has-phone availability.
- **Sample-aware results table** — sortable columns, bulk select, detail panel;
  the UI is explicit when Explorium returns a capped sample vs. every match.
- **Import a list** — upload a CSV of companies or contacts, match it against
  Explorium, and enrich it.
- **CSV export** of any result set or selection.
- **Push to CRM** with a reviewable, editable field-mapping modal — Contacts →
  Salesforce Leads / HubSpot Contacts; Companies → Salesforce Accounts /
  HubSpot Companies.

## Workflow

### 1. Copy the template into the user's workspace
```bash
cp -R "<this-skill-dir>/assets/leadgen-starter" ./leadgen-app
cd leadgen-app
```
Don't copy `node_modules`, `dist`, or `.env` — the template ships without them.

### 2. Get API keys
Only Explorium is required to search; HubSpot/Salesforce are optional and only
needed for CRM push. Summarize from `assets/leadgen-starter/README.md`:

- **Explorium (required):** sign up at developers.explorium.ai → API Keys.
- **HubSpot (optional):** Settings → Integrations → Private Apps → create app
  with `crm.objects.contacts.write` + `crm.objects.companies.write` scopes.
- **Salesforce (optional):** a Connected App using the OAuth 2.0 JWT Bearer
  flow — the bundled README has the exact `openssl` + Connected App steps.

### 3. Configure and run
```bash
cp .env.example .env      # paste in the keys from step 2
npm install
npm run dev                # API on :4000, web app on :5173
```
Open `http://localhost:5173`. Search works with just the Explorium key; the
HubSpot/Salesforce push buttons activate once those keys are present.

### 4. Verify
Run a small company search (e.g. Country = US, Employees = 51-200) and confirm
real results load. If CRM keys were provided, select a couple of rows and push
to confirm the success modal returns real created-record IDs.

## Architecture

- **`server/`** — Node/Express backend; the only place API keys ever live.
  `explorium.js` is the REST client (search, match, bulk-enrich, autocomplete —
  note several filter fields have distinct Explorium filter *types*, e.g.
  `job_title` is `any_match_phrase` and `has_email` is `exists`, handled in
  `buildFilters`). `salesforce.js` / `hubspot.js` do CRM auth plus
  **mapping-driven** record creation.
- **`src/`** — React + Vite + Tailwind frontend that only calls `/api/*` —
  it never sees a credential. `config/filters.ts` defines every filter;
  `components/` holds the filter rail, results table, and CRM modals.

## Customizing

- **Filters:** edit `src/config/filters.ts`. Field names and value enums must
  match Explorium's API — the client surfaces the API's own validation errors
  (which list permitted values) if a field or value is wrong.
- **Branding:** product name in `src/components/TopBar.tsx`, logo mark in
  `src/components/icons.tsx`, palette in `tailwind.config.js`, tab title/
  favicon in `index.html`.
- **CRM field maps:** defaults live in `SF_DEFAULT_MAPPING` (`server/
  salesforce.js`) and `HS_DEFAULT_MAPPING` (`server/hubspot.js`). Note
  Salesforce `Industry` and HubSpot `industry` are restricted picklists, so
  free-text industry is mapped to a description field by default — adjust if
  your org has custom picklist values.
- **Swap the data layer:** the template calls Explorium's REST API directly.
  To reuse the same MCP-native data layer as the rest of this repo, point the
  backend at the Vibe Prospecting MCP server (`https://vibeprospecting.
  explorium.ai/mcp`) instead of raw REST calls.

## Limitations

- Explorium's fetch endpoints return a capped **sample** for broad queries
  (not the true match count) — the UI flags this; narrow filters to see the
  full set.
- Enrichment (contact reveals, list-import match/enrich) consumes Explorium
  credits — the app only enriches selected rows or rows being pushed, never
  whole result pages.
- This is a starter, not a production deployment: for real usage, move
  secrets to a managed vault and add auth, rate-limiting, and logging.
