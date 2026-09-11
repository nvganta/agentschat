"""Validate repository handoff files; this is not a runtime acceptance test."""
from pathlib import Path
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
errors = []
required = ["README.md", "AGENTS.md", "FOUNDER.md", "LOG.md", "ARCHITECTURE.md", "ROADMAP.md", "DEVELOPMENT.md"]
for name in required:
    p = root / name
    if not p.is_file() or not p.read_text(encoding="utf-8-sig").strip():
        errors.append(f"Missing or empty {name}")
if not errors:
    log = (root / "LOG.md").read_text(encoding="utf-8-sig")
    status = re.search(r"(?ms)^## Status\s*\n(.*?)(?=^## |\Z)", log)
    if not status:
        errors.append("LOG.md needs ## Status")
    else:
        for key in ["State", "Live URL", "Stranger test", "Currently working on", "Blocked on investor"]:
            if not re.search(r"(?m)^- " + re.escape(key) + r":\s*\S", status[1]):
                errors.append(f"LOG.md missing status field: {key}")
        state = re.search(r"(?m)^- State: ([^\n]+)", status[1])
        if state and state[1].strip() not in {"active", "parked", "dormant"}:
            errors.append("State must be active, parked or dormant")
    if "## Session notes" not in log:
        errors.append("LOG.md needs ## Session notes")
    if "## Mission" not in (root / "FOUNDER.md").read_text(encoding="utf-8-sig"):
        errors.append("FOUNDER.md needs ## Mission")
    # Check simple local document links without traversing external URLs.
    for name in ["ARCHITECTURE.md", "ROADMAP.md", "DEVELOPMENT.md"]:
        for target in re.findall(r"\[[^\]]+\]\(([^)]+)\)", (root / name).read_text(encoding="utf-8-sig")):
            if "://" not in target and not target.startswith("#"):
                if not (root / target.split("#")[0]).exists():
                    errors.append(f"{name}: missing local link {target}")
tracked = subprocess.run(["git", "-C", str(root), "ls-files", "-z"], capture_output=True, check=True).stdout.decode().split("\0")
for file in tracked:
    base = Path(file).name
    if base in {".env", ".env.local", ".env.production", ".env.development", "pairing_token.txt"}:
        errors.append(f"Private local configuration is tracked: {file}")
if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print("Repository handoff check passed (runtime not assessed)")
