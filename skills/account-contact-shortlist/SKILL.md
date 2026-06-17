---
name: account-contact-shortlist
description: Build a ranked shortlist of contacts at a target company for prospecting, deal acceleration, or renewal/expansion plays. Provide a company name or domain and optionally a use case or seniority focus.
---

# Account Contact Shortlist
Pull the right people at a target account and rank them for outreach, with a use-case lens (new business, active deal, renewal) and a reachability check.

## Input
The user provides:
- A company name or domain (required).
- Optional use case: "prospecting" (default), "deal acceleration", or "renewal" / "expansion".
- Optional seniority focus (C-level, VP+, Director+) or a specific function (sales, marketing, RevOps, security, finance).
- Optional size of the shortlist (default 25, max 100).

## Workflow

1. Resolve the company. Match the business from the name or domain. If multiple plausible matches surface, present the top 2 to 3 with industry, size, and HQ, then ask the user to confirm. Sanity-check the resolved firmographics: if a major-brand input comes back as 1-50 employees in a Corporate-Managing-Offices category, the match likely routed to a shell entity. Retry with the alternate domain or the name string before proceeding.

2. Enrich the resolved business with firmographics to anchor the output header (industry, size bucket, revenue bucket, HQ, public vs private).

3. Translate the use case into a persona blueprint before any prospect fetch. Prospecting / default: broad buying-committee coverage across Sales, Marketing, RevOps, IT, and Product, weighted toward Director, VP, and C-level. Deal acceleration: economic buyer plus technical evaluator plus procurement, biased to C-level and VP in the relevant function, plus one Director-level champion. Renewal / expansion: existing product-owner functions plus an executive sponsor, including Manager and Director levels alongside VP+. Intersect any user-supplied seniority or function override with the blueprint and note dropped roles.

4. Discover canonical values for every free-text role or industry token before filtering. Combine a job-title filter with an explicit seniority constraint to keep matches tight: a title-only filter for "Vice President of Engineering" leaks non-VP rows, so intersect title with seniority.

5. Sample 5 prospects scoped to the resolved account, matching the blueprint's titles, seniority, and department, with a reachability proxy (has-email true). Present this preview for the user to sanity-check the persona translation and wait for approval before going full size. When the user names a role rather than a person ("the CFO at Notion"), do not try to resolve a title string as a person; surface candidates via the filtered prospect fetch instead.

6. After approval, materialize the full shortlist and enrich prospects for contact data. Default to email-only contact enrichment because it is the cheaper option; opt in to phone only when the user explicitly needs dialer-ready output. For the top 10, also pull profile enrichment so tenure and prior-role signals can feed the ranking rationale.

7. Rank and group. Score each contact on persona fit (title and department match, weighted by seniority), reachability (professional email, then personal email, then phone), and tenure or stability from the profile pull (recent joiners get a small bump for prospecting, a penalty for renewal). Break ties by seniority.

## Output Format

### Target Account
One line: company name, domain, industry, headcount bucket, revenue bucket, HQ, public vs private.

### Use Case Frame
State the resolved use case and what the shortlist optimizes for (prospecting = buying-committee coverage on a first conversation; deal acceleration = economic buyer plus technical evaluator plus procurement plus a Director-level champion; renewal / expansion = current product owners plus an executive sponsor). List any user-provided overrides that narrowed the blueprint.

### Shortlist

| Rank | Full Name | Job Title | Seniority | Department | Professional Email | Phone | LinkedIn | Why On The List |
|------|-----------|-----------|-----------|------------|--------------------|-------|----------|-----------------|

"Why On The List" is one short clause referencing the persona-blueprint slot the contact fills (e.g. "VP-level economic buyer in Sales"). Show "Unattributed" in the Department column for cross-functional senior roles where department is null.

### Coverage Read
Counts by department, by seniority band, and by reachability (professional email, personal email only, phone, none). Flag gaps where the use case expected a slot but no contact was found (e.g. "No procurement contact surfaced for deal acceleration").

### Engagement Priority
Pick the top 5 to contact first with a one-line reason each, distinguishing entry points (Manager / Director with strong reachability) from decision makers (VP / CXO in the relevant function). Suggest an outreach order.

### Next Steps
- Brief the opener with fresh account context via funding, challenges, or strategic-insights enrichments.
- Fetch prospect events on the shortlist to catch recent role changes or new-hire signals before the first touch.
- Re-run with a different use case to compare the buying committee against an in-flight deal team.

## Limitations
- No native contact data-quality sort. Reachability is approximated from the has-email flag plus enriched professional email and phone.
- Headcount and revenue are bucketed, so very narrow size cutoffs are not possible.
- No sub-department job-function filter. The finest cut on function is department plus title.
- The only company-type filter is public vs private. Private subsidiary cannot be distinguished from independent private.
- Department is null for many cross-functional senior roles. Group those under "Unattributed" rather than dropping them.
- Sample previews are capped at 5 rows. Full shortlists materialize only after user approval.
