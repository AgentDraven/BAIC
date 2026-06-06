"""Hub and provider console services."""

from __future__ import annotations

from typing import Any

from db.models import MetricSnapshot
from db.ports import DatabasePort
from db.repository import EnatRepository

from core.provider_loader import ProviderRegistry


def _snap_to_dict(s: MetricSnapshot) -> dict[str, Any]:
    return {
        "tpm_usage": s.tpm_usage,
        "tpm_ceiling": s.tpm_ceiling,
        "accumulated_cost": s.accumulated_cost,
        "spend_cap": s.spend_cap,
        "promo_balance": s.promo_balance,
        "promo_expires": s.promo_expires,
        "allowance_percent": s.allowance_percent,
        "cpu_percent": s.cpu_percent,
        "memory_gb_free": s.memory_gb_free,
        "status": s.status,
        "hierarchy_path": s.hierarchy_path,
        "metrics_profile": s.metrics_profile,
    }


class HubService:
    def __init__(self, db: DatabasePort, registry: ProviderRegistry) -> None:
        self._db = db
        self._registry = registry

    def get_hub_summary(self) -> dict[str, Any]:
        with self._db.session() as session:
            repo = EnatRepository(session)
            metrics = repo.list_latest_metrics_by_provider()
            dirt = repo.list_dirt_events(limit=10)

        consumer_kinds = {"consumer_frontend"}
        providers_cfg = self._registry.all_provider_configs()

        consumer_cards: list[dict[str, Any]] = []
        infra_cards: list[dict[str, Any]] = []
        usd_liquidity = 0.0

        for pid in self._registry.list_ids():
            cfg = providers_cfg.get(pid, {})
            bridge = self._registry.get(pid)
            snap = metrics.get(pid)
            snap_dict = _snap_to_dict(snap) if snap else None
            card = bridge.hub_card(snap_dict)
            card["kind"] = cfg.get("kind", "hyperscaler")
            card["console_screen"] = cfg.get("console_screen", "GLOBAL_LEDGER_HUB")
            card["metrics_profile"] = cfg.get("metrics_profile", "token_and_promo_cash")

            if snap and snap.promo_balance:
                usd_liquidity += float(snap.promo_balance)

            if card["kind"] in consumer_kinds:
                consumer_cards.append(card)
            else:
                infra_cards.append(card)

        return {
            "portfolio_status": "ACTIVE ARBITRAGE",
            "global_runway_months": 14,
            "out_of_pocket_monthly": 19.99,
            "total_liquidity_usd": round(usd_liquidity, 2),
            "consumer_cards": consumer_cards,
            "infra_cards": infra_cards,
            "dirt_events": [{"level": e.level, "message": e.message} for e in dirt],
        }

    def get_provider_console(self, provider_id: str) -> dict[str, Any]:
        bridge = self._registry.get(provider_id)
        cfg = self._registry.provider_config(provider_id)

        with self._db.session() as session:
            repo = EnatRepository(session)
            entities = repo.list_providers_entities(provider_id)
            snap = repo.latest_metric(provider_id)
            snap_dict = _snap_to_dict(snap) if snap else None

        metrics = bridge.get_metrics(snap.hierarchy_path if snap else "", snap_dict)
        blocks = self._build_blocks(provider_id, cfg, entities, metrics)

        return {
            "provider_id": provider_id,
            "display_name": cfg.get("display_name", provider_id),
            "console_screen": cfg.get("console_screen"),
            "hierarchy": bridge.hierarchy_tiers(),
            "entities": [
                {"tier": e.tier, "name": e.name, "path": e.hierarchy_path, "parent": e.parent_path}
                for e in entities
            ],
            "metrics": metrics,
            "blocks": blocks,
            "operations": bridge.supported_operations(),
        }

    def _build_blocks(
        self,
        provider_id: str,
        cfg: dict[str, Any],
        entities: list[Any],
        metrics: dict[str, Any],
    ) -> list[dict[str, Any]]:
        if provider_id == "google_cloud":
            projects = [e.name for e in entities if e.tier == "project"]
            return [
                {
                    "id": "ai_studio",
                    "title": "BLOCK A: GOOGLE AI STUDIO (PUBLIC DEVELOPER SANDBOX)",
                    "status": "ACTIVE",
                    "projects": projects,
                    "tpm_ceiling": metrics.get("tpm_ceiling", 1_000_000),
                    "pricing_matrix": {
                        "gemini_2_5_flash_input": 0.30,
                        "gemini_2_5_flash_output": 2.50,
                        "gemini_2_5_pro_input": 1.25,
                        "gemini_2_5_pro_output": 10.00,
                    },
                },
                {
                    "id": "vertex_ai",
                    "title": "BLOCK B: GCP VERTEX AI (ENTERPRISE CORE POOL)",
                    "status": "ACTIVE",
                    "promo_pools": [
                        {"name": "MAIN POOL", "balance": metrics.get("promo_balance", 1000), "expires": metrics.get("promo_expires")},
                        {"name": "DEV CODE VOUCHER", "balance": 40.0, "expires": "2026-06-18"},
                    ],
                    "guardrails": {
                        "current_cost": metrics.get("accumulated_cost", 3.77),
                        "spend_cap": metrics.get("spend_cap", 15.0),
                        "auto_swap_at_tpm_pct": 95,
                    },
                },
            ]
        return [
            {
                "id": "default",
                "title": f"{cfg.get('display_name', provider_id)} Console",
                "metrics": metrics,
            }
        ]

    def run_operation(self, provider_id: str, op_id: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        bridge = self._registry.get(provider_id)
        result = bridge.run_operation(op_id, context or {})
        with self._db.session() as session:
            repo = EnatRepository(session)
            repo.add_dirt_event(f"[{provider_id}] operation {op_id}: {result.get('message', 'done')}")
            session.commit()
        return result
