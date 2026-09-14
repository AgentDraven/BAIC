from fastapi.testclient import TestClient


def test_committed_local_action_is_recorded_without_api_call(client: TestClient):
    payload = {
        "event_type": "usage.refresh",
        "event_id": "usage.refresh:local-1",
        "utility_id": "baic",
        "quantity": 1,
        "transport": "local",
        "api_call_made": False,
        "outcome": "committed",
        "cost_usd": 0,
        "cost_source": "local",
    }
    response = client.post("/api/v1/actions", json=payload)
    assert response.status_code == 200
    events = client.get("/api/v1/actions").json()["events"]
    assert events[0]["event_type"] == "usage.refresh"
    assert events[0]["api_call_made"] is False
    assert events[0]["transport"] == "local"


def test_action_rejects_inconsistent_transport(client: TestClient):
    response = client.post("/api/v1/actions", json={
        "event_type": "usage.refresh", "event_id": "bad-1", "utility_id": "baic",
        "transport": "none", "api_call_made": True,
    })
    assert response.status_code == 422
