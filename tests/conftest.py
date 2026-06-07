"""Pytest fixtures."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from core.api.app import create_app
from core.config_loader import AppConfig
from core.path_resolver import get_repo_root, reset_repo_root_cache
from db.sqlite_backend import SQLiteBackend
from fastapi.testclient import TestClient


@pytest.fixture
def repo_root() -> Path:
    reset_repo_root_cache()
    return get_repo_root()


@pytest.fixture
def temp_config(tmp_path: Path, repo_root: Path) -> AppConfig:
    cfg_dir = tmp_path / "cfg"
    cfg_dir.mkdir()
    out_dir = tmp_path / "output"
    out_dir.mkdir()
    (tmp_path / "VERSION").write_text("0.0.0-test\n", encoding="utf-8")
    config = {
        "app_name": "BAIC Test",
        "api": {"host": "127.0.0.1", "port": 8765},
        "database": {"engine": "sqlite", "path": str(out_dir / "test.db"), "echo": False},
        "hub": {
            "portfolio_status_live": "AWAITING LIVE METRICS",
            "portfolio_status_stub": "ACTIVE ARBITRAGE (STUB)",
            "stub_demo": {"global_runway_months": 14, "out_of_pocket_monthly": 19.99},
        },
        "branding": {},
    }
    (cfg_dir / "config.json").write_text(json.dumps(config), encoding="utf-8")
    registry_src = repo_root / "cfg" / "provider_registry.json"
    (cfg_dir / "provider_registry.json").write_text(registry_src.read_text(encoding="utf-8"), encoding="utf-8")
    spoke_src = repo_root / "cfg" / "spoke_console_layout.json"
    if spoke_src.is_file():
        (cfg_dir / "spoke_console_layout.json").write_text(spoke_src.read_text(encoding="utf-8"), encoding="utf-8")
    matrix_src = repo_root / "cfg" / "model_capability_matrix.json"
    if matrix_src.is_file():
        (cfg_dir / "model_capability_matrix.json").write_text(matrix_src.read_text(encoding="utf-8"), encoding="utf-8")

    import core.path_resolver as pr

    old_root = pr._REPO_ROOT
    pr._REPO_ROOT = tmp_path
    cl_cfg = AppConfig.load(cfg_dir / "config.json")
    yield cl_cfg
    pr._REPO_ROOT = old_root
    reset_repo_root_cache()


@pytest.fixture
def temp_config_stub(temp_config: AppConfig) -> AppConfig:
    return temp_config


@pytest.fixture
def test_db(temp_config: AppConfig) -> SQLiteBackend:
    db = SQLiteBackend(temp_config, stub_mode=False)
    db.initialize()
    yield db
    db.dispose()


@pytest.fixture
def test_db_stub(temp_config: AppConfig) -> SQLiteBackend:
    db = SQLiteBackend(temp_config, stub_mode=True)
    db.initialize()
    yield db
    db.dispose()


@pytest.fixture
def client(temp_config: AppConfig, test_db_stub: SQLiteBackend) -> TestClient:
    app = create_app(temp_config, test_db_stub, stub_mode=True)
    return TestClient(app)


@pytest.fixture
def client_live(temp_config: AppConfig, test_db: SQLiteBackend) -> TestClient:
    app = create_app(temp_config, test_db, stub_mode=False)
    return TestClient(app)
