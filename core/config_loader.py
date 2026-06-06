"""Load cfg/ JSON configuration (MERIT §I.B — cfg is SSOT)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from core.error_codes import BaicError, ErrorCode
from core.path_resolver import cfg_path, get_repo_root


@dataclass(frozen=True)
class DatabaseConfig:
    engine: str
    path: str
    echo: bool = False


@dataclass(frozen=True)
class AppConfig:
    app_name: str
    api_host: str
    api_port: int
    database: DatabaseConfig
    branding: dict[str, str]
    raw: dict[str, Any]

    @classmethod
    def load(cls, config_file: Path | None = None) -> AppConfig:
        path = config_file or cfg_path("config.json")
        if not path.is_file():
            raise BaicError(ErrorCode.CONFIG_NOT_FOUND, f"Missing {path}")
        data = json.loads(path.read_text(encoding="utf-8"))
        db = data.get("database", {})
        return cls(
            app_name=data.get("app_name", "BAIC"),
            api_host=data.get("api_host", "127.0.0.1"),
            api_port=int(data.get("api_port", 8765)),
            database=DatabaseConfig(
                engine=db.get("engine", "sqlite"),
                path=db.get("path", "output/baic_state.db"),
                echo=bool(db.get("echo", False)),
            ),
            branding=data.get("branding", {}),
            raw=data,
        )


def load_provider_registry(path: Path | None = None) -> dict[str, Any]:
    file_path = path or cfg_path("provider_registry.json")
    if not file_path.is_file():
        file_path = cfg_path("provider_registry.example.json")
    if not file_path.is_file():
        raise BaicError(ErrorCode.CONFIG_NOT_FOUND, "provider_registry.json not found")
    return json.loads(file_path.read_text(encoding="utf-8"))


def resolve_db_file(config: AppConfig) -> Path:
    db_path = Path(config.database.path)
    if db_path.is_absolute():
        return db_path
    return get_repo_root() / db_path
