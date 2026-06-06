"""Integration tests — FastAPI control plane API."""

def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["database"]["engine"] == "sqlite"


def test_hub_summary(client):
    r = client.get("/api/v1/hub/summary")
    assert r.status_code == 200
    body = r.json()
    assert body["portfolio_status"] == "ACTIVE ARBITRAGE"
    assert len(body["consumer_cards"]) >= 3
    assert len(body["infra_cards"]) >= 4
    assert len(body["dirt_events"]) >= 1


def test_google_console(client):
    r = client.get("/api/v1/providers/google_cloud/console")
    assert r.status_code == 200
    body = r.json()
    assert body["provider_id"] == "google_cloud"
    assert len(body["blocks"]) == 2
    assert body["blocks"][0]["id"] == "ai_studio"
    assert body["blocks"][1]["id"] == "vertex_ai"


def test_run_operation(client):
    r = client.post("/api/v1/providers/cursor_pro/operations/troubleshoot_sync", json={"context": {}})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_proxy_completion(client):
    r = client.post(
        "/api/v1/proxy/google_cloud/completions",
        json={"prompt": "Explain token arbitrage", "model": "gemini-2.5-flash"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "decision" in body
    assert body["result"]["routed"] is True


def test_admin_providers(client):
    r = client.get("/api/v1/admin/providers")
    assert r.status_code == 200
    assert "google_cloud" in r.json()["providers"]
