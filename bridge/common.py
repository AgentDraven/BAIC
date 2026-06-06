"""Shared bridge helpers."""

from __future__ import annotations

from typing import Any


def status_badge(status: str) -> str:
    mapping = {
        "active": "ACTIVE_FREE",
        "active_free": "ACTIVE_FREE",
        "ready": "ACTIVE_FREE",
        "canceled_active": "CANCELED_ACTIVE",
        "unclaimed": "UNCLAIMED",
        "idle": "UNCLAIMED",
    }
    return mapping.get(status.lower(), "UNCLAIMED")


def format_usd(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"${value:,.2f}"


def metrics_from_snapshot(snapshot: dict[str, Any] | None) -> dict[str, Any]:
    if not snapshot:
        return {}
    return {
        "tpm_usage": snapshot.get("tpm_usage"),
        "tpm_ceiling": snapshot.get("tpm_ceiling"),
        "accumulated_cost": snapshot.get("accumulated_cost"),
        "spend_cap": snapshot.get("spend_cap"),
        "promo_balance": snapshot.get("promo_balance"),
        "promo_expires": snapshot.get("promo_expires"),
        "allowance_percent": snapshot.get("allowance_percent"),
        "cpu_percent": snapshot.get("cpu_percent"),
        "memory_gb_free": snapshot.get("memory_gb_free"),
        "status": snapshot.get("status", "unknown"),
    }
