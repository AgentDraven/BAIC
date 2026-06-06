#!/usr/bin/env python3
"""BAIC unified test entry point (MERIT §II.A)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))


def main() -> int:
    args = sys.argv[1:]
    if not args:
        args = ["tests", "-v", "--tb=short"]
    cmd = [sys.executable, "-m", "pytest", *args]
    print(f"[test_baic] Running: {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=str(_ROOT))


if __name__ == "__main__":
    raise SystemExit(main())
