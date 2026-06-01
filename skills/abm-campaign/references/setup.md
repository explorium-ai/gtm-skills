# Setup Guide — Credentials & Prerequisites

This skill uses three external services. You must configure them before running any phase. **No credentials are stored in this repo** — everything is set via environment variables or interactive login prompts at runtime.

---

## 1. Vibe Prospecting

Vibe Prospecting powers Phases 1 and 2 (account discovery and enrichment). You need a Vibe Prospecting account and API key.

### Get an account
1. Go to [vibeprospecting.ai](https://vibeprospecting.ai) and sign up (free tier available).
2. After signup, go to **Settings → API Keys** and copy your key.

### Configure the CLI
```bash
# Install and configure the CLI
npx @vibeprospecting/vpai@latest config --api-key "YOUR_VIBE_API_KEY"

# Verify it works
npx @vibeprospecting/vpai@latest --help
```

If the API key is already on disk from a previous session:
```bash
API_KEY=$(python3 -c "import json; print(json.load(open(os.path.expanduser('~/.config/vpai/config.json')))['api_key'])" 2>/dev/null)
[ -n "$API_KEY" ] && echo "Key found: ${API_KEY:0:8}..." || echo "No cached key found — run config above"
```

---

## 2. LinkedIn Ads API

LinkedIn credentials are needed for Phases 5 and 6. You need a LinkedIn Developer App with Marketing API access.

### Get credentials

**Step 1 — Create a LinkedIn Developer App**
1. Go to [linkedin.com/developers](https://www.linkedin.com/developers/apps) and create an app.
2. Under **Products**, request access to **Marketing Developer Platform**.
3. Note your `Client ID` and `Client Secret`.

**Step 2 — Get an Access Token**

LinkedIn uses OAuth 2.0 with the 3-legged flow. Run this helper to get your token:

```bash
# Set your app credentials
export LINKEDIN_CLIENT_ID="your_client_id"
export LINKEDIN_CLIENT_SECRET="your_client_secret"
export LINKEDIN_REDIRECT_URI="http://localhost:8080/callback"

# Step 2a: Open this URL in your browser and authorize
echo "Open this URL in your browser:"
echo "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${LINKEDIN_REDIRECT_URI}&scope=r_ads%20r_ads_reporting%20w_organization_social%20rw_ads"

# Step 2b: After authorizing, LinkedIn redirects to your callback with ?code=XXX
# Copy the code from the URL and run:
read -p "Paste the authorization code: " AUTH_CODE

# Step 2c: Exchange code for token
curl -s -X POST "https://www.linkedin.com/oauth/v2/accessToken" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=${AUTH_CODE}&redirect_uri=${LINKEDIN_REDIRECT_URI}&client_id=${LINKEDIN_CLIENT_ID}&client_secret=${LINKEDIN_CLIENT_SECRET}" \
  | python3 -m json.tool
```

Copy the `access_token` from the response (valid for 60 days).

**Step 3 — Find your Ad Account ID**
```bash
# List your ad accounts
curl -s "https://api.linkedin.com/v2/adAccountsV2?q=search&search.type.values[0]=BUSINESS" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  | python3 -m json.tool
```

Look for `"id"` in the response — that's your Ad Account URN (format: `urn:li:sponsoredAccount:123456789`). The numeric part is your account ID.

### Set environment variables

Add these to your shell profile (`.bashrc`, `.zshrc`) or set them at the start of each session:

```bash
export LINKEDIN_ACCESS_TOKEN="your_access_token"
export LINKEDIN_AD_ACCOUNT_ID="123456789"        # numeric only, no urn prefix
export LINKEDIN_CLIENT_ID="your_client_id"
export LINKEDIN_CLIENT_SECRET="your_client_secret"
```

### Verify access
```bash
curl -s "https://api.linkedin.com/v2/me" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  | python3 -m json.tool
```

---

## 3. Figma (Optional — Phase 4)

Figma MCP is used for dynamic creative personalization. If Figma MCP is already connected in your Claude Code environment, no extra setup is needed. To check:

```bash
# If Figma MCP is connected, Claude will have access to figma_* tools automatically.
# You can verify by asking: "What Figma tools are available?"
```

If you need to set it up manually:
1. Go to [figma.com/developers](https://www.figma.com/developers) → **Personal Access Tokens**
2. Create a token with **File Read** and **File Write** scopes
3. Set it:
```bash
export FIGMA_ACCESS_TOKEN="your_figma_token"
```

---

## Required Scopes Summary

| Service | Scopes / Permissions |
|---------|---------------------|
| Vibe Prospecting | API key (from vibeprospecting.ai) |
| LinkedIn Ads | `r_ads`, `r_ads_reporting`, `w_organization_social`, `rw_ads` |
| Figma | File Read, File Write |

---

## Quick Verification Checklist

```bash
# 1. Vibe Prospecting
npx @vibeprospecting/vpai@latest --help && echo "✓ Vibe OK"

# 2. LinkedIn
curl -sf -o /dev/null "https://api.linkedin.com/v2/me" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" && echo "✓ LinkedIn OK"

# 3. Environment variables set
[ -n "$LINKEDIN_ACCESS_TOKEN" ] && echo "✓ LINKEDIN_ACCESS_TOKEN set" || echo "✗ LINKEDIN_ACCESS_TOKEN missing"
[ -n "$LINKEDIN_AD_ACCOUNT_ID" ] && echo "✓ LINKEDIN_AD_ACCOUNT_ID set" || echo "✗ LINKEDIN_AD_ACCOUNT_ID missing"
```

All checks passing? You're ready to start Phase 1.
