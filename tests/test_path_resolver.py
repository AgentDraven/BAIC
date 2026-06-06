"""Unit tests — path resolver."""

from core.path_resolver import cfg_path, get_repo_root


def test_repo_root_has_version_and_cfg():
    root = get_repo_root()
    assert (root / "VERSION").is_file()
    assert (root / "cfg" / "config.json").is_file()


def test_cfg_path_provider_registry():
    path = cfg_path("provider_registry.json")
    assert path.name == "provider_registry.json"
    assert path.is_file()
