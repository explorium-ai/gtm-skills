---
name: account-research
description: Produce a high-signal intelligence brief on a target company using Explorium firmographics, technographics, funding, hiring and challenge signals, business events, recent website and LinkedIn moves, plus a peer cohort. Identify the account by Explorium business_id (preferred) or by company name or domain (which triggers a match step). Always lead with a TL;DR framed by the user's stated research purpose (QBR prep, competitive analysis, cold outbound, renewal risk, expansion).
---

# Account Research
Build a purpose-driven intelligence brief on a single target company, anchored on the user's stated reason for pulling the brief.

## Input
- Account identifier (required): a business ID, a company name, or a domain.
- Research context (strongly recommended): one sentence on why this brief is being pulled and what decision it supports (QBR prep, competitive eval vs Acme, cold outbound to finance leaders). This shapes enrichment selection, event triage, and the TL;DR framing.

Example phrasings: "Build a brief on stripe.com for cold outbound to finance leaders.", "Account brief for business_id abc123, QBR next week, watch renewal signals.", "Profile Snowflake, competitive analysis vs Databricks."

## Workflow

1. Anchor on purpose. Restate the research context in one sentence as the brief purpose. If missing, ask once; if the user declines, default to general account intelligence and state that assumption. Derive 2 to 4 priority themes (e.g. for QBR renewal risk: workforce changes, exec moves, competing vendors, expansion signals). Themes drive enrichment selection in step 3 and peer-cohort sub-category in step 5.

2. Resolve the company. If a business ID was supplied, use it. Otherwise match the business by name or domain. Sanity-check the resolved firmographics: if a major-brand input returns 1-50 employees and Corporate-Managing-Offices category, the match likely routed to a shell entity. Retry with the alternate domain or the name string before proceeding. If no confident match emerges, surface the ambiguity to the user before continuing rather than guessing.

3. Enrich the resolved business in tiers.

   Tier A: spine (always pull): firmographics, hierarchies, funding-and-acquisitions, workforce-trends, linkedin-posts. Plus business events from step 4 (separate tool, same role: current-state signal). The spine is uniform across every brief because each item answers a question the reader will ask regardless of purpose.

   Tier B: purpose-conditional (pick by the purpose declared in step 1):
   - Competitive eval → technographics, webstack, competitive-landscape
   - QBR or renewal → company-ratings, challenges, strategic-insights
   - Cold outbound → website-changes, website-keywords (tied to your offering)
   - Investor or M&A → financial-metrics

   Tier C: skip by default unless the purpose explicitly demands it.

   Chunking: run enrichments in groups of at most 3 per call, and each chunk against the original match table rather than a post-enrichment view. Session column count grows per enrichment and the chain breaks around the 4th-5th wide call.

   Any tier item that returns null OR is intentionally skipped must surface in the brief as a one-line note inside its section ("Skipped: not in this purpose's bundle" or "Returned null: typical for private companies"), so the reader can distinguish absent data from absent investigation.

4. Fetch business events scoped to the last 90 days: hiring spikes, leadership changes (where surfaced), funding rounds, product launches, layoffs, office moves, tech adoption. For each event, verify the headline actually mentions the target before counting it: industry-wide articles can cross-attribute to multiple companies in the same sector.

5. Build a peer cohort (directional).

   5a. Sub-category from purpose, not industry label. A broad industry label (e.g. "Software Development") routes mega-tech defaults like Google or Amazon into a small-tech peer query. Derive the sub-category from the brief purpose instead:
   - "vs <competitor>" → the named competitor's sub-vertical (Databricks → data warehouse / lakehouse)
   - "QBR seat-expansion" → the target's collaboration / workflow sub-vertical
   - "cold outbound to <function> leaders" → the target's GTM sub-vertical
   - General intelligence (no purpose declared) → broad NAICS, marked "general baseline"

   5b. Manually include named competitors. If the user prompt named a specific competitor or comparator, include it in the cohort even if filters would exclude it (private status, different size band, different country). Label such rows "named in prompt: manually included" so the reader can audit.

   5c. Suppress when thin. If after sub-category filtering and manual additions the cohort still has fewer than 5 confident matches, do NOT render the table. Replace with one line: "Peer cohort suppressed: fewer than 5 confident matches in <sub-category>. Recommend manual comparison against <2-3 named alternatives, tagged verify externally>."

   Add a "Cohort construction" line above the table stating the sub-category used and any manually-included names.

6. Reconcile and verify before synthesis.
   - Funding recency. If business events show a more recent round than the funding enrichment, treat events as canonical, restate the latest round in the Funding section, and flag the enrichment lag in one line.
   - Public-vs-private signal mix. If firmographics returns public, the Funding section must include a one-line financial-posture sentence (ticker, rough market cap band, last reported quarter direction) drawn from general knowledge with a "verify" tag. If private, keep current behavior (events + funding + workforce + LinkedIn as the current-state proxy).
   - Per-event cross-attribution. Tag each Recent Events row "target named in headline", "target inferred from body", or "industry-wide: excluded". Excluded items don't appear in the body; list them once at the end of the section as "events screened out (n)". Note any event type the executor expected but couldn't query (e.g. leadership-change) in that same trailer.
   - Snapshot fallbacks. For any Company Snapshot row not returned by firmographics (Founded is the typical case), attempt one fallback (LinkedIn posts, website-changes context, general knowledge with verify tag) before leaving blank.

7. Synthesize against the brief purpose. Keep events and signals that map to the purpose, priority themes, or non-obvious flags. Mark past-date enrichments as needing verification. Suppress sections that lack volume: skip funding for public mega-caps (use ticker instead per step 6), flatten challenges or insights to bullets when only 1-3 items. Cross-reference signals (new CTO plus a webstack change plus engineering hiring = a clear timing signal).

8. Write the exec summary last. Re-read the body, then write the TL;DR. The Situation line must explicitly answer "why this brief, now" against the stated purpose.

## Output Format

### TL;DR: [Company Name]
Brief purpose (restated, or "general account intelligence" if defaulted). Then: **Situation** (2 to 4 sentences answering "why this brief, now" against the stated purpose), **Top 3 facts** (most consequential data points), **Highest-leverage actions** (1 to 3 concrete actions tied to specific signals).

### Company Snapshot
A compact field table: Domain, Industry, Headcount bucket, Revenue bucket, HQ Country / Region, Public / Private, Founded, business_id. Any row not returned by firmographics is filled by one fallback per step 6 or marked "not surfaced".

### Firmographics & Hierarchy
Firmographics plus parent / subsidiary structure. Note recent restructuring. If hierarchies returned null, state it.

### Funding & Capital Structure
Total raised, most recent round date and amount, acquisitions. If business events surfaced a more recent round than the enrichment, lead with the events-side fact and flag the enrichment lag. For public mega-caps, lead with ticker + one-line financial posture per step 6.

### Workforce & Hiring Signals
Net headcount change, departmental growth, hiring spikes or contractions. Flag exec moves surfaced via LinkedIn posts or events.

### Tech Stack & Website Activity
Tools in use, recent additions or removals, keyword shifts. Highlight items mapping to the user's offering or competitors. If this tier was not pulled for the declared purpose, say so explicitly rather than mislabeling the section.

### Challenges & Strategic Insights
Stated pain points, public priorities, expansion plans. Tie back to brief purpose. If null because the target is private, state that and point to the live-signal substitutes (events, funding, workforce, LinkedIn).

### Recent Events (last 90 days)
Grouped (Funding / Leadership / Hiring / Product / Risk) when 4+ items span categories, otherwise flat. Each item: event type, date, one-line summary, verified-status per step 6. Call out timing opportunities (new CTO = vendor evaluation likely). End with "events screened out: N (industry-wide cross-attribution)" + any event-type gaps.

### Peer Cohort (directional)
First line: "Cohort construction: <sub-category derived from purpose>; manually included: <names if any>." Caveat that the set is approximated from shared sub-category attributes, not exact similarity. Then a top-10 table: Company, Domain, Size, Revenue, Country. If fewer than 5 confident matches survived, suppress the table per step 5c and replace with the recommendation line.

### Key Takeaways & Next Steps
3 to 5 bullets connecting dots across sources, framed by the stated purpose. Then concrete next actions tied to specific signals, people, or moments. Omit any line without a concrete target.

## Limitations
- Strategic-insights and challenges signals come from public filings: null for private companies and 12-18 months stale for public ones. Use events, funding, workforce, and LinkedIn posts for current state.
- No native similar-companies tool; the peer cohort is approximated from a sub-category derived from the brief purpose and flagged as directional. Named competitors that don't match the filter set are surfaced via the manual-inclusion rule.
- No native intent-topic scoring; intent-style signals come from events, website changes, website keywords, and LinkedIn posts rather than a single ranked feed.
- No AI-generated outbound copy; this skill produces the brief, downstream skills handle messages.
- Bucket-only headcount and revenue. Finer company-type distinctions (subsidiary, JV, PE-backed) must be read from hierarchies and funding rather than filtered.
- Business match returns no confidence score; infer ambiguity from the candidate set, sanity-check the resolved firmographics for shell entities, and confirm with the user when in doubt.
- Event data can cross-attribute industry-wide headlines to multiple companies in the same sector. The per-event verification step is non-optional, not just stylistic.
- No executive-move event type exists; the closest signals are generic hiring and inferred-from-LinkedIn-posts. State this gap in the events trailer when the brief purpose would otherwise expect exec moves.
