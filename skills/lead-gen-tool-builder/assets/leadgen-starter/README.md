# LeadGen Starter

A self-hostable, ZoomInfo-style **lead-generation tool** powered by the
[Explorium](https://www.explorium.ai/) API, with one-click push to **HubSpot**
and **Salesforce**. Search 150M+ companies and 800M+ people, filter like a pro,
enrich, export to CSV, and sync straight into your CRM.

> Bring your own API keys — nothing is hardcoded. Everything reads from a local
> `.env` file, so this is safe to fork, share, and self-host.

![Companies + Contacts search with a filter rail, results table, and CRM push bar]

---

## Features

- **Company generator** and **Contact (prospect) generator** — two search modes.
- **Rich filters** mapped to Explorium fields: industry, employees, revenue,
  company age, locations, HQ country/region/city, tech stack, keywords, business
  events (funding, hiring, M&A…), and for people: job title, management level,
  department, and **has-email / has-phone** availability.
- **Results table** with sortable columns, bulk select, and a detail panel.
- **Sample vs. all-matches** labeling (Explorium returns a capped sample for
  broad queries — the UI is honest about it).
- **Import a list** — upload a CSV of companies or contacts, **match** it to
  Explorium, and enrich it.
- **CSV export** of any result set or selection.
- **Push to CRM** with a **reviewable/editable field mapping** — Prospects →
  Salesforce Leads / HubSpot Contacts; Companies → Salesforce Accounts / HubSpot
  Companies.

## Architecture

```
leadgen-starter/
├── server/            # Node/Express backend — the only thing that holds API keys
│   ├── secrets.js     # loads keys from .env (swap for a vault in production)
│   ├── explorium.js   # Explorium REST client (search, match, enrich, autocomplete)
│   ├── salesforce.js  # Salesforce JWT-bearer auth + record create (mapping-driven)
│   ├── hubspot.js     # HubSpot private-app auth + batch create (mapping-driven)
│   ├── normalize.js   # Explorium rows -> flat UI/CRM shape
│   └── routes/        # /api/companies, /api/prospects, /api/match, /api/crm/*
└── src/               # React + Vite + Tailwind frontend (calls /api/* only)
    ├── config/filters.ts   # the filter definitions (edit to add/remove filters)
    ├── components/         # TopBar, FilterSidebar, ResultsTable, CRM modals, …
    └── lib/                # api client + CSV helpers
```

The frontend never sees your keys — it only calls the backend, which talks to
Explorium/HubSpot/Salesforce.

---

## Quick start

**Prerequisites:** Node 18+ and an Explorium API key.

```bash
# 1. install
npm install

# 2. add your keys
cp .env.example .env      # then edit .env and paste your keys

# 3. run (starts the API on :4000 and the web app on :5173)
npm run dev
```

Open **http://localhost:5173**. Explorium search works with just
`EXPLORIUM_API_KEY`; HubSpot/Salesforce push each need their own keys (below).

---

## Getting the keys

### Explorium (required)
Sign up at [developers.explorium.ai](https://developers.explorium.ai/) and create
an API key. Put it in `.env` as `EXPLORIUM_API_KEY`.

### HubSpot (optional — for HubSpot push)
HubSpot → **Settings → Integrations → Private Apps → Create private app**. Grant
`crm.objects.contacts.write` and `crm.objects.companies.write`, then copy the
**access token** into `HUBSPOT_API_KEY`.

### Salesforce (optional — for Salesforce push)
Uses the **OAuth 2.0 JWT Bearer flow** with a Connected App:

1. Generate a key/cert: `openssl req -x509 -newkey rsa:2048 -nodes -keyout server.key -out server.crt -days 365`
2. Salesforce → **Setup → App Manager → New Connected App**. Enable OAuth, add
   scopes `api` + `refresh_token`, enable **Use digital signatures** and upload
   `server.crt`.
3. Pre-authorize your user (Connected App → Manage → Edit Policies → Permitted
   Users → *Admin approved*, then assign a Permission Set/Profile).
4. Fill `.env`:
   - `SALESFORCE_CONSUMER_KEY` = the Connected App's Consumer Key
   - `SALESFORCE_USERNAME` = the Salesforce user to run as
   - `SALESFORCE_LOGIN_URL` = `https://login.salesforce.com` (or `https://test.salesforce.com` for sandbox)
   - `SALESFORCE_PRIVATE_KEY_BASE64` = `base64 -i server.key` (single line)

## CRM field mapping

Before pushing, a modal shows the **source → CRM field** map with live sample
values. You can toggle fields off and rename target fields. Defaults are safe:
`Industry` maps to a description field (Salesforce `Industry` and HubSpot
`industry` are restricted picklists), and employee ranges convert to numbers.
For prospects, email/phone are enriched from Explorium at push time.

## Notes & limits

- **Sample results:** Explorium's fetch returns a sample capped at the page size
  for broad queries; narrow your filters to surface the full match set. The UI
  flags this.
- **Credits:** searches and especially enrichment/contact reveals consume
  Explorium credits. The app only enriches selected rows / on push.
- **Not production-hardened:** for real deployments, move secrets to a managed
  vault, add auth, rate-limiting, and logging.

## Customizing

- **Filters:** add/remove entries in `src/config/filters.ts` (field names must
  match Explorium's API).
- **Branding:** the product name (“LeadGen”) lives in `src/components/TopBar.tsx`,
  the logo mark in `src/components/icons.tsx` (`ZMark`), colors in
  `tailwind.config.js`, and the tab title/favicon in `index.html`.
- **CRM objects/fields:** default maps are in `server/salesforce.js`
  (`SF_DEFAULT_MAPPING`) and `server/hubspot.js` (`HS_DEFAULT_MAPPING`).

## License

MIT — see `LICENSE`. Provided as-is; you are responsible for complying with the
terms of Explorium, HubSpot, and Salesforce, and with applicable data-privacy law.
