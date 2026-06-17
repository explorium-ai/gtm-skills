---
name: enrich-company
description: Pull a single company's full profile in Explorium. Accepts a domain, company name, or business_id and returns firmographics, technographics, financial metrics, funding history, workforce trends, competitive landscape, and the contact pool count.
---

# Enrich Company

Resolve a single company and return a complete profile across firmographics, tech, financials, funding, hiring, and contact coverage.

## Input

The user will provide one of:
- A domain (e.g. `stripe.com`)
- A company name (e.g. `Stripe`)
- A known Explorium `business_id`

Optional: a specific area of focus (e.g. "just funding", "tech stack only"). If omitted, run the full profile.

## Workflow

1. **Resolve the company.** Match the business from the supplied domain, name, or id. If a name is ambiguous, re-match with user-supplied tiebreakers (country, HQ city, domain hint) and surface the top 3 candidates for a pick. If a `business_id` is given, treat it as already resolved. If nothing resolves, stop and suggest re-trying with a domain.

2. **Domain-variant sanity check.** After firmographics land, if a major-brand input resolves to a row with headcount 1-50 and NAICS `551114` (Corporate Managing Offices) or SIC `Hotels and motels`, the match likely routed to a registered-agent shell. Re-try with the alternate domain or with the company name string before continuing.

3. **Enrich the core profile.** Run firmographics, technographics, company hierarchies, funding and acquisitions, workforce trends, strategic insights, company ratings, and competitive landscape on the resolved company.

4. **Add financial metrics.** Financial metrics require a reporting date. Default to the first day of the current month, or use the most recent month the user names, and state the assumption.

5. **Size the contact pool.** Get a total prospect count scoped to the resolved company. Record it as "Contacts in Explorium" so the user can decide whether to chase decision-makers next.

6. **Focused mode.** If the user asked for one slice only (e.g. "just tech stack", "funding only"), run only the relevant enrichments in step 3 plus steps 1, 2, and 5.

7. **Render the profile** using the format below. Always surface `business_id` and `company_domain` so the user can chain into follow-up work.

## Output Format

**[Company Name]** : [one-line description from strategic insights or firmographics]

| Field | Value |
|-------|-------|
| Website | domain |
| Industry | LinkedIn or NAICS category |
| Headcount | bucket plus exact count when present |
| Revenue | bucket plus range when present |
| HQ Location | city, region, country |
| Company Type | public / private / subsidiary |
| Ticker | if public |
| Phone | |
| business_id | |

**Corporate Structure**: ultimate parent, direct parent, subsidiary count and top names.
**Financials**: reporting period plus key metrics (revenue, growth, margin where present).
**Funding & Acquisitions**: total raised, last round (stage, amount, date, lead investor), recent acquisitions.
**Workforce Trends**: headcount now vs 6 / 12 / 24 months ago, net hires last quarter, top hiring departments.
**Tech Stack**: group by category (CRM, analytics, infra), cap at top 15 named tools.
**Competitive Landscape**: top named competitors and positioning notes.
**Strategic Insights**: 3-5 bullets on recent direction, priorities, or signals.
**Ratings**: Glassdoor, G2, and other review signals when returned.
**Contact Coverage**: total prospect count plus a suggested next step to pull decision-makers filtered by seniority and department.

## Limitations

- Strategic insights and challenges are sourced from SEC 10-K filings: null for private companies, and 12-18 months stale for public ones. Use business events, funding, workforce trends, and LinkedIn posts for current-state signals.
- Exact headcount and exact revenue are not always returned: bucket values are the floor.
- No native "similar companies" tool. Approximate by reconstructing seed attributes and re-fetching with those filters (see the lookalike-accounts skill).
- Quarter-over-quarter and year-over-year headcount deltas may be partial for smaller or private companies.
- Financial metrics require a reporting date: default to current month and state the assumption.
- High-profile executives at the resolved company often have suppressed contact data. If the user pivots to "who runs it", warn that professional emails for top execs are unreliable and recommend LinkedIn outreach for that tier.
- Sub-industry granularity is limited to whichever taxonomy you filtered on (LinkedIn and NAICS categories are mutually exclusive as filters, though both can appear in firmographics output).
