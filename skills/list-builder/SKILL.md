---
name: list-builder
description: Build a targeted list of prospects or businesses from a natural-language brief using Explorium. Use when the user asks to "build a list", "find prospects", "pull a target account list", "give me contacts at", "show me companies that", or names titles, departments, industries, company size, location, tech stack, intent topics, or growth events.
---

# List Builder

Turn a natural-language audience brief into a clean, exportable prospect or business list.

## Input

`$ARGUMENTS` is a free-text description of the audience. Parse it for:

- Entity type (prospects vs businesses; default prospects if ambiguous).
- Role signals: job titles, seniority, department.
- Firmographics: industry, size bucket, revenue bucket, company age, public vs private.
- Geography: country, US/Canadian state, or city region.
- Technographics, intent topics, growth events with a recency window in days.
- Contactability: reachable / emailable.
- Count (default 25), fields requested (e.g. "include phone") that drive which enrichments layer on top.

Example phrasings: "100 VP Engineering at Series B SaaS in the US that use Snowflake", "heads of demand gen at 200-1000 fintech in NYC", "50 CFOs at public manufacturing that raised funding in the last 90 days", "cybersecurity under 500 employees in the UK with intent on zero trust".

## Workflow

1. **Decide list type.** Prospects if the brief names person attributes (title, seniority, department). Businesses if only company attributes are named. If prospects are scoped by a prior company set, plan to thread that businesses table into the prospect fetch.

2. **Discover canonical values.** For every free-text field (industry, technology, job title, intent topic, city region), resolve the user's phrase to the standardized value the API expects. Skip discovery for ISO country codes, region codes, bucket enums (size, revenue, age), seniority and department enums, and boolean flags.

3. **Tighten loose title filters.** Title filters are not enforced as exact-match: a job-title-only filter for "Vice President of Engineering" can return non-VP rows. Always combine a title with a seniority value (e.g. "vice president") to keep the slice tight.

4. **Size the audience.** Get a total match count for the assembled filters before pulling rows. Use this number to frame the preview honestly and to warn the user early if the audience is unexpectedly small or massive.

5. **Sample-first preview.** Pull a small slice (5 rows) and render it for the user to sanity-check the filter translation before materializing the full list. The interactive preview is hard-capped at 5 rows: treat it as a sanity sample, not as the ranked top-N.

6. **Pull the full list.** Once the preview is approved, materialize the requested count via the paid export path. Restate the audience definition so the user can see what locked in.

7. **Enrich the rows.** For prospects, default to email-only contact enrichment (cheaper); add phone only when the user explicitly asks for it (e.g. dialer flows). Add profile data for LinkedIn URL and bio when requested. Prospect-side LinkedIn post content is NOT available: for recent activity, enrich LinkedIn posts on the employer instead. For businesses, layer in firmographics, technographics, funding, workforce trends, competitive landscape, ratings, or strategic insights based on the fields the user asked for.

8. **Output as a table artifact** with the CSV path called out so the user can download or pipe it onward.

## Output Format

### Search Criteria Applied
Bulleted readout of every filter that landed: entity type, title and seniority, department, industry, size and revenue buckets, geography, tech stack, intent topics, growth events with their recency window, and any boolean flags. Call out any requested filter that had no direct equivalent and how it was approximated.

### Prospect List
Show when entity type is prospects. Columns: name, job title, company, company domain, industry, company size, email (professional preferred), phone if pulled, LinkedIn URL, prospect_id. Drop columns the user did not ask for. Caveat: email and phone only populate after contact enrichment; the discovery preview returns identifiers only.

### Business List
Show when entity type is businesses. Columns: company name, domain, industry, headcount, revenue bucket, country/region, plus any enrichment columns requested (tech stack, recent funding, hiring trend), business_id.

### List Summary
Total matching audience from step 4, rows returned in this pull, path to the CSV artifact, enrichment coverage (e.g. "92 of 100 rows have a verified email"). Frame as "Sample preview (5 of <total> matches)" when a total is available; never invent a total.

### Refinement Options
Concrete next moves: tighten or broaden a bucket, add a reachability filter, swap geography granularity, layer a recent-event filter, pivot from businesses to prospects by reusing the current business table, add or remove an enrichment.

## Limitations

- No native sort by contact data-quality, exact employee count, or revenue. Use the reachability flag, or tighten buckets.
- No metropolitan-area taxonomy: use city region discovery or state-level region codes.
- No native similar-companies tool: see the lookalike-accounts skill.
- No sub-department job-function filter. Combine a title (after discovery) with a department.
- No business-list ranking filter (Inc 5000, Fortune 500). Approximate with size, revenue, and public-company flag.
- Headcount and revenue are bucket enums, not exact numeric ranges.
- Title filters are loose: always pair with a seniority value to avoid false positives.
- The interactive preview is hard-capped at 5 rows: the full slice only materializes via the paid export path.
- Department is null for many cross-functional senior roles (Chief X Officer, President, Founder): group under "Unattributed".
