# GTM Skills for Claude Code, Codex & AI Agents

> Open-source B2B data enrichment, prospecting, and outbound skills for **Claude Code**, **Codex**, **Hermes-Agent**, **OpenClaw**, and **Claude Cowork** — powered by [Explorium](https://explorium.ai) and [Vibe Prospecting](https://vibeprospecting.ai).

These skills are ready-to-use playbooks that let any AI coding assistant run real GTM workflows: use as a **prospecting skill** to build prospect lists, an **enrichment skill** to enrich company and contact data, a **lead scoring skill** to tier leads, or a complete **outbound skill** for cold email and ABM campaigns — without custom tooling or agencies.

Free to install, use, and adapt under the MIT license.

```bash
claude install explorium-ai/gtm-skills
```

---

## Skills

| Skill | Use case | Triggers |
|---|---|---|
| [`lead-gen-tool-builder`](skills/lead-gen-tool-builder/SKILL.md) | Scaffold a self-hostable, ZoomInfo-style lead-gen web app — search UI + CRM push | lead generation tool, build a lead gen tool, lead gen tool skill, prospecting app, ZoomInfo alternative |
| [`list-builder`](skills/list-builder/SKILL.md) | Build targeted B2B prospect lists from a natural-language ICP brief | prospecting, lead gen, find companies, build a list |
| [`enrich-company`](skills/enrich-company/SKILL.md) | Add firmographics, technographics, funding & workforce signals to any company | B2B data enrichment, company enrichment, firmographics API |
| [`enrich-contact`](skills/enrich-contact/SKILL.md) | Look up email, phone & LinkedIn profile for any B2B prospect | contact enrichment, email lookup, LinkedIn profile lookup |
| [`account-fit-rank`](skills/account-fit-rank/SKILL.md) | Score & tier accounts by ICP fit, buying signals & intent data | lead scoring, account prioritization, ICP fit rank |
| [`score-leads`](skills/score-leads/SKILL.md) | Tier inbound or outbound leads Hot/Warm/Cold against buyer personas | lead scoring, inbound scoring, CRM enrichment |
| [`account-research`](skills/account-research/SKILL.md) | Deep intelligence briefs with firmographics, hiring & technographics | account research, company research, pre-call brief |
| [`account-contact-shortlist`](skills/account-contact-shortlist/SKILL.md) | Ranked contact shortlists at target accounts for outbound prospecting | contact data, decision-makers, outbound |
| [`decision-makers-map`](skills/decision-makers-map/SKILL.md) | Map buying committees — economic buyers, champions, technical evaluators | decision-makers, buying committee, multi-thread |
| [`personalize-email`](skills/personalize-email/SKILL.md) | Assemble signal packs for personalized cold email outreach | cold email, outbound, personalization, lead gen |
| [`competitor-research`](skills/competitor-research/SKILL.md) | Competitive intelligence briefs and side-by-side battlecards | competitor research, battlecard, competitive intelligence |
| [`lookalike-accounts`](skills/lookalike-accounts/SKILL.md) | Find similar companies for territory expansion or TAM analysis | lookalike company, similar accounts, audience twins |
| [`market-sizing`](skills/market-sizing/SKILL.md) | Size TAM/SAM for any ICP against Explorium's 150M+ company dataset | market sizing, TAM, ICP filters |
| [`meeting-prep`](skills/meeting-prep/SKILL.md) | 30-minute call briefs with prospect intelligence & talking points | meeting prep, call brief, account research |
| [`clean-data`](skills/clean-data/SKILL.md) | Validate, deduplicate & entity-match B2B company and contact records | data cleaning, entity matching, deduplication, CRM enrichment |
| [`abm-campaign`](skills/abm-campaign/SKILL.md) | End-to-end ABM: ICP → enrichment → LinkedIn Ads → monitoring | ABM campaign, account-based marketing, LinkedIn Ads |

---

## Why Use These GTM Skills?

**B2B data enrichment for AI agents.** Most skills are built on the Vibe Prospecting MCP server — real-time access to Explorium's 150M+ company database directly inside your Claude Code, Codex, or Hermes-Agent workflow. No polling, no CSV exports, no stitching together REST calls.

**Scaffold a real app, not just a list.** `lead-gen-tool-builder` is different from the workflow skills above: instead of running a prospecting task in your current session, it generates a standalone, self-hostable lead-gen web app — company & contact search, filters, CRM push — powered directly by the Explorium API, ready to deploy or hand to your team.

**Buying signals & intent data.** Surface companies and contacts that are actively in-market. Skills like `account-fit-rank` and `score-leads` combine firmographic fit with behavioral intent signals and recent trigger events (funding, hiring surges, leadership changes, product launches).

**Waterfall enrichment.** `enrich-company` and `enrich-contact` use Explorium's waterfall enrichment pipeline to maximize fill rate across email, phone, LinkedIn, technographics, and firmographics — a single skill call instead of chaining multiple data provider APIs.

**Entity matching & deduplication.** `clean-data` resolves messy company names, partial domains, and duplicate contact rows before you pay to enrich them — critical for CRM enrichment workflows and inbound lead scoring.

---

## Supported AI Agents & Platforms

These skills work as Claude Code skills, Codex plugins, and GTM plugins for any AI coding assistant that supports the Claude skill protocol:

| Platform | Support | Install |
|---|---|---|
| **Claude Code** | Full support | `claude install explorium-ai/gtm-skills` |
| **Codex** | Full support | Add as a Codex plugin |
| **Hermes-Agent** | Full support | Add as a GTM plugin |
| **OpenClaw** | Full support | Add as a GTM plugin |
| **Claude Cowork** | Full support | Add as a GTM plugin |
| **n8n** | Via MCP server | See [MCP Integration](#mcp-integration) |

---

## GTM Use Cases

### Prospecting & Lead Generation

Use `list-builder` to turn a natural-language ICP description into a filtered list of target companies and contacts. Combine with `lookalike-accounts` to expand from a seed customer list, and `account-fit-rank` to rank by real-time buying signals before handing off to outbound.

```
/list-builder Find 50 Series B SaaS companies in the US with 50-200 employees using Salesforce
/lookalike-accounts Find companies similar to Notion and Figma for my AE territory
/account-fit-rank Score this account list by ICP fit and buying intent
```

### Build Your Own Lead Gen Tool

Want a lead-gen tool your whole team can use, not just a one-off list? Use
`lead-gen-tool-builder` to scaffold a complete, self-hostable, ZoomInfo-style
web app — company & contact search, firmographic and technographic filters, a
sortable results table, CSV import/export, and one-click push to HubSpot and
Salesforce — powered by the Explorium API. It's the fastest way to build a lead
generation tool, a self-hosted ZoomInfo or Apollo.io alternative, or an
internal prospecting app without hiring an agency or writing the data-layer
integration by hand.

```
/lead-gen-tool-builder Build me a lead gen tool with Explorium search and HubSpot push
/lead-gen-tool-builder Scaffold a ZoomInfo-style prospecting app I can self-host for my team
```

### Outbound & Cold Email

Use `personalize-email` to assemble intent-led signal packs for each prospect — recent funding, hiring trends, tech stack, LinkedIn activity — so your AI can write truly personalized outbound at scale. `account-contact-shortlist` surfaces the right decision-makers with verified contact data.

```
/personalize-email Build a personalization brief for the VP of Sales at Acme Corp
/account-contact-shortlist Get me the top 5 contacts at Stripe for an outbound sequence
```

### CRM Enrichment

`enrich-company` and `enrich-contact` drop directly into CRM enrichment workflows: pass a list of domains or emails, get back firmographics, technographics, funding stage, headcount, and verified contact info. `clean-data` normalizes and deduplicates records first so you only pay to enrich real rows.

```
/enrich-company Add firmographics, tech stack, and funding to these 200 accounts
/clean-data Validate and deduplicate this Salesforce export before enrichment
/score-leads Tier these 500 inbound MQLs against my ICP — Hot, Warm, or Cold
```

### Buying Signals & Intent Data

`account-fit-rank` surfaces buying signals across all accounts simultaneously: funding rounds, leadership hires, headcount growth, technology adoption, and behavioral intent topics. Use it before every outbound sequence to prioritize who to call first.

```
/account-fit-rank Which of these 100 accounts has the strongest buying signals right now?
```

### Account Research & Competitive Intelligence

`account-research` generates a full intelligence brief — firmographics, recent hires, technology stack, funding history, and news — in seconds. `competitor-research` builds side-by-side battlecards from the same real-time data.

```
/account-research Give me a pre-call brief on Salesforce before my meeting Thursday
/competitor-research Build a battlecard comparing HubSpot vs Salesforce for our sales team
```

### ABM Campaigns

`abm-campaign` orchestrates the full ABM workflow: ICP → Vibe Prospecting list → enrichment → score → personalized LinkedIn ad creatives → LinkedIn matched audience → daily campaign monitoring. No agency, no stitching tools together manually.

```
/abm-diy-campaign Run an ABM campaign targeting 200 Series B fintech companies
```

---

## MCP Integration

The Vibe Prospecting MCP server is the data layer powering every skill in this repo. It exposes Explorium's real-time B2B data platform — 150M+ companies, 700M+ contacts, firmographics, technographics, funding, workforce signals, intent data, and buying triggers — as a native MCP tool for AI agent workflows.

**MCP server URL:** `https://vibeprospecting.explorium.ai/mcp`

```json
{
  "mcpServers": {
    "vibe-prospecting": {
      "type": "http",
      "url": "https://vibeprospecting.explorium.ai/mcp"
    }
  }
}
```

Use this MCP server directly in Claude Code, Codex, Hermes-Agent, OpenClaw, or any agent that supports MCP for B2B data enrichment, prospecting, and GTM workflows — no SDK required.

---

## Explorium vs. Other B2B Data Providers

These skills use Explorium's data platform and Vibe Prospecting MCP as the B2B data layer. Here's how that compares to other providers when building AI agent workflows:

| | **Explorium / Vibe Prospecting** | ZoomInfo | Apollo.io | Clay | Clearbit | Cognism |
|---|---|---|---|---|---|---|
| Native Claude Code skill | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Codex plugin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MCP server (agent-native) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Real-time buying signals | ✅ | Partial | Partial | Via connectors | ❌ | Partial |
| Waterfall enrichment | ✅ | ❌ | Partial | ✅ | ❌ | ❌ |
| Entity matching & dedup | ✅ | ❌ | ❌ | Partial | ❌ | ❌ |
| 150M+ company coverage | ✅ | ✅ | ✅ | Via connectors | Partial | Partial |
| Open-source skill library | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

Looking for a **ZoomInfo alternative**, **Apollo.io alternative**, **Clearbit alternative**, or **Clay alternative** for AI agent workflows? These skills and the Vibe Prospecting MCP give you real-time B2B data enrichment, prospecting, and buying signals directly inside Claude Code or Codex — without stitching together multiple APIs or building custom integrations.

For alternatives to **Cognism**, **Crustdata**, **People Data Labs**, **Lusha**, or **Hunter** in AI agent contexts, see [Vibe Prospecting](https://vibeprospecting.ai) for pricing and coverage details.

---

## Installation

```bash
# Install all GTM skills (Claude Code)
claude install explorium-ai/gtm-skills

# Invoke any skill in a Claude Code session
/list-builder
/enrich-company
/account-fit-rank
/abm-diy-campaign
```

For Codex, Hermes-Agent, OpenClaw, or Claude Cowork: add as a plugin from `https://github.com/explorium-ai/gtm-skills`.

**Requirements:** [Vibe Prospecting](https://vibeprospecting.ai) account (free tier available). LinkedIn Ads API credentials required only for `abm-campaign`.

---

## License

[MIT](LICENSE) — free to use, share, and build on. See [CONTRIBUTING](CONTRIBUTING.md) to contribute.

## Maintained by

[Explorium](https://explorium.ai) · [Vibe Prospecting](https://vibeprospecting.ai)
