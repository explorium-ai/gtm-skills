# Phase 4 — Personalize the Creative

Inject per-account data (company name, logo, tailored headline) into each template and render final ad images.

**Input:** `abm-accounts-final.csv`, `creative/templates/`, `creative/copy-variants.json`, `creative/logos/`

Two options: Figma MCP (polished, collaborative) or code-based rendering (fast, no Figma needed).

---

## Option A — Figma MCP (Recommended)

Use the Figma MCP server to read your design templates and update component values per account.

**Prerequisites:** Figma MCP connected, Figma file with ad templates prepared.

### Step 1 — Prepare your Figma file

Your Figma file should have:
- One frame per ad format (named `Single-1200x628`, `Carousel-1080x1080`)
- Text layers named with the placeholder: `company_name`, `headline`, `body_copy`, `cta_text`
- An image layer named `company_logo`
- Component variants per segment (color token swapped per segment)

### Step 2 — Read the template structure

```
# Ask Claude: "Read my Figma file at [FIGMA_URL] and list all layers in the ad template frames"
# Claude will use the Figma MCP to inspect the file
```

### Step 3 — Loop through accounts and update

For each account in `abm-accounts-final.csv`:

1. Get the account's segment, name, domain, logo URL from the CSV
2. Look up the copy variant for that segment from `creative/copy-variants.json`
3. Pick headline variant (rotate through 3 variants across accounts)
4. Use Figma MCP `use_figma` to update the text and image layers
5. Export the frame as PNG to `creative/personalized/<domain>/single.png`

**Tell Claude:**
> "Personalize the Single ad template in my Figma file for each account in abm-accounts-final.csv. For each account: update company_name text, swap company_logo image, set headline from copy-variants.json using the account's segment. Export each as PNG to creative/personalized/<domain>/single.png."

Claude will orchestrate the Figma MCP calls in a loop.

### Figma MCP calls Claude will use:

```
mcp__figma__use_figma — update layer values
mcp__figma__get_design_context — read current layer state
mcp__figma__get_screenshot — export frame as PNG
mcp__figma__upload_assets — upload company logos to Figma
```

---

## Option B — Code-Based Rendering (No Figma)

Use Playwright/Puppeteer to render the HTML templates to PNG. No Figma account needed.

### Step 1 — Install dependencies

```bash
npm install -g playwright
playwright install chromium
```

Or with Python:
```bash
pip install playwright
python -m playwright install chromium
```

### Step 2 — Run the personalization script

```python
import csv, json, os, asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def render_ad(page, template_html: str, output_path: str, width: int, height: int):
    await page.set_viewport_size({"width": width, "height": height})
    await page.set_content(template_html, wait_until="networkidle")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    await page.screenshot(path=output_path, clip={"x": 0, "y": 0, "width": width, "height": height})

def inject_vars(template: str, variables: dict) -> str:
    for key, value in variables.items():
        template = template.replace(f"{{{{{key}}}}}", str(value) if value else "")
    return template

async def main():
    accounts = list(csv.DictReader(open("abm-accounts-final.csv")))
    copy_variants = json.load(open("creative/copy-variants.json"))

    # Track headline rotation per segment
    headline_idx = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        for account in accounts:
            domain = account.get("domain", "unknown").replace("/", "_")
            segment = account.get("segment", "Tier2-Target")
            company_name = account.get("company_name", "")

            copy = copy_variants.get(segment, copy_variants.get("Tier2-Target"))
            idx = headline_idx.get(segment, 0)
            headline_idx[segment] = (idx + 1) % len(copy["headlines"])

            # Use Clearbit logo as fallback if local logo not found
            logo_path = f"creative/logos/{domain}.png"
            logo_url = f"file://{os.path.abspath(logo_path)}" if os.path.exists(logo_path) \
                       else f"https://logo.clearbit.com/{domain}"

            variables = {
                "company_name": company_name,
                "company_logo_url": logo_url,
                "headline": copy["headlines"][idx].replace("{{company_name}}", company_name),
                "body_copy": copy["body_copy"],
                "cta_text": copy["cta"],
                "stat_number": copy.get("stat_number", ""),
                "stat_label": copy.get("stat_label", ""),
                "segment_color": "#1E3A8A" if "Tier1" in segment else "#2563EB",
                "your_logo_url": "creative/your-logo.png",
                "disclaimer_text": "Results may vary",
                "card_number": "01",
            }

            # Render single image
            template_path = f"creative/templates/{segment}-single.html"
            if os.path.exists(template_path):
                template = open(template_path).read()
                rendered = inject_vars(template, variables)
                await render_ad(page, rendered, f"creative/personalized/{domain}/single.png", 1200, 628)
                print(f"Rendered: {domain}/single.png")

            # Render carousel cards
            for card_num in range(1, 4):
                template_path = f"creative/templates/{segment}-carousel-{card_num}.html"
                if os.path.exists(template_path):
                    variables["card_number"] = f"0{card_num}"
                    template = open(template_path).read()
                    rendered = inject_vars(template, variables)
                    await render_ad(page, rendered, f"creative/personalized/{domain}/carousel-{card_num}.png", 1080, 1080)

        await browser.close()
    print("Done. All creatives rendered.")

asyncio.run(main())
```

---

## Step 3 — Review and Quality Check

After rendering, spot-check creatives:
1. Open 5–10 samples from `creative/personalized/`
2. Check: logo renders correctly, text isn't truncated, colors are right
3. If a logo is missing, the fallback (Clearbit) is used — mark in a review log

```python
import os, csv

accounts = list(csv.DictReader(open("abm-accounts-final.csv")))
missing = []
for a in accounts:
    domain = a.get("domain","").replace("/","_")
    if not os.path.exists(f"creative/personalized/{domain}/single.png"):
        missing.append(domain)

if missing:
    print(f"Missing creatives ({len(missing)}):")
    for d in missing[:20]:
        print(f"  {d}")
else:
    print("All creatives rendered successfully.")
```

---

## Batch Sizes

LinkedIn allows up to 100 ad creatives per campaign. If your account list exceeds 100:
- Use the top 100 accounts by fit score for direct account personalization
- For the rest, use segment-level creatives (one creative per segment, not per account)

---

## Outputs

| File | Description |
|------|-------------|
| `creative/personalized/<domain>/single.png` | 1200×628 personalized ad image |
| `creative/personalized/<domain>/carousel-<n>.png` | 1080×1080 carousel cards |

**Next:** [`05-linkedin-audiences.md`](05-linkedin-audiences.md)
