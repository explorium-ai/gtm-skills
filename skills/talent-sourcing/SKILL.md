---
name: talent-sourcing
description: "Talent sourcing skill for Claude Code and Codex: turn a job description or role brief into a ranked candidate pipeline using real-time professional and company data from Explorium via Vibe Prospecting. Returns candidates with current title, employer, seniority, tenure, career trajectory, LinkedIn profile, and contact data, scored against must-have and nice-to-have criteria. Use for recruiting, technical sourcing, executive search, and building passive-candidate pipelines. Triggers on 'source candidates', 'find candidates for', 'build a talent pipeline', 'who could fill this role', 'sourcing for a [role]', 'boolean search alternative', 'recruiter sourcing'. Works in Claude Code, Codex, Hermes-Agent, and OpenClaw."
compatibility: "Requires: Vibe Prospecting MCP server (https://vibeprospecting.explorium.ai/mcp, bundled with this plugin) or the Vibe Prospecting CLI (npx @vibeprospecting/vpai@latest)"
---

# Talent Sourcing

Turn a role brief into a ranked, contactable pipeline of passive candidates, with a transparent fit score per person.

## Input

`$ARGUMENTS` is a job description, a pasted JD link's text, or a free-text brief. Parse it for:

- Target role: title, seniority, department / function.
- Must-haves vs nice-to-haves. If the brief does not separate them, propose a split and confirm before searching.
- Source-company profile: industry, size bucket, stage, tech stack, or a named list of target companies ("ex-Stripe, Adyen, or Checkout.com").
- Exclusions: current employer, clients under a no-poach agreement, companies the user names.
- Geography: country, state, city region, or "remote in [country]".
- Pipeline size (default 30, max 150) and whether contact data is needed now or later.

Example phrasings: "Senior backend engineers, Go + Kafka, at Series B-D fintechs in Germany", "VP Sales for a 200-person SaaS company, must have scaled a team from 10 to 50", "Head of RevOps, ex-HubSpot or Salesforce customer, US remote, exclude our clients", "30 product designers at consumer apps in London".

## Setup check (always do this first)

This skill runs on Explorium's B2B data through Vibe Prospecting. Before step 1, confirm a data path is available:

- **MCP / connector:** a Vibe Prospecting tool such as `fetch-entities` or `match-business` is in your tool list. If it is, proceed.
- **CLI fallback:** run `npx @vibeprospecting/vpai@latest --help`. If it lists tools, proceed. If it errors on auth, ask the user to run `npx @vibeprospecting/vpai@latest config --api-key "YOUR_VP_API_KEY"`.
- **Neither available:** stop and tell the user: "Please connect the Vibe Prospecting connector (https://vibeprospecting.explorium.ai/mcp) or configure the CLI, then let me know." Do not continue or invent data.

## Workflow

1. **Build the search blueprint.** Translate the brief into a candidate profile (titles, seniority, department, geography) and a source-company profile (industry, size, stage, tech, named companies). Expand the target title into 3 to 6 adjacent titles a strong candidate might hold today ("Staff Engineer", "Senior Software Engineer, Payments", "Tech Lead"). Note one level down in seniority as a "step-up" pool when the role is a promotion move for most candidates. Show the blueprint and confirm before any fetch.

2. **Discover canonical values.** Resolve every free-text token (job titles, industries, technologies, city regions) to the standardized values the API expects. Skip discovery for ISO country codes, region codes, size and revenue buckets, seniority and department enums.

3. **Resolve the source companies.** When the user names target companies, match each one and sanity-check the firmographics: a well-known brand returning 1-50 employees in a Corporate-Managing-Offices category is likely a shell entity, so retry with the alternate domain. When the user describes a company profile instead, build a businesses table from those filters first and thread it into the prospect fetch. Remove excluded companies at this stage.

4. **Tighten loose title filters.** Title filters are not exact-match: always pair a title with a seniority value, and with a department when the title is generic ("Manager", "Lead").

5. **Size the pool.** Get a total match count. Under 20: suggest broadening (adjacent titles, wider geography, step-up pool). Over 2,000: suggest tightening (narrower company profile, tech stack, seniority). Report the number honestly.

6. **Sample-first preview.** Pull 5 candidates and render them for the user to sanity-check the translation. Wait for approval before materializing the full pipeline.

7. **Materialize and enrich.** Pull the full pipeline. Enrich every row with profile data (work history, tenure in current role, prior employers, education where available). Defer contact enrichment until the user confirms they are ready to reach out; then default to professional email, and add personal email or phone only when the user explicitly asks.

8. **Check recent movement.** Fetch prospect events on the pipeline to flag recent role changes. Someone who changed jobs in the last 6 months is rarely movable: mark them, do not drop them. Fetch business events on their employers for the last 90 days: layoffs, leadership changes, acquisitions, and funding drought raise openness to a move; a fresh large funding round lowers it.

9. **Score and rank.** Score each candidate 0-100:
   - Must-have fit (50): title, seniority, function, and any must-have that can be evidenced from profile data. A candidate missing a must-have caps at 49.
   - Nice-to-have fit (20): source-company match, tech stack of employer, career trajectory (promotions, scope growth).
   - Movability (20): tenure in role 2-4 years = high; under 12 months = low; 5+ years = medium. Employer-level signals from step 8 adjust up or down.
   - Reachability (10): professional email, then personal email, then LinkedIn only.
   Break ties by must-have fit, then movability.

## Output Format

### Role Blueprint
Bullets: target and adjacent titles, seniority (plus step-up pool if used), function, geography, source-company profile, exclusions, and the must-have / nice-to-have split as confirmed.

### Candidate Pipeline

| Rank | Name | Current Title | Current Company | Tenure In Role | Prior Employers | Location | Score | Movability | LinkedIn | Email | Why They Fit |
|------|------|---------------|-----------------|----------------|-----------------|----------|-------|------------|----------|-------|--------------|

"Why They Fit" is one clause tied to the brief ("Scaled SDR team at a Series C fintech; Kafka shop"). Leave Email blank until contact enrichment runs.

### Pool Read
Total matching pool from step 5, rows returned, score distribution (80+, 60-79, under 60), breakdown by source company and by location. Flag gaps: a must-have no candidate evidences, a target company with zero matches, or a geography that is too thin.

### Top 10 To Contact First
One line each: why now (tenure, employer event) and a suggested outreach angle drawn from their trajectory, not generic praise.

### Next Steps
- Run contact enrichment on the top tier once outreach is approved.
- Run `talent-mapping` on the strongest source companies to see the full bench there.
- Pass the top 10 to `contact-research` for a per-person synopsis before outreach.
- Re-run with the step-up pool or adjacent geography to widen a thin pipeline.

## Fair-hiring and privacy rules

- Never filter, score, or comment on protected characteristics (age, gender, ethnicity, religion, disability, nationality, family status) or proxies for them, such as graduation year used to infer age or names used to infer gender or origin. If the brief asks for this, decline that criterion and say why.
- Score only on job-related evidence present in the data. Do not infer skills the profile does not show; mark them "unverified" instead.
- Use contact data only for recruiting outreach about a real role. Remind the user to honor opt-outs and local rules (GDPR, CCPA) on candidate data.

## Limitations

- Requires the Vibe Prospecting connector or CLI; data coverage and credits follow the user's Vibe Prospecting plan.
- Profile data reflects what candidates publish professionally. Skills, scope, and team size are often missing: treat absence as unknown, not as a gap.
- No native skills or certifications filter. Approximate with title tokens, department, and employer tech stack.
- No sub-department job-function filter. Combine discovered titles with department.
- Title filters are loose: always pair with seniority.
- Headcount and revenue are bucketed, so source-company size cuts are approximate.
- The preview is capped at 5 rows. The full pipeline materializes only after approval.
- Compensation, visa status, and job-seeking intent are not available.
