import httpx
from fastapi.testclient import TestClient

from app.services import checker


class FakeClient:
    def __init__(self, status_code: int, body: str) -> None:
        self.response = httpx.Response(status_code=status_code, text=body)

    def __enter__(self) -> "FakeClient":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None

    def get(self, url: str) -> httpx.Response:
        return self.response


def create_monitor(client: TestClient) -> str:
    response = client.post(
        "/monitors",
        json={
            "name": "Booking page",
            "target_url": "https://example.com/book",
            "interval_minutes": 5,
            "timeout_seconds": 10,
            "expected_status_code": 200,
            "expected_substring": "Book now",
        },
    )
    assert response.status_code == 201
    return response.json()["monitor_id"]


def test_incident_opens_after_two_failures_and_resolves_after_two_successes(
    client: TestClient,
    monkeypatch,
) -> None:
    monitor_id = create_monitor(client)

    def failing_client(timeout_seconds: int) -> FakeClient:
        return FakeClient(status_code=503, body="temporarily unavailable")

    monkeypatch.setattr(checker, "build_http_client", failing_client)

    first_failure = client.post(f"/monitors/{monitor_id}/run-check")
    second_failure = client.post(f"/monitors/{monitor_id}/run-check")

    assert first_failure.status_code == 200
    assert first_failure.json()["incident_action"] == "none"
    assert second_failure.status_code == 200
    assert second_failure.json()["incident_action"] == "opened"

    incidents_after_failures = client.get("/incidents")
    assert incidents_after_failures.status_code == 200
    assert len(incidents_after_failures.json()) == 1
    assert incidents_after_failures.json()[0]["state"] == "open"

    def healthy_client(timeout_seconds: int) -> FakeClient:
        return FakeClient(status_code=200, body="Book now")

    monkeypatch.setattr(checker, "build_http_client", healthy_client)

    first_success = client.post(f"/monitors/{monitor_id}/run-check")
    second_success = client.post(f"/monitors/{monitor_id}/run-check")

    assert first_success.status_code == 200
    assert first_success.json()["incident_action"] == "updated"
    assert second_success.status_code == 200
    assert second_success.json()["incident_action"] == "resolved"
    assert second_success.json()["active_incident"] is None

    incidents_after_recovery = client.get("/incidents")
    assert incidents_after_recovery.status_code == 200
    assert incidents_after_recovery.json()[0]["state"] == "resolved"
