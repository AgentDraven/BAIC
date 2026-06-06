"""Unit tests — bridge layer."""

import pytest
from bridge.google import GoogleBridge
from core.config_loader import load_provider_registry
from core.error_codes import BaicError
from core.provider_loader import ProviderRegistry


def test_google_bridge_operations():
    reg = load_provider_registry()
    bridge = GoogleBridge()
    bridge.load_config(reg["providers"]["google_cloud"], {})
    assert "enter_provider_console" in bridge.supported_operations()
    result = bridge.run_operation("claim_dev_voucher", {})
    assert result["ok"] is True


def test_registry_loads_all_enabled():
    registry = ProviderRegistry(load_provider_registry())
    ids = registry.list_ids()
    assert "google_cloud" in ids
    assert "cursor_pro" in ids
    assert len(ids) >= 7


def test_registry_missing_provider():
    registry = ProviderRegistry(load_provider_registry())
    with pytest.raises(BaicError):
        registry.get("nonexistent_provider")
