"""Google Cloud bridge — AI Studio + Vertex AI blocks."""

from __future__ import annotations

from typing import Any

from bridge.base import ProviderBridge
from bridge.common import format_usd, metrics_from_snapshot, status_badge


class GoogleBridge(ProviderBridge):
    provider_id = "google_cloud"

    def __init__(self) -> None:
        self._entry: dict[str, Any] = {}
        self._secrets: dict[str, Any] = {}

    def load_config(self, registry_entry: dict[str, Any], secrets: dict[str, Any]) -> None:
        self._entry = registry_entry
        self._secrets = secrets

    def hierarchy_tiers(self) -> list[str]:
        return list(self._entry.get("hierarchy", ["billing_account", "project", "byok"]))

    def get_metrics(self, hierarchy_path: str, snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
        m = metrics_from_snapshot(snapshot)
        return {
            **m,
            "display_balance": format_usd(m.get("promo_balance")),
            "products": self._entry.get("products", ["ai_studio", "vertex_ai"]),
            "status_badge": status_badge(str(m.get("status", "active"))),
        }

    def forward_request(self, hierarchy_path: str, payload: dict[str, Any]) -> dict[str, Any]:
        tokens = len(str(payload.get("prompt", ""))) // 4
        return {
            "provider_id": self.provider_id,
            "hierarchy_path": hierarchy_path,
            "estimated_tokens": tokens,
            "routed": True,
            "model": payload.get("model", "gemini-2.5-flash"),
        }

    def supported_operations(self) -> list[str]:
        return ["enter_provider_console", "claim_dev_voucher", "force_swap"]

    def run_operation(self, op_id: str, context: dict[str, Any]) -> dict[str, Any]:
        if op_id == "claim_dev_voucher":
            return {"ok": True, "message": "Dev voucher claim queued ($40)"}
        if op_id == "force_swap":
            return {"ok": True, "message": "Swap sequencer triggered at 95% TPM"}
        if op_id == "enter_provider_console":
            return {"ok": True, "screen": "GOOGLE_CONSOLE"}
        return {"ok": False, "message": f"Unknown operation: {op_id}"}

    def hub_card(self, snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
        m = metrics_from_snapshot(snapshot)
        promo = m.get("promo_balance") or 0
        dev = 40.0
        return {
            "provider_id": self.provider_id,
            "title": self._entry.get("display_name", "Google Ecosystem"),
            "balance_summary": f"{format_usd(promo)} (Vertex) + {format_usd(dev)} Developer Code",
            "projects": ["M4O-Venture", "Merit-SWDAR", "Draven-Bot"],
            "posture": "SECURE (SQLite Synchronized)",
            "status": m.get("status", "active"),
            "status_badge": status_badge(str(m.get("status", "active"))),
            "cta": "CLICK TO ENTER PROVIDER CONSOLE",
            "operations": self.supported_operations(),
        }


Bridge = GoogleBridge
