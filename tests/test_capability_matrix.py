"""P×M capability matrix tests."""

from core.capability_service import CapabilityService


def test_load_matrix(repo_root):
    svc = CapabilityService()
    matrix = svc.full_matrix()
    assert "model_catalog" in matrix
    assert "platforms" in matrix
    assert "google_cloud" in matrix["platforms"]


def test_model_families():
    svc = CapabilityService()
    families = svc.model_families()
    assert any(f["family"] == "google" for f in families)


def test_routing_platforms():
    svc = CapabilityService()
    platforms = svc.models_for_routing("gemini-2.5-flash")
    assert "google_cloud" in platforms


def test_api_matrix(client):
    r = client.get("/api/v1/capability/matrix")
    assert r.status_code == 200
    assert "platforms" in r.json()
