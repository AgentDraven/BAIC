"""Hub and provider console services."""

from __future__ import annotations

from typing import Any

from db.models import MetricSnapshot
from db.ports import DatabasePort
from db.repository import EnatRepository

from core.config_loader import AppConfig
from core.provenance import cfg_provenance, field, metric_provenance, provenance
from core.provider_loader import ProviderRegistry
from core.spoke_builder import build_console_payload, resolve_operations


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
    def __init__(
        self,
        db: DatabasePort,
        registry: ProviderRegistry,
        config: AppConfig | None = None,
    ) -> None:
        self._db = db
        self._registry = registry
        self._config = config
        self._hub_cfg = config.hub_defaults() if config else {}

    def get_hub_summary(self) -> dict[str, Any]:
        with self._db.session() as session:
            repo = EnatRepository(session)
            metrics = repo.list_latest_metrics_by_provider()
            dirt = repo.list_dirt_events(limit=10)

        consumer_kinds = {"consumer_frontend"}
        providers_cfg = self._registry.all_provider_configs()
        stub = self._registry.stub_mode
        stub_demo = self._hub_cfg.get("stub_demo", {})

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
            card["provenance"] = metric_provenance(
                has_snapshot=snap is not None,
                stub_mode=stub,
                secrets_configured=bridge.secrets_configured(),
            )

            if snap and snap.promo_balance:
                usd_liquidity += float(snap.promo_balance)

            if card["kind"] in consumer_kinds:
                consumer_cards.append(card)
            else:
                infra_cards.append(card)

        status_key = "portfolio_status_stub" if stub else "portfolio_status_live"
        default_status = "ACTIVE ARBITRAGE (STUB)" if stub else "AWAITING LIVE METRICS"

        if stub:
            global_runway = stub_demo.get("global_runway_months")
            out_of_pocket = float(stub_demo.get("out_of_pocket_monthly", 0))
            kpi_prov = cfg_provenance(
                "cfg/config.json",
                "Demo KPI from hub.stub_demo — only when BAIC runs with --stub.",
            )
        else:
            global_runway = None
            out_of_pocket = 0.0
            kpi_prov = provenance(
                source="computed",
                summary="Sum of promo_balance from metric_snapshots rows (local SQLite). Zero until live sync.",
                stored_in="sqlite://metric_snapshots",
                output_ref="TOTAL ACTIVE LIQUIDITY KPI",
            )

        return {
            "portfolio_status": self._hub_cfg.get(status_key, default_status),
            "global_runway_months": field(global_runway, kpi_prov if stub else cfg_provenance("cfg/config.json", "Runway requires live billing sync (not implemented).")),
            "out_of_pocket_monthly": field(out_of_pocket, kpi_prov if stub else provenance(source="computed", summary="Sum of consumer subscription costs from DB (not implemented).", stored_in="—")),
            "total_liquidity_usd": field(round(usd_liquidity, 2), kpi_prov if stub else provenance(
                source="sqlite_snapshot",
                summary="Sum of promo_balance across infra providers in metric_snapshots.",
                stored_in="sqlite://metric_snapshots",
                feeds="Hub KPI strip",
                extra={"stale_seed_warning": not stub and usd_liquidity > 0},
            )),
            "consumer_cards": consumer_cards,
            "infra_cards": infra_cards,
            "dirt_events": [{"level": e.level, "message": e.message} for e in dirt],
            "stub_mode": stub,
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
        has_snapshot = snap is not None
        secrets_ok = bridge.secrets_configured()
        operations = resolve_operations(
            provider_id,
            cfg,
            stub_mode=self._registry.stub_mode,
            has_metrics=has_snapshot,
            secrets_configured=secrets_ok,
        )
        spoke = build_console_payload(
            provider_id,
            cfg,
            entities,
            metrics,
            stub_mode=self._registry.stub_mode,
            has_snapshot=has_snapshot,
            secrets_configured=secrets_ok,
            operations=operations,
        )

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
            "metrics_provenance": metric_provenance(
                has_snapshot=has_snapshot,
                stub_mode=self._registry.stub_mode,
                secrets_configured=secrets_ok,
            ),
            "header": spoke["header"],
            "context": spoke["context"],
            "blocks": spoke["blocks"],
            "layout_screen": spoke["layout_screen"],
            "operations": [o["id"] for o in operations],
            "operation_details": operations,
        }

    def run_operation(self, provider_id: str, op_id: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        bridge = self._registry.get(provider_id)
        result = bridge.run_operation(op_id, context or {})
        with self._db.session() as session:
            repo = EnatRepository(session)
            repo.add_dirt_event(f"[{provider_id}] operation {op_id}: {result.get('message', 'done')}")
            session.commit()
        return result
