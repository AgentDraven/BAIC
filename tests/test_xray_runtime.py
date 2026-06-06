"""X-Ray runtime API tests."""


def test_xray_runtime_shape(client):
    r = client.get("/api/v1/xray/runtime")
    assert r.status_code == 200
    body = r.json()
    assert "dashboard_events" in body
    assert "request_events" in body
    assert "logs" in body


def test_xray_post_event(client):
    r = client.post("/api/v1/xray/event", json={"level": "DEBUG", "message": "ui trace"})
    assert r.status_code == 200
    runtime = client.get("/api/v1/xray/runtime").json()
    messages = [e["message"] for e in runtime["dashboard_events"]]
    assert "ui trace" in messages


def test_http_logged(client):
    client.get("/api/v1/health")
    runtime = client.get("/api/v1/xray/runtime").json()
    assert any("GET" in e.get("message", "") for e in runtime["request_events"])
