"""Backend admin console hooks (provider CRUD) — Alpha stub."""

from __future__ import annotations

from typing import Any

from core.config_loader import load_provider_registry


def list_providers_admin() -> dict[str, Any]:
    reg = load_provider_registry()
    return {
        "default_hierarchy": reg.get("default_hierarchy"),
        "providers": reg.get("providers", {}),
    }
