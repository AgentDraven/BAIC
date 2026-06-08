"""Thin BAIC wrapper for MERIT layered env loading."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any


def _humanbala_lib() -> Path:
    return Path(os.environ.get("USERPROFILE", os.path.expanduser("~"))) / "HumanBala" / "lib"


def load_merged_env(repo_path: Path | None = None, *, include_persona: bool | None = None) -> dict[str, str]:
    """Load L2 persona + L3 repo env. Persona layer loads only when repo .env.local exists."""
    if repo_path is None:
        from core.path_resolver import get_repo_root

        root = get_repo_root()
    else:
        root = Path(repo_path)
    repo_file = root / ".env.local"
    if include_persona is None:
        include_persona = repo_file.is_file()
    lib = _humanbala_lib()
    if lib.is_dir() and str(lib) not in sys.path:
        sys.path.insert(0, str(lib))
    try:
        import merit_env as merit_env_mod  # type: ignore[import-not-found]

        return merit_env_mod.load_merged_env(
            repo_path=root,
            persona_id=None if include_persona else "__skip__",
        )
    except ImportError:
        return _parse_env_file(repo_file)


def apply_merged_env(repo_path: Path | None = None, *, overwrite: bool = False) -> dict[str, str]:
    merged = load_merged_env(repo_path=repo_path)
    for key, value in merged.items():
        if overwrite or key not in os.environ:
            os.environ[key] = value
    return merged


def _parse_env_file(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip()
    return out


def secrets_from_merged_env(provider_specs: dict[str, list[dict[str, str]]]) -> dict[str, Any]:
    """Map merged env vars into cfg/secrets.json provider shape."""
    env = load_merged_env()
    providers: dict[str, dict[str, str]] = {}
    for pid, specs in provider_specs.items():
        row: dict[str, str] = {}
        for spec in specs:
            env_key = spec.get("env", "")
            secret_key = spec["key"]
            if env_key and env.get(env_key):
                row[secret_key] = env[env_key]
        if row:
            providers[pid] = row
    return providers
