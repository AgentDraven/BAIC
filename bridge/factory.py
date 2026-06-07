"""Generic bridge factory — hub_card copy from provider_registry, balances from metrics only."""

from __future__ import annotations

from typing import Any

from bridge.base import ProviderBridge
from bridge.common import format_usd, metrics_from_snapshot, status_badge


def make_bridge(provider_id: str) -> type[ProviderBridge]:
    pid = provider_id

    class BridgeImpl(ProviderBridge):
        provider_id = pid

        def load_config(self, registry_entry: dict[str, Any], secrets: dict[str, Any]) -> None:
            self._entry = registry_entry
            self._secrets = secrets
            self._hub_card = dict(registry_entry.get("hub_card", {}))

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
            return list(self._hub_card.get("operations", ["enter_provider_console"]))

        def run_operation(self, op_id: str, context: dict[str, Any]) -> dict[str, Any]:
            if not self._stub_mode:
                self.ensure_live_ready()
            handlers = self._hub_card.get("op_messages", {})
            if op_id in handlers:
                return {"ok": True, "message": handlers[op_id]}
            if op_id == "enter_provider_console":
                screen = self._entry.get("console_screen", "GLOBAL_LEDGER_HUB")
                return {"ok": True, "screen": screen}
            return {"ok": False, "message": f"Unsupported: {op_id}"}

        def hub_card(self, snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
            m = metrics_from_snapshot(snapshot)
            has_metrics = bool(m)
            balance = self._balance_from_metrics(m) if has_metrics else None
            if not balance and self._stub_mode:
                balance = self._hub_card.get("balance_summary_stub")
            status = self._resolve_status(m, has_metrics)
            detail = (
                self._hub_card.get("detail")
                if has_metrics or self._stub_mode
                else "Connect credentials in cfg/secrets.json or run with --stub"
            )
            return {
                "provider_id": pid,
                "title": self._entry.get("display_name", pid),
                "balance_summary": balance,
                "detail": detail,
                "status": m.get("status", "unknown") if has_metrics else ("active" if self._stub_mode else "unconfigured"),
                "status_badge": status,
                "cta": self._hub_card.get("cta", "OPEN CONSOLE"),
                "operations": self.supported_operations(),
            }

        def _balance_from_metrics(self, m: dict[str, Any]) -> str | None:
            if m.get("promo_balance") is not None:
                return format_usd(m["promo_balance"])
            if m.get("allowance_tokens"):
                return f"~{int(m['allowance_tokens']):,} Token Cap"
            if m.get("allowance_percent") is not None:
                return f"{m['allowance_percent']}% Rest (Locked)"
            if m.get("consumer_credits"):
                return f"{m['consumer_credits']:,} Consumer Credits"
            if m.get("compute_cpus"):
                return f"{m['compute_cpus']} Ampere CPUs · {m.get('compute_ram_gb', '?')} GB RAM"
            return None

        def _resolve_status(self, m: dict[str, Any], has_metrics: bool) -> str:
            if self._stub_mode and not has_metrics:
                return self._hub_card.get("status_badge_stub", "ACTIVE_FREE")
            if has_metrics:
                return status_badge(str(m.get("status", "active")))
            return "UNCONFIGURED"

    return BridgeImpl
