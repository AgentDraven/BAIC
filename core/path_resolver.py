"""Resolve repository-relative paths (MERIT §I.A)."""

from __future__ import annotations

from pathlib import Path

_REPO_ROOT: Path | None = None


def get_repo_root(start: Path | None = None) -> Path:
    global _REPO_ROOT
    if _REPO_ROOT is not None:
        return _REPO_ROOT
    cursor = (start or Path(__file__)).resolve()
    for parent in [cursor, *cursor.parents]:
        if (parent / "VERSION").is_file() and (parent / "cfg" / "config.json").is_file():
            _REPO_ROOT = parent
            return parent
    raise FileNotFoundError("BAIC repository root not found (missing VERSION or cfg/config.json).")


def cfg_path(name: str) -> Path:
    return get_repo_root() / "cfg" / name


def output_path(*parts: str) -> Path:
    path = get_repo_root() / "output" / Path(*parts)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def reset_repo_root_cache() -> None:
    global _REPO_ROOT
    _REPO_ROOT = None
