---
name: talent-mapping
description: "Talent mapping skill for Claude Code and Codex: map the talent bench for a function across a set of target or competitor companies using Explorium data via Vibe Prospecting. Returns an org-style map per company (headcount by seniority, named leaders and individual contributors, tenure, recent joiners and leavers), plus company-level movement signals like layoffs, leadership changes, acquisitions, and headcount decline that indicate when talent is likely open to a move. Use for recruiting strategy, competitive talent intelligence, executive search market maps, and workforce planning. Triggers on 'talent map', 'map the engineering team at', 'who works in [function] at our competitors', 'talent intelligence', 'where can we hire from', 'market map for a search'. Works in Claude Code, Codex, Hermes-Agent, and OpenClaw."
compatibility: "Requires: Vibe Prospecting MCP server (https://vibeprospecting.explorium.ai/mcp, bundled with this plugin) or the Vibe Prospecting CLI (npx @vibeprospecting/vpai@latest)"
---

# Talent Mapping

Map who does a given job across a set of companies, and where that talent is most likely to move, before a single outreach goes out.

## Input

`$ARGUMENTS` describes:

- A function or role family to map (required): "data engineering", "enterprise sales", "product design leadership".
- A company set (required): named companies or domains, a competitor list, or a company profile ("Series C-E cybersecurity in the US, 200-1000 employees").
- Optional seniority focus (default Manager and above plus senior ICs).
- Optional geography.
- Optional depth: "overview" (counts and leaders only, default) or "full" (named roster per company).

## Setup check (always do this first)

This skill runs on Explorium's B2B data through Vibe Prospecting. Before step 1, confirm a data path is available:

- **MCP / connector:** a Vibe Prospecting tool such as `fetch-entities` or `match-business` is in your tool list. If it is, proceed.
- **CLI fallback:** run `npx @vibeprospecting/vpai@latest --help`. If it lists tools, proceed. If it errors on auth, ask the user to run `npx @vibeprospecting/vpai@latest config --api-key "YOUR_VP_API_KEY"`.
- **Neither available:** stop and tell the user: "Please connect the Vibe Prospecting connector (https://vibeprospecting.explorium.ai/mcp) or configure the CLI, then let me know." Do not continue or invent data.

## Workflow

1. **Resolve the company set.** Match each named company and sanity-check firmographics: a major brand resolving to 1-50 employees in a Corporate-Managing-Offices category likely routed to a shell entity, so retry with the alternate domain. For a profile instead of names, size it first and cap the map at 15 companies; if more match, ask the user to tighten or pick. Surface ambiguous matches for confirmation rather than picking silently.

2. **Define the role family.** Translate the function into a department value plus 4 to 8 discovered canonical titles spanning the ladder (IC, senior IC, manager, director, VP, C-level). Confirm the family with the user, since "data" alone can mean analytics, engineering, or science.

3. **Count before you pull.** For each company, get the match count by seniority band for the role family. This is cheap and produces the bench-size view even when the user only wants an overview.

4. **Pull leaders, sample ICs.** For every company, materialize the people at Director and above in the role family. For "full" depth, also materialize senior ICs and managers up to 50 per company. Pair every title filter with a seniority value: title-only filters leak.

5. **Enrich profiles.** Pull profile data for the materialized people to get tenure in current role, time at company, and prior employers. Skip contact enrichment: a talent map is research. Point the user to `talent-sourcing` or `enrich-contact` when they move to outreach.

6. **Collect movement signals.**
   - Company level, last 180 days: business events for layoffs, leadership changes, acquisitions or mergers, office closures, and funding rounds. Verify each headline names the target company: industry-wide articles can cross-attribute.
   - Workforce trend: headcount change in the last 6 and 12 months, and department-level trend for the mapped function where available.
   - People level: prospect events for recent role changes among the mapped leaders.

7. **Score each company as a talent source** (0-100):
   - Bench depth (35): count of people in the role family at the target seniority, relative to the other companies in the set.
   - Movement pressure (40): layoff or restructuring = 90-100; new leadership in the mapped function in the last 6 months = 70-85; acquisition = 70; declining headcount = 50-70; flat = 30; strong growth or fresh large round = 10-20.
   - Tenure ripeness (25): share of mapped people with 2-4 years in role.
   Explain the score in one line. Do not score individuals here; that belongs to `talent-sourcing`.

## Output Format

### Map Scope
Role family (department plus titles), seniority bands, geography, and the resolved company list with domain, industry, and headcount bucket. Note any company that failed to resolve.

### Talent Source Ranking

| Rank | Company | Bench Size (role family) | Directors+ | Headcount Trend 12m | Key Movement Signal | Source Score | Why |
|------|---------|--------------------------|------------|---------------------|---------------------|--------------|-----|

### Company Maps
One block per company, ordered by source score:
- Bench by seniority: counts per band.
- Leadership: name, title, tenure in role, prior employer, LinkedIn. Flag leaders who joined in the last 6 months (team reshuffles often follow).
- Notable ICs (full depth only): name, title, tenure, LinkedIn.
- Signals: dated events with a one-line summary.

### Market Read
3 to 6 bullets: where the deepest benches sit, which companies show the most pressure right now, common prior-employer feeder companies seen across the map, and typical tenure. Flag companies to avoid (client conflicts, strong growth making talent hard to move).

### Next Steps
- Run `talent-sourcing` scoped to the top 3 source companies to build a ranked candidate pipeline.
- Re-run in 60-90 days to catch new movement signals.
- Expand the set with `lookalike-accounts` seeded on the highest-scoring source company.

## Fair-hiring and privacy rules

- Map roles and companies, not personal characteristics. Never segment or comment on protected characteristics or proxies for them.
- Keep the map to professional, publicly listed information. Do not pull personal contact data during mapping.
- When the user names companies under a no-poach or client agreement, exclude them and say so in Map Scope.

## Limitations

- Requires the Vibe Prospecting connector or CLI; data coverage and credits follow the user's Vibe Prospecting plan.
- Counts reflect people whose professional profiles match the role family. Small or stealth teams, and people with sparse profiles, are undercounted.
- No department-level headcount history for every company: when missing, fall back to company-wide headcount trend and say so.
- No executive-departure event type. Leavers show up only indirectly, via new-joiner signals at other companies or role-change events.
- No sub-department job-function filter. The finest cut is department plus discovered titles.
- Title filters are loose: always pair with seniority.
- Large companies can return thousands of matches: the map caps named rosters at 50 per company and relies on counts beyond that.
