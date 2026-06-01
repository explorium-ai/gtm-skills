# Phase 5 — Push Audiences to LinkedIn Ads

Create a LinkedIn Matched Audience from your account list and prepare it for campaign targeting.

**Prerequisites:** LinkedIn credentials configured (see [`setup.md`](setup.md))
**Input:** `abm-accounts-final.csv`

---

## How LinkedIn Matched Audiences Work

1. You upload a list of company domains/names
2. LinkedIn matches them against its company database (~40–60% match rate typical)
3. The matched segment becomes available for targeting in Campaign Manager
4. Minimum 300 matched companies to serve ads

**Handling the 300-company minimum with ghost companies**

If your target account list is smaller than ~500 companies (which is common for Tier 1 campaigns), pad the audience with a fixed list of generic "ghost" companies. These are real LinkedIn company entries — small businesses, clinics, schools, etc. — that will never be relevant to your ads. They exist solely to clear the 300-matched threshold.

In practice, your target accounts receive ~90% of ad impressions because LinkedIn's auction heavily favors companies that match your ad's industry/firmographic profile. The ghost companies absorb the remaining impressions at negligible cost.

**Ghost company list (125 pre-validated entries):**

```python
GHOST_COMPANIES = [
    "Ariana Pharmacy", "STAY AT HOME CAT MOM LLC", "Confecções", "SMMM ALİ SERBEST",
    "Pentland Primary School", "Al Lavoratore", "CECACI CENTRO DE CAPACITACION COMERCIAL E INDUSTRIAL",
    "My Solutions 4 U", "Puskesmas Lau", "Школа профессий будущего КрашПро", "Tangga",
    "Hurr Tours / حر للسياحة", "PCS Informática", "Salário Maternidade Desempregada",
    "深圳有限公司", "Ржд Медицина", "doe", "JW Inc.", "中国邮政", "ООО \"Поликлиника ЦК-5003\"",
    "MOVIE INDUSTRY TRANSPORT SERVICES LIMITED", "МБОУ гимназия №14", "Hurricane Logistics LLC",
    "Tneb Workshop,mettur,salem(dt)", "Kentucky Fried Chicken Restaurant", "CATERING",
    "Conveniência", "Qualquer Nota", "Secretaría de Educación Municipal", "Anything",
    "Banquetes", "TORNEARIA", "J Frios", "Outros 400", "ГБОУ СОШ №1416", "Ruang Karyawan",
    "Oil", "Sao Leopoldo", "GLY Religious store", "Rumah Sakit MEDINA",
    "Forever Living - selvstændig forhandler", "Super U Maubec/Coustellet", "Some Film Company",
    "Estofados", "Nancy Humphrey for PISD Board of Trustees", "asdasd",
    "Quality Control Company", "QLD Progressive Health", "CENTRO CLINICO SAN CARLOS SA",
    "Negocio", "Издательский дом А4", "Residencial Viver Bem", "Jl trasporte", "Ex",
    "Мастерская", "OFICINA SEGURIDAD PRIVADA", "Альфа", "ООО \"Торговый дом БФ\"",
    "Cigniti Software Services Private Limited", "Agricultura y Ganadería",
    "DENTAL CONSULTORIO DENTAL", "Call Center Corporation", "Espaco",
    "Pizzeria \"Alla Croce\"", "Barokah", "GD", "PARÓQUIA CBMDF", "Jewellery", "Tigo GmbH",
    "DUBLING ASESORIA SL", "MUTUELLE DES RETRAITEE DE LA CNCA", "المصريه للقل",
    "ELECTRICAL", "Feel King Barbearia", "Chácara", "Roga&kopyta", "CLINICAL SOCIAL WORKER",
    "Medicina", "Musica Propria", "Daycare Website Designs", "Thermo Domus snc",
    "Aventino's Pizza", "Fresher Jobs", "Second Opinion Private Medical Practice",
    "郑州德克士食品开发有限公司", "CS", "Корпорация М8", "DIVERS.se", "Farmacia Leganés",
    "Loterias online Caixa", "GOBIERNO FEDERAL SAGARPA VENTANILLA 3 CHIAPA DE CORZO",
    "Us.", "CABINET LIBERAL D'EXPERTISE SOCIALE", "1980",
    "Translink Express - International Courier Service", "Pemerintahan Desa Tonasa",
    "Bar - Restaurante Los Leones", "collage", "Mercado Super",
    "Cryoexpress Singapore Pte. Ltd.", "Tienda de ropa yazmin", "Shri balaji",
    "Scuola Pubblica Media Raffaello", "Ростелеком",
    "ГБОУ Школа № 854", "Zakład optyczny", "HOSPITAL GERAL DO", "Puskesmas Turi",
    "União", "Simonetti", "Auto Mecánica", "Гранд", "Admin", "PRINTING",
    "Desirèe Troiano Advogada", "Weatherstone Elementary School", "DJ", "df",
    "Legal Inc.", "Smart Devs", "Qatar", "ГБОУ Гимназия № 1619",
    "Clases de piano particulares", "1978 LTD", "Govt School of Mines",
    "Harbour Private Duty Nursing", "Japan", "Gemeinde Großefehn", "ETAT DE SERVICE",
]
```

**Matching best practices:**
- Use company domain for your real target accounts (more reliable than name)
- Ghost companies are matched by name only — that's fine, they just need to match
- Include both parent and subsidiary domains for target accounts if relevant

---

## Step 1 — Prepare the Upload File

LinkedIn accepts a CSV with `companyName` and/or `companyDomain` columns. The script automatically pads with ghost companies when needed.

```python
import csv

accounts = list(csv.DictReader(open("abm-accounts-final.csv")))

# Build rows: real target accounts (domain + name) + ghost padding (name only)
rows = [{"companyName": a.get("company_name", ""), "companyDomain": a.get("domain", "")}
        for a in accounts]

# Pad with ghost companies if needed to clear the 300-match threshold.
# LinkedIn matches ~50% of uploads, so we need ~600 entries to be safe.
TARGET_UPLOAD_COUNT = 600
if len(rows) < TARGET_UPLOAD_COUNT:
    needed = TARGET_UPLOAD_COUNT - len(rows)
    ghost_rows = [{"companyName": name, "companyDomain": ""}
                  for name in GHOST_COMPANIES[:needed]]
    rows.extend(ghost_rows)
    print(f"Added {len(ghost_rows)} ghost companies (total upload: {len(rows)})")

with open("linkedin-upload.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["companyName", "companyDomain"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Target accounts: {len(accounts)}, Ghost padding: {len(rows) - len(accounts)}")
print(f"Total upload: {len(rows)} companies → ~{len(rows)//2} expected matched")
```

---

## Step 2 — Create a DMP Segment (Matched Audience)

```bash
SEGMENT_RESPONSE=$(curl -s -X POST "https://api.linkedin.com/v2/dmpSegments" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d '{
    "name": "ABM Target Accounts — '$(date +%Y-%m-%d)'",
    "accessPolicy": "PRIVATE",
    "destinations": [{"destination": "urn:li:sponsoredAccount:'$LINKEDIN_AD_ACCOUNT_ID'"}],
    "type": "COMPANY"
  }')

echo $SEGMENT_RESPONSE | python3 -m json.tool

# Extract segment ID
SEGMENT_ID=$(echo $SEGMENT_RESPONSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id','').split(':')[-1])")
echo "Segment ID: $SEGMENT_ID"
echo $SEGMENT_ID > linkedin-audience-id.txt
```

---

## Step 3 — Upload Company List

LinkedIn uses a two-step upload: (1) create a DMP segment import, (2) upload the CSV.

```bash
SEGMENT_ID=$(cat linkedin-audience-id.txt)

# Step 3a: Initiate DMP import
IMPORT_RESPONSE=$(curl -s -X POST \
  "https://api.linkedin.com/v2/dmpSegmentImports?dmpSegmentId=urn:li:dmpSegment:${SEGMENT_ID}" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@linkedin-upload.csv;type=text/csv")

echo $IMPORT_RESPONSE | python3 -m json.tool
```

Alternatively, use LinkedIn's bulk upload via the Marketing API:

```bash
# Upload via the company list endpoint (newer API)
curl -s -X POST \
  "https://api.linkedin.com/v2/dmpSegments/urn:li:dmpSegment:${SEGMENT_ID}/companyList" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "
import csv, json
rows = list(csv.DictReader(open('linkedin-upload.csv')))
companies = [{'companyDomain': r['companyDomain'], 'companyName': r['companyName']} for r in rows if r['companyDomain']]
print(json.dumps({'companies': companies[:5000]}))
")"
```

---

## Step 4 — Check Audience Status

Audience population takes 24–48 hours. Poll the status:

```bash
SEGMENT_ID=$(cat linkedin-audience-id.txt)

curl -s "https://api.linkedin.com/v2/dmpSegments/urn:li:dmpSegment:${SEGMENT_ID}" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Name:', d.get('name'))
print('Status:', d.get('audienceSizeByDestination'))
print('Match count:', d.get('destinationAudienceSize'))
"
```

**Status values:**
- `BUILDING` — LinkedIn is matching companies (normal for 24–48h)
- `READY` — audience is ready to use in campaigns
- `TOO_SMALL` — fewer than 300 matched; broaden your list

---

## Step 5 — Create Segment Per Tier (Optional)

For more granular targeting, create one audience per segment:

```python
import csv, json, subprocess, os

segments_to_create = {}
for row in csv.DictReader(open("abm-accounts-final.csv")):
    seg = row.get("segment", "Tier2-Target")
    if seg not in segments_to_create:
        segments_to_create[seg] = []
    segments_to_create[seg].append(row)

audience_ids = {}
token = os.environ["LINKEDIN_ACCESS_TOKEN"]
account_id = os.environ["LINKEDIN_AD_ACCOUNT_ID"]

for segment, accounts in segments_to_create.items():
    print(f"Creating audience for {segment} ({len(accounts)} accounts)...")

    payload = json.dumps({
        "name": f"ABM {segment} — {__import__('datetime').date.today()}",
        "accessPolicy": "PRIVATE",
        "destinations": [{"destination": f"urn:li:sponsoredAccount:{account_id}"}],
        "type": "COMPANY"
    })

    result = subprocess.run([
        "curl", "-s", "-X", "POST",
        "https://api.linkedin.com/v2/dmpSegments",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-d", payload
    ], capture_output=True, text=True)

    data = json.loads(result.stdout)
    seg_id = data.get("id", "").split(":")[-1]
    audience_ids[segment] = seg_id
    print(f"  Created segment ID: {seg_id}")

# Save all audience IDs
with open("linkedin-audience-ids.json", "w") as f:
    json.dump(audience_ids, f, indent=2)

print("Audience IDs saved to linkedin-audience-ids.json")
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `403 Forbidden` on segment creation | Verify `rw_ads` scope was included in OAuth; re-authenticate |
| `TOO_SMALL` status | Upload more companies (need 300+ matched); check if `companyDomain` is populated |
| Low match rate (<30%) | Add `companyName` as fallback; LinkedIn uses both for matching |
| Segment stuck in `BUILDING` >72h | Contact LinkedIn support; check the import job status endpoint |

---

## Outputs

| File | Description |
|------|-------------|
| `linkedin-upload.csv` | Company list formatted for LinkedIn |
| `linkedin-audience-id.txt` | Primary DMP segment ID |
| `linkedin-audience-ids.json` | Segment IDs per tier (if segmented) |

**Next:** [`06-campaign-management.md`](06-campaign-management.md)
