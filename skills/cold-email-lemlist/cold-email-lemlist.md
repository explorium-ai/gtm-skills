# Cold Email — Vibe Prospecting + Lemlist

Build a targeted prospect list, enrich it with firmographic and contact data, have Claude write personalized emails for each prospect, and push everything to a live Lemlist campaign — ready to send.

**What you'll end up with:**
- A filtered, enriched prospect list with verified work emails
- A personalized first-line (icebreaker) and full email per prospect, written by Claude using their actual company data
- All leads uploaded to a Lemlist campaign with personalization variables pre-filled

---

## Step 0 — Credential Check (Claude: always do this first)

Do not start Phase 1 until both checks pass.

### Vibe Prospecting

**Cowork mode:** look for a tool matching `mcp__*__fetch-entities` in your tool list.
- ✅ Found → proceed
- ❌ Missing → tell the user: *"Please connect the Vibe Prospecting connector from the connector store, then let me know when it's done."* Wait. Do not continue until the tool appears.

**Claude Code / terminal:**
```bash
npx @vibeprospecting/vpai@latest --help
```
- ✅ Lists tools → proceed
- ❌ Error → run: `npx @vibeprospecting/vpai@latest config --api-key "YOUR_VP_API_KEY"`

### Lemlist API Key

Ask the user: *"Please paste your Lemlist API key. I'll verify it and we'll get started."*

Get it from: Lemlist → Settings → Integrations → API.

Once provided, verify:
```bash
export LEMLIST_API_KEY="<key-from-user>"

curl -s "https://api.lemlist.com/api/team" \
  -u ":$LEMLIST_API_KEY" \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('✅ Connected —', d.get('name', 'team found')) if '_id' in d else print('❌ Failed:', d.get('message', 'unknown error'))
"
```
- ✅ Connected → tell the user *"Both credentials verified — let's go."* Proceed to Phase 1.
- ❌ Failed → ask the user to check the API key in Lemlist → Settings → Integrations → API. Do not proceed.

---

## Phase 1 — Define Your ICP and Fetch Prospects

Ask the user for their targeting criteria if not already provided:
> *"Who are we targeting? Tell me: industry, company size, geography, job titles/levels, and any tech stack or funding signals you want to filter on."*

Then run autocomplete for any controlled-vocab fields before fetching.

```bash
# Normalize industry/category values first
npx @vibeprospecting/vpai@latest autocomplete \
  --args '{"field": "linkedin_category", "query": "<user industry>"}' \
  --tool-reasoning 'Normalize industry filter for cold email prospect list'

# Normalize job titles if needed
npx @vibeprospecting/vpai@latest autocomplete \
  --args '{"field": "job_title", "query": "<user job title>"}' \
  --tool-reasoning 'Normalize job title for cold email prospect list'
```

Sample 5 prospects first (full chain — do not stop after fetch to ask for approval):

```bash
npx @vibeprospecting/vpai@latest fetch-entities --all-parameters

npx @vibeprospecting/vpai@latest fetch-entities \
  --args '{
    "entity_type": "prospects",
    "filters": {
      "job_level": {"values": ["<user levels>"]},
      "job_department": {"values": ["<user departments>"]},
      "linkedin_category": {"values": ["<normalized category>"]},
      "company_headcount_range": {"values": ["<user size range>"]},
      "company_country_code": {"values": ["<user geo>"]},
      "has_email": true
    }
  }' \
  --number-of-results 5 \
  --tool-reasoning '<user request verbatim>'
```

Note the `session_id` and `table_name` from the output — pass these to every subsequent step.

Run the full enrich chain on those 5 (Phase 2), show the result as a table, then ask: *"Does this look right? How many prospects do you want in the full run?"* Only after approval re-run at full scale.

---

## Phase 2 — Enrich with Contact Info

Enrich the fetched prospects with verified work email, LinkedIn URL, and direct phone.

```bash
npx @vibeprospecting/vpai@latest enrich-prospects --all-parameters

npx @vibeprospecting/vpai@latest enrich-prospects \
  --args '{"enrichments": ["contacts", "profiles"]}' \
  --session-id <SESSION_ID> \
  --table-name <TABLE_NAME_FROM_FETCH_STEP> \
  --tool-reasoning '<user request verbatim>' \
  --csv
```

Drop any prospects where `work_email` is empty — Lemlist requires a valid email to add a lead.

**Output:** `prospects-enriched.csv` — columns include `first_name`, `last_name`, `work_email`, `linkedin_url`, `job_title`, `company_name`, `company_domain`, `employee_count`, `annual_revenue`, `tech_stack`, `last_funding_type`

---

## Phase 3 — Write Personalized Emails

Read `prospects-enriched.csv` and write a personalized email for each prospect using their actual company data. Do not use generic templates — each email should reference something specific to that company.

Ask the user for:
> *"What's the core value prop you want to lead with? And is there a specific pain point, use case, or trigger (e.g. recent funding, tech stack) you want to reference?"*

For each prospect, write:

**1. Icebreaker (1 sentence)** — a specific, researched opening line referencing something real about their company. Examples of what to use:
- Their tech stack (e.g. "Noticed you're running Salesforce + HubSpot...")
- Company size/growth signal (e.g. "With [X] employees and growing...")
- Funding event (e.g. "Congrats on the Series B — scaling RevOps is usually top of mind at that stage...")
- Industry-specific angle

**2. Email body** — 4–6 sentences max. Structure:
- Icebreaker (from above)
- One-sentence value prop tied to their context
- One-sentence social proof or specific outcome
- Clear, low-friction CTA (e.g. "Worth a 15-min call this week?")

**3. Subject line** — short, specific, not salesy. Under 8 words.

Write all output to `prospects-emails.csv`, adding these columns to the enriched data:

| Column | Description |
|--------|-------------|
| `icebreaker` | Personalized first line |
| `email_subject` | Subject line |
| `email_body` | Full email body |

**Example output row:**

| Field | Value |
|-------|-------|
| `icebreaker` | Noticed you're running Salesforce and recently closed a Series A — congrats. |
| `email_subject` | faster pipeline data for [company] |
| `email_body` | Noticed you're running Salesforce and recently closed a Series A — congrats. At that stage, RevOps teams usually hit a wall with stale CRM data slowing down outbound. Explorium helps teams like yours enrich and score their entire HubSpot or Salesforce account base in under an hour, so reps are always working the right accounts. Happy to show you a quick example with your actual ICP. Worth a 15-min call this week? |

After writing all emails, show a table of 3–5 sample rows for the user to review before uploading. Ask: *"Does the tone and personalization feel right? Any tweaks before I push to Lemlist?"*

---

## Phase 4 — Create Lemlist Campaign

Create a new campaign in Lemlist to hold these prospects, or ask the user if they want to add to an existing one.

### Option A — Create a new campaign

```bash
# Create campaign
CAMPAIGN=$(curl -s -X POST "https://api.lemlist.com/api/campaigns" \
  -u ":$LEMLIST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vibe Prospecting — <ICP description> — <date>",
    "type": "email"
  }')

echo $CAMPAIGN | python3 -c "import json,sys; d=json.load(sys.stdin); print('Campaign ID:', d.get('_id','error'))"
export LEMLIST_CAMPAIGN_ID="<campaign _id from above>"
```

### Option B — Use an existing campaign

```bash
# List existing campaigns
curl -s "https://api.lemlist.com/api/campaigns" \
  -u ":$LEMLIST_API_KEY" \
  | python3 -c "
import json, sys
for c in json.load(sys.stdin):
    print(c['_id'], '—', c['name'])
"

# User picks one → set it
export LEMLIST_CAMPAIGN_ID="<chosen campaign id>"
```

---

## Phase 5 — Upload Leads to Lemlist

Add each prospect from `prospects-emails.csv` to the campaign. Lemlist accepts custom variables per lead — use these to carry the personalized icebreaker and email copy into the campaign.

```python
import csv, json, os, requests, time

API_KEY = os.environ["LEMLIST_API_KEY"]
CAMPAIGN_ID = os.environ["LEMLIST_CAMPAIGN_ID"]
AUTH = ("", API_KEY)

with open("prospects-emails.csv") as f:
    prospects = list(csv.DictReader(f))

success, failed = 0, []

for p in prospects:
    email = p.get("work_email", "").strip()
    if not email:
        continue

    payload = {
        "firstName":    p.get("first_name", ""),
        "lastName":     p.get("last_name", ""),
        "companyName":  p.get("company_name", ""),
        "linkedinUrl":  p.get("linkedin_url", ""),
        # Custom variables — reference these in your Lemlist email template
        # as {{icebreaker}}, {{emailBody}}, {{emailSubject}}
        "icebreaker":   p.get("icebreaker", ""),
        "emailBody":    p.get("email_body", ""),
        "emailSubject": p.get("email_subject", ""),
    }

    resp = requests.post(
        f"https://api.lemlist.com/api/campaigns/{CAMPAIGN_ID}/leads/{email}",
        auth=AUTH,
        json=payload
    )

    if resp.status_code in (200, 201):
        success += 1
    elif resp.status_code == 429:
        print("Rate limited — waiting 5s")
        time.sleep(5)
        resp = requests.post(
            f"https://api.lemlist.com/api/campaigns/{CAMPAIGN_ID}/leads/{email}",
            auth=AUTH, json=payload
        )
        if resp.status_code in (200, 201):
            success += 1
        else:
            failed.append({"email": email, "error": resp.text})
    else:
        failed.append({"email": email, "error": resp.text})

print(f"\n✅ {success} leads uploaded")
if failed:
    print(f"❌ {len(failed)} failed:")
    for f in failed: print(" ", f["email"], "—", f["error"])
```

After upload, tell the user:
> *"[N] leads are now in your Lemlist campaign. Before you launch, make sure your email template in Lemlist uses `{{icebreaker}}`, `{{emailBody}}`, and `{{emailSubject}}` as variables so the personalization populates correctly. You'll also want to set your sending schedule and daily limits in Lemlist before activating."*

---

## Full Checklist

```
[ ] Step 0  — Vibe Prospecting connected, Lemlist API key verified
[ ] Phase 1 — ICP defined, prospect list fetched (sample approved)
[ ] Phase 2 — Prospects enriched with verified emails and company data
[ ] Phase 3 — Personalized emails written and reviewed
[ ] Phase 4 — Lemlist campaign created or selected
[ ] Phase 5 — Leads uploaded with personalization variables
[ ] Done    — Review campaign in Lemlist, set schedule, activate
```

---

## Lemlist Template Setup (one-time)

In your Lemlist campaign, your email step should use these variable placeholders:

```
Subject: {{emailSubject}}

{{icebreaker}}

{{emailBody}}
```

This lets Claude's personalized copy flow directly into each lead's email without any manual editing.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Vibe Prospecting tools missing | Connect from connector store; wait for `mcp__*__fetch-entities` to appear |
| Lemlist 401 Unauthorized | API key wrong — regenerate in Lemlist → Settings → Integrations → API |
| Lemlist 404 on lead upload | Campaign ID is wrong — re-check with the list campaigns call in Phase 4 |
| Lead already exists error | Lemlist returns 409 if the email is already in the campaign — safe to ignore |
| Low match rate / missing emails | `has_email: true` filter in Phase 1 ensures only contactable prospects are fetched |
| Emails feel generic | Give Claude more context in Phase 3: specific pain points, recent company news, or competitor context |
| Lemlist rate limits | API allows ~120 req/min — the script handles 429s with retry; for very large lists add `time.sleep(0.5)` between calls |
