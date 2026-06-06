"""Unit tests — arbitrage engine."""

from core.arbitrage import estimate_cost, estimate_tokens, evaluate_route


def test_estimate_tokens():
    assert estimate_tokens("hello world") >= 2


def test_evaluate_forward():
    d = evaluate_route(100, 1_000_000, 1.0, 15.0, 50)
    assert d["action"] == "forward"


def test_evaluate_swap_at_95pct():
    d = evaluate_route(960_000, 1_000_000, 1.0, 15.0, 50_000)
    assert d["action"] == "swap"


def test_evaluate_freeze_spend_cap():
    d = evaluate_route(0, 1_000_000, 14.9, 15.0, 400_000)
    assert d["action"] == "freeze"


def test_estimate_cost_positive():
    assert estimate_cost(1_000_000) > 0
