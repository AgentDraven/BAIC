"""Shared factory for direct LLM API bridges (kind: llm_api)."""

from __future__ import annotations

from typing import Any

from bridge.base import ProviderBridge
from bridge.common import status_badge


def make_llm_api_bridge(provider_id: str) -> type[ProviderBridge]:
    pid = provider_id

    class LlmApiBridge(ProviderBridge):
        provider_id = pid

        def load_config(self, registry_entry: dict[str, Any], secrets: dict[str, Any]) -> None:
            self._entry = registry_entry
            self._secrets = secrets
            self._hub_card = dict(registry_entry.get("hub_card", {}))
            self._models = list(registry_entry.get("models", []))
            self._default_model = registry_entry.get(
                "default_model",
                self._models[0] if self._models else "",
            )

        def hierarchy_tiers(self) -> list[str]:
            return list(self._entry.get("hierarchy", ["byok"]))

        def get_metrics(
            self,
            hierarchy_path: str,
            snapshot: dict[str, Any] | None = None,
        ) -> dict[str, Any]:
            configured = self.secrets_configured()
            status = "active" if configured or self._stub_mode else "unconfigured"
            return {
                "status": status,
                "status_badge": status_badge(status),
                "api_base": self._entry.get("api_base", ""),
                "models": self._models,
                "routing_mode": "direct_api",
            }

        def forward_request(self, hierarchy_path: str, payload: dict[str, Any]) -> dict[str, Any]:
            model = payload.get("model") or self._default_model
            if self._stub_mode:
                tokens = len(str(payload.get("prompt", ""))) // 4
                return {
                    "provider_id": pid,
                    "hierarchy_path": hierarchy_path or "byok/default",
                    "estimated_tokens": tokens,
                    "routed": True,
                    "stub": True,
                    "model": model,
                    "api_base": self._entry.get("api_base", ""),
                }
            self.ensure_live_ready()
            tokens = len(str(payload.get("prompt", ""))) // 4
            return {
                "provider_id": pid,
                "hierarchy_path": hierarchy_path or "byok/default",
                "estimated_tokens": tokens,
                "routed": True,
                "model": model,
                "api_base": self._entry.get("api_base", ""),
            }

        def supported_operations(self) -> list[str]:
            return list(self._hub_card.get("operations", ["enter_provider_console"]))

        def run_operation(self, op_id: str, context: dict[str, Any]) -> dict[str, Any]:
            if not self._stub_mode:
                self.ensure_live_ready()
            if op_id == "enter_provider_console":
                screen = self._entry.get("console_screen", "LLM_API_CONSOLE")
                return {"ok": True, "screen": screen}
            handlers = self._hub_card.get("op_messages", {})
            if op_id in handlers:
                return {"ok": True, "message": handlers[op_id]}
            return {"ok": False, "message": f"Unsupported: {op_id}"}

        def hub_card(self, snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
            configured = self.secrets_configured()
            detail = (
                self._hub_card.get("detail")
                if configured or self._stub_mode
                else "Set API key in cfg/secrets.json or .env.local"
            )
            balance = self._hub_card.get("balance_summary_stub") if self._stub_mode else None
            if configured and not balance:
                balance = "Pay-as-you-go (BYOK)"
            status = "active" if configured or self._stub_mode else "unconfigured"
            return {
                "provider_id": pid,
                "title": self._entry.get("display_name", pid),
                "balance_summary": balance,
                "detail": detail,
                "status": status,
                "status_badge": status_badge(status),
                "cta": self._hub_card.get("cta", "CONFIGURE API KEY"),
                "operations": self.supported_operations(),
                "models": self._models,
            }

    return LlmApiBridge
