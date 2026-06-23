
# HubSpot Enrichment & Scoring

Enrich your HubSpot CRM with Explorium data and write ICP fit scores directly back to your records. Claude runs the full pipeline: pull from HubSpot → match & enrich via Vibe Prospecting → score → push back.

**What you'll end up with:**
- Enriched company records: firmographics, tech stack, funding history, intent signals
- An ICP fit score (0–100) and tier (A/B/C) on every company
- All of it written back to HubSpot as custom properties, ready for segmentation and sequencing

---

## Step 0 — Credential Check (Claude: always do this first)

Do not touch Phase 1 until both checks pass.

### Vibe Prospecting

**Cowork mode:** look for a tool matching `mcp__*__fetch-entities` in your tool list.
- ✅ Found → proceed
- ❌ Missing → tell the user: *"Please connect the Vibe Prospecting connector from the connector store, then let me know when it's done."* Wait. Do not continue until the tool appears.

**Claude Code / terminal:**
```bash
npx @vibeprospecting/vpai@latest --help
```
- ✅ Lists tools → proceed
- ❌ Error → run: `npx @vibeprospecting/vpai@latest config --api-key "YOUR_VP_API_KEY"` (get key from vibeprospecting.com → Settings → API Keys)

### HubSpot Token

Ask the user: *"Please paste your HubSpot Private App token (starts with `pat-`). I'll verify it and we'll get started."*

**Don't have one yet?** Create it in HubSpot → Settings → Integrations → Private Apps → Create a private app. Enable scopes: `crm.objects.companies.read`, `crm.objects.companies.write`. Click Create and copy the token.

Once the user provides the token, verify it:
```bash
export HUBSPOT_TOKEN="<token-from-user>"

curl -s "https://api.hubapi.com/crm/v3/objects/companies?limit=1" \
  -H "Authorization: Bearer $HUBSPOT_TOKEN" \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('✅ Connected') if d.get('results') is not None else print('❌ Failed:', d.get('message','unknown error'))
"
```
- ✅ Connected → tell the user *"Both credentials verified — let's go."* Proceed to Phase 1.
- ❌ Failed → tell the user the token didn't work, ask them to check the scopes and try again. Do not proceed.

> The token lives only in the session environment variable. It is never stored or logged.

---

## Phase 1 — Pull Companies from HubSpot

Export your HubSpot company records. The match keys are `name` and `domain` — domain is the more reliable one.

**For up to 100 companies:**
```bash
curl -s "https://api.hubapi.com/crm/v3/objects/companies?limit=100&properties=name,domain,hs_object_id,lifecyclestage,numberofemployees,annualrevenue,industry" \
  -H "Authorization: Bearer $HUBSPOT_TOKEN" \
  | python3 -c "
import json, sys, csv

data = json.load(sys.stdin)
fields = ['hs_object_id','name','domain','lifecyclestage','numberofemployees','annualrevenue','industry']
w = csv.DictWriter(sys.stdout, fieldnames=fields, extrasaction='ignore')
w.writeheader()
for r in data['results']:
    row = {'hs_object_id': r['id']}
    row.update(r['properties'])
    w.writerow(row)
" > hs-companies-raw.csv

echo "Exported $(wc -l < hs-companies-raw.csv) rows"
```

**For larger exports (paginated):**
```python
import csv, os, requests

TOKEN = os.environ["HUBSPOT_TOKEN"]
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
PROPS = "name,domain,hs_object_id,lifecyclestage,numberofemployees,annualrevenue,industry"
FIELDS = ['hs_object_id','name','domain','lifecyclestage','numberofemployees','annualrevenue','industry']

rows, params = [], {"limit": 100, "properties": PROPS}
while True:
    resp = requests.get("https://api.hubapi.com/crm/v3/objects/companies", headers=HEADERS, params=params)
    resp.raise_for_status()
    data = resp.json()
    for r in data["results"]:
        row = {"hs_object_id": r["id"]}
        row.update(r["properties"])
        rows.append(row)
    after = data.get("paging", {}).get("next", {}).get("after")
    if not after:
        break
    params["after"] = after

with open("hs-companies-raw.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
    w.writeheader()
    w.writerows(rows)

print(f"Exported {len(rows)} companies")
```

**Tips:**
- If many records are missing `domain`, clean those in HubSpot before running this skill — domain is the primary match key and missing domains won't match.
- To enrich only a subset (e.g. leads and MQLs), filter `lifecyclestage` after export before passing to Phase 2.

**Output:** `hs-companies-raw.csv`

> **Starting from scratch with no existing HubSpot records?** Skip to Phase 2 and use `fetch-entities` to build a net-new account list from your ICP, then push those as new HubSpot companies in Phase 5.

---

## Phase 2 — Match to Vibe Prospecting IDs

Resolve company names and domains to Explorium business IDs. These IDs are required for all enrichment steps.

```bash
# Always check schema before first use
npx @vibeprospecting/vpai@latest match-business --all-parameters

# Match from the exported CSV
npx @vibeprospecting/vpai@latest match-business \
  --file-path hs-companies-raw.csv \
  --schema '{"name":"name","domain":"domain"}' \
  --tool-reasoning 'Match HubSpot companies to Vibe Prospecting IDs for enrichment'
```

Note the `session_id` and `table_name` from the JSON output — you'll pass these to every subsequent step.

Drop any matches with confidence < 0.7 before proceeding.

**Output:** matched companies in session DB (`vp-matched` table)

---

## Phase 3 — Enrich

Pull firmographic, technographic, funding, and intent data for every matched company.

```bash
npx @vibeprospecting/vpai@latest enrich-business --all-parameters

npx @vibeprospecting/vpai@latest enrich-business \
  --args '{
    "enrichments": ["firmographics", "technographics", "funding-and-acquisitions"]
  }' \
  --session-id <SESSION_ID> \
  --table-name <TABLE_NAME_FROM_MATCH_STEP> \
  --tool-reasoning 'Enrich HubSpot companies with Vibe Prospecting data' \
  --csv
```

**Available enrichment categories:**

| Category | What you get |
|----------|-------------|
| `firmographics` | Revenue, headcount, industry, HQ location, founding year |
| `technographics` | Full tech stack — CRM, marketing automation, data tools, infra |
| `funding-and-acquisitions` | Total raised, last round type/date/amount, investors |
| `intent` | Topics the company is actively researching (requires intent add-on) |

**Output:** `vp-enriched.csv`

---

## Phase 4 — Score on ICP Fit

Ask the user for their ICP criteria if not already provided:
> *"To score these companies, I need to know your ideal customer profile. What industry, company size, revenue range, and tech stack signals matter most? And how would you weight them?"*

Then read `vp-enriched.csv` and score each row. Add three columns:

| Column | Description |
|--------|-------------|
| `icp_score` | 0–100 fit score |
| `icp_tier` | A (80–100), B (60–79), C (40–59), Disqualified (<40) |
| `icp_score_reason` | One-line explanation |

**Default weights (adjust to the user's ICP):**
- Industry match: 25%
- Headcount match: 25%
- Tech stack match: 30%
- Revenue/funding match: 20%

Save output to `vp-scored.csv`.

---

## Phase 5 — Push Back to HubSpot

### Step 1 — Create custom properties (one-time)

Run this once to create the Vibe Prospecting properties in HubSpot. Skip any that already exist.

```bash
for PROP_JSON in \
  '{"name":"vp_icp_score","label":"ICP Score (Vibe)","type":"number","fieldType":"number"}' \
  '{"name":"vp_icp_tier","label":"ICP Tier (Vibe)","type":"string","fieldType":"text"}' \
  '{"name":"vp_icp_score_reason","label":"ICP Score Reason (Vibe)","type":"string","fieldType":"text"}' \
  '{"name":"vp_headcount","label":"Headcount (Vibe)","type":"number","fieldType":"number"}' \
  '{"name":"vp_annual_revenue","label":"Annual Revenue (Vibe)","type":"number","fieldType":"number"}' \
  '{"name":"vp_tech_stack","label":"Tech Stack (Vibe)","type":"string","fieldType":"textarea"}' \
  '{"name":"vp_total_funding","label":"Total Funding (Vibe)","type":"number","fieldType":"number"}' \
  '{"name":"vp_last_funding_type","label":"Last Funding Type (Vibe)","type":"string","fieldType":"text"}' \
  '{"name":"vp_last_funding_date","label":"Last Funding Date (Vibe)","type":"string","fieldType":"text"}'; do
  curl -s -X POST "https://api.hubapi.com/crm/v3/properties/companies" \
    -H "Authorization: Bearer $HUBSPOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PROP_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('name','?'), '—', 'created' if 'name' in d else d.get('message','error'))"
done
```

### Step 2 — Batch update company records

```python
import csv, json, os, requests, time

TOKEN = os.environ["HUBSPOT_TOKEN"]
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

with open("vp-scored.csv") as f:
    rows = list(csv.DictReader(f))

def build_batch(chunk):
    return [
        {
            "id": row["hs_object_id"],
            "properties": {
                "vp_icp_score":        row.get("icp_score", ""),
                "vp_icp_tier":         row.get("icp_tier", ""),
                "vp_icp_score_reason": row.get("icp_score_reason", ""),
                "vp_headcount":        row.get("employee_count", ""),
                "vp_annual_revenue":   row.get("annual_revenue", ""),
                "vp_tech_stack":       row.get("tech_stack", ""),
                "vp_total_funding":    row.get("total_funding", ""),
                "vp_last_funding_type":row.get("last_funding_type", ""),
                "vp_last_funding_date":row.get("last_funding_date", ""),
            }
        }
        for row in chunk
    ]

# Batch in groups of 100
for i in range(0, len(rows), 100):
    chunk = rows[i:i+100]
    resp = requests.post(
        "https://api.hubapi.com/crm/v3/objects/companies/batch/update",
        headers=HEADERS,
        json={"inputs": build_batch(chunk)}
    )
    print(f"Batch {i//100 + 1}: {resp.status_code}")
    if resp.status_code == 429:
        print("Rate limited — waiting 10s")
        time.sleep(10)
```

**Output:** HubSpot company records updated with enriched fields + ICP scores

---

## Phase 6 (Optional) — Enrich Contacts at Top Accounts

Scope to A-tier accounts only (ICP score ≥ 80) before fetching contacts — keeps the batch focused and cost-efficient.

```bash
# Fetch key contacts at top-scored companies
npx @vibeprospecting/vpai@latest fetch-entities \
  --args '{
    "entity_type": "prospects",
    "filters": {
      "job_level": {"values": ["vice president", "director", "c_suite"]},
      "job_department": {"values": ["sales", "revenue_operations", "marketing"]},
      "has_email": true
    }
  }' \
  --businesses-table-name <TABLE_NAME_FROM_ENRICH_STEP> \
  --session-id <SESSION_ID> \
  --number-of-results 200 \
  --tool-reasoning 'Fetch key contacts at top ICP accounts for HubSpot'

# Enrich with verified contact info
npx @vibeprospecting/vpai@latest enrich-prospects \
  --args '{"enrichments": ["contacts", "profiles"]}' \
  --session-id <SESSION_ID> \
  --table-name <FETCH_PROSPECTS_TABLE> \
  --csv \
  --tool-reasoning 'Enrich contact info for HubSpot push'
```

Then upsert contacts into HubSpot using `/crm/v3/objects/contacts/batch/upsert`, matching on email. Set `hs_additional_domains` or associate to the parent company using the associations API.

---

## Full Checklist

```
[ ] Step 0  — Vibe Prospecting connected, HubSpot token verified
[ ] Phase 1 — Companies exported to hs-companies-raw.csv
[ ] Phase 2 — Matched to Vibe Prospecting IDs
[ ] Phase 3 — Enriched (firmographics, tech stack, funding)
[ ] Phase 4 — ICP scores computed and tiered (A/B/C)
[ ] Phase 5 — HubSpot properties created; company records updated
[ ] Phase 6 — (optional) Contacts enriched and pushed to HubSpot
```

---

## HubSpot Custom Properties Written

| Property | Type | Description |
|----------|------|-------------|
| `vp_icp_score` | Number | ICP fit score 0–100 |
| `vp_icp_tier` | Text | A / B / C / Disqualified |
| `vp_icp_score_reason` | Text | One-line score rationale |
| `vp_headcount` | Number | Employee count from Explorium |
| `vp_annual_revenue` | Number | Estimated annual revenue |
| `vp_tech_stack` | Text | Comma-separated tech stack |
| `vp_total_funding` | Number | Total funding raised (USD) |
| `vp_last_funding_type` | Text | Series A / Seed / PE / etc. |
| `vp_last_funding_date` | Text | Date of most recent round |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Vibe Prospecting tools missing in Cowork | Open connector store → connect Vibe Prospecting → wait for tools to appear |
| HubSpot 401 Unauthorized | Token is wrong or scopes missing — recreate the Private App with correct scopes |
| Low match rate | Ensure `domain` is populated on HubSpot records — it's the primary match key |
| HubSpot 429 Rate Limit | Batch update allows 100 records/call; script already handles this with `time.sleep` |
| Property already exists error on Step 1 | Safe to ignore — the property is already there |
| Contacts not linking to companies | Use the HubSpot associations API after upsert to link contacts to their parent company |
