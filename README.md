# Explorium Public Skills

Ready-to-use Claude Code skills for B2B marketing and sales teams.

## Available Skills

### ABM DIY Campaign (`skills/abm-campaign`)

Run a full Account-Based Marketing campaign end-to-end — from ICP to live LinkedIn Ads — without an agency.

**What it does:**
1. Builds a targeted account list from your ICP using Vibe Prospecting
2. Enriches and scores companies with firmographics, technographics, and growth signals
3. Generates personalized LinkedIn ad creatives using Claude Code and Figma
4. Pushes matched audiences to LinkedIn Ads
5. Monitors campaigns daily and auto-pauses at frequency cap

**Install:**
```bash
claude install explorium-ai/public-skills
```

**Use:**
```
/abm-diy-campaign
```

**Requirements:** Vibe Prospecting account, LinkedIn Ads API credentials, Figma (optional)

---

## Installing skills

```bash
# Install all skills from this repo
claude install explorium-ai/public-skills

# Then invoke a skill in any Claude Code session
/abm-diy-campaign
```

## License

[MIT](LICENSE) — free to use, share, and build on. See [CONTRIBUTING](CONTRIBUTING.md) if you want to contribute.

## Maintained by

[Explorium](https://explorium.ai) · [Vibe Prospecting](https://vibeprospecting.ai)
