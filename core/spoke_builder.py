"""Resolve spoke console blocks from cfg/spoke_console_layout.json + live metrics."""

from __future__ import annotations

from typing import Any

from core.config_loader import load_spoke_console_layout
from core.provenance import cfg_provenance, field, metric_provenance, provenance


def resolve_operations(
    provider_id: str,
    registry_entry: dict[str, Any],
    *,
    stub_mode: bool,
    has_metrics: bool,
    secrets_configured: bool,
) -> list[dict[str, Any]]:
    hub = registry_entry.get("hub_card", {})
    raw_ops = hub.get("operations", [])
    op_labels = hub.get("operation_labels", {})
    op_rules = hub.get("operation_visibility", {})
    out: list[dict[str, Any]] = []

    for op_id in raw_ops:
        rules = op_rules.get(op_id, ["always"])
        visible = _op_visible(rules, stub_mode=stub_mode, has_metrics=has_metrics, secrets_configured=secrets_configured)
        out.append(
            {
                "id": op_id,
                "label": op_labels.get(op_id, op_id.replace("_", " ").upper()),
                "visible": visible,
                "provenance": cfg_provenance(
                    "cfg/provider_registry.json",
                    f"Operation '{op_id}' declared under providers.{provider_id}.hub_card.operations.",
                    learn_more_url="BAIC docs/CONCEPTS_GUIDE.md#hub-operations",
                ),
            }
        )
    return [o for o in out if o["visible"]]


def _op_visible(rules: list[str], *, stub_mode: bool, has_metrics: bool, secrets_configured: bool) -> bool:
    if "never" in rules:
        return False
    if "always" in rules:
        return True
    ok = False
    if "stub_mode" in rules and stub_mode:
        ok = True
    if "has_metrics" in rules and has_metrics:
        ok = True
    if "secrets_configured" in rules and secrets_configured:
        ok = True
    if "live_only" in rules and not stub_mode and secrets_configured:
        ok = True
    return ok


def build_console_payload(
    provider_id: str,
    cfg: dict[str, Any],
    entities: list[Any],
    metrics: dict[str, Any],
    *,
    stub_mode: bool,
    has_snapshot: bool,
    secrets_configured: bool,
    operations: list[dict[str, Any]],
) -> dict[str, Any]:
    layout_doc = load_spoke_console_layout()
    screen = cfg.get("console_screen", "CONSUMER_CONSOLE")
    screen_layout = layout_doc.get("console_screens", {}).get(screen, {})
    templates = layout_doc.get("block_templates", {})

    mprov = metric_provenance(
        has_snapshot=has_snapshot,
        stub_mode=stub_mode,
        secrets_configured=secrets_configured,
    )

    projects = [e.name for e in entities if getattr(e, "tier", None) == "project"]
    active_project = projects[0] if projects else None
    if not active_project and metrics.get("hierarchy_path"):
        active_project = metrics["hierarchy_path"].split("/")[-1].replace("-", " ").title()

    route_label = "—"
    if active_project and metrics.get("promo_balance") is not None:
        route_label = f"{active_project} (VERTEX)"
    elif active_project:
        route_label = active_project
    elif stub_mode and provider_id == "google_cloud":
        route_label = "— (stub projects in entities only when seeded)"

    context = {
        "active_route": field(
            route_label,
            provenance(
                source="entities_or_metrics",
                summary="First project entity name, or last segment of hierarchy_path from metric_snapshots.",
                stored_in="provider_entities / metric_snapshots",
                input_ref="Provider sync or --stub seed",
                output_ref="Spoke header ACTIVE ROUTE",
            ),
        ),
        "interception_mode": field(
            "INLINE MIDDLEWARE LOCAL PIPELINE",
            cfg_provenance(
                "cfg/config.json",
                "Static routing label for BAIC local proxy layer (not a live cloud API field).",
            ),
        ),
    }

    promo_balance = metrics.get("promo_balance")
    promo_pools: list[dict[str, Any]] = []
    if promo_balance is not None:
        promo_pools.append(
            {
                "name": "MAIN POOL",
                "balance": field(promo_balance, mprov),
                "expires": field(metrics.get("promo_expires"), mprov),
            }
        )

    guardrails = {
        "current_cost": field(metrics.get("accumulated_cost") or 0.0, mprov),
        "spend_cap": field(metrics.get("spend_cap") or 15.0, mprov),
        "auto_swap_at_tpm_pct": field(95, cfg_provenance("cfg/spoke_console_layout.json", "Default guardrail from layout template.")),
        "label": field(route_label if route_label != "—" else cfg.get("display_name", provider_id), mprov),
    }

    block_data: dict[str, Any] = {
        "ai_studio": {
            "title": "BLOCK A: GOOGLE AI STUDIO (PUBLIC DEVELOPER SANDBOX)",
            "template": "ai_studio_sandbox",
            "projects": [field(p, mprov) for p in projects],
            "tpm_ceiling": field(metrics.get("tpm_ceiling") or (1_000_000 if stub_mode and has_snapshot else 0), mprov),
            "pricing_matrix": {},
            "status": "ACTIVE" if has_snapshot else "UNCONFIGURED",
        },
        "vertex_ai": {
            "title": f"BLOCK B: {cfg.get('display_name', provider_id).upper()} (ENTERPRISE CORE POOL)",
            "template": "promo_guardrails",
            "promo_pools": promo_pools,
            "guardrails": guardrails,
            "operations": operations,
            "status": "ACTIVE" if promo_balance is not None else "UNCONFIGURED",
        },
        "azure_core": {
            "title": f"BLOCK B: {cfg.get('display_name', provider_id).upper()}",
            "template": "promo_guardrails",
            "promo_pools": promo_pools,
            "guardrails": guardrails,
            "operations": operations,
            "status": "ACTIVE" if promo_balance is not None else "UNCONFIGURED",
        },
        "aws_core": {
            "title": f"BLOCK B: {cfg.get('display_name', provider_id).upper()}",
            "template": "promo_guardrails",
            "promo_pools": promo_pools,
            "guardrails": guardrails,
            "operations": operations,
            "status": "UNCLAIMED" if metrics.get("status") == "unclaimed" else ("ACTIVE" if has_snapshot else "UNCONFIGURED"),
        },
        "oci_core": {
            "title": "COMPUTE CAPACITY (ALWAYS FREE)",
            "template": "compute_capacity",
            "cpu_percent": field(metrics.get("cpu_percent"), mprov),
            "memory_gb_free": field(metrics.get("memory_gb_free"), mprov),
            "operations": operations,
        },
        "consumer": {
            "title": "CONSUMER SUBSCRIPTION",
            "template": "consumer_subscription",
            "allowance_summary": field(_consumer_allowance(metrics), mprov),
            "operations": operations,
        },
        "cost_gauge": {"template": "dual_axis_cost", "guardrails": guardrails},
        "capability_matrix": {
            "template": "pxm_matrix",
            "title": "BLOCK C: PLATFORM × MODEL MATRIX",
        },
    }

    blocks: list[dict[str, Any]] = []
    for spec in screen_layout.get("blocks", []):
        bid = spec["id"]
        if bid in block_data:
            blk = {"id": bid, **block_data[bid]}
            tmpl = templates.get(blk.get("template", ""), {})
            if "title" not in blk and tmpl.get("title"):
                blk["title"] = tmpl["title"]
            blocks.append(blk)

    header: list[dict[str, Any]] = []
    for h in screen_layout.get("header", []):
        bind = h.get("bind", "")
        ctx_key = bind.split(".")[-1] if "." in bind else bind
        ctx_val = context.get(ctx_key, field("—", cfg_provenance("cfg/spoke_console_layout.json", "Header binding missing")))
        header.append({"id": h["id"], "label": h["label"], "display": ctx_val})

    return {"context": context, "header": header, "blocks": blocks, "layout_screen": screen}


def _consumer_allowance(metrics: dict[str, Any]) -> str:
    if metrics.get("allowance_percent") is not None:
        return f"{metrics['allowance_percent']}% Rest (Locked)"
    if metrics.get("promo_balance"):
        return f"${metrics['promo_balance']:,.2f} balance"
    return "—"
