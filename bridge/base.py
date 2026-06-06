"""ProviderBridge protocol — all vendor code implements this contract."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderBridge(ABC):
    provider_id: str

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
        """Proxy inference/API call (stubbed in Alpha)."""

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
