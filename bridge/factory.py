"""Generic bridge factory for providers sharing similar hub card patterns."""

from __future__ import annotations

from typing import Any

from bridge.base import ProviderBridge
from bridge.common import format_usd, metrics_from_snapshot, status_badge


def make_bridge(provider_id: str, defaults: dict[str, Any] | None = None) -> type[ProviderBridge]:
    card_defaults = defaults or {}
    pid = provider_id

    class BridgeImpl(ProviderBridge):
        provider_id = pid

        def __init__(self) -> None:
            super().__init__()
            self._card = card_defaults

        def load_config(self, registry_entry: dict[str, Any], secrets: dict[str, Any]) -> None:
            self._entry = registry_entry
            self._secrets = secrets

        def hierarchy_tiers(self) -> list[str]:
            return list(self._entry.get("hierarchy", ["billing_account", "project", "byok"]))

        def get_metrics(
            self,
            hierarchy_path: str,
            snapshot: dict[str, Any] | None = None,
        ) -> dict[str, Any]:
            m = metrics_from_snapshot(snapshot)
            return {**m, "status_badge": status_badge(str(m.get("status", "unknown")))}

        def forward_request(self, hierarchy_path: str, payload: dict[str, Any]) -> dict[str, Any]:
            if self._stub_mode:
                return {
                    "provider_id": pid,
                    "hierarchy_path": hierarchy_path,
                    "routed": True,
                    "stub": True,
                    "model": payload.get("model"),
                }
            self.ensure_live_ready()
            return {
                "provider_id": pid,
                "hierarchy_path": hierarchy_path,
                "routed": True,
                "model": payload.get("model"),
            }

        def supported_operations(self) -> list[str]:
            return list(self._card.get("operations", ["enter_provider_console"]))

        def run_operation(self, op_id: str, context: dict[str, Any]) -> dict[str, Any]:
            if not self._stub_mode:
                self.ensure_live_ready()
            handlers = self._card.get("op_messages", {})
            if op_id in handlers:
                return {"ok": True, "message": handlers[op_id]}
            if op_id == "enter_provider_console":
                screen = self._entry.get("console_screen", "GLOBAL_LEDGER_HUB")
                return {"ok": True, "screen": screen}
            return {"ok": False, "message": f"Unsupported: {op_id}"}

        def hub_card(self, snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
            m = metrics_from_snapshot(snapshot)
            balance = self._card.get("balance_summary", format_usd(m.get("promo_balance")))
            return {
                "provider_id": pid,
                "title": self._entry.get("display_name", pid),
                "balance_summary": balance if m or self._stub_mode else "Configure credentials",
                "detail": self._card.get("detail", ""),
                "status": m.get("status", "unknown") if m else "unconfigured",
                "status_badge": status_badge(str(m.get("status", "unknown") if m else "unclaimed")),
                "cta": self._card.get("cta", "OPEN CONSOLE"),
                "operations": self.supported_operations(),
            }

    return BridgeImpl
