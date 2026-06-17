---
name: meeting-prep
description: Prepare for an upcoming sales meeting with a target account. Identify the company by Explorium business_id (preferred) or by company name or domain (which triggers a lookup step). Provide attendee names or emails and rich context on the meeting purpose, stakes, and known dynamics so the calling agent can synthesize a tight, decision-ready brief: headline, attendee profiles, ranked talking points, discovery questions, suggested agenda, and what NOT to do. Optimized for a 30-minute slot. Triggers on phrases like "prep me for a meeting with", "build a call brief for", "I have a call tomorrow with", "pre-meeting research on".
---

# Meeting Prep

Pull the company, signal, and attendee evidence the calling agent needs to write a tight, decision-ready brief for a ~30-minute meeting.

## Input

- Account identifier (required): an Explorium business_id (preferred), or a company name or domain.
- Attendees (recommended): names and/or emails. Without attendees the brief is necessarily generic.
- Meeting context (strongly recommended): free-form description of purpose, stakes, prior discussions, deal stage, walk-out goals, known tensions, competitive context, the offering in play, hypotheses to test, and pitfalls. Flat enums produce flat briefs.

If the identifier is ambiguous: a string with a dot or known TLD is a domain; otherwise treat it as a name.

## Workflow

Parallelize aggressively. Company enrichment fans out from the resolved account; per attendee, resolve and enrich profile evidence in parallel.

1. Anchor on purpose. Restate the meeting context in 1-2 sentences. If missing, ask once; if the user declines, default to general prep and state that assumption. Derive purpose (1 line), desired outcome, 3-5 priority topics, named risks or hypotheses. These drive insight focus, attendee framing, talking-point ranking, and the suggested agenda.
2. Match the business. If a business_id was supplied, use it directly. Otherwise resolve by name or domain. If no confident match, surface the ambiguity rather than guessing. Domain-variant sanity check: if firmographics show a major brand but headcount is 1-50 and the entity looks like a registered-agent shell, retry with the alternate domain (.so vs .com) or the company-name string.
3. Enrich the business broadly: firmographics and technographics, funding and acquisitions, strategic insights and stated challenges, hiring direction and workforce trends, competitive landscape and company hierarchies, recent LinkedIn posts, website changes. Gather broadly now; decide relevance during synthesis.
4. Fetch business events on a 30-90 day window. Treat events as raw signal to triage in step 6. Event-attribution sanity check: tie every event to the matched business; do not blend across the parent / subsidiary tree silently.
5. Match and enrich attendees in parallel. Resolve each by email when available, otherwise by full name plus the resolved company. If an attendee cannot be resolved, note it; do not fabricate. Enrich each resolved person for profile (seniority, department, tenure, prior roles). Pull contacts only when the user intends to send outreach: default email-only (cheaper), switch to email + phone only when phone is required (SDR dialer flows). Per-prospect post history is a current gap; pull the employer's recent posts for voice instead.
6. Hand back raw evidence for synthesis. The calling agent writes the narrative brief. Organize so the calling agent can: triage events and posts (keep items tied to purpose, deal stage, attendees, priority topics; drop generic press); classify per-attendee posture from employment history and recent voice (Cold, Warm-but-dormant with significant past tenure at a relevant prior employer, Active, Hostile); rank 3-5 talking points by relevance to the desired outcome, each tied to a specific surfaced fact and ideally a named attendee; mark each named hypothesis confirmed, contradicted, or unresolved; tag claims by source category; flag any past-dated milestone for verification rather than dropping silently.
7. Write the TL;DR last, framed by the meeting purpose and desired outcome.

## Output Format

- TL;DR: meeting purpose / desired outcome in one line (or "general meeting prep (no context supplied)" if defaulted); top 3 to know walking in, each tied to the outcome; hypothesis check one line each (confirmed / contradicted / unresolved); "Open with" a single recommended opening line, verbatim, calibrated to attendee posture.
- Company Snapshot: industry, size bucket, revenue range, HQ, website, business model. One paragraph weaving in strategic priorities and current challenges.
- Signals Worth Raising: grouped by category (funding and M&A, hiring direction, tech stack overlap or gaps, recent business events, voice on LinkedIn or site changes, competitive context, parent / subsidiary). For any past date inline: "Verify; date is in the past."
- Attendees: per attendee, name and title, department (fallback "Unattributed" when null), canonical seniority display (c-suite, vice president, director, manager), email, phone, LinkedIn, time in role, posture (Cold / Warm-but-dormant / Active / Hostile). "Why they matter for THIS meeting": 2 lines max. Talking points for them: 1-2 specific. If profile data is thin: "Profile data restricted; verify externally."
- Talking Points (3-5): ranked by impact, tagged for audience, each referencing a supporting data point with its source category tag. Prioritize items that show homework, connect to the offering, surface competitive angles, or hit a specific persona.
- Discovery Questions (3-5): specific, anchored in concrete facts. Tag each for an attendee or the group.
- Suggested Agenda (~30 min): (0-5) Open with the calibrated line; (5-15) Explore with the top talking point and 2 questions; (15-25) Develop with the secondary point, demo, or proposal; (25-30) Close on the specific desired next step.
- What NOT to Do: 1-3 specific failure modes for THIS meeting. Concrete, not generic.

## Limitations

- Strategic insights and stated challenges are sourced from SEC 10-K filings: for private companies these will be all-null, and for public companies they can be 12-18 months stale. Use business events, funding, workforce trends, and recent posts for current-state signals.
- Business event fetching supports a date floor but no upper bound; window the upper edge client-side.
- Company size and revenue are bucketed. State buckets verbatim; do not interpolate exact figures.
- No native CRM relationship history or deal-stage data. Posture must be inferred from profile history and post voice, plus user-supplied context.
- No executive-move event enum. New-hire / departure signals must be inferred from workforce trends and profile changes, not fetched as a typed event.
- Past-dated milestones must be verified externally; treat them as prompts to check, not ground truth.
- Attendees who cannot be matched should be listed as unresolved. Do not synthesize their roles.
- Department is null for many cross-functional senior roles (Chief X Officer, President, Founder). Group these under "Unattributed".
