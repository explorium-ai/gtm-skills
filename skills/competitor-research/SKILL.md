---
name: competitor-research
description: Build a fact-led competitive intelligence brief on one or more rival companies. Use when the user says "competitor analysis", "size up a competitor", "compare rivals", "competitive landscape", "vendor battlecard", "rival snapshot", "track competitor moves", or asks for a side-by-side comparison of named companies with firmographics, funding, headcount, exec roster, hiring shifts, tech stack, and recent strategic moves.
---

# Competitor Research
Produce a dated, source-tagged competitive brief for one or more named rival companies.

## Input
- One or more competitor company names or domains (required).
- Optional brief purpose (e.g. "battlecard for renewal", "board update", "win-loss prep"). If absent, ask once before running so the synthesis stays grounded.
- Optional priority angles (e.g. "pricing pressure", "AI roadmap", "EMEA expansion").
- Optional named hypotheses to confirm or contradict.

## Workflow
1. Anchor on purpose. Restate the brief purpose, priority angles, and hypotheses in 1-2 sentences before any tool call so synthesis stays scoped.

2. Resolve each competitor: **match a business** by name + domain when available. Domain-variant sanity check: if a major-brand input resolves to a tiny headcount with a "Corporate Managing Offices" or "Hotels and motels" classification, the match likely routed to a registered-agent shell entity. Re-try with the alternate domain or with the company-name string. Do not proceed with the wrong identity. Skip any name that does not resolve confidently and flag it under data quality.

3. Enrich each resolved competitor across these dimensions: firmographics (HQ, headcount, revenue, founded), competitive landscape (named competitors), strategic insights (priorities and recent moves), funding and acquisitions (rounds and M&A), workforce trends (headcount trajectory), technographics (current stack), challenges (publicly surfaced risks), company ratings (third-party signals), and LinkedIn posts (recent owned-channel narrative).

4. Fetch business events for the resolved set, scoped to the last 90 days. Keep events that map to: product launches, leadership changes at vice president and above, funding rounds, M&A, office openings or closures, and material hiring shifts. Discard the rest. Event-attribution sanity check: before including any event row in the brief, verify the event title or snippet actually mentions the target company. Industry-wide articles can be cross-attributed to multiple competitors' identities in the ingestion pipeline.

5. Surface the executive team per competitor: size the audience first (count of C-level and VP roles per company), then sample a small slice for preview. Run a count before any larger pull so you can frame the sample honestly.

6. If the user asks for outreach-ready contacts on a specific exec subset, enrich those prospects with contacts and profiles. Default to email-only contacts: it costs less than email + phone, and phone numbers are only needed for SDR dialer flows. Use presence-of-email as the contact-quality proxy when filtering.

7. Classify ICP overlap per competitor (High / Partial / None) using firmographics versus the user's stated ICP. If no ICP was stated, mark overlap as "Not assessed" rather than guessing.

8. Address each named hypothesis explicitly as confirmed, contradicted, or unresolved, citing the specific enrichment or event row that drove the call.

9. Final delivery: write the working table out only as the last step (exec roster + key firmographic columns); keep all intermediate previews on screen.

## Output Format
### Executive Comparison
- Purpose statement (one sentence) and hypothesis check (confirmed / contradicted / unresolved per item).
- Side-by-side table across all resolved competitors with columns: company name, domain, HQ, headcount, size bucket, revenue bucket, founded year, public/private, CEO or top exec, last funding event, last strategic move (dated), competitive products noted.
- 90-day move highlights: dated bullets per competitor, source-tagged to the enrichment that surfaced them (strategic insights, funding, business events).
- Data quality flags: unresolved names, empty enrichments, stale records, contradictions between enrichments.

### Per-Competitor Section
Repeat per resolved competitor:
- Snapshot: HQ, headcount, revenue range, founded, public/private, primary tech-stack signals.
- Recent moves (last 90 days): dated bullets, each tagged with the enrichment source.
- Strategic positioning: pulled verbatim from strategic-insights and competitive-landscape where present. Do not paraphrase.
- Workforce trajectory: direction and magnitude.
- Challenges: bullets, dated where available.
- Funding and M&A: latest round, investors, any acquisitions or divestitures.
- Exec roster preview: sampled rows with full name, job title, LinkedIn URL, professional email (if enriched). Frame as "Sample preview (5 of <total> matches)." If totals were not captured, use "Sample preview (5 rows). Many more match these filters."
- ICP overlap: High / Partial / None / Not assessed, with the firmographic evidence in one line.
- Three discovery questions rooted in specific surfaced facts (not generic).

## Limitations
- Strategic-insights and challenges are gated on SEC 10-K filings: populated for public competitors, null for private ones, and can be 12-18 months stale even when present. Use NAICS + LinkedIn category + technographics overlap for private targets.
- No native sort by employee count, revenue, or contact data quality. Contact quality is approximated by presence-of-email.
- Employee count and revenue are bucketed, not raw integers. Side-by-side comparisons use bucket labels.
- No similar-companies tool. For adjacent rivals beyond named inputs, approximate by resolving competitive-landscape outputs and re-enriching them, and flag the approach explicitly.
- No metropolitan-area taxonomy. Geographic comparisons use country (ISO-2) or region (ISO 3166-2).
- Only public/private as a company-type filter; finer ownership structure is not available.
- Sentiment from G2, TrustRadius, or earnings transcripts is not in the data surface and is out of scope.
