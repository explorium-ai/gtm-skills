---
name: score-leads
description: Gather the data needed to tier leads or cold contacts (mixed prospect IDs, emails, LinkedIn URLs, or name+company rows) as Hot / Warm / Cold against a buyer persona and ICP. Resolves each lead, fetches person profile and contact data, pulls account firmographics and recent business events, and returns a per-lead evidence row plus the persona/ICP rule set so the calling model can apply scoring math. Triggers on phrases like "score these leads", "tier this list", "rank inbound", "prioritize my MQLs", "which lead should I call first", "who should I prioritize from this list", "pull fit data on these contacts".
---

# Score Leads

Gather verified person, account, and trigger evidence per lead so a downstream model can tier leads Hot / Warm / Cold against a stated persona and ICP. This skill collects the evidence and restates the rule set; it does NOT apply scoring math.

## Input

- Leads (required): list of prospect IDs, emails, LinkedIn URLs, or name+company rows. Mixed types allowed.
- Buyer persona (required): target job titles or title keywords, seniority, and department.
- ICP (required): country (or region-country), company size buckets, optional revenue buckets, optional industry (LinkedIn or NAICS, mutually exclusive), optional tech stack, optional company age.
- Source label per lead (optional): e.g. demo_request, pricing_inquiry, free_trial, content_download, webinar_attended, cold_inbound. Passed through verbatim.
- Tier thresholds (optional): Hot and Warm cutoffs on the composite the caller computes.
- Trigger lookback (optional): default 90 days for recent business events.

## Workflow

1. Lock the persona and ICP rule set. Restate persona (titles, seniority, department) and the ICP filter shape. Discover canonical values for every free-text dimension (industry, tech stack, job title, city) before applying any filter. Tighten persona matches by intersecting a job-title filter with a seniority filter: a title-only filter is loose and returns near-matches at the rim. Note the mutually exclusive choices (LinkedIn vs NAICS; country vs region-country). Echo persona and ICP in the output so scoring math is auditable.
2. Resolve each lead. Bucket every input row; never silently drop one. Known prospect IDs pass through. Email rows resolve by email: email is a unique identifier, so a no-match is a hard fail, NOT a fallback to name search (a typo'd email must not silently resolve to a different real person). LinkedIn URL rows resolve by URL. Name+company rows resolve by full name plus company name or domain: person matching returns only an id or null (no confidence score, no candidate list), so a name+company match at a 10k+ employee company is indistinguishable from a unique email match. Treat name+company matches as Verified-with-caveat by default. Free-text rows like "Jane Doe at Acme" parse to the name+company path. Persona-only rows (no name, "the CFO at Notion") must NOT use full_name="CFO" (silently returns nothing); instead match the business, then sample prospects at that account filtered by canonical job title and seniority, and surface the candidates as Verified (caveat) for the user to pick. Tag each row: Auto-resolved, Verified (caveat), Ambiguous (pause), or Failed (no match). Never reroute Failed emails into name search.
3. Enrich the person. Profile (full name, title, seniority, department, linkedin URL) plus contacts. Default email-only (cheaper); switch to email + phone only when phone is required (SDR dialer flows). Per-prospect post history is a current gap; if recent activity matters, pull the employer's recent posts as a substitute.
4. Resolve and enrich the lead's company. Match the business by domain or name, then enrich firmographics (headcount, revenue range, country, industry, size bucket, age, description). Add technographics when the ICP names a tech stack. Add funding posture when the ICP cares about stage.
5. Fetch recent triggers per account on the configured lookback (default 90 days). Relevant events: new funding rounds, leadership hires in the persona's department, hiring surges in the persona's department, office openings or relocations, product launches, new partnerships. For accounts where prospect-level moves matter (job change into the persona seat), also fetch prospect events. Tag each event with age in days. Event-attribution sanity check: ensure events tie to the matched business, not blended across parent / subsidiary entities.
6. Optional ICP corroboration. If the caller wants to know whether the lead's account looks like the broader ICP shape, size the ICP filter set once and attach the summary (total addressable count, size bucket distribution, top industries). Do not re-pull per lead.
7. Compose one evidence row per lead. Each row carries: input identifier, resolution status, person id, full name, title, mapped seniority (canonical), mapped department, email, phone, linkedin URL, company name, company domain, business id, headcount, revenue range, country, industry, size bucket, revenue bucket, tech stack hits (only those intersecting the ICP tech list), top 3 recent events (type, age in days, one-line summary), source label, caveat strings (Stale, Ambiguous, Failed, Missing phone, Email not found). Process in chunks of ~25 end-to-end so working context does not balloon.
8. State the scoring boundary explicitly. The output ships the per-lead evidence plus the rule set verbatim. Composite scoring and tier assignment (Hot / Warm / Cold) are the caller's job. Do not invent a composite score in this skill.

## Output Format

- Restated rules: persona (titles, seniority set, department set); ICP filter set (exact object with canonical-resolved values, plus the industry-taxonomy and country-vs-region choices); trigger lookback in days.
- Resolution summary: one row per input with input, resolved name, person id, status. Status legend: Auto-resolved, Verified (caveat), Ambiguous, Failed.
- Per-lead evidence rows: one row per lead with the columns from step 7.
- ICP shape (optional, when corroboration ran): total addressable count, top size buckets, top industries.
- Scoring rules handed to the caller: persona-match rule (title list, seniority set, department set), ICP-match rule (the filter object), source weights (or raw label pass-through), trigger weights (event-type weights and recency decay), tier thresholds (Hot and Warm cutoffs).
- Caveats: Failed leads are not scoreable, list separately; stale records (>12 months) get a "downweight title-based fit" flag; Hot-candidate leads missing both phone and professional email get a "verify contact data before outreach" flag.

## Limitations

- Scoring math is downstream LLM work. This skill gathers evidence and restates the rule set; it does NOT produce a composite score or assign a tier.
- Name+company resolution can return multiple plausible matches at large companies; those rows surface as Ambiguous, and the matching response carries no confidence signal to disambiguate.
- Company size and revenue are bucketed, not exact counts; persona/ICP math must work against the bucket.
- Industry taxonomy (LinkedIn vs NAICS) is mutually exclusive on a single ICP filter.
- No built-in scoring engine, no contact data-quality sort, no native employee or revenue sort, no Inc/Fortune ranking signal, no metro taxonomy, no sub-department job-function filter.
- Department is null for many cross-functional senior roles (Chief X Officer, President, Founder). Group these under "Unattributed".
- The mapped seniority column should show the canonical value used for filtering.
