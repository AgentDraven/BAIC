"""Config scaffold validator — ensures examples match bridge secret specs."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from core.bridge_secrets import BRIDGE_SECRET_SPECS, example_secrets_json
from core.path_resolver import get_repo_root


@dataclass
class ScaffoldReport:
    ok: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def add_error(self, msg: str) -> None:
        self.errors.append(msg)
        self.ok = False


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _parse_env_example(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.is_file():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, _val = line.partition("=")
            env[key.strip()] = ""
    return env


def validate_scaffold(repo_root: Path | None = None) -> ScaffoldReport:
    root = repo_root or get_repo_root()
    report = ScaffoldReport(ok=True)

    secrets_example = root / "cfg" / "secrets.example.json"
    env_example = root / ".env.local.example"
    matrix_example = root / "cfg" / "model_capability_matrix.json.example"
    matrix_baseline = root / "cfg" / "model_capability_matrix.json"

    if not secrets_example.is_file():
        report.add_error(f"Missing {secrets_example}")
    else:
        data = _read_json(secrets_example)
        expected = example_secrets_json()
        for pid, keys in expected["providers"].items():
            if pid not in data.get("providers", {}):
                report.add_error(f"secrets.example.json missing provider '{pid}'")
                continue
            for key in keys:
                if key not in data["providers"][pid]:
                    report.add_error(f"secrets.example.json missing {pid}.{key}")

    if not env_example.is_file():
        report.add_error(f"Missing {env_example}")
    else:
        env_keys = _parse_env_example(env_example)
        for pid, specs in BRIDGE_SECRET_SPECS.items():
            for spec in specs:
                env_key = spec.get("env", "")
                if env_key and env_key not in env_keys:
                    report.add_error(f".env.local.example missing {env_key} for {pid}")

    if not matrix_example.is_file():
        report.add_error(f"Missing {matrix_example}")
    if not matrix_baseline.is_file():
        report.add_error(f"Missing tracked {matrix_baseline}")

    return report


def validate_scaffold_or_raise() -> ScaffoldReport:
    report = validate_scaffold()
    if not report.ok:
        raise ValueError("; ".join(report.errors))
    return report
