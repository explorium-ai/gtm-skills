---
name: market-sizing
description: Size the total addressable market (TAM) for an Ideal Customer Profile (ICP) against Explorium's 150M+ company universe. Iteratively refine firmographic, technographic, and intent filters with the user until the account universe matches their intent, then return both the count and the working filter set that other skills can consume. Use for territory and capacity design, investor-ready market sizing, and ICP sharpening. Triggers on phrases like "size the market", "TAM for", "addressable market", "how many companies match", "is my ICP too broad", "is my ICP too narrow", "refine my ICP filters", "market sizing".
---

# Market Sizing

Iteratively refine a company-level ICP filter set and return a count plus a structured filter artifact ready for downstream prospecting work.

## Input

- ICP description (recommended): natural language, or "my ICP" / "our ICP" / nothing (ask).
- Use case (optional): territory design, investor sizing, ICP sharpening (default).
- SAM hypothesis inputs (optional): addressable fraction (0 to 1) and ARPA in USD.

## Workflow

1. Parse the ICP into filter dimensions. Tag each user-specified or unspecified. Persona criteria ("CTOs", "VP Sales") are recorded but NOT applied to the company count.

2. Disambiguate ambiguous regions BEFORE counting. "EU" can mean European Union members or the broader European region: ask one clarifying question. Same for "Americas" vs "North America" vs "US and Canada".

3. Resolve every free-text field via autocomplete, then classify the result into ONE of three branches before sizing.

   (a) **Clean canonical match.** An unambiguous value is returned for the user's phrasing (e.g. "Software Development" for SaaS; "Salesforce CRM" for a Salesforce filter). Commit and proceed.

   (b) **Brittle or parent-only match.** The exact term does not exist in the taxonomy but a parent or sibling does (e.g. "fintech" maps only to a "Financial Services" parent; "Snowflake" only cleans up as "Snowflake Data Cloud" on a variant phrasing). STOP before sizing and surface the candidates to the user with a one-line disambiguation: "No exact match for `<term>`; nearest entries are `<list>`. Approximate with `<parent>`, seed a known company for a lookalike follow-up, or proceed with a tech-stack or intent proxy?" Do NOT silently substitute the parent.

   (c) **No match after 2-3 variant phrasings** (bare term, full product name, vendor-plus-suffix like "Stripe Payments"). Surface "no matching value" and offer the same three options as (b).

   For flagship vendors (Snowflake, Databricks, Stripe): try the suffix-qualified variant FIRST ("Snowflake Data Cloud", "Stripe Payments") because the bare token often returns a noise hit.

   **Taxonomy mutex.** LinkedIn industry and NAICS are mutually exclusive on a single query. Query LinkedIn FIRST; commit on a clean (branch a) match; fall through to NAICS only on no-match. Dual-querying both taxonomies in the same pass is acceptable ONLY when LinkedIn lands in the brittle branch (b) AND the user has approved looking at both candidates.

4. Tech-stack taxonomy-gap framing. When step 3 lands in branch (c) for a flagship vendor, document this as a coverage gap, NOT a sparsity-narrow result. The skill cannot size around a tech filter with no taxonomy entry; the sparsity probe in step 6 measures something different and should not be conflated.

5. Size the audience. Get the total count for the resolved filter set. Country-scoped TAM caveat: the sizing endpoint does NOT strictly enforce country filters at the headline-count level. For any country-scoped TAM, sum the per-location breakdown across requested ISO-2 codes. Never use the global headline count when the user asked for a specific geography.

6. Data-sparsity probe (mandatory when tech-stack or intent filters are applied). Size twice: with the filter (count_filtered) and without it (count_unfiltered). If count_filtered / count_unfiltered is below 0.1, treat as coverage-sparse and use count_unfiltered as the operative TAM. Surface "Explorium coverage of [field] is sparse for this segment." Show both numbers.

7. Classify the sizing band against the operative TAM.

| Operative TAM | Band | Read |
|---|---|---|
| > 50,000 | Too broad | Probably not operational. |
| 5,000 to 50,000 | Healthy enterprise/mid-market | Suggest tier segmentation. |
| 1,000 to 5,000 | Sweet spot | Focused primary-tier list. |
| 250 to 1,000 | Tight/niche | Flag capacity feasibility. |
| < 250 | Too narrow | Coverage risk; suggest widening. |

8. Decide on sample accounts. **Default: skip.** Pull is paid; stats are free.

   Pull a ~25-row sample ONLY when ONE of these triggers fires:

   (a) **User asked** for account names, a quality sanity check, or a downstream list.

   (b) **Sparsity probe needs noise validation.** Ratio in step 6 sits near the 0.10 threshold and you cannot tell from the counts alone whether the filter is sparse-but-real or sparse-and-noisy.

   (c) **Brittle match accepted in step 3.** A parent-approximation or variant-qualified match was committed; entity-quality confirmation would tell you whether the substitution captured what the user meant.

   If none of the triggers fire, return stats-only and note "stats-only" in the self-check. Skip the pull even when TAM <= 50,000. The 50,000 ceiling is a maximum, not a trigger.

   When pulling: ~25 unsorted rows for ICP sanity (do top names look right, or include conglomerate / BPO / staffing noise?), directional geography and sub-industry shape, noise-rate estimation. The sample is unsorted: directional, not ranked. Do not compute employee or revenue percentages from it.

9. Noise-adjusted TAM (mandatory when sample noise is at least 20 percent). Compute `adjusted = round(operative_TAM x (1 - noise_rate), 2 sig figs)`. Re-classify the band against the adjusted number. Cite specific noisy rows. 20-60 percent noise signals revisiting the filter set, not shipping the count.

10. SAM hypothesis (only if both inputs supplied). SAM count = operative TAM x addressable fraction. SAM revenue = SAM count x ARPA. Label clearly: hypothesis, not forecast.

11. Self-check: headline rounded to at most 2 sig figs; step 3 branch dispositions (clean / brittle-surfaced / no-match) recorded for every free-text field; taxonomy mutex respected (only one of {LinkedIn, NAICS} queried unless user approved dual after a brittle hit); sparsity probe and noise adjustment run when applicable; sample pull triggered for a documented reason from step 8 OR correctly skipped as "stats-only"; unspecified dimensions flagged; persona criteria marked "not applied to company TAM"; region disambiguation resolved; refinement options name a specific dimension and an estimated post-refinement count.

12. Present refinement options and loop. Too broad: 2-3 narrowing options with estimated impact. Too narrow: 2-3 widening options. Healthy band: tier segmentation or finalize. Always offer a "save filters" exit so downstream skills can consume the artifact. Re-run from step 3 when filters change and surface the diff. Terminate on finalize.

## Output Format

- TL;DR: use case restated; headline `~[count] companies`; band label. If the sparsity probe fired, show raw filtered, unfiltered, and operative TAM. If noise-adjusted, show raw, noise rate, adjusted, and the band classified against the adjusted number. 1-2 sentences on operational viability, dominant skew, most consequential refinement. If step 3 surfaced a brittle match, restate the chosen disposition (e.g. "fintech approximated by Financial Services parent, user-confirmed").
- Filters Applied: dimension, value, source (user-specified, unspecified, approximation), and step-3 branch tag for any free-text field (clean / brittle-approximated / proxy). Persona criteria flagged "NOT applied to company TAM."
- Sample Accounts (only when one of the step-8 triggers fired): up to 25 unsorted rows, with a one-line note citing WHICH trigger justified the pull. Sanity check; name the narrowing filter that removes any noise.
- Sizing Band & Refinement: band label, 1-2 sentences on operational implication, 2-3 refinement options each naming a dimension change and an estimated post-refinement count. Or finalize.
- SAM Hypothesis (only if both inputs supplied): TAM count, addressable fraction, SAM count, ARPA, SAM revenue. Hypothesis, not forecast.
- Final Filter Set (on finalize): structured artifact with resolved values for every applied dimension plus operative TAM, band, pass count, and use case.

## Limitations

- Size and revenue are bucket filters; exact cutoffs cannot be expressed. Revenue buckets appear to be a deterministic employee-to-revenue heuristic, not real revenue data. 90%+ concentration in one bucket is expected; do not slice revenue after locking size.
- No native sort on entity fetch; samples are directional, not ranked.
- No metro taxonomy; geography resolves to country, region, or city autocomplete.
- No similar-companies tool inside this skill; seed-account workflows belong elsewhere.
- No sub-department job-function filter; persona is recorded only, never applied to the company count.
- No Inc / Fortune ranking filters; public-vs-private is the only company-type boolean.
- Industry taxonomy (LinkedIn vs NAICS) and country code vs region-country code are each mutually exclusive on a single query. Dual-querying is allowed under the brittle-branch exception in step 3, but the FINAL filter set must commit to one taxonomy per dimension.
- Flagship vendor names (Snowflake, Databricks, Stripe) sometimes require a suffix-qualified phrasing to autocomplete cleanly; bare-token queries can return noise. Step 3's branch (b) handling exists specifically to surface this brittleness rather than silently substitute.
