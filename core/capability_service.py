"""Platform × Model capability matrix service (MERIT §II.I)."""

from __future__ import annotations

import json
from typing import Any

from core.config_loader import load_capability_matrix
from core.error_codes import BaicError, ErrorCode
from core.path_resolver import cfg_path


class CapabilityService:
    def __init__(self, matrix: dict[str, Any] | None = None, stub_mode: bool = False) -> None:
        self._matrix = matrix or load_capability_matrix()
        self._stub_mode = stub_mode

    def full_matrix(self) -> dict[str, Any]:
        return self._matrix

    def platform_models(self, platform_id: str) -> dict[str, Any]:
        platforms = self._matrix.get("platforms", {})
        if platform_id not in platforms:
            raise BaicError(ErrorCode.PROVIDER_NOT_FOUND, f"Platform '{platform_id}' not in matrix")
        return platforms[platform_id]

    def model_families(self) -> list[dict[str, str]]:
        catalog = self._matrix.get("model_catalog", {})
        families: dict[str, list[str]] = {}
        for model_id, meta in catalog.items():
            fam = meta.get("family", "other")
            families.setdefault(fam, []).append(model_id)
        return [{"family": k, "models": v} for k, v in sorted(families.items())]

    def patch_model(
        self,
        platform_id: str,
        model_id: str,
        patch: dict[str, Any],
    ) -> dict[str, Any]:
        if not self._stub_mode:
            raise BaicError(ErrorCode.OPERATION_UNSUPPORTED, "Matrix PATCH allowed in --stub mode only")
        platforms = self._matrix.setdefault("platforms", {})
        plat = platforms.setdefault(platform_id, {"provider_id": platform_id, "models": {}})
        models = plat.setdefault("models", {})
        cell = models.setdefault(model_id, {})
        cell.update(patch)
        self._persist_matrix()
        return cell

    def _persist_matrix(self) -> None:
        path = cfg_path("model_capability_matrix.json")
        path.write_text(json.dumps(self._matrix, indent=2) + "\n", encoding="utf-8")

    def models_for_routing(self, model_id: str) -> list[str]:
        """Return platform ids that expose model_id."""
        out: list[str] = []
        for pid, plat in self._matrix.get("platforms", {}).items():
            models = plat.get("models", {})
            if model_id in models and models[model_id].get("available"):
                out.append(pid)
        return out
