# GTM Skills

This repository contains open-source Claude Code skills built and maintained by [Explorium](https://explorium.ai). Each skill is a ready-to-use, step-by-step playbook that Claude Code can follow to complete a real marketing or sales workflow — no agency, no custom tooling, just Claude and the tools your team already uses.

Skills are free to install, use, and adapt under the MIT license.

## Available Skills

### ABM DIY Campaign (`skills/abm-campaign`)

Run a full Account-Based Marketing campaign end-to-end — from ICP to live LinkedIn Ads — without an agency.

**What it does:**
1. Builds a targeted account list from your ICP using Vibe Prospecting
2. Enriches and scores companies with firmographics, technographics, and growth signals
3. Generates personalized LinkedIn ad creatives using Claude Code and Figma
4. Pushes matched audiences to LinkedIn Ads
5. Monitors campaigns daily and auto-pauses at frequency cap

**Install:**
```bash
claude install explorium-ai/public-skills
```

**Use:**
```
/abm-diy-campaign
```

**Requirements:** Vibe Prospecting account, LinkedIn Ads API credentials, Figma (optional)

---

### Vibe Prospecting workflow skills

Fourteen focused skills that wrap the Vibe Prospecting MCP plugin. Each one is a single SKILL.md playbook — sample gates, capability-gap disclosure, tenure verification, and credit-cost discipline baked in. Install the [Vibe Prospecting plugin](https://github.com/explorium-ai/vibeprospecting-plugin) first, then use these.

| Skill | What it does |
|---|---|
| [`account-contact-shortlist`](skills/account-contact-shortlist/SKILL.md) | Ranked shortlist of contacts at a target company for prospecting, deal acceleration, or renewal/expansion plays. |
| [`account-fit-rank`](skills/account-fit-rank/SKILL.md) | Score and tier a list of accounts (A/B/C) by ICP fit, intent, triggers, and workforce momentum with a "why now" per row. |
| [`account-research`](skills/account-research/SKILL.md) | Intelligence brief on a target company — firmographics, technographics, funding, hiring, events, peer cohort. |
| [`clean-data`](skills/clean-data/SKILL.md) | Triage and validate a CSV/Excel/JSON of companies or contacts before enrichment so you do not pay to enrich noise. |
| [`competitor-research`](skills/competitor-research/SKILL.md) | Fact-led competitive intelligence brief or side-by-side battlecard on one or more rival companies. |
| [`decision-makers-map`](skills/decision-makers-map/SKILL.md) | Map the buying committee — economic buyers, champions, technical evaluators — and surface coverage gaps. |
| [`enrich-company`](skills/enrich-company/SKILL.md) | Pull a single company's full profile: firmographics, technographics, financials, funding, workforce, competition. |
| [`enrich-contact`](skills/enrich-contact/SKILL.md) | Look up a single person's full professional profile from email, name+company, LinkedIn URL, or prospect_id. |
| [`list-builder`](skills/list-builder/SKILL.md) | Build a targeted list of prospects or businesses from a natural-language brief. |
| [`lookalike-accounts`](skills/lookalike-accounts/SKILL.md) | Find companies that resemble a seed account for territory expansion, TAM analysis, or audience twins. |
| [`market-sizing`](skills/market-sizing/SKILL.md) | Size the TAM for an ICP against Explorium's 150M+ company universe and iteratively refine filters. |
| [`meeting-prep`](skills/meeting-prep/SKILL.md) | 30-minute call brief on a target account — headline, attendee profiles, ranked talking points, what NOT to do. |
| [`personalize-email`](skills/personalize-email/SKILL.md) | Assemble a personalization signal pack for one prospect so a downstream LLM can compose a tailored email. |
| [`score-leads`](skills/score-leads/SKILL.md) | Gather evidence to tier mixed leads as Hot/Warm/Cold against a buyer persona and ICP. |

---

## Installing skills

```bash
# Install all skills from this repo
claude install explorium-ai/public-skills

# Then invoke a skill in any Claude Code session
/abm-diy-campaign
```

## License

[MIT](LICENSE) — free to use, share, and build on. See [CONTRIBUTING](CONTRIBUTING.md) if you want to contribute.

## Maintained by

[Explorium](https://explorium.ai) · [Vibe Prospecting](https://vibeprospecting.ai)
