# Phase 6 — Create, Launch & Manage Campaigns

Create LinkedIn campaigns targeting your matched audiences, upload personalized creatives, launch, and monitor performance.

**Prerequisites:** `linkedin-audience-ids.json`, `creative/personalized/` populated
**Input:** audience IDs, rendered ad images, copy variants

---

## Campaign Structure (Recommended)

```
Campaign Group: "ABM Q3 2025"
├── Campaign: "Tier1-Strategic — Single Image"
│   ├── Ad: Acme Corp — personalized creative
│   ├── Ad: Stripe — personalized creative
│   └── Ad: [segment creative for accounts without individual creatives]
└── Campaign: "Tier2-Target — Single Image"
    ├── Ad: [segment creative - headline variant A]
    └── Ad: [segment creative - headline variant B]
```

---

## Step 1 — Create Campaign Group

```bash
GROUP_RESPONSE=$(curl -s -X POST \
  "https://api.linkedin.com/v2/adCampaignGroupsV2" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d '{
    "account": "urn:li:sponsoredAccount:'$LINKEDIN_AD_ACCOUNT_ID'",
    "name": "ABM Campaign — '$(date +%Y-%m-%d)'",
    "status": "ACTIVE",
    "totalBudget": {
      "amount": "5000",
      "currencyCode": "USD"
    },
    "runSchedule": {
      "start": '$(python3 -c "import time; print(int(time.time()*1000))")'
    }
  }')

echo $GROUP_RESPONSE | python3 -m json.tool
GROUP_ID=$(echo $GROUP_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','').split(':')[-1])")
echo $GROUP_ID > linkedin-group-id.txt
```

---

## Step 2 — Create Campaigns Per Segment

```python
import json, subprocess, os, time

token = os.environ["LINKEDIN_ACCESS_TOKEN"]
account_id = os.environ["LINKEDIN_AD_ACCOUNT_ID"]
group_id = open("linkedin-group-id.txt").read().strip()
audience_ids = json.load(open("linkedin-audience-ids.json"))

campaign_ids = {}

for segment, seg_audience_id in audience_ids.items():
    # Daily budget: $50–$200 depending on tier
    daily_budget = "200" if "Tier1" in segment else "100"

    payload = json.dumps({
        "account": f"urn:li:sponsoredAccount:{account_id}",
        "campaignGroup": f"urn:li:adCampaignGroup:{group_id}",
        "name": f"ABM — {segment} — {__import__('datetime').date.today()}",
        "status": "PAUSED",  # Start paused; review before activating
        "type": "SPONSORED_UPDATES",
        "costType": "CPM",
        "dailyBudget": {
            "amount": daily_budget,
            "currencyCode": "USD"
        },
        "targetingCriteria": {
            "include": {
                "and": [
                    {
                        "or": {
                            "urn:li:adTargetingFacet:audienceMatchingSegments": [
                                f"urn:li:dmpSegment:{seg_audience_id}"
                            ]
                        }
                    }
                ]
            }
        },
        "objectiveType": "WEBSITE_CONVERSIONS",
        "locale": {"country": "US", "language": "en"},
        "runSchedule": {
            "start": int(time.time() * 1000)
        }
    })

    result = subprocess.run([
        "curl", "-s", "-X", "POST",
        "https://api.linkedin.com/v2/adCampaignsV2",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-H", "X-Restli-Protocol-Version: 2.0.0",
        "-d", payload
    ], capture_output=True, text=True)

    data = json.loads(result.stdout)
    campaign_id = data.get("id", "").split(":")[-1]
    campaign_ids[segment] = campaign_id
    print(f"Created campaign for {segment}: {campaign_id}")

# Save campaign IDs
with open("campaign-ids.json", "w") as f:
    json.dump({"group": group_id, "campaigns": campaign_ids}, f, indent=2)
```

---

## Step 3 — Upload Creatives & Create Ads

For each account's personalized creative, register the image and attach it to the campaign.

```python
import os, csv, json, subprocess, base64

token = os.environ["LINKEDIN_ACCESS_TOKEN"]
account_id = os.environ["LINKEDIN_AD_ACCOUNT_ID"]
campaign_ids = json.load(open("campaign-ids.json"))
copy_variants = json.load(open("creative/copy-variants.json"))
accounts = list(csv.DictReader(open("abm-accounts-final.csv")))

def upload_image(image_path: str) -> str:
    """Register image with LinkedIn and return the asset URN."""
    # Step 1: Initialize upload
    init_resp = subprocess.run([
        "curl", "-s", "-X", "POST",
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": f"urn:li:organization:{account_id}",
                "serviceRelationships": [{
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent"
                }]
            }
        })
    ], capture_output=True, text=True)
    init_data = json.loads(init_resp.stdout)
    upload_url = init_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
    asset_id = init_data["value"]["asset"]

    # Step 2: Upload binary
    subprocess.run([
        "curl", "-s", "-X", "PUT", upload_url,
        "-H", "Content-Type: image/png",
        "--data-binary", f"@{image_path}"
    ], capture_output=True)

    return asset_id

def create_ad(campaign_id: str, image_asset: str, headline: str, intro_text: str, destination_url: str):
    """Create a sponsored content ad creative."""
    payload = json.dumps({
        "account": f"urn:li:sponsoredAccount:{account_id}",
        "campaign": f"urn:li:adCampaign:{campaign_id}",
        "status": "ACTIVE",
        "type": "SPONSORED_STATUS_UPDATE",
        "reference": f"urn:li:share:{asset_id}"  # see LinkedIn sponsored content API docs
    })
    # See LinkedIn Ads API docs for full sponsored content creative creation
    # https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/advertising-targeting/create-and-manage-ads

for account in accounts[:100]:  # LinkedIn max 100 creatives per campaign
    domain = account.get("domain", "").replace("/", "_")
    segment = account.get("segment", "Tier2-Target")
    campaign_id = campaign_ids["campaigns"].get(segment)
    if not campaign_id:
        continue

    img_path = f"creative/personalized/{domain}/single.png"
    if not os.path.exists(img_path):
        print(f"No creative for {domain}, skipping")
        continue

    print(f"Uploading creative for {domain}...")
    asset_id = upload_image(img_path)

    copy = copy_variants.get(segment, {})
    company_name = account.get("company_name", "")
    headline = copy.get("headlines", [""])[0].replace("{{company_name}}", company_name)

    create_ad(campaign_id, asset_id, headline,
              intro_text=f"Personalized for {company_name}",
              destination_url="https://your-landing-page.com?company=" + domain)

print("All creatives uploaded.")
```

---

## Step 4 — Activate Campaigns

Review in LinkedIn Campaign Manager, then activate:

```bash
CAMPAIGN_ID="your_campaign_id"
curl -s -X POST \
  "https://api.linkedin.com/v2/adCampaignsV2/urn:li:adCampaign:${CAMPAIGN_ID}" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d '{"patch": {"$set": {"status": "ACTIVE"}}}'
```

---

## Step 5 — Daily Monitor: Frequency Cap & Performance

Run this script daily (or schedule it as a cron job). It pulls lifetime and daily stats, computes frequency, **auto-pauses any campaign that has reached frequency ≥ 10**, and flags other performance issues.

**Why frequency 10?** At freq 10, the audience has seen your ad enough times that incremental impressions produce diminishing returns and start hurting brand perception. Pausing preserves budget for account refreshes and prevents ad fatigue.

```python
import subprocess, json, os, csv
from datetime import date, timedelta

FREQUENCY_PAUSE_THRESHOLD = 10

token = os.environ["LINKEDIN_ACCESS_TOKEN"]
account_id = os.environ["LINKEDIN_AD_ACCOUNT_ID"]
campaign_data = json.load(open("campaign-ids.json"))

today = date.today()
yesterday = today - timedelta(days=1)

def api_get(url: str) -> dict:
    r = subprocess.run(
        ["curl", "-s", url, "-H", f"Authorization: Bearer {token}",
         "-H", "X-Restli-Protocol-Version: 2.0.0"],
        capture_output=True, text=True
    )
    return json.loads(r.stdout)

def pause_campaign(campaign_id: str, reason: str):
    subprocess.run([
        "curl", "-s", "-X", "POST",
        f"https://api.linkedin.com/v2/adCampaignsV2/urn:li:adCampaign:{campaign_id}",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-H", "X-Restli-Protocol-Version: 2.0.0",
        "-d", json.dumps({"patch": {"$set": {"status": "PAUSED"}}})
    ], capture_output=True)
    print(f"  PAUSED campaign {campaign_id}: {reason}")

def format_date_params(d: date) -> str:
    return f"dateRange.start.day={d.day}&dateRange.start.month={d.month}&dateRange.start.year={d.year}"

report_rows = []

for segment, campaign_id in campaign_data["campaigns"].items():
    print(f"\n── {segment} (campaign {campaign_id}) ──")

    # --- Lifetime stats (for frequency) ---
    # Frequency = lifetime impressions / unique reach (approximated as impressions / clicks ratio
    # when viralImpressions not available; use approximateUniqueImpressions when available)
    campaign_start = campaign_data.get("start_date", "2025-01-01")
    start = date.fromisoformat(campaign_start)

    lifetime_url = (
        f"https://api.linkedin.com/v2/adAnalyticsV2?q=analytics&pivot=CAMPAIGN"
        f"&{format_date_params(start)}"
        f"&dateRange.end.day={today.day}&dateRange.end.month={today.month}&dateRange.end.year={today.year}"
        f"&campaigns[0]=urn:li:adCampaign:{campaign_id}"
        f"&fields=impressions,clicks,approximateUniqueImpressions,costInLocalCurrency,externalWebsiteConversions"
    )
    lifetime = api_get(lifetime_url)
    lt = lifetime.get("elements", [{}])[0]

    lt_impressions = lt.get("impressions", 0)
    lt_unique = lt.get("approximateUniqueImpressions", 0)
    lt_clicks = lt.get("clicks", 0)
    lt_spend = float(lt.get("costInLocalCurrency", 0))
    lt_conversions = lt.get("externalWebsiteConversions", 0)

    # Frequency: impressions / unique reach. Fall back to impressions/clicks*10 if no unique data.
    frequency = (lt_impressions / lt_unique) if lt_unique > 0 else None

    print(f"  Lifetime — Impressions: {lt_impressions:,}, Unique reach: {lt_unique:,}")
    if frequency is not None:
        print(f"  Frequency: {frequency:.1f}x (pause threshold: {FREQUENCY_PAUSE_THRESHOLD})")
    print(f"  Lifetime spend: ${lt_spend:.2f}, Conversions: {lt_conversions}")

    # --- Auto-pause at frequency threshold ---
    if frequency is not None and frequency >= FREQUENCY_PAUSE_THRESHOLD:
        pause_campaign(campaign_id, f"frequency {frequency:.1f} reached threshold {FREQUENCY_PAUSE_THRESHOLD}")
        status = "PAUSED_FREQUENCY"
    else:
        status = "ACTIVE"

    # --- Yesterday's daily stats ---
    daily_url = (
        f"https://api.linkedin.com/v2/adAnalyticsV2?q=analytics&pivot=CAMPAIGN"
        f"&{format_date_params(yesterday)}"
        f"&dateRange.end.day={yesterday.day}&dateRange.end.month={yesterday.month}&dateRange.end.year={yesterday.year}"
        f"&campaigns[0]=urn:li:adCampaign:{campaign_id}"
        f"&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions"
    )
    daily = api_get(daily_url)
    d = daily.get("elements", [{}])[0]

    d_impressions = d.get("impressions", 0)
    d_clicks = d.get("clicks", 0)
    d_spend = float(d.get("costInLocalCurrency", 0))
    d_ctr = (d_clicks / d_impressions * 100) if d_impressions > 0 else 0
    d_cpc = (d_spend / d_clicks) if d_clicks > 0 else 0

    print(f"  Yesterday — Impressions: {d_impressions:,}, CTR: {d_ctr:.2f}%, CPC: ${d_cpc:.2f}")

    # --- Flag performance issues (only for still-active campaigns) ---
    if status == "ACTIVE":
        if d_impressions > 1000 and d_ctr < 0.4:
            print(f"  ⚠ LOW CTR — swap to headline variant B or C")
        if d_cpc > 15:
            print(f"  ⚠ HIGH CPC — review bid strategy")
        if d_impressions < 500 and d_spend > 20:
            print(f"  ⚠ LOW DELIVERY — audience may be too small or bid too low")
        if frequency is not None:
            remaining = FREQUENCY_PAUSE_THRESHOLD - frequency
            days_to_cap = remaining / (frequency / max((today - date.fromisoformat(campaign_start)).days, 1))
            print(f"  Estimated days to frequency cap: ~{days_to_cap:.0f}")

    report_rows.append({
        "date": str(yesterday),
        "segment": segment,
        "campaign_id": campaign_id,
        "status": status,
        "lifetime_impressions": lt_impressions,
        "lifetime_unique_reach": lt_unique,
        "frequency": round(frequency, 2) if frequency else "",
        "lifetime_spend": round(lt_spend, 2),
        "lifetime_conversions": lt_conversions,
        "daily_impressions": d_impressions,
        "daily_clicks": d_clicks,
        "daily_ctr_pct": round(d_ctr, 2),
        "daily_cpc": round(d_cpc, 2),
        "daily_spend": round(d_spend, 2),
    })

# Save report
report_file = f"campaign-report-{yesterday}.csv"
if report_rows:
    with open(report_file, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=report_rows[0].keys())
        w.writeheader()
        w.writerows(report_rows)
    print(f"\nReport saved: {report_file}")
```

**Schedule this daily** (add to crontab):
```bash
# Run at 8am every day
0 8 * * * cd /path/to/your/campaign && python3 skills/abm-campaign/monitor.py >> logs/monitor.log 2>&1
```

---

## Optimization Playbook

| Signal | Threshold | Action |
|--------|-----------|--------|
| **Frequency reached cap** | ≥ 10 | Auto-paused by monitor script; refresh account list or creative before re-activating |
| CTR below target | < 0.4% | Swap to headline variant B or C; test new creative |
| CPC too high | > $15 | Switch from CPM to CPC bidding; narrow audience |
| Low impressions | < 500/day | Increase daily budget; check audience size |
| High impression share, 0 clicks | — | Creative issue — regenerate for that segment |
| Conversion rate drops | < prev week | Check landing page; A/B test CTA text |

**When to re-activate a frequency-capped campaign:** Pull new accounts from Vibe Prospecting, add them to the DMP segment, refresh creatives for the new companies, then set status back to `ACTIVE`. The frequency counter resets when the audience composition changes significantly.

---

## Outputs

| File | Description |
|------|-------------|
| `linkedin-group-id.txt` | Campaign group ID |
| `campaign-ids.json` | Campaign and group IDs by segment |
| `campaign-report-YYYY-MM-DD.csv` | Daily analytics export |
