# Phase 1 — Build the Account List

Use Vibe Prospecting to translate your ICP definition into a concrete list of target companies.

**Prerequisites:** Vibe Prospecting configured (see [`setup.md`](setup.md))

---

## Step 1 — Define Your ICP

Before running any search, gather these inputs from the user:

| Dimension | Examples |
|-----------|----------|
| **Industry** | SaaS, Fintech, Healthcare IT, E-commerce |
| **Company size** | 50–500 employees, or $10M–$100M revenue |
| **Geography** | US, UK, DACH, APAC |
| **Tech stack** | Salesforce, HubSpot, AWS, Snowflake |
| **Funding stage** | Seed, Series A–C, PE-backed, Public |
| **Growth signals** | Recent funding, hiring surge, new office opening |
| **Intent signals** | Actively researching competitor tools |
| **Exclude** | Competitors, current customers (get domain list from CRM) |

Store the ICP as `icp-definition.json` at the project root:

```json
{
  "industry_linkedin": ["Software Development", "Financial Services"],
  "headcount_range": ["51-100", "101-250", "251-500"],
  "country_codes": ["US"],
  "tech_stack": ["Salesforce", "HubSpot"],
  "funding_recency_days": 180,
  "exclude_domains": ["competitor.com", "existing-customer.com"]
}
```

---

## Step 2 — Normalize Filter Values

LinkedIn category and NAICS values must come from the Vibe autocomplete, not free text.

```bash
# Look up linkedin_category values
npx @vibeprospecting/vpai@latest autocomplete \
  --args '{"field":"linkedin_category","query":"software"}' \
  --tool-reasoning 'Normalizing industry filter for ABM account list'

# Look up tech stack values
npx @vibeprospecting/vpai@latest autocomplete \
  --args '{"field":"company_tech_stack_tech","query":"salesforce"}' \
  --tool-reasoning 'Normalizing tech stack filter for ABM account list'

# Look up city/region if targeting specific metros
npx @vibeprospecting/vpai@latest autocomplete \
  --args '{"field":"city_region","query":"new york"}' \
  --tool-reasoning 'Normalizing geography filter for ABM account list'
```

Use only the **exact values returned** by autocomplete in your fetch calls.

---

## Step 3 — Sample Fetch (5 accounts)

Always run a sample first. Show results and wait for approval before full export.

```bash
npx @vibeprospecting/vpai@latest fetch-entities \
  --args '{
    "entity_type": "business",
    "filters": {
      "linkedin_category": {"values": ["Software Development"]},
      "company_headcount_range": {"values": ["51-100","101-250","251-500"]},
      "company_country_code": {"values": ["US"]},
      "company_tech_stack_tech": {"values": ["Salesforce"]}
    },
    "page_size": 5
  }' \
  --tool-reasoning 'Sample fetch for ABM account list — awaiting user approval'
```

Show the 5 results in a markdown table with: company name, domain, headcount, revenue, location, tech stack.

Ask the user to confirm before proceeding. **Stop the turn here.**

---

## Step 4 — Full Export

Only after user approval. Export all matching companies to CSV.

```bash
# Set writable tmp dir
export TMPDIR=/tmp/abm-vibe
mkdir -p $TMPDIR

# Page 1
npx @vibeprospecting/vpai@latest fetch-entities \
  --args '{
    "entity_type": "business",
    "filters": {
      "linkedin_category": {"values": ["Software Development"]},
      "company_headcount_range": {"values": ["51-100","101-250","251-500"]},
      "company_country_code": {"values": ["US"]},
      "company_tech_stack_tech": {"values": ["Salesforce"]}
    },
    "page_size": 100,
    "page": 1
  }' \
  --save-csv \
  --tool-reasoning 'Full export for ABM account list'
```

Paginate until you have the desired number of accounts (or the response returns fewer than `page_size`).

---

## Step 5 — Apply Exclusions

Remove competitors and existing customers from the raw list using Python:

```python
import csv

exclude_domains = set(["competitor.com", "existing-customer.com"])  # from icp-definition.json

with open("abm-accounts-raw.csv") as f_in, open("abm-accounts-filtered.csv", "w") as f_out:
    reader = csv.DictReader(f_in)
    writer = csv.DictWriter(f_out, fieldnames=reader.fieldnames)
    writer.writeheader()
    for row in reader:
        domain = row.get("company_domain", "").lower()
        if domain and not any(domain.endswith(d) for d in exclude_domains):
            writer.writerow(row)

print("Done. Remaining accounts:", sum(1 for _ in open("abm-accounts-filtered.csv")) - 1)
```

---

## Step 6 — Add Intent Signal Filter (Optional)

If your ICP includes accounts showing purchase intent or recent business events:

```bash
# Fetch companies with recent funding rounds
npx @vibeprospecting/vpai@latest fetch-entities \
  --args '{
    "entity_type": "business",
    "filters": {
      "linkedin_category": {"values": ["Software Development"]},
      "company_country_code": {"values": ["US"]},
      "events": {"values": ["new_funding_round"], "last_occurrence": 180}
    },
    "page_size": 5
  }' \
  --tool-reasoning 'Fetching accounts with recent funding signals for ABM list'
```

Available event types: `new_funding_round`, `executive_change`, `product_launch`, `hiring_surge`, `expansion_news`

---

## Outputs

| File | Description |
|------|-------------|
| `icp-definition.json` | ICP parameters |
| `abm-accounts-raw.csv` | All matching companies from Vibe |
| `abm-accounts-filtered.csv` | After exclusions applied |

Typical raw list size: 500–5,000 companies. You'll score and filter down to your final target list in Phase 2.

**Next:** [`02-enrich-score.md`](02-enrich-score.md)
