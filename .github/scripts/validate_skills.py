"""Check that every skill and manifest loads in all supported agents.

Enforces the Agent Skills spec (https://agentskills.io/specification), which is
the strictest common denominator: OpenCode, Cline, Kiro, Roo Code and the
Claude.ai uploader skip or reject skills that break it.
"""
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
errors = []


def check_skill(skill_dir: Path) -> None:
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.is_file():
        errors.append(f"{skill_dir.name}: missing SKILL.md (agents only discover skills through that exact file name)")
        return
    text = skill_md.read_text(encoding="utf-8")
    parts = text.split("---\n", 2)
    if not text.startswith("---\n") or len(parts) < 3:
        errors.append(f"{skill_dir.name}: SKILL.md must start with YAML frontmatter")
        return
    try:
        fm = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as exc:
        errors.append(f"{skill_dir.name}: invalid frontmatter YAML: {exc}")
        return
    name = fm.get("name")
    description = fm.get("description")
    if name != skill_dir.name:
        errors.append(f"{skill_dir.name}: name {name!r} must match the folder name")
    if not isinstance(name, str) or len(name) > 64 or not NAME_RE.match(name):
        errors.append(f"{skill_dir.name}: name must be 1-64 chars of a-z, 0-9 and single hyphens")
    if not isinstance(description, str) or not 1 <= len(description) <= 1024:
        errors.append(f"{skill_dir.name}: description must be 1-1024 chars")
    compatibility = fm.get("compatibility")
    if compatibility is not None and not (isinstance(compatibility, str) and 1 <= len(compatibility) <= 500):
        errors.append(f"{skill_dir.name}: compatibility must be 1-500 chars")


def load_json(rel: str) -> dict:
    try:
        return json.loads((ROOT / rel).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{rel}: {exc}")
        return {}


for skill_dir in sorted(p for p in (ROOT / "skills").iterdir() if p.is_dir()):
    check_skill(skill_dir)

manifests = {
    rel: load_json(rel)
    for rel in (
        ".claude-plugin/plugin.json",
        ".claude-plugin/marketplace.json",
        ".cursor-plugin/plugin.json",
        ".cursor-plugin/marketplace.json",
        "gemini-extension.json",
    )
}
plugin_names = {rel: m.get("name") for rel, m in manifests.items() if "marketplace" not in rel}
if len(set(plugin_names.values())) != 1:
    errors.append(f"plugin names differ across manifests: {plugin_names}")
for rel in (".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json"):
    for entry in manifests[rel].get("plugins", []):
        # Codex and Cursor only resolve relative sources for this repo; a
        # {"source": "github"} entry is silently skipped by Codex.
        if entry.get("source") != "./":
            errors.append(f"{rel}: plugin {entry.get('name')!r} source must be \"./\"")

for err in errors:
    print(f"::error::{err}")
print(f"Checked {len(list((ROOT / 'skills').iterdir()))} skills and {len(manifests)} manifests: {len(errors)} error(s)")
sys.exit(1 if errors else 0)
