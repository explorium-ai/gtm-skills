---
name: personalize-email
description: Assemble a personalization signal pack for one prospect so a downstream LLM can compose a tailored email. Resolves the prospect, pulls company firmographics + recent business events + funding + workforce trends + LinkedIn posts + website changes + intent topics, and attaches the prospect's role context and LinkedIn activity. Returns a structured brief (signal ladder, recency stamps, anchor candidates, persona cues, proof hooks) ready to drop into a cold outbound, follow-up, re-engagement, renewal, expansion, or objection-handling email prompt. Use for sales prospecting, lead generation, account-based selling, signal-led outreach, B2B prospecting. Triggers on phrases like "personalize an email", "draft outreach", "outbound to X", "follow up on this prospect", "find a hook for this contact", "build me a personalization brief", "what should I say to this lead".
---

# Personalize Email

Gather every personalization signal for a single prospect and their company so the calling model can write a sharp, specific email. This skill does NOT draft the email: it returns a structured brief; the calling model composes copy.

## Input

- Prospect identifier (required): full name + company, full name + company domain, LinkedIn URL, email, or a role at a company ("CFO at Notion") with no name.
- Use case (default `cold_outbound`): one of `cold_outbound`, `discovery_follow_up`, `demo_recap`, `re_engagement`, `renewal`, `expansion`, `objection_handling`. Drives which signals matter most.
- Recency floor (optional): days. Defaults: 14 for intent topics, 30 for executive moves, 90 for company events.
- Sender / offering note (optional): one line on what the user sells, used only to rank signals.
- Prior touchpoint summary (optional, recommended for follow-up, recap, renewal): what was last discussed, when, who was involved.

## Workflow

1. Resolve the prospect. If a LinkedIn URL or email is supplied, match the person directly. Otherwise match the business first to anchor the company, then match the person by full name plus the resolved company. On miss, retry first plus last name. Capture prospect_id, business_id, full_name, job_title, linkedin_url. If either id fails, stop and surface the gap.
2. Resolve-by-role path (the user named a seat, not a person). Matching by full_name="CFO" silently returns nothing: do NOT use that path. Instead match the business, then sample prospects at that account filtered by canonical job title and seniority. This is the dominant cold-outbound shape when the user knows the seat but not the person.
3. Domain-variant sanity check at match time. After firmographics land, if the input was a major brand but the resolved entity has headcount 1-50 and looks like a registered-agent shell, retry with the alternate domain (.so vs .com) or the company-name string. Do not proceed with the wrong account.
4. Discover canonical values for any free-text dimension the user named (industry, technology, city) before applying a filter. Show top matches and wait for the user to pick.
5. Enrich the company. Firmographics first (industry, size, headcount, revenue range, HQ, age). Then pull recent signals broadly: funding and acquisitions, workforce trends, LinkedIn posts, website changes, stated challenges and strategic priorities. Add technographics only when the offering implies a tech-stack pitch. Add competitive landscape only for objection_handling or competitive displacement framing.
6. Fetch business events on the last 90 days. Keep every event with a date; drop those older than the use-case recency floor during scoring. Event-attribution sanity check: ensure events tie to the matched business, not blended across a parent / subsidiary tree.
7. Enrich the prospect. Profile (seniority, department, tenure in seat, last 2 prior employers). Pull contacts only when the user intends to send outreach: default email-only (cheaper), switch to email + phone only when phone is required (SDR dialer flows). Skip contacts entirely otherwise. Fetch prospect events for job-change or promotion moves. Per-prospect post history is a current gap; pull the employer's recent posts as a substitute for company voice.
8. Score and rank signals. Stamp each with age in days and a source tag. Score recency x persona relevance x use-case fit. Recency: 0-14d = 1.0, 15-30d = 0.7, 31-60d = 0.4, 61-90d = 0.2, older = drop. Persona: CFO maps to funding / earnings / M&A; CRO and VP Sales map to hiring surges, product launches, GTM posts; CTO and VP Eng map to website changes, technographics, engineering hires; CEO maps to all. Use case: cold outbound and re-engagement lean on fresh events; follow-up, recap, renewal, expansion lean on prior touchpoint plus role and company posts; objection handling leans on competitive landscape and strategic insights. Rank top 5; mark the highest `anchor_candidate`, next `runner_up`.
9. Build the persona cue block. Seniority, department, tenure in seat, last 2 prior employers. Tone hint by seat: executive (outcome first, numeric), director / manager (problem then approach then outcome), IC (workflow friction then concrete benefit). Pull 1-3 direct quotes or themes from recent posts when available.
10. Assemble the proof hook list. Suggest peer-segment framings by industry and size band. Do not invent customer names or stats; flag only categories where the calling model could later plug real customer proof.
11. Flag gaps and refuse conditions. For cold_outbound or re_engagement, if zero events pass the recency floor and zero relevant posts exist, mark `signal_layer: thin` and recommend warming via another channel. For follow-up family without a prior touchpoint summary, surface the gap and ask; do not fabricate. If profile last update is older than 12 months or the resolved company does not match the user-named company, add `stale_record: true` and recommend verifying.

## Output Format

- TL;DR: one paragraph with prospect name, title, company, the single strongest anchor signal with age, and the persona tone hint.
- Prospect: full name, job title, company name, company domain, LinkedIn URL, prospect_id, business_id, email (only if contacts were pulled).
- Company snapshot: 2-4 lines covering industry, size bucket, headcount, revenue range, HQ, founding year.
- Signal ladder (ranked): for each of the top 5, rank, signal type, age in days, source tag, one-line description, why it matters for this persona and use case, anchor / runner-up flag.
- Persona cues: seniority, department, tenure in seat, last 2 prior employers, tone hint, direct quotes or post themes (up to 3, with date).
- Proof hook categories: peer-segment framings the calling model could plug real customer proof into. No invented stats or logos.
- Brief for the drafting model: compact structured block with anchor and age, runner-up, persona block, company block, chosen use case, gaps, and an explicit "do_not_invent" list (customer names, stats not in this brief).
- Flags: `signal_layer` (rich | moderate | thin), `stale_record`, `missing_prior_touchpoint` (only for follow-up family), `competitor_mention_detected`.

## Limitations

- Funding and acquisition data has coverage gaps for late-stage privates with no S-1. For CFO personas at private targets, lean on business events (M&A, new funding round, cost cutting, hiring in finance) instead.
- No native sort by signal recency at the API level; ranking is done client-side.
- No metro taxonomy; location filtering relies on city autocomplete plus country code.
- No similar-companies tool; peer framing falls back to industry plus size band.
- Headcount and revenue are buckets, not exact values.
- This skill does not draft email copy. The calling model writes subject lines and bodies from the brief.
- Per-prospect post history is not available; flag as a gap when the use case wants the individual's posting voice.
- Department is null for many cross-functional senior roles (Chief X Officer, President, Founder). Group these under "Unattributed" in the persona cue block.
