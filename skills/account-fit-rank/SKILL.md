---
name: account-fit-rank
description: Rank a list of accounts (mixed Explorium business IDs, company names, or domains) by ICP fit, buying intent, recent triggers, and workforce momentum. Returns per-account composite score (0-100), tier (A/B/C), explainable component breakdown (fit / intent / trigger / workforce), and a specific "why now" sentence per account anchored on a real Explorium signal. Resolves name/domain inputs via business match with explicit confirmation for ambiguous matches. Iteratively refinable. Use for account-based selling, ABM list prioritization, territory planning, signal-based selling, buyer-intent ranking, and B2B prospecting. Triggers on "score these accounts", "rank by ICP fit and intent", "prioritize this account list", "which accounts should I work first", "build a tiered account list", "ICP scoring", "account prioritization".
---

# Account Fit Rank
Score and tier a list of accounts on four axes (fit, intent, trigger, workforce) using firmographics, technographics, intent topics, events, and workforce trends, then apply a transparent weighted composite the calling model computes from the returned data.

## Input
- Accounts (required): list of business IDs, company names, domains, or a mixed CSV.
- Use case (default `prospecting`): one of `prospecting`, `abm`, `territory_planning`, `pipeline_acceleration`. Shifts tier thresholds and recommended actions.
- ICP definition (required): industries, employee buckets, revenue buckets, country or region, optional tech-stack vendors, optional intent topics. Capture inline; no persisted ICP exists.
- Weight overrides (optional): `{fit, intent, trigger, workforce}` summing to 100. Default `45 / 25 / 25 / 5`.
- Tier thresholds (optional): `{A, B}`. C is the remainder. Default `A>=75, B 50-74`.

## Workflow

1. Lock the ICP and intent topics. Restate the ICP from the user. Discover canonical values for every free-text dimension (industry, technology, intent topic, city). Resolve intent topics one term at a time: fuzzy multi-term queries fail silently. If a tag does not resolve, drop it and flag that axis as configuration-gap, not signal-absent.

2. Resolve identifiers. Route inputs by shape: existing business IDs pass through; domains and names resolve via business match, with an optional country tiebreaker for names. Never silently pick a winner: surface top candidates for ambiguous rows and ask for confirmation. For high-collision names, require domain confirmation before scoring. Sanity-check the resolved firmographics: if a major-brand input returns 1-50 employees and Corporate-Managing-Offices category, the match likely routed to a shell entity. Retry with the alternate domain or the name string. Every input ends as auto-resolved, verified, ambiguous, or failed.

3. Pre-flight relationship context. Tag each resolved account against any user-supplied competitor / customer / partner lists before scoring so a "pursue this competitor" line is never produced silently.

4. Fetch firmographic, technographic, and signal data in small chunks end-to-end (resolve, enrich, score, write row, discard raw payloads). Per chunk: enrich with firmographics, technographics, recent LinkedIn posts, funding and acquisitions, workforce trends, strategic insights, and website changes; then fetch business events scoped to the last 90 days for funding rounds, leadership changes, product launches, and expansions. If the ICP includes intent, size intent-topic exposure separately; if no topics resolved in step 1, set intent weight to zero and redistribute. Drop raw payloads after extracting the per-axis inputs and the single winning signal for "why now".

5. Score each axis (calling model computes from the fetched data):
   - Fit (0-100): banded firmographic match. Industry primary = 25, adjacent = 10; employee bucket in band = 20, one off = 12, two off = 4; revenue bucket same banding, max 20; geography country = 15, region = 8; company age in window = 10; vendor match if specified = 10.
   - Intent (0-100): 90 for 3+ resolved topics active, 70 for 2, 50 for 1, 0 for none. Record the strongest topic. If no topics resolved, axis = 0 with `configuration-gap` and the weight redistributes.
   - Trigger (0-100): `event_score = type_weight * recency_factor`. Type weights: M&A / funding / new CEO = 95; product launch, hiring surge, major website change = 75; partnership, new facility = 55; generic announcement = 25. Recency: 0-14d = 1.0, 14-30d = 0.7, 30-60d = 0.4, 60-90d = 0.2, older = 0. Account trigger = max event_score, capped at 100. Verify the event headline actually mentions the target: industry-wide articles can cross-attribute.
   - Workforce (0-100): headcount up 10%+ in 90d or target-department hiring surge = 80-100; modest growth = 40-70; flat or shrinking = 10-30; no data = null and the weight redistributes.

6. Composite, tier, and "why now". Composite = round(weighted sum / 100). Cap any axis with no data at null and redistribute proportionally; surface the redistribution. Assign tier from thresholds (use-case overrides: `abm` A=80 / B=55, `pipeline_acceleration` A=65 / B=40). "Why now" is one sentence anchored on the strongest underlying signal, never the composite restated. For strong trigger with low fit, be explicit ("Do not pursue: fresh CEO change but the revenue bucket mismatch keeps this in C.").

7. Iterate. Offer: adjust weights and recompute from cached axes; tighten thresholds; drop tier C; swap the ICP; drill into one account with deeper enrichment (challenges, competitive landscape, ratings); add accounts and rescore. Only "add accounts" or "swap ICP" require new calls.

## Output Format

### TL;DR
Account Fit Rank, N accounts. Use case, weights, thresholds. Resolution counts (resolved / ambiguous / failed; flag if confirmation required). Tier distribution. Top 3 accounts each with a one-line "why now".

### Resolution Summary
Table: Input, Resolved To, Business ID, Confidence, Status (auto-resolved, verified, ambiguous, failed). For each ambiguous row, list candidates with industry, headcount, revenue bucket, country and ask the user to pick.

### Ranked Accounts
Sorted by composite descending. Use `-` in any axis column that was redistributed. Columns: #, Account, Tag, Tier, Composite, Fit, Intent, Trigger, Workforce, Why now, Business ID.

### Weights and Axes Used
List percentages applied and any axis redistributed because data was unavailable.

### Recommended Actions per Tier
Tier A: route to AE for 1:1 outreach within 24h, prioritize contact enrichment. Tier B: SDR sequence using the why-now as opener, retarget for ABM. Tier C: monitor, rescore weekly when fresh events land.

### Iteration Options
Adjust weights, tighten thresholds, drop tier C, swap the ICP, drill into one account with deeper enrichment, or add accounts and rescore.

### Caveats (when relevant)
Ambiguous-pending count, failed resolutions, intent configuration-gap, stale trigger cliff (60-90d), workforce nulls with weight redistribution.

## Limitations
- Business match returns no confidence score; infer ambiguity from candidate-set shape and confirm with the user.
- Strategic-insights and challenges signals come from public filings: null for private companies and 12-18 months stale for public ones. Use events, funding, workforce, and LinkedIn posts for current state.
- No native scoring engine. The composite and tiering are computed by the calling model from the data returned.
- Headcount and revenue are bucketed; band-distance scoring is the right resolution.
- No CRM-engagement axis (deal stage, last activity, named champion); workforce is the substitute, and the gap is surfaced rather than invented.
- Industry taxonomies are mutually exclusive on filters; pick one per run.
- No native similar-companies tool, no metro taxonomy, no Inc / Fortune ranking. Geography is country or region only.
- Country-scoped sizing does not strictly enforce the country filter; read the per-country breakdown rather than the global total.
