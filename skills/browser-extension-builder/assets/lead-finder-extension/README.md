# Lead Finder

A local, unpacked **Chrome extension** that reveals verified contact info
(email, phone, job title, company) directly on a LinkedIn profile — powered by
the [Explorium](https://www.explorium.ai/) API — then lets you push the
contact to **HubSpot** or draft a personalized email in Gmail. It's the same
shape as tools like Lusha or Apollo.io's browser extension, but self-hosted
and running on your own Explorium key.

> Bring your own API keys — nothing is hardcoded. Both keys are pasted once
> into the extension's own Options page and stored in `chrome.storage.local`,
> local to your browser profile. Nothing is sent anywhere except Explorium,
> HubSpot, and Gmail's own compose URL.

## Features

- Detects any `linkedin.com/in/...` profile and shows a floating panel with
  a **Reveal contact info** button.
- Reveal calls Explorium's `prospects/match` → `prospects/profiles/bulk_enrich`
  + `prospects/contacts_information/bulk_enrich` to return verified email,
  phone, job title, company, company website, and location.
- **Push to HubSpot** — opens an editable field-mapping review (name, email,
  job title, company, phone) before creating/updating a HubSpot contact via a
  private-app token (search-by-email first, so re-pushing the same person
  updates rather than duplicates).
- **Draft email** — opens a prefilled Gmail compose tab using the enriched
  name/company/title.

## Install (load unpacked)

1. Open `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked**, select this folder.
3. Click the toolbar icon → **Set API keys** → paste your Explorium API key
   and HubSpot private-app token → **Save**.
4. Open any `linkedin.com/in/...` profile — the panel appears top-right.

After any code change: reload the extension's card in `chrome://extensions`,
then hard-refresh the LinkedIn tab (content scripts aren't re-injected into
already-open tabs).

## Getting the keys

### Explorium (required)
Sign up at [developers.explorium.ai](https://developers.explorium.ai/) and
create an API key.

> **Not the same as Vibe Prospecting.** Explorium also ships
> [Vibe Prospecting](https://github.com/explorium-ai/vibeprospecting-mcp), a
> remote MCP server for prospecting *inside an AI agent session* — it uses
> OAuth sign-in and issues no static API key, so it can't be pasted into this
> extension's Options page. This extension needs the classic REST API key
> from developers.explorium.ai.

### HubSpot (optional — for the Push to HubSpot button)
HubSpot → **Settings → Integrations → Private Apps → Create private app**.
Grant `crm.objects.contacts.write` (and `crm.objects.contacts.read` for the
search-before-push lookup), then copy the access token.

## Architecture

```
lead-finder-extension/
├── manifest.json        # MV3 manifest
├── background.js        # service worker — the only place API keys are read
├── content.js           # injected on linkedin.com/in/* — panel UI + reveal/push/draft
├── content.css           # panel styles
├── popup.html            # toolbar popup
├── options.html/js       # paste keys here -> chrome.storage.local
├── styles/tokens.css     # design tokens (colors, radii, shadows, font)
└── icons/                # icon.svg source + rasterized icon16/32/48/128.png
```

`content.js` never sees your API keys — it only sends messages to
`background.js`, which is the sole place that reads `chrome.storage.local`
and calls Explorium/HubSpot.

## Customizing

- **Branding:** the display name lives in `manifest.json` (`name`), the popup
  (`popup.html`), the options page (`options.html`), and the panel title in
  `content.js`. The full color palette is in `styles/tokens.css` — swap
  `--leadfinder-primary`/`--leadfinder-ink` and related tokens to restyle.
  The icon source is `icons/icon.svg`; after editing it, re-rasterize with:
  ```bash
  for s in 16 32 48 128; do rsvg-convert -w $s -h $s icons/icon.svg -o icons/icon${s}.png; done
  ```
- **CSS class prefix:** everything uses a `leadfinder-` prefix (panel, buttons,
  fields) — rename consistently if you fork this under a different name.
- **CRM target:** the HubSpot integration lives entirely in `background.js`
  (`pushToHubspot`, `findHubspotContactByEmail`). Swapping to Salesforce or
  another CRM means replacing that function and its two `host_permissions` /
  `web_accessible_resources` entries in `manifest.json`.

## Limitations

- LinkedIn's DOM changes over time; `content.js` waits for the profile `<h1>`
  to render (polls up to ~6s) but selectors may need updating if LinkedIn
  changes its markup.
- No OAuth flow for HubSpot — it's a private-app token, which is simpler to
  set up but scoped to a single HubSpot account, not a multi-tenant install.
- This is a personal/team tool, not a Chrome Web Store submission — it's
  meant to be loaded unpacked, not published.

## License

MIT — see `LICENSE`. You are responsible for complying with LinkedIn's,
Explorium's, and HubSpot's terms of service, and with applicable data-privacy
law, when using this extension.
