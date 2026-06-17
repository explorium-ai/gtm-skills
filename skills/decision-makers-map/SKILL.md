---
name: decision-makers-map
description: Map the decision-makers and buying committee at a target account. Identifies economic buyers, champions, technical evaluators, and influencers; prioritizes who to engage first; surfaces coverage gaps and multi-thread risk. Leads with a TL;DR (top 3 to engage, biggest gap, single-thread risk), uses compact tables, and flags recently appointed leaders. Identify the account by company domain (preferred) or company name; include deal context, persona priorities, and any hypotheses to test.
---

# Decision-Makers Map
Map the buying committee at one target account: who matters, what role they play, and who to engage first.

## Input
`$ARGUMENTS` is an account identifier plus optional context.

- Account identifier (required): a company domain (preferred) or a company name.
- Research context (strongly recommended): why this map is being pulled and what decision it supports. Capture as much as is true: deal stage and value, offering in play, recent activity or stalls, who is already engaged, who is missing, competitive pressure, persona priorities, timing, and any working hypothesis to test.

Example phrasings:
- "Map the buying committee at acme.com. Stage 3 deal, $400K ARR, security platform. We talked to the Director of SecOps but the CISO is quiet: find the economic buyer and any procurement blockers."
- "Decision-makers at Globex for a Data Platform pitch. Cold prospecting, likely Eng or Data leadership, flag CFO if cost story applies."
- "Renewal in 90 days at initech.com, champion left last quarter. Find the new owner and anyone who could block renewal."

If only a bare token is supplied with no context, ask once. If declined, default to general committee mapping for prospecting and state that assumption in the TL;DR.

## Workflow
1. Anchor on purpose. Restate the research context in 1-2 sentences as the map purpose. Derive priority personas (3-6 titles or functions), priority seniority levels, priority departments, and any named hypotheses ("find the economic buyer").

2. Resolve the account: **match a business** from domain or name, then **enrich a business** with firmographics for company name, headcount, revenue range, industry, and HQ. Domain-variant sanity check: if a major-brand input resolves to a tiny headcount with a "Corporate Managing Offices" or "Hotels and motels" classification, the match likely routed to a registered-agent shell entity. Re-try with the alternate domain or company-name string. If no confident match, surface the ambiguity rather than guessing.

3. Discover canonical values for the committee search. For every priority title, discover canonical job-title strings the filter surface accepts. Title-only filters are NOT enforced as strict exact-match: combine title with a seniority filter to tighten.

4. Size the committee. Run a count (statistics, not retrieval) scoped to the resolved company plus the priority title and seniority filters. Country caveat: country scoping is approximate at the statistics layer; read the per-location category breakdown and sum the requested ISO-2 codes. If the total is very large (above ~500), tighten with department or higher seniority; if very small (under ~10), loosen by dropping seniority or adding adjacent titles.

5. Sample the committee broadly (retrieval, not filtering). Sample a small slice of prospects matching the resolved account plus the title and seniority filters, using presence-of-email as a contact-quality proxy. Treat the preview as a sample, not a ranked top-N. Run a second sample for adjacent functions named in the context (Procurement, Legal, Finance) so coverage gaps are visible.

6. Account-context signals. Fetch business events for the resolved account scoped to the last 90 days. There is no executive-move or departure enum: closest signals are an undifferentiated `employee_joined_company` and department-level hiring events. Flag this as a capability gap in the brief. Also triage funding and strategy signals that change the buying dynamic. Optionally enrich the account with strategic insights, challenges, and competitive landscape when a named hypothesis ties to a strategic theme. Event-attribution sanity check: confirm any event row actually names the target account before quoting it.

7. Enrich and deep-research the top contacts. Merge prospects from step 5, dedupe, and rank by seniority, persona fit, hypothesis fit, and presence of email or LinkedIn URL. Enrich the top contacts with contacts and profiles, defaulting to email-only (cheaper; switch on phone only for SDR dialer flows). For the top 3-5 stakeholders, surface recent activity from the business-side LinkedIn-posts enrichment (per-prospect LinkedIn-posts is not exposed).

8. Synthesize. Each retrieval is raw context; decide what makes the map.
   - Events triage: keep new-hire, executive-move, and promotion signals at director-level and above, especially in priority or adjacent functions. For each newly-named person, **match a prospect** if not already enriched and add to the committee with a RECENTLY APPOINTED flag and event date.
   - Role classification (conservative): Champions require explicit engagement evidence (CRM activity, demo, prior emails); title alone is never sufficient, default to Potential Champions under Influencers. Technical Evaluators are director-and-above in Engineering, IT, or the function being sold to. Economic Buyers hold budget: C-Level Finance, the sponsoring function head, or CEO for strategic deals. Influencers use named sub-buckets (Procurement, Legal / Compliance, Operations, Adjacent Marketing, HR / Talent, Potential Champions).
   - Hypothesis check: address each named hypothesis as confirmed, contradicted, or unresolved.
   - Source tagging: tag every contact with where it came from (committee sample, event-derived, freshly matched).

9. Write the exec summary last. Re-read the body, then write the TL;DR at the top, framed by the map purpose.

## Output Format

### Decision-Makers Map: [Company Name]
Header line: **industry** | **headcount / size bucket** | **revenue bucket** | **HQ**.

### TL;DR
Map purpose (restated in one line, or "general committee mapping for prospecting" if defaulted). One paragraph with: top 3 contacts to engage (named, one-line reasoning each), biggest coverage gap, single-thread risk, and a one-line answer to each named hypothesis. Sample preview phrasing for committee tables: "Sample preview (top 20 of <total> matches)."

### Company Snapshot
One paragraph: what they do, where they sit, key firmographic and strategic signals.

### Account Context
Deal status, engaged stakeholders, key signals (leadership moves, funding, strategic shifts), open issues / blockers. Pull from user context where available.

### Committee Map (tables)
Per category, a 5-column table with columns: Name, Title, Email, Status, Source. Skip empty categories.
- Economic Buyers
- Champions (only if explicit engagement evidence exists; otherwise "No Champions identified. See Potential Champions under Influencers.")
- Technical Evaluators
- Influencers (one table per sub-bucket that has contacts: Procurement, Legal / Compliance, Operations, Adjacent Marketing, HR / Talent, Potential Champions)
- Recently Appointed (last 90 days): same 5 columns plus Appointment Date; these also appear in their primary category with a RECENTLY APPOINTED flag.

### Key Stakeholders (top 3-5)
Per stakeholder: Role classification, Background (career summary, time in role), Engagement history (or "No prior engagement recorded"), Why they matter, Flags (`no email on file`, `RECENTLY APPOINTED`, source disagreements), Recommended approach tied to the hypothesis or coverage need.

### Engagement Strategy
Specific to this account, not a generic playbook. Anchor each step to a named person and a real signal.
1. Immediate priorities (next 2 weeks): top 3 actions tied to specific people and signals.
2. Coverage gaps: specific empty persona slots ("No Finance stakeholder below the CFO; director-level FP&A search recommended").
3. Sequencing: ordered outreach with named people and reasons.
4. Single-thread risk: current dependencies and the moves to fix them.

### Excluded / Needs Verification
Table with Name, Reason, Recommended Action. Use for prospects with no email and no LinkedIn URL, ambiguous title matches, or names returned only by events that could not be resolved.

### Next Steps
Concrete next actions, each referencing a specific person, persona gap, hypothesis, or signal, and tied to the map purpose.

## Limitations
- Strategic-insights and challenges are sourced from SEC 10-K filings: all-null for private companies, and can be 12-18 months stale for public ones. Use events, funding, workforce trends, and LinkedIn posts for current-state signals.
- No native contact data-quality sort. Use presence-of-email as a proxy for reachable contacts.
- No executive-move or departure event enum. Closest signals are undifferentiated new-hire and department-level hiring; executive-level moves must be inferred from other sources and flagged as a capability gap.
- No sub-department job-function filter. Combine canonical title values with department to approximate functions like "FP&A" or "SecOps".
- No CRM-engagement signal in the data surface. Champion designation depends on engagement evidence supplied in the user context; without it, default to Potential Champions under Influencers.
- Bucket-only company size and revenue. Use bucket labels when describing the account snapshot.
- Department is null for many cross-functional senior roles (Chief X Officer, President, Founder). Group under "Unattributed" rather than dropping.
