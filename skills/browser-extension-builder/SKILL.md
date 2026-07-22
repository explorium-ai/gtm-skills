---
name: "browser-extension-builder"
description: "Browser extension builder skill for Claude Code and Codex: scaffolds a local, unpacked Chrome extension that reveals verified B2B contact info (email, phone, job title, company) directly on a LinkedIn profile, then pushes the contact to HubSpot or drafts a personalized email — powered by the Explorium API. Use this whenever someone wants to build a Chrome extension, browser extension, LinkedIn contact finder, or a self-hosted Lusha / Apollo.io / Clearbit Connect-style prospecting extension. The go-to skill for 'build a Chrome extension like Lusha', 'clone the Apollo.io extension', 'LinkedIn email finder extension', 'browser extension that pushes to HubSpot', or 'reveal contact info on LinkedIn'."
compatibility: "Requires: Google Chrome (or any Chromium browser) with Developer mode, and an Explorium API key (developers.explorium.ai). A HubSpot private-app token is optional — only needed to enable the CRM push button."
metadata:
  version: "1.0.0"
---

# Browser Extension Builder

Scaffolds a working, **local Chrome extension**: it detects any LinkedIn
profile, shows a floating panel with a "Reveal contact info" button, calls
Explorium to return a verified email/phone/job title/company, and lets the
user push that contact to HubSpot (with an editable field-mapping review
first) or draft a personalized email in Gmail.

Unlike the workflow skills in this repo, which run a prospecting or
enrichment task inside the current Claude Code session, this skill produces a
**standalone browser extension** loaded via Chrome's "Load unpacked" — a real
artifact the user keeps using, not a one-off list. Reach for `enrich-contact`
or `list-builder` when the user wants a contact or list right now; reach for
this skill (or `lead-gen-tool-builder`) when they want a *tool*.

**No personal keys are stored in this skill.** The bundled extension has no
hardcoded credentials — both the Explorium key and the HubSpot token are
pasted into the extension's own Options page at install time and stored in
`chrome.storage.local`, local to the user's browser profile.

## When to use

Trigger this for any request to build a Chrome/browser extension for
prospecting or contact discovery, a "Lusha alternative", an "Apollo.io
extension clone", a LinkedIn email/phone finder, or a browser tool that
reveals contact info and pushes it to a CRM. Example phrasings: "build me a
Lusha-style Chrome extension", "clone the Apollo.io browser extension but use
our own data", "make a LinkedIn contact finder extension", "I want a browser
extension that reveals emails on LinkedIn and pushes to HubSpot".

## What you get

The bundled template (`assets/lead-finder-extension/`) is a ready-to-load
Manifest V3 extension:

- **LinkedIn detection** — a content script matches `linkedin.com/in/*`,
  waits for the profile to render, and injects a floating panel (avatar,
  name, headline pulled straight from the page).
- **Reveal contact info** — calls Explorium's `prospects/match` →
  `prospects/profiles/bulk_enrich` + `prospects/contacts_information/
  bulk_enrich` and renders verified email, phone, job title, company,
  company website, and location with a "Verified by Explorium" badge.
- **Push to HubSpot** — an editable review step (first/last name, email,
  job title, company, phone) before a search-then-create-or-update call to
  HubSpot's Contacts API, so re-pushing the same person updates instead of
  duplicating.
- **Draft email** — opens a prefilled Gmail compose tab built from the
  enriched name/company/title.
- **Options page** for pasting the Explorium key and HubSpot token; a toolbar
  popup with status text and a link to Options.

## Workflow

### 1. Copy the template into the user's workspace
```bash
cp -R "<this-skill-dir>/assets/lead-finder-extension" ./lead-finder-extension
```
Don't copy `node_modules` or build artifacts — there are none; this is a
vanilla, dependency-free MV3 extension (no build step at all).

### 2. Get API keys
Only Explorium is required to reveal contacts; HubSpot is optional and only
needed for the push button. Summarize from `assets/lead-finder-extension/
README.md`:

- **Explorium (required):** sign up at developers.explorium.ai → API Keys.
  **Do not confuse this with Vibe Prospecting** — Vibe Prospecting
  (`vibeprospecting.explorium.ai`) is a separate, OAuth-only MCP server for
  prospecting *inside* an agent session; it issues no static API key and
  cannot be pasted into a browser extension. This skill always needs the
  classic REST API key.
- **HubSpot (optional):** Settings → Integrations → Private Apps → create an
  app with `crm.objects.contacts.write` (+ `.read` for the dedup lookup).

### 3. Load it and configure keys
```bash
# Chrome -> chrome://extensions -> enable Developer mode -> Load unpacked
# -> select the lead-finder-extension folder
```
Click the toolbar icon → **Set API keys** → paste the Explorium key and (if
using CRM push) the HubSpot token → **Save**.

### 4. Verify
Open a real `linkedin.com/in/...` profile — the panel should appear top-right
within a couple of seconds. Click **Reveal contact info** and confirm real
data comes back. If HubSpot is configured, push a contact and confirm the
success toast, then check the contact exists in HubSpot.

After any code change: reload the extension's card in `chrome://extensions`,
then hard-refresh the LinkedIn tab — Chrome does not re-inject content
scripts into tabs that were already open.

## Architecture

- **`background.js`** — the MV3 service worker; the *only* place API keys are
  ever read from `chrome.storage.local`. Owns all `fetch()` calls to
  `api.explorium.ai` and `api.hubapi.com`, and message-routes
  `LEADFINDER_REVEAL` / `LEADFINDER_PUSH_HUBSPOT` / `LEADFINDER_OPEN_TAB`.
- **`content.js`** — injected on `linkedin.com/in/*`. Scrapes name/headline/
  photo from the page as an instant preview, renders the panel's state
  machine (reveal → loading → result → HubSpot field-mapping review), and
  never touches an API key directly — it only messages the background
  worker.
- **`styles/tokens.css`** — the entire visual identity as CSS variables
  (`--leadfinder-primary`, `--leadfinder-ink`, radii, shadows, font stack).
  `content.css`, `popup.html`, and `options.html` all consume these tokens
  rather than hardcoding colors.
- **`manifest.json`** — note `web_accessible_resources` for the icon PNGs.
  MV3 blocks a content script from loading extension assets (like the
  toolbar icon shown inside the injected panel) unless they're explicitly
  declared there — easy to forget and the failure mode is a silently broken
  `<img>` in the panel.

## Customizing / restyling to match a brand

This is the most common follow-up request: "make it look like Lusha", "use
Apollo.io's design system", "give it a HubSpot-native look". Do this:

1. **Research the real brand before guessing.** Web search and generic
   knowledge about a company's colors are frequently wrong (a blue-brand
   guess for a company that's actually lime-green is a realistic failure
   mode). The most reliable signal is the company's own **favicon or Chrome
   extension icon** — fetch it directly and read the pixel colors:
   ```bash
   curl -sL <https://company.com/favicon.ico> -o /tmp/favicon.ico
   python3 -c "
   from PIL import Image
   img = Image.open('/tmp/favicon.ico').convert('RGBA')
   print('corner (bg):', img.getpixel((2, 2)))
   print('center (mark):', img.getpixel((img.width//2, img.height//2)))
   "
   ```
   Cross-check against the target's Chrome Web Store listing and any
   "brand/visual identity" blog posts before finalizing a palette.
2. **Update `styles/tokens.css`** with the real hex values — rename the
   token if its semantics changed (e.g. `--leadfinder-primary` staying
   "primary" is fine; don't leave a token named `-lime` holding a blue hex).
3. **Regenerate the icon** to match the brand's mark. For a simple geometric
   shape, hand-write the SVG. For anything more organic, generate it with an
   image model and composite it onto an exact-hex background with Pillow so
   the brand color is pixel-accurate rather than whatever the model
   approximated:
   ```python
   from PIL import Image, ImageDraw
   bg = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
   ImageDraw.Draw(bg).rounded_rectangle([0, 0, 127, 127], radius=18, fill=(R, G, B, 255))
   mark = Image.open("generated_mark.png").convert("RGBA").resize((92, 92))
   bg.alpha_composite(mark, (18, 18))
   ```
   Then rasterize all four sizes with `rsvg-convert` (if you kept an SVG
   source) or export directly from the composite.
4. **Rename display strings** (`manifest.json` name, popup/options headers,
   the panel title in `content.js`) — leave the `leadfinder-` CSS/JS class
   prefix alone unless the user asks for a full fork/rename, since renaming
   it everywhere is mechanical but easy to half-do and break a selector.
5. **Show the result before calling it done.** Render the popup, options
   page, and result panel as standalone HTML files against `styles/
   tokens.css` + `content.css` in a browser preview, and look at the
   screenshot yourself — don't assume a hex swap looks right.
6. **Never reproduce a trademarked logo pixel-for-pixel** if the resulting
   extension will be shared or published anywhere beyond the requester's own
   local machine — recreate the *style* (color, shape language, motion
   weight), not a copy of the asset itself. This matters more once the
   output leaves a single person's local `chrome://extensions` page.

## Limitations

- LinkedIn's DOM changes over time; `content.js` polls for the profile
  `<h1>` (up to ~6s) rather than assuming a fixed load time, but exact CSS
  selectors may need updating if LinkedIn changes its markup.
- HubSpot auth is a private-app token (simple, but scoped to one HubSpot
  account) — there's no OAuth flow, so this isn't a multi-tenant install.
- This produces a **local, unpacked** extension for personal/team use, not a
  Chrome Web Store submission — there's no review-ready packaging, privacy
  policy, or store listing here.
- Vibe Prospecting cannot power this extension's reveal step (see above) —
  only a classic Explorium REST API key works.
