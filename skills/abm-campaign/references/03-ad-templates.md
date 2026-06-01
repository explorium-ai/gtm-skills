# Phase 3 — Create Ad Templates

Generate reusable, segment-specific LinkedIn ad templates using Claude Code. Templates use placeholders that Phase 4 fills in with per-account data.

**Input:** `abm-accounts-final.csv` (segments defined)

---

## LinkedIn Ad Format Specs

| Format | Size | File type | Max size | Notes |
|--------|------|-----------|----------|-------|
| Single Image | 1200×628 px | JPG, PNG | 5 MB | Most common; 70% of ABM campaigns |
| Carousel card | 1080×1080 px | JPG, PNG | 10 MB | 2–10 cards per ad |
| Spotlight | 300×250 px | JPG, PNG | 2 MB | Right rail placement |
| Message Ad | N/A | HTML (text) | — | InMail-style |

Use Single Image as the default format. Create Carousel for Tier 1 (Strategic) accounts.

---

## Template Placeholders

All templates use these placeholders — replaced per account in Phase 4:

| Placeholder | Example value |
|-------------|---------------|
| `{{company_name}}` | Acme Corp |
| `{{company_logo_url}}` | https://logo.clearbit.com/acme.com |
| `{{headline}}` | How Acme Corp can cut CAC by 40% |
| `{{body_copy}}` | Join 200+ SaaS companies using Explorium to… |
| `{{cta_text}}` | See Your Data |
| `{{segment_color}}` | #1E3A8A (Tier 1), #2563EB (Tier 2) |
| `{{value_prop}}` | Segment-specific value proposition |

---

## Step 1 — Gather Brand Inputs

Ask the user for these before generating templates:

```
1. Primary brand color (hex): e.g., #1E40AF
2. Secondary/accent color (hex): e.g., #DBEAFE
3. Font family: e.g., "Inter", "DM Sans", "Helvetica Neue"
4. Logo URL or file path
5. Core value proposition (1 sentence per segment)
6. CTA text: e.g., "See Your Data", "Book a Demo", "Get Started Free"
7. Design style: Minimal / Bold / Corporate / Startup
```

If no brand inputs are provided, use these professional defaults:
- Primary: `#1E3A8A`, Accent: `#DBEAFE`, Font: `Inter`, Style: Minimal

---

## Step 2 — Generate HTML Templates

Claude generates self-contained HTML/CSS files. Each template renders correctly at the target dimensions and exports cleanly to PNG via a headless browser.

**Single Image Template (1200×628):**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 628px; overflow: hidden;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    background: #ffffff;
  }
  .ad-container {
    width: 1200px; height: 628px;
    display: flex; align-items: stretch;
  }
  .left-panel {
    flex: 0 0 680px;
    background: {{segment_color}};
    padding: 60px 64px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .company-badge {
    display: flex; align-items: center; gap: 12px;
  }
  .company-logo {
    width: 48px; height: 48px; border-radius: 8px;
    object-fit: contain; background: rgba(255,255,255,0.15);
    padding: 6px;
  }
  .company-name {
    color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 500;
  }
  .headline {
    color: #ffffff; font-size: 40px; font-weight: 700;
    line-height: 1.15; letter-spacing: -0.5px;
  }
  .body-copy {
    color: rgba(255,255,255,0.85); font-size: 17px; line-height: 1.6;
    max-width: 500px;
  }
  .cta-button {
    display: inline-block;
    background: #ffffff; color: {{segment_color}};
    padding: 14px 32px; border-radius: 8px;
    font-size: 16px; font-weight: 700; letter-spacing: 0.2px;
    width: fit-content;
  }
  .right-panel {
    flex: 1;
    background: #F8FAFC;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px 40px; gap: 24px;
  }
  .brand-logo {
    width: 140px; height: auto; object-fit: contain;
  }
  .stat-block {
    text-align: center;
  }
  .stat-number {
    font-size: 52px; font-weight: 800; color: {{segment_color}};
    line-height: 1;
  }
  .stat-label {
    font-size: 14px; color: #64748B; margin-top: 6px;
    font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;
  }
  .disclaimer {
    font-size: 11px; color: #94A3B8; text-align: center;
  }
</style>
</head>
<body>
<div class="ad-container">
  <div class="left-panel">
    <div class="company-badge">
      <img class="company-logo" src="{{company_logo_url}}" alt="{{company_name}} logo"
           onerror="this.style.display='none'">
      <span class="company-name">{{company_name}}</span>
    </div>
    <h1 class="headline">{{headline}}</h1>
    <p class="body-copy">{{body_copy}}</p>
    <div class="cta-button">{{cta_text}}</div>
  </div>
  <div class="right-panel">
    <img class="brand-logo" src="{{your_logo_url}}" alt="Your brand">
    <div class="stat-block">
      <div class="stat-number">{{stat_number}}</div>
      <div class="stat-label">{{stat_label}}</div>
    </div>
    <p class="disclaimer">{{disclaimer_text}}</p>
  </div>
</div>
</body>
</html>
```

**Carousel Card Template (1080×1080):**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1080px; overflow: hidden;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  }
  .card {
    width: 1080px; height: 1080px;
    background: {{segment_color}};
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 80px;
  }
  .card-header {
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .card-number { color: rgba(255,255,255,0.5); font-size: 16px; font-weight: 500; }
  .company-logo {
    width: 56px; height: 56px; border-radius: 10px;
    object-fit: contain; background: rgba(255,255,255,0.15); padding: 8px;
  }
  .card-headline {
    color: #ffffff; font-size: 52px; font-weight: 800;
    line-height: 1.1; letter-spacing: -1px;
  }
  .card-body { color: rgba(255,255,255,0.85); font-size: 20px; line-height: 1.6; }
  .card-cta {
    display: inline-block;
    background: #ffffff; color: {{segment_color}};
    padding: 18px 40px; border-radius: 10px;
    font-size: 18px; font-weight: 700; width: fit-content;
  }
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <span class="card-number">{{card_number}}</span>
    <img class="company-logo" src="{{company_logo_url}}" alt="{{company_name}}"
         onerror="this.style.display='none'">
  </div>
  <h1 class="card-headline">{{headline}}</h1>
  <p class="card-body">{{body_copy}}</p>
  <div class="card-cta">{{cta_text}}</div>
</div>
</body>
</html>
```

---

## Step 3 — Generate Segment-Specific Copy

For each segment in `abm-accounts-final.csv`, generate the copy variants:

**Prompt Claude to generate copy:**

> "Generate 3 headline variants + 1 body copy for each segment: [list segments and their value props]. Keep headlines under 60 characters. Body copy under 120 characters. Tone: [professional/bold/consultative]."

Save as `creative/copy-variants.json`:

```json
{
  "Tier1-Strategic": {
    "headlines": [
      "How {{company_name}} can scale with better B2B data",
      "The data advantage {{company_name}} is missing",
      "{{company_name}}: 3x your pipeline quality"
    ],
    "body_copy": "Join 200+ enterprise teams using Explorium to turn raw data into revenue.",
    "cta": "See Your Data",
    "stat_number": "3x",
    "stat_label": "Pipeline improvement"
  },
  "Tier2-Target": {
    "headlines": [
      "Find your next 100 customers — faster",
      "Stop guessing. Start targeting with precision.",
      "{{company_name}}'s ideal customers are already in our data"
    ],
    "body_copy": "Explorium surfaces the right accounts at the right time. No manual research.",
    "cta": "Get Started Free",
    "stat_number": "150M+",
    "stat_label": "Companies tracked"
  }
}
```

---

## Step 4 — Save Templates

```bash
mkdir -p creative/templates

# Templates are saved as:
# creative/templates/Tier1-Strategic-single.html
# creative/templates/Tier1-Strategic-carousel-1.html
# creative/templates/Tier2-Target-single.html
# etc.
```

---

## Outputs

| File | Description |
|------|-------------|
| `creative/templates/<segment>-single.html` | Single image template per segment |
| `creative/templates/<segment>-carousel-<n>.html` | Carousel card templates (3 cards each) |
| `creative/copy-variants.json` | Headline and body copy per segment |

**Next:** [`04-personalize-figma.md`](04-personalize-figma.md)
