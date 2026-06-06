"""Stub mode tests (MERIT §II.G)."""


def test_health_stub_flag(client):
    r = client.get("/api/v1/health")
    assert r.json()["stub_mode"] is True


def test_live_health_no_stub(client_live):
    r = client_live.get("/api/v1/health")
    assert r.json()["stub_mode"] is False


def test_proxy_live_without_secrets_fails(client_live):
    r = client_live.post(
        "/api/v1/proxy/google_cloud/completions",
        json={"prompt": "test", "model": "gemini-2.5-flash"},
    )
    assert r.status_code == 400


def test_proxy_stub_succeeds(client):
    r = client.post(
        "/api/v1/proxy/google_cloud/completions",
        json={"prompt": "test", "model": "gemini-2.5-flash"},
    )
    assert r.status_code == 200
    assert r.json()["result"].get("stub") is True


def test_stub_manifest_in_xray(client):
    r = client.get("/api/v1/xray/runtime")
    assert r.status_code == 200
    body = r.json()
    assert body["stub_mode"] is True
    assert "stub_manifest" in body
    assert body["stub_manifest"].get("stub_mode") is True
