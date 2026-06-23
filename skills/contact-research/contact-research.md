# Contact Research — Vibe Prospecting Deep Profile

Given a list of people, match and enrich each one with Vibe Prospecting, then have Claude write a professional synopsis — who they are, what they do, their career trajectory, and what's relevant to know before engaging with them.

**What you'll end up with:**
- Verified contact info (work email, LinkedIn, direct phone) for each person
- A full professional profile: current role, work history, seniority, department, company context
- Recent career signals: job changes, promotions
- A 4–6 sentence professional synopsis per person, written by Claude in plain English

**Good for:** pre-call research, account intelligence, investor diligence on founders, recruiting, conference prep.

---

## Step 0 — Credential Check (Claude: always do this first)

**Cowork mode:** confirm `mcp__*__fetch-entities` is in your tool list.
- ✅ Found → proceed
- ❌ Missing → tell the user: *"Please connect the Vibe Prospecting connector from the connector store, then let me know."* Wait. Do not continue.

**Claude Code / terminal:**
```bash
npx @vibeprospecting/vpai@latest --help
```
- ✅ Lists tools → proceed
- ❌ Error → run: `npx @vibeprospecting/vpai@latest config --api-key "YOUR_VP_API_KEY"`

---

## Phase 1 — Prepare Your People List

Ask the user how they want to provide their list:

> *"How would you like to provide the people? You can: (A) paste names and companies directly in chat, (B) share a CSV file, or (C) describe who you're targeting and I'll find them from Vibe Prospecting's database."*

### Option A — Paste in chat
Claude converts the input into a structured CSV. Minimum needed per person: `full_name` + one of `company_name`, `email`, or `linkedin`.

### Option B — CSV file
Accepted columns (use whatever you have — more is better for matching):

| Column | Description |
|--------|-------------|
| `full_name` | Full name (or `first_name` + `last_name` separately) |
| `email` | Work or personal email |
| `linkedin` | LinkedIn profile URL |
| `company_name` | Current company name |
| `business_id` | Vibe Prospecting business ID (skip match step if you have this) |

Save the file as `people-input.csv`.

### Option C — Find them from scratch
If the user describes a persona (e.g. "CFOs at fintech companies in the US"), use `fetch-entities` with `entity_type: prospects` to build the list, then proceed from Phase 2. Sample 5 first before scaling.

```bash
npx @vibeprospecting/vpai@latest fetch-entities \
  --args '{
    "entity_type": "prospects",
    "filters": {
      "job_level": {"values": ["c_suite"]},
      "job_department": {"values": ["finance"]},
      "linkedin_category": {"values": ["Financial Services"]},
      "company_country_code": {"values": ["US"]},
      "has_email": true
    }
  }' \
  --number-of-results 5 \
  --tool-reasoning '<user request verbatim>'
```

---

## Phase 2 — Match to Vibe Prospecting IDs

Resolve each person to an Explorium prospect ID. This unlocks all downstream enrichment.

```bash
npx @vibeprospecting/vpai@latest match-prospects --all-parameters

# From CSV
npx @vibeprospecting/vpai@latest match-prospects \
  --file-path people-input.csv \
  --schema '{"full_name":"full_name","email":"email","linkedin":"linkedin","company_name":"company_name"}' \
  --tool-reasoning 'Match people list for deep contact research'
```

Note the `session_id` and `table_name` from the output.

**On low match confidence:** drop records with confidence < 0.7 and flag them for the user — they may need a cleaner input (e.g. adding LinkedIn URL or email helps significantly).

---

## Phase 3 — Enrich Profiles and Contact Info

Pull the full professional profile for each matched person, plus their verified contact details.

```bash
npx @vibeprospecting/vpai@latest enrich-prospects --all-parameters

npx @vibeprospecting/vpai@latest enrich-prospects \
  --args '{
    "enrichments": ["contacts", "profiles"]
  }' \
  --session-id <SESSION_ID> \
  --table-name <TABLE_NAME_FROM_MATCH_STEP> \
  --tool-reasoning 'Enrich profiles and contact info for research' \
  --csv
```

**What "profiles" gives you:**
- Current job title, department, seniority level
- Full work history (company, title, dates)
- Education history
- LinkedIn URL
- Skills and areas of expertise

**What "contacts" gives you:**
- Verified work email
- Direct phone / mobile (when available)
- LinkedIn URL (confirmed)

---

## Phase 4 — Fetch Career Signals

Pull recent career events for each person — job changes and promotions are the most useful signals for understanding where someone is and why they might be receptive to a conversation.

```bash
npx @vibeprospecting/vpai@latest fetch-prospects-events --all-parameters

npx @vibeprospecting/vpai@latest fetch-prospects-events \
  --args '{
    "event_types": ["job_change", "promotion"],
    "timestamp_from": "<12 months ago, format YYYY-MM-DD>"
  }' \
  --session-id <SESSION_ID> \
  --table-name <TABLE_NAME_FROM_ENRICH_STEP> \
  --tool-reasoning 'Fetch career events for contact research' \
  --csv
```

Save the combined enriched + events data as `people-enriched.csv`.

---

## Phase 5 — Write Professional Synopses

Read `people-enriched.csv` and write a professional brief for each person. Each synopsis should be in plain, natural English — like a colleague briefing you before a meeting, not a LinkedIn bio.

**For each person, write a 4–6 sentence synopsis covering:**

1. **Who they are right now** — current role, company, seniority. What they're responsible for.
2. **How they got here** — 1–2 relevant prior roles that show their trajectory or expertise.
3. **What they know** — domain expertise, industries they've worked in, notable skills or patterns across their career.
4. **What's changed recently** — any job change or promotion in the last 12 months. If nothing changed, note their tenure in the current role.
5. **What's worth knowing** — one insight that would be useful before engaging: a shared background, a relevant company pivot, a pattern in their career, or a company context signal (e.g. their company just raised, or is in a growth stage).

**Tone:** confident, specific, no filler. Avoid phrases like "passionate about", "seasoned professional", or "proven track record." Use the actual data.

**Example synopsis:**

> Sarah Chen is the VP of Revenue Operations at Lattice, where she owns the full RevOps stack — CRM, pipeline reporting, territory planning, and sales tool evaluation. Before Lattice she spent four years at Salesforce, first as a sales ops analyst and then as a senior manager, which explains her strong bias toward CRM-native workflows. Her career has stayed tightly in the revenue/GTM ops lane, moving from execution roles into leadership over the last three years. She joined Lattice 14 months ago, likely as part of a post-Series D scaling push. Worth knowing: Lattice runs HubSpot, not Salesforce — so she made a deliberate switch when she moved, which suggests she's not locked into any one platform.

---

## Phase 6 — Deliver the Output

Present results in two formats:

### 1. In-chat briefing (for small lists, ≤ 10 people)

Show each person as a card:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 [Full Name] — [Title] at [Company]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 [work_email]
🔗 [linkedin_url]
📱 [phone if available]

[Synopsis paragraph]

Career signals: [any job change/promotion in last 12 months, or "No recent changes — [X] years in current role"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. CSV export (for larger lists or when the user wants to save/share)

Write `people-research.csv` with columns:

| Column | Description |
|--------|-------------|
| `full_name` | Full name |
| `job_title` | Current title |
| `company_name` | Current company |
| `work_email` | Verified work email |
| `linkedin_url` | LinkedIn URL |
| `phone` | Direct phone (if available) |
| `synopsis` | Claude's professional synopsis |
| `career_signal` | Most recent job change or promotion (if any, last 12 months) |
| `years_in_role` | Approximate tenure in current role |

---

## Full Checklist

```
[ ] Step 0  — Vibe Prospecting connected
[ ] Phase 1 — People list prepared (pasted, CSV, or fetched)
[ ] Phase 2 — Matched to Vibe Prospecting prospect IDs
[ ] Phase 3 — Profiles and contact info enriched
[ ] Phase 4 — Career signals fetched (job changes, promotions)
[ ] Phase 5 — Professional synopses written by Claude
[ ] Phase 6 — Delivered as in-chat cards and/or CSV export
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Vibe Prospecting tools missing | Connect from connector store; wait for `mcp__*__fetch-entities` to appear |
| Low match rate | Add LinkedIn URLs or emails to input — they're the strongest match signals. Names alone match poorly for common names |
| Profile data sparse | Not all profiles are equally populated. Flag thin records to the user and note what's missing |
| No contact info returned | Some people have limited public contact data. Note it in the synopsis card rather than leaving it blank |
| Career events empty | Person may not have changed jobs recently — note their tenure in current role instead |
| Synopsis feels generic | Claude needs data to work with — if enrichment returned little, flag the record rather than inventing details |
