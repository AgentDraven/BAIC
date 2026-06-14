#!/usr/bin/env python3
"""BAIC repo hygiene — VERSION sync, instruction chain, root floaters."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
VERSION_FILES = {
    "VERSION": PROJECT_ROOT / "VERSION",
    "README": PROJECT_ROOT / "README.md",
    "BAIC.instructions": PROJECT_ROOT / "BAIC.instructions",
    "BAIC docs/INDEX.md": PROJECT_ROOT / "BAIC docs" / "INDEX.md",
}
INSTRUCTION_REFERENCES = [
    "BAIC docs/MERIT.instructions",
    "BAIC.instructions",
]
ROOT_FILE_ALLOWLIST = {
    ".env.example",
    ".env.local.example",
    ".env.local",
    ".gitignore",
    "AGENTS.md",
    "CHANGELOG.md",
    "BAIC.instructions",
    "LICENSE",
    "README.md",
    "VERSION",
    "pyproject.toml",
    "requirements.txt",
    "requirements-dev.txt",
    "run_baic.py",
    "test_baic.py",
}
ROOT_FILE_ALLOW_SUFFIXES = {".code-workspace", ".instructions"}
SKIP_DIR_NAMES = {".archive", ".git", ".venv", "__pycache__", "node_modules", "output"}
ZERO_BYTE_SCAN_DIRS = ("cfg", "core", "BAIC docs", "scripts", "tests", "web")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def extract_backticked_version(text: str) -> str | None:
    match = re.search(r"`(\d+\.\d+\.\d+)`", text)
    return match.group(1) if match else None


def extract_plain_version(text: str) -> str | None:
    match = re.search(r"Version:\s*(\d+\.\d+\.\d+)", text, flags=re.IGNORECASE)
    return match.group(1) if match else None


def extract_changelog_latest_version(text: str) -> str | None:
    match = re.search(r"^## \[(\d+\.\d+\.\d+)\]", text, flags=re.MULTILINE)
    return match.group(1) if match else None


def root_floaters() -> list[str]:
    floaters: list[str] = []
    for child in PROJECT_ROOT.iterdir():
        if not child.is_file():
            continue
        name = child.name
        if name in ROOT_FILE_ALLOWLIST:
            continue
        if Path(name).suffix in ROOT_FILE_ALLOW_SUFFIXES:
            continue
        if name.startswith("run_") or name.startswith("test_"):
            continue
        floaters.append(name)
    return sorted(floaters)


def zero_byte_files() -> list[str]:
    hits: list[str] = []
    for dirname in ZERO_BYTE_SCAN_DIRS:
        base = PROJECT_ROOT / dirname
        if not base.is_dir():
            continue
        for path in base.rglob("*"):
            if any(part in SKIP_DIR_NAMES for part in path.parts):
                continue
            if path.is_file() and path.stat().st_size == 0:
                hits.append(str(path.relative_to(PROJECT_ROOT)))
    return sorted(hits)


def version_mismatches() -> list[str]:
    versions: dict[str, str | None] = {}
    if VERSION_FILES["VERSION"].is_file():
        versions["VERSION"] = read_text(VERSION_FILES["VERSION"]).strip()
    if VERSION_FILES["README"].is_file():
        versions["README"] = extract_backticked_version(read_text(VERSION_FILES["README"]))
    if VERSION_FILES["BAIC.instructions"].is_file():
        text = read_text(VERSION_FILES["BAIC.instructions"])
        versions["BAIC.instructions"] = extract_plain_version(text) or extract_backticked_version(text)
    changelog = PROJECT_ROOT / "CHANGELOG.md"
    if changelog.is_file():
        versions["CHANGELOG"] = extract_changelog_latest_version(read_text(changelog))
    declared = [v for v in versions.values() if v]
    if len(set(declared)) > 1:
        return [f"{k}={v}" for k, v in versions.items() if v]
    return []


def missing_instruction_refs() -> list[str]:
    agents = PROJECT_ROOT / "AGENTS.md"
    if not agents.is_file():
        return ["AGENTS.md missing"]
    lower = read_text(agents).lower()
    return [ref for ref in INSTRUCTION_REFERENCES if ref.lower() not in lower]


def cfg_e2e_pollution() -> list[str]:
    cfg = PROJECT_ROOT / "cfg"
    if not cfg.is_dir():
        return []
    bad: list[str] = []
    for path in cfg.rglob("*"):
        if not path.is_file():
            continue
        name = path.name.lower()
        if "e2e" in name or "playwright" in name or "test-result" in name:
            bad.append(str(path.relative_to(PROJECT_ROOT)))
    return bad


def main() -> int:
    parser = argparse.ArgumentParser(description="BAIC repo hygiene check")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    payload = {
        "root_floaters": root_floaters(),
        "zero_byte_files": zero_byte_files(),
        "version_mismatches": version_mismatches(),
        "missing_instruction_refs": missing_instruction_refs(),
        "cfg_e2e_pollution": cfg_e2e_pollution(),
    }
    ok = not any(
        payload[k]
        for k in (
            "root_floaters",
            "zero_byte_files",
            "version_mismatches",
            "missing_instruction_refs",
            "cfg_e2e_pollution",
        )
    )
    payload["ok"] = ok
    print(json.dumps(payload, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
