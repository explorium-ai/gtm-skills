# Phase 2 — Enrich & Score Accounts

Enrich every company with firmographic and technographic data, compute an ICP fit score, and filter to your best-fit target accounts.

**Input:** `abm-accounts-filtered.csv` from Phase 1

---

## Step 1 — Match Companies to Vibe Business IDs

The enrichment APIs require Vibe business IDs. Match your company list in batches of 50.

```bash
# Extract domains from your CSV as JSON array (first 50)
python3 - <<'EOF'
import csv, json
rows = list(csv.DictReader(open("abm-accounts-filtered.csv")))[:50]
payload = [{"name": r.get("company_name",""), "domain": r.get("company_domain","")} for r in rows]
print(json.dumps({"businesses_to_match": payload}))
EOF
```

Then match:

```bash
npx @vibeprospecting/vpai@latest match-business \
  --args '<paste output above>' \
  --save-csv \
  --tool-reasoning 'Matching accounts for enrichment in ABM campaign'
```

Repeat in batches of 50 until all companies are matched. Save the matched IDs as `abm-business-ids.json`.

---

## Step 2 — Enrich Firmographics

Enrich in batches of 50 business IDs.

```bash
npx @vibeprospecting/vpai@latest enrich-business \
  --args '{
    "business_ids": ["biz_id_1", "biz_id_2"],
    "enrichments": ["firmographics", "technographics", "funding-and-acquisitions", "workforce-trends"]
  }' \
  --tool-reasoning 'Enriching firmographics for ABM account scoring'
```

Save raw JSON output to `enrichment-firmographics.json`:
```bash
npx @vibeprospecting/vpai@latest enrich-business \
  --args '...' \
  --tool-reasoning '...' \
  > enrichment-firmographics.json
```

---

## Step 3 — Fetch Company Logos

LinkedIn ad creatives with the prospect's logo significantly improve CTR. Fetch logos via Vibe.

```bash
npx @vibeprospecting/vpai@latest enrich-business \
  --args '{
    "business_ids": ["biz_id_1", "biz_id_2"],
    "enrichments": ["firmographics"]
  }' \
  --tool-reasoning 'Fetching company logos for ad personalization'
```

The `firmographics` enrichment includes `logo_url`. Download logos to `creative/logos/<domain>.png`:

```python
import json, requests, os

os.makedirs("creative/logos", exist_ok=True)

data = json.load(open("enrichment-firmographics.json"))
for company in data.get("enrichment_results", []):
    domain = company.get("domain", "unknown")
    logo_url = company.get("firmographics", {}).get("logo_url")
    if logo_url:
        try:
            r = requests.get(logo_url, timeout=10)
            if r.status_code == 200:
                with open(f"creative/logos/{domain}.png", "wb") as f:
                    f.write(r.content)
                print(f"Saved logo: {domain}")
        except Exception as e:
            print(f"Failed {domain}: {e}")
```

---

## Step 4 — Compute ICP Fit Score

Claude computes a 0–100 fit score based on how closely each account matches the ICP.

**Default scoring model** (adjust weights based on your ICP):

| Signal | Weight | Scoring Logic |
|--------|--------|---------------|
| Headcount in ideal range | 25 | Full score if in range, half if adjacent |
| Revenue in ideal range | 20 | Full score if in range, half if adjacent |
| Tech stack match | 20 | +5 per matched tool, up to 20 |
| Industry match | 15 | Full score if primary industry matches |
| Recent funding | 10 | Full if funded in last 90 days, half if 90–180 |
| Growth rate (headcount) | 10 | +10 if headcount grew >20% YoY |

Run the scoring script:

```python
import json, csv

def score_account(company, icp):
    score = 0
    firm = company.get("firmographics", {})

    # Headcount
    hc = firm.get("employee_count", 0)
    if icp["hc_min"] <= hc <= icp["hc_max"]:
        score += 25
    elif icp["hc_min"] * 0.5 <= hc <= icp["hc_max"] * 2:
        score += 12

    # Revenue (USD millions)
    rev = firm.get("revenue_usd_millions", 0)
    if icp.get("rev_min", 0) <= rev <= icp.get("rev_max", 9999):
        score += 20
    elif icp.get("rev_min", 0) * 0.5 <= rev:
        score += 10

    # Tech stack
    tech = set(t.lower() for t in firm.get("tech_stack", []))
    for t in icp.get("required_tech", []):
        if t.lower() in tech:
            score += min(5, 20 - score)  # cap at 20

    # Industry
    industry = firm.get("linkedin_category", "")
    if industry in icp.get("target_industries", []):
        score += 15

    # Funding recency
    days_since_funding = firm.get("days_since_last_funding", 9999)
    if days_since_funding <= 90:
        score += 10
    elif days_since_funding <= 180:
        score += 5

    # Growth
    hc_growth = firm.get("headcount_growth_yoy_pct", 0)
    if hc_growth >= 20:
        score += 10
    elif hc_growth >= 10:
        score += 5

    return min(score, 100)

# Load ICP and enrichment data
icp = json.load(open("icp-definition.json"))
enrichment = json.load(open("enrichment-firmographics.json"))

# Score all accounts
results = []
for company in enrichment.get("enrichment_results", []):
    s = score_account(company, icp)
    results.append({
        "company_name": company.get("name"),
        "domain": company.get("domain"),
        "business_id": company.get("business_id"),
        "headcount": company.get("firmographics", {}).get("employee_count"),
        "revenue_usd_m": company.get("firmographics", {}).get("revenue_usd_millions"),
        "industry": company.get("firmographics", {}).get("linkedin_category"),
        "fit_score": s,
        "logo_url": company.get("firmographics", {}).get("logo_url"),
    })

# Sort by score descending
results.sort(key=lambda x: x["fit_score"], reverse=True)

# Save scored list
keys = results[0].keys()
with open("abm-accounts-scored.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=keys)
    w.writeheader()
    w.writerows(results)

print(f"Scored {len(results)} accounts")
print(f"Score distribution: 80+ = {sum(1 for r in results if r['fit_score']>=80)}, "
      f"60-79 = {sum(1 for r in results if 60<=r['fit_score']<80)}, "
      f"<60 = {sum(1 for r in results if r['fit_score']<60)}")
```

---

## Step 5 — Filter & Segment

Keep accounts above score threshold and assign to segments.

```python
import csv

SCORE_THRESHOLD = 60  # adjust based on list size target

with open("abm-accounts-scored.csv") as f:
    accounts = list(csv.DictReader(f))

# Filter
best_fit = [a for a in accounts if int(a["fit_score"]) >= SCORE_THRESHOLD]

# Segment by score tier
def assign_segment(score):
    s = int(score)
    if s >= 80:
        return "Tier1-Strategic"
    elif s >= 65:
        return "Tier2-Target"
    else:
        return "Tier3-Awareness"

for a in best_fit:
    a["segment"] = assign_segment(a["fit_score"])

# Save final list
with open("abm-accounts-final.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(best_fit[0].keys()))
    w.writeheader()
    w.writerows(best_fit)

# Segment summary
from collections import Counter
seg_counts = Counter(a["segment"] for a in best_fit)
print(f"Final list: {len(best_fit)} accounts")
for seg, count in sorted(seg_counts.items()):
    print(f"  {seg}: {count}")
```

---

## Outputs

| File | Description |
|------|-------------|
| `abm-business-ids.json` | Vibe business IDs for matched companies |
| `enrichment-firmographics.json` | Raw enrichment data |
| `creative/logos/` | Company logos downloaded as PNG |
| `abm-accounts-scored.csv` | All accounts with fit scores |
| `abm-accounts-final.csv` | Filtered, segmented final account list |

Typical final list: 100–500 accounts across 2–3 segments.

**LinkedIn minimum:** You need at least 300 matched companies in Phase 5 for LinkedIn to serve ads. If your final list is smaller, consider relaxing the score threshold or broadening the ICP.

**Next:** [`03-ad-templates.md`](03-ad-templates.md)
