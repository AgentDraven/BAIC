"""Quota routing and token estimation (Loop A reference)."""

from __future__ import annotations

from typing import Any

from core.config_loader import load_capability_matrix


def estimate_tokens(text: str) -> int:
    """Lightweight pre-flight token weight (Alpha heuristic)."""
    return max(1, len(text) // 4)


def _pricing_from_matrix(model_id: str) -> tuple[float, float]:
    """Return (input_per_token, output_per_token) from cfg matrix pricing_ref if present."""
    try:
        matrix = load_capability_matrix()
        catalog = matrix.get("model_catalog", {}).get(model_id, {})
        ref = catalog.get("pricing_ref", "")
        # Defaults from cfg hub pricing table when added; fallback zeros for live
        defaults = matrix.get("metadata", {}).get("pricing_defaults", {})
        flash = defaults.get("gemini-2.5-flash", {"input": 0.30e-6, "output": 2.50e-6})
        if "gemini" in model_id or "google" in ref:
            return float(flash.get("input", 0.30e-6)), float(flash.get("output", 2.50e-6))
    except Exception:
        pass
    return 0.30e-6, 2.50e-6


def estimate_cost(input_tokens: int, output_tokens: int = 0, model_id: str = "gemini-2.5-flash") -> float:
    rate_in, rate_out = _pricing_from_matrix(model_id)
    return (input_tokens * rate_in) + (output_tokens * rate_out)


def evaluate_route(
    tpm_usage: int,
    tpm_ceiling: int,
    accumulated_cost: float,
    spend_cap: float,
    estimated_tokens: int,
    model_id: str = "gemini-2.5-flash",
) -> dict[str, Any]:
    projected_cost = accumulated_cost + estimate_cost(estimated_tokens, model_id=model_id)
    if spend_cap and projected_cost >= spend_cap:
        return {"action": "freeze", "reason": "spend_cap", "projected_cost": projected_cost}
    if tpm_ceiling and (tpm_usage + estimated_tokens) >= int(0.95 * tpm_ceiling):
        return {"action": "swap", "reason": "tpm_95pct", "rolling_tpm": tpm_usage + estimated_tokens}
    platforms = []
    try:
        from core.capability_service import CapabilityService

        platforms = CapabilityService().models_for_routing(model_id)
    except Exception:
        pass
    return {"action": "forward", "projected_cost": projected_cost, "platforms": platforms}
