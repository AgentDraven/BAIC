"""ProviderBridge protocol — all vendor code implements this contract."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from core.bridge_secrets import BRIDGE_SECRET_SPECS
from core.error_codes import BaicError, ErrorCode


class ProviderBridge(ABC):
    provider_id: str
    _stub_mode: bool

    def __init__(self) -> None:
        self._stub_mode = False
        self._entry: dict[str, Any] = {}
        self._secrets: dict[str, Any] = {}

    def set_stub_mode(self, enabled: bool) -> None:
        self._stub_mode = enabled

    @classmethod
    def required_secrets(cls) -> list[dict[str, str]]:
        return list(BRIDGE_SECRET_SPECS.get(cls.provider_id, []))

    def secrets_configured(self) -> bool:
        specs = self.required_secrets()
        if not specs:
            return True
        for spec in specs:
            key = spec["key"]
            val = self._secrets.get(key) or ""
            if not str(val).strip() or str(val).startswith("<"):
                return False
        return True

    def ensure_live_ready(self) -> None:
        if self._stub_mode:
            return
        if not self.secrets_configured():
            missing = [s["key"] for s in self.required_secrets() if not self._secrets.get(s["key"])]
            raise BaicError(
                ErrorCode.AUTH_FAILED,
                f"Provider '{self.provider_id}' missing credentials: {', '.join(missing)}. "
                "Use --stub for demo mode or configure cfg/secrets.json / env.",
            )

    def stub_manifest(self) -> dict[str, Any]:
        return {
            "provider_id": self.provider_id,
            "stub": True,
            "sample_metrics": {"status": "active", "promo_balance": 1000.0},
            "missing_secrets": [
                s["key"] for s in self.required_secrets() if not self.secrets_configured()
            ],
        }

    @abstractmethod
    def load_config(self, registry_entry: dict[str, Any], secrets: dict[str, Any]) -> None:
        """Bind registry metadata and secret handles."""

    @abstractmethod
    def hierarchy_tiers(self) -> list[str]:
        """Return ordered hierarchy tier names."""

    @abstractmethod
    def get_metrics(self, hierarchy_path: str, snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
        """Normalize provider metrics for UI."""

    @abstractmethod
    def forward_request(self, hierarchy_path: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Proxy inference/API call — live requires credentials; stub only with --stub."""

    @abstractmethod
    def supported_operations(self) -> list[str]:
        """Hub/Spoke CTA operation IDs."""

    @abstractmethod
    def run_operation(self, op_id: str, context: dict[str, Any]) -> dict[str, Any]:
        """Execute a UI-triggered operation."""

    def hub_card(self, snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
        """Optional enriched card payload for Global Ledger."""
        return {
            "provider_id": self.provider_id,
            "operations": self.supported_operations(),
        }
