---
name: enrich-contact
description: Look up a single person's full professional profile in Explorium. Provide an email, a name plus company, a LinkedIn URL, or a known prospect_id. Returns title, seniority, department, work email, phone, company firmographics, and the linkable prospect_id for downstream workflows.
---

# Enrich Contact

Resolve one person and return their full enriched profile in a single pass.

## Input

The user will supply one of:
- An email address (e.g. `jane@acme.com`)
- A full name plus a company name or domain (e.g. `Jane Smith at Acme Corp`)
- A LinkedIn profile URL
- A known Explorium `prospect_id`

Optional: a request for company context (firmographics on the matched employer).

## Workflow

1. **Classify the identifier.** Pick exactly one resolution path: do not fan out match strategies in parallel. Use the strongest signal first and fall back only if it returns no match.
   - Email present and well-formed: path A.
   - LinkedIn URL: path B.
   - Bare `prospect_id`: path D, skip resolution.
   - Full name plus a company token: path C.
   - Phone-only: stop and tell the user phone-only is not a supported match key.

2. **Resolve the prospect.**
   - Path A: match the prospect by email.
   - Path B: match the prospect by LinkedIn URL.
   - Path C: if the user gave a company name, first resolve the business to get its canonical domain and `business_id`, then match the prospect by full name plus that company domain or id.
   - Path D: use the supplied id directly.

3. **Handle ambiguity.** If matching returns zero rows:
   - For path A, retry by splitting the email local-part into a name guess plus the company domain.
   - For path C, retry with first/last name and the resolved `business_id` from a company match.
   - If multiple plausible rows return, surface a candidates table and ask the user to pick. Never silently take the first row.

4. **Enrich the prospect.** Pull contacts and profile on the resolved person. Default to email-only contacts (cheaper); upgrade to email plus phone only when the user explicitly needs phone numbers (e.g. SDR dialer flows).
   - Recent LinkedIn post content for an individual is not available. If the user asks for post content, surface this gap and offer the employer's LinkedIn posts via business enrichment instead.

5. **Optional company context.** If the user asked for company context (or path C resolved a `business_id`), enrich firmographics on the employer and surface headcount, revenue range, country, and industry.

6. **Assemble the output.** Render the card below. Omit empty fields. Always surface the `prospect_id`.

## Output Format

**[Full Name]** at [Company]

| Field | Value |
|-------|-------|
| Job Title | |
| Job Level | display canonical (e.g. `c-suite`, `vice president`) |
| Job Department | fallback "Unattributed" when null |
| Professional Email / Personal Email / Phone | |
| LinkedIn URL | |
| Company / Domain / Industry | |
| Company Size / Revenue / Country | buckets |
| prospect_id / business_id | |

If multiple candidates surfaced during resolution and the user has not yet picked, render a `### Candidates` table instead, with one row per candidate (name, title, company, domain, prospect_id) and ask which to enrich.

## Limitations

- High-profile public execs (CEOs, founders, well-known executives) often have suppressed contact data. Professional email may be null or only a personal address. Recommend LinkedIn outreach instead of cold email for this tier.
- Phone-only lookup is not a supported match key.
- No per-prospect accuracy or confidence score. Treat the presence of a professional email plus phone as the practical quality signal.
- No `last_updated` timestamp per contact field. Level and department are coarse buckets; department is null for many cross-functional senior roles (Chief X Officer, President, Founder), group under "Unattributed".
- Company size and revenue are bucketed, not exact numbers.
