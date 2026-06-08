"""Unit tests — bridge layer."""

import pytest
from bridge.google import GoogleBridge
from core.config_loader import load_provider_registry
from core.error_codes import BaicError
from core.provider_loader import ProviderRegistry


def test_google_bridge_operations():
    reg = load_provider_registry()
    bridge = GoogleBridge()
    bridge.set_stub_mode(True)
    bridge.load_config(reg["providers"]["google_cloud"], {})
    assert "enter_provider_console" in bridge.supported_operations()
    result = bridge.run_operation("claim_dev_voucher", {})
    assert result["ok"] is True


def test_registry_loads_all_enabled():
    registry = ProviderRegistry(load_provider_registry())
    ids = registry.list_ids()
    assert "google_cloud" in ids
    assert "cursor_pro" in ids
    assert len(ids) >= 11


def test_registry_missing_provider():
    registry = ProviderRegistry(load_provider_registry())
    with pytest.raises(BaicError):
        registry.get("nonexistent_provider")


def test_llm_api_bridge_loads():
    reg = load_provider_registry()
    registry = ProviderRegistry(reg, stub_mode=True)
    for pid in ("groq", "openai", "gemini", "anthropic"):
        bridge = registry.get(pid)
        cfg = reg["providers"][pid]
        assert cfg["kind"] == "llm_api"
        assert bridge.hierarchy_tiers() == ["byok"]
        result = bridge.forward_request("byok/default", {"prompt": "hello", "model": cfg["models"][0]})
        assert result.get("stub") is True
        assert result.get("routed") is True
