"""Config scaffold validator tests."""

from core.config_scaffold import validate_scaffold


def test_scaffold_ok(repo_root):
    report = validate_scaffold(repo_root)
    assert report.ok, report.errors


def test_scaffold_has_env_keys(repo_root):
    report = validate_scaffold(repo_root)
    assert report.ok
    assert not any("GOOGLE_APPLICATION_CREDENTIALS" in e for e in report.errors)
