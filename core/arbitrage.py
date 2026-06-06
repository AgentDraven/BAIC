"""Quota routing and token estimation (Loop A reference)."""

from __future__ import annotations

from typing import Any

GEMINI_FLASH_IN = 0.30 / 1_000_000
GEMINI_FLASH_OUT = 2.50 / 1_000_000


def estimate_tokens(text: str) -> int:
    """Lightweight pre-flight token weight (Alpha heuristic)."""
    return max(1, len(text) // 4)


def estimate_cost(input_tokens: int, output_tokens: int = 0) -> float:
    return (input_tokens * GEMINI_FLASH_IN) + (output_tokens * GEMINI_FLASH_OUT)


def evaluate_route(
    tpm_usage: int,
    tpm_ceiling: int,
    accumulated_cost: float,
    spend_cap: float,
    estimated_tokens: int,
) -> dict[str, Any]:
    projected_cost = accumulated_cost + estimate_cost(estimated_tokens)
    if projected_cost >= spend_cap:
        return {"action": "freeze", "reason": "spend_cap", "projected_cost": projected_cost}
    if tpm_ceiling and (tpm_usage + estimated_tokens) >= int(0.95 * tpm_ceiling):
        return {"action": "swap", "reason": "tpm_95pct", "rolling_tpm": tpm_usage + estimated_tokens}
    return {"action": "forward", "projected_cost": projected_cost}
