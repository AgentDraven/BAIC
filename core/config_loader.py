"""Load cfg/ JSON configuration (MERIT §I.B — cfg is SSOT)."""

from __future__ import annotations

import json
import os
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
        api = data.get("api", {})
        api_host = api.get("host", data.get("api_host", "127.0.0.1"))
        api_port = int(api.get("port", data.get("api_port", 8765)))
        return cls(
            app_name=data.get("app_name", "BAIC"),
            api_host=api_host,
            api_port=api_port,
            database=DatabaseConfig(
                engine=db.get("engine", "sqlite"),
                path=db.get("path", "output/baic_state.db"),
                echo=bool(db.get("echo", False)),
            ),
            branding=data.get("branding", {}),
            raw=data,
        )

    def hub_defaults(self) -> dict[str, Any]:
        return dict(self.raw.get("hub", {}))

    def ui_config(self) -> dict[str, Any]:
        return dict(self.raw.get("ui", {}))

    def api_base_url(self) -> str:
        return f"http://{self.api_host}:{self.api_port}"


def load_provider_registry(path: Path | None = None) -> dict[str, Any]:
    file_path = path or cfg_path("provider_registry.json")
    if not file_path.is_file():
        file_path = cfg_path("provider_registry.example.json")
    if not file_path.is_file():
        raise BaicError(ErrorCode.CONFIG_NOT_FOUND, "provider_registry.json not found")
    return json.loads(file_path.read_text(encoding="utf-8"))


def load_capability_matrix(path: Path | None = None) -> dict[str, Any]:
    file_path = path or cfg_path("model_capability_matrix.json")
    if not file_path.is_file():
        file_path = cfg_path("model_capability_matrix.json.example")
    if not file_path.is_file():
        raise BaicError(ErrorCode.CONFIG_NOT_FOUND, "model_capability_matrix.json not found")
    return json.loads(file_path.read_text(encoding="utf-8"))


def load_spoke_console_layout(path: Path | None = None) -> dict[str, Any]:
    file_path = path or cfg_path("spoke_console_layout.json")
    if not file_path.is_file():
        raise BaicError(ErrorCode.CONFIG_NOT_FOUND, "spoke_console_layout.json not found")
    return json.loads(file_path.read_text(encoding="utf-8"))


def load_secrets(path: Path | None = None) -> dict[str, Any]:
    file_path = path or cfg_path("secrets.json")
    if not file_path.is_file():
        return {"providers": {}}
    return json.loads(file_path.read_text(encoding="utf-8"))


def load_env_secrets() -> dict[str, str]:
    """Merge relevant env vars (does not load .env.local — operator exports or uses secrets.json)."""
    keys = [
        "GOOGLE_APPLICATION_CREDENTIALS",
        "GOOGLE_CLOUD_PROJECT",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_DEFAULT_REGION",
        "OCI_TENANCY_OCID",
        "OCI_USER_OCID",
        "OCI_FINGERPRINT",
        "OCI_PRIVATE_KEY_PATH",
        "CURSOR_API_TOKEN",
        "GITHUB_TOKEN",
        "GOOGLE_ONE_CLIENT_ID",
    ]
    return {k: os.environ.get(k, "") for k in keys if os.environ.get(k)}


def resolve_db_file(config: AppConfig) -> Path:
    db_path = Path(config.database.path)
    if db_path.is_absolute():
        return db_path
    return get_repo_root() / db_path
