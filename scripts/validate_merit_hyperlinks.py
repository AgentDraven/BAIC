#!/usr/bin/env python3
"""Repo shim — delegates to merit-private-vault/scripts/compliance/validate_merit_hyperlinks.py"""

from __future__ import annotations

import os
import runpy
import sys
from pathlib import Path


def _vault_script(name: str) -> Path:
    roots: list[Path] = []
    env = os.environ.get("MERIT_VAULT_ROOT")
    if env:
        roots.append(Path(env).expanduser())
    repo = Path(__file__).resolve().parents[1]
    roots.append(repo.parent / "merit-private-vault")
    roots.append(Path.home() / "AgentDraven" / "merit-private-vault")
    for root in roots:
        script = root.resolve() / "scripts" / "compliance" / name
        if script.is_file():
            return script
    sys.exit(
        "MERIT vault compliance script not found. "
        "Clone merit-private-vault alongside this repo or set MERIT_VAULT_ROOT."
    )


if __name__ == "__main__":
    script = _vault_script("validate_merit_hyperlinks.py")
    repo = str(Path(__file__).resolve().parents[1])
    sys.argv = [str(script), "--repo", repo] + [a for a in sys.argv[1:] if a != "--repo"]
    runpy.run_path(str(script), run_name="__main__")
