---
name: "abm-diy-campaign"
description: "Run a full Account-Based Marketing (ABM) campaign DIY — from ICP to live LinkedIn Ads. Build a targeted account list with Vibe Prospecting, enrich and score companies, generate personalized ad creatives with Claude Code and Figma, push matched audiences to LinkedIn Ads, and monitor campaigns at scale. No agency needed."
compatibility: "Requires: Vibe Prospecting CLI (npx @vibeprospecting/vpai@latest), Figma MCP (optional, for dynamic creative), LinkedIn Ads API credentials"
metadata:
  version: "1.0.0"
---

# ABM Campaign — DIY Playbook

This skill walks you through a full ABM campaign end-to-end, using Claude Code as the orchestration layer. You bring your ICP definition and credentials; Claude handles the rest.

**What you'll build:**
1. A scored, filtered account list sourced from Vibe Prospecting
2. Segment-specific ad creatives (HTML templates + optional Figma assets)
3. LinkedIn matched audiences populated with your target accounts
4. Live LinkedIn campaigns with personalized ads
5. An ongoing monitoring and optimization loop

**No personal keys are stored in this skill.** You provide credentials at runtime via environment variables or interactive prompts. See [`setup.md`](references/setup.md) before starting.

---

## Prerequisites

Complete [`setup.md`](references/setup.md) first. It covers:
- Vibe Prospecting login (`npx @vibeprospecting/vpai@latest`)
- LinkedIn Ads API credentials
- Figma access token (optional)

---

## Campaign Phases

### Phase 1 — Build the Account List

**Goal:** Translate your ICP into a concrete list of target companies.

Read [`01-account-list.md`](references/01-account-list.md) before running any Vibe Prospecting commands.

**Quick steps:**
1. Define your ICP (industry, company size, geography, tech stack, funding stage, intent signals)
2. Use `autocomplete` to normalize filter values
3. Fetch matching companies with `fetch-entities` (sample 5 first, then full export)
4. Save to `abm-accounts-raw.csv`

```bash
# Example: US SaaS companies, 100-1000 employees, using Salesforce
npx @vibeprospecting/vpai@latest autocomplete \
  --args '{"field":"linkedin_category","query":"software"}' \
  --tool-reasoning 'Building ABM account list for SaaS ICP'

npx @vibeprospecting/vpai@latest fetch-entities \
  --args '{
    "entity_type": "business",
    "filters": {
      "linkedin_category": {"values": ["Software Development"]},
      "company_headcount_range": {"values": ["101-250","251-500","501-1000"]},
      "company_country_code": {"values": ["US"]},
      "company_tech_stack_tech": {"values": ["Salesforce"]}
    },
    "page_size": 5
  }' \
  --tool-reasoning 'Sample fetch for ABM account list'
```

**Output:** `abm-accounts-raw.csv`

---

### Phase 2 — Enrich & Score the Accounts

**Goal:** Add firmographic and technographic data, then score and filter to your best-fit accounts.

Read [`02-enrich-score.md`](references/02-enrich-score.md) for scoring model details.

**Quick steps:**
1. Match raw companies to Vibe business IDs
2. Enrich with `firmographics`, `technographics`, `funding-and-acquisitions`
3. Apply ICP scoring formula (Claude computes a fit score 0–100)
4. Filter to accounts above your threshold (suggested: score ≥ 60)
5. Save to `abm-accounts-scored.csv` and `abm-accounts-final.csv`

```bash
# Match company names to IDs
npx @vibeprospecting/vpai@latest match-business \
  --args '{"businesses_to_match": [{"name":"Acme Corp","domain":"acme.com"}]}' \
  --tool-reasoning 'Matching accounts for enrichment'

# Enrich firmographics + technographics
npx @vibeprospecting/vpai@latest enrich-business \
  --args '{
    "business_ids": ["biz_xxx"],
    "enrichments": ["firmographics","technographics","funding-and-acquisitions"]
  }' \
  --tool-reasoning 'Enriching accounts for ABM scoring'
```

**Output:** `abm-accounts-final.csv` (scored, filtered list)

---

### Phase 3 — Create the Ad Templates

**Goal:** Generate reusable, segment-specific ad templates using Claude Code.

Read [`03-ad-templates.md`](references/03-ad-templates.md) for template structure and design system integration.

**Quick steps:**
1. Define your ad segments (e.g., "Enterprise Fintech", "Mid-Market SaaS", "Startup")
2. Specify your design system or brand colors/fonts (or use defaults)
3. Claude generates HTML/CSS templates for each LinkedIn ad format:
   - Single Image (1200×628 px)
   - Carousel cards (1080×1080 px)
   - Spotlight ad (300×250 px)
4. Templates use placeholders: `{{company_name}}`, `{{company_logo}}`, `{{headline}}`, `{{body_copy}}`
5. Output files saved under `creative/templates/`

Tell Claude:
> "Create LinkedIn ad templates for these segments: [list]. Use these brand colors: [hex]. Use this value prop: [text]."

**Output:** `creative/templates/<segment>-single.html`, `creative/templates/<segment>-carousel.html`

---

### Phase 4 — Personalize the Creative

**Goal:** Dynamically update creative elements per account using Figma MCP (or a code-based approach).

Read [`04-personalize-figma.md`](references/04-personalize-figma.md) for the Figma MCP workflow and code-based fallback.

**Option A — Figma MCP (recommended for polished output):**
1. Share your Figma design file URL
2. Claude reads the template frames via Figma MCP
3. For each account, Claude swaps: company logo, company name, segment headline
4. Exports PNG assets per account

**Option B — Code-based (no Figma):**
1. Claude uses the HTML templates from Phase 3
2. Injects per-account data using a Python/Node script
3. Renders to PNG using `puppeteer` or `playwright`
4. Saves under `creative/personalized/<company_domain>/`

```bash
# Install rendering dependencies (Option B)
npm install -g playwright
playwright install chromium
```

**Output:** `creative/personalized/<company_domain>/<format>.png`

---

### Phase 5 — Push Audiences to LinkedIn Ads

**Goal:** Create a LinkedIn matched audience from your account list and upload company data.

Read [`05-linkedin-audiences.md`](references/05-linkedin-audiences.md) for the full API workflow.

**Quick steps:**
1. Set LinkedIn credentials as environment variables (see [`setup.md`](references/setup.md))
2. Create a DMP segment (matched audience)
3. Upload your company list (domain-based matching — LinkedIn matches ~40–60% of lists)
4. Wait for audience to populate (typically 24–48 hours for >300 companies)

```bash
# Step 1: Create matched audience
curl -s -X POST "https://api.linkedin.com/v2/dmpSegments" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABM Target Accounts — Q3 2025",
    "accessPolicy": "PRIVATE",
    "destinations": [{"destination": "urn:li:sponsoredAccount:'$LINKEDIN_AD_ACCOUNT_ID'"}],
    "type": "COMPANY"
  }'

# Note the returned segment ID, then upload company list (see 05-linkedin-audiences.md)
```

**Output:** LinkedIn DMP Segment ID saved to `linkedin-audience-id.txt`

---

### Phase 6 — Create & Launch the Campaigns

**Goal:** Create campaign groups, campaigns, and ad creatives in LinkedIn Campaign Manager.

Read [`06-campaign-management.md`](references/06-campaign-management.md) for full campaign creation and monitoring.

**Quick steps:**
1. Create a campaign group per segment
2. Create campaigns targeting your matched audience + segment filters
3. Upload personalized creatives as sponsored content
4. Set budget, schedule, and bid strategy
5. Launch

**Monitoring loop (ongoing):**
- Claude checks campaign analytics daily
- Flags underperforming ads (CTR < 0.4%, CPC > $15)
- Suggests copy/creative tweaks
- Refreshes audience as new accounts are added

---

## Full Pipeline Checklist

```
[ ] setup.md — credentials configured
[ ] 01-account-list.md — account list built and exported
[ ] 02-enrich-score.md — accounts enriched, scored, filtered
[ ] 03-ad-templates.md — ad templates created per segment
[ ] 04-personalize-figma.md — creatives personalized per account
[ ] 05-linkedin-audiences.md — matched audience created and populated
[ ] 06-campaign-management.md — campaigns live and monitored
```

---

## File Outputs Reference

| File | Phase | Description |
|------|-------|-------------|
| `abm-accounts-raw.csv` | 1 | Raw account list from Vibe Prospecting |
| `abm-accounts-scored.csv` | 2 | Accounts with enrichment + fit scores |
| `abm-accounts-final.csv` | 2 | Filtered best-fit accounts (score ≥ threshold) |
| `creative/templates/` | 3 | HTML/CSS ad templates per segment |
| `creative/personalized/` | 4 | Per-account rendered ad images |
| `linkedin-audience-id.txt` | 5 | LinkedIn DMP segment ID |
| `campaign-ids.json` | 6 | Campaign group, campaign, creative IDs |
| `campaign-report.csv` | 6 | Daily analytics export |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Vibe Prospecting auth fails | Run setup from [`setup.md`](references/setup.md) → Vibe section |
| LinkedIn 401 Unauthorized | Access token expired — re-run OAuth flow in [`setup.md`](references/setup.md) |
| Audience too small (<300) | Broaden ICP filters in Phase 1; LinkedIn needs 300+ matched companies to serve ads |
| Low audience match rate | Use company domains (not just names) in Phase 5 upload for better matching |
| Figma MCP not available | Use Option B (code-based) in Phase 4 |
| Creatives rejected by LinkedIn | Check LinkedIn ad specs in [`03-ad-templates.md`](references/03-ad-templates.md) |
