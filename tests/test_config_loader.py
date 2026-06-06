"""Unit tests — config loader."""

import pytest
from core.config_loader import AppConfig, load_provider_registry
from core.error_codes import BaicError


def test_load_app_config():
    cfg = AppConfig.load()
    assert cfg.database.engine == "sqlite"
    assert cfg.api_port > 0


def test_load_provider_registry():
    reg = load_provider_registry()
    assert "providers" in reg
    assert "google_cloud" in reg["providers"]


def test_missing_config_raises(tmp_path):
    with pytest.raises(BaicError):
        AppConfig.load(tmp_path / "missing.json")
