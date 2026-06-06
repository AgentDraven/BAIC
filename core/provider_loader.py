"""Dynamic bridge loader — maps cfg provider_registry to bridge modules."""

from __future__ import annotations

import importlib
from typing import Any

from bridge.base import ProviderBridge
from bridge.google import Bridge as GoogleBridge

from core.error_codes import BaicError, ErrorCode

_BUILTIN: dict[str, type[ProviderBridge]] = {
    "google_cloud": GoogleBridge,
}


def _import_bridge_class(module_path: str) -> type[ProviderBridge]:
    if module_path in _BUILTIN:
        return _BUILTIN[module_path]
    try:
        mod = importlib.import_module(module_path)
    except ImportError as exc:
        raise BaicError(ErrorCode.BRIDGE_LOAD_FAILED, f"Cannot import {module_path}") from exc
    bridge_cls = getattr(mod, "Bridge", None)
    if bridge_cls is None:
        raise BaicError(ErrorCode.BRIDGE_LOAD_FAILED, f"No Bridge class in {module_path}")
    return bridge_cls


class ProviderRegistry:
    def __init__(self, registry: dict[str, Any], secrets: dict[str, Any] | None = None) -> None:
        self._registry = registry
        self._secrets = secrets or {}
        self._bridges: dict[str, ProviderBridge] = {}
        self._load_all()

    def _load_all(self) -> None:
        providers = self._registry.get("providers", {})
        for provider_id, entry in providers.items():
            if not entry.get("enabled", True):
                continue
            module_path = entry.get("bridge_module", "").replace("/", ".")
            if not module_path:
                continue
            cls = _import_bridge_class(module_path if module_path.startswith("bridge") else f"bridge.{module_path}")
            instance = cls()
            instance.load_config(entry, self._secrets.get(provider_id, {}))
            self._bridges[provider_id] = instance

    def get(self, provider_id: str) -> ProviderBridge:
        if provider_id not in self._bridges:
            raise BaicError(ErrorCode.PROVIDER_NOT_FOUND, f"Provider '{provider_id}' not loaded")
        return self._bridges[provider_id]

    def list_ids(self) -> list[str]:
        return list(self._bridges.keys())

    def default_hierarchy(self) -> list[str]:
        return list(self._registry.get("default_hierarchy", ["billing_account", "project", "byok"]))

    def provider_config(self, provider_id: str) -> dict[str, Any]:
        return dict(self._registry.get("providers", {}).get(provider_id, {}))

    def all_provider_configs(self) -> dict[str, Any]:
        return dict(self._registry.get("providers", {}))
