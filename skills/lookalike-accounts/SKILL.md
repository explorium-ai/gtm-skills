---
name: lookalike-accounts
description: Find companies that resemble a seed account by reconstructing its firmographic, technographic, and industry profile, then surfacing other companies that match those same attributes. Useful for territory expansion, TAM analysis, competitive mapping, account list extension, and finding lookalikes, similar accounts, or audience twins to a reference customer.
---

# Lookalike Accounts

Reconstruct the profile of one seed company, then surface other companies that share its industry, size, region, and tech stack.

## Input

The user supplies via `$ARGUMENTS`:
- A seed company name or domain (required).
- Optional: how many lookalikes to return (default 25, ceiling 100).
- Optional overrides: country focus (country codes or grouped regions, pick one), size or revenue bucket, public-only flag, additional named tech stack components.

If the user gives only a person or asks for similar contacts, redirect them to a prospecting flow. This skill returns accounts.

## Workflow

1. **Resolve the seed.** Match the supplied name or domain. If multiple candidates return, pick the highest-confidence match whose domain aligns with the user input and confirm the chosen company back in the final output. If nothing resolves, stop and ask for a clearer identifier (domain preferred).

2. **Domain-variant sanity check.** After firmographics land, if a major-brand input resolves to a row with headcount 1-50 and NAICS `551114` (Corporate Managing Offices) or SIC `Hotels and motels`, the match likely routed to a registered-agent shell. Re-try with the alternate domain or with the company name string. A broken seed produces garbage lookalikes.

3. **Reconstruct the seed profile.** Enrich firmographics and technographics on the seed. Extract:
   - Industry category (LinkedIn or NAICS, whichever is populated; the two are mutually exclusive as filters).
   - Headcount bucket and revenue bucket.
   - Country code (or regional grouping if the seed is multinational and the user asked for regional scope).
   - Top 3-5 tech stack values, biased toward category-defining tools (CRM, MAP, data warehouse, primary cloud) over ubiquitous infrastructure (Analytics, jQuery).
   Skip any field that comes back empty: never fabricate a value.

4. **Discover canonical values** for the reconstructed industry and each tech token. Drop any value that does not resolve cleanly. Bucket enums and country codes do not need discovery.

5. **Apply user overrides.** If the user specified country, size, revenue, public-only, or extra tech filters, replace or extend the reconstructed values with the overrides. Honor the mutual exclusivity rule between LinkedIn and NAICS industry, and between country code and grouped region.

6. **Size the candidate pool.** Get a total count for the assembled filters. If below the requested return size, relax the most restrictive filter first: drop the 5th tech, then 4th, then 3rd, then collapse the headcount bucket to an adjacent one. Re-size after each step. If the count exceeds 5,000, tighten by adding back a tech filter or narrowing region. Report the final candidate count in the output.

7. **Fetch lookalikes.** Sample the validated filter set to surface candidates, then export the user-requested count via the paid export path for the full materialized list. Exclude the seed before display.

## Output Format

### Header
**Lookalikes for [Seed Company Name] ([seed domain])**
Reconstructed profile: [industry] | [headcount bucket] | [revenue bucket] | [country or region] | Tech: [comma-separated tech list].
Candidate pool: [N] companies matching this profile. Returning top [requested count].

### Results Table
| Rank | Company | Domain | Industry | Employees | Revenue | Country |
|------|---------|--------|----------|-----------|---------|---------|

Show the user-requested count (default 25, cap 100). Always exclude the seed.

### Pattern Notes
2-4 bullets covering dominant geography, size concentration, tech-overlap density (tech filters are not fully populated on every row), and any adjacency the filter set introduced (e.g. "industry widened because LinkedIn category was empty on seed").

### Suggested Next Steps
Pull contacts at any of these accounts via the list-builder flow scoped by the businesses table; deepen one row with the enrich-company flow; watch the list for growth events on the reconstructed cohort.

## Limitations

- **No native similarity model.** There is no lookalike API or ML similarity score. This skill approximates similarity by reconstructing the seed's firmographics, technographics, and industry, then doing a filtered company fetch on those reconstructed attributes. The native flow is match-seed, enrich attributes, then re-fetch with attributes. Results are ranked by default fetch order, NOT by a true similarity score.
- **No similarity ranking column.** No per-row similarity score is computed: rank reflects fetch order.
- **Industry classification gaps.** If neither LinkedIn nor NAICS category is populated, the skill falls back to size + region + tech, producing a looser approximation. Flag this in the output.
- **Tech stack coverage is partial.** Tech tokens are not exhaustively populated, so filtering on multiple values can collapse the candidate pool faster than expected. The relaxation logic in step 6 handles this.
- **Bucketed size and revenue.** A seed at the high edge of one bucket and a candidate at the low edge of the next can look further apart than they are.
- **Region taxonomy is country-level.** No metro or sub-country scope.
- **High-profile execs at these accounts** often have suppressed contact data: if the user pivots to "who runs these", recommend LinkedIn outreach for top execs.
- **No contact-level lookalikes.** This skill returns accounts only.
