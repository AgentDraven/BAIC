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
    assert body["portfolio_status"] == "ACTIVE ARBITRAGE (STUB)"
    assert body["stub_mode"] is True
    assert body["global_runway_months"]["value"] == 14
    assert len(body["consumer_cards"]) >= 3
    assert len(body["infra_cards"]) >= 4
    assert len(body["dirt_events"]) >= 1


def test_hub_summary_live_no_demo_kpis(client_live):
    r = client_live.get("/api/v1/hub/summary")
    assert r.status_code == 200
    body = r.json()
    assert body["stub_mode"] is False
    assert body["global_runway_months"]["value"] is None
    assert body["out_of_pocket_monthly"]["value"] == 0.0
    assert body["portfolio_status"] == "AWAITING LIVE METRICS"


def test_azure_console_uses_spoke_layout(client):
    r = client.get("/api/v1/providers/microsoft_azure/console")
    assert r.status_code == 200
    body = r.json()
    assert body["layout_screen"] == "AZURE_CONSOLE"
    block_ids = [b["id"] for b in body["blocks"]]
    assert "azure_core" in block_ids
    assert "capability_matrix" in block_ids
    assert body["header"]
    assert "operation_details" in body


def test_google_console(client):
    r = client.get("/api/v1/providers/google_cloud/console")
    assert r.status_code == 200
    body = r.json()
    assert body["provider_id"] == "google_cloud"
    assert len(body["blocks"]) >= 2
    assert body["blocks"][0]["id"] == "ai_studio"
    block_ids = [b["id"] for b in body["blocks"]]
    assert "vertex_ai" in block_ids
    assert "capability_matrix" in block_ids
    assert body.get("header")


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
