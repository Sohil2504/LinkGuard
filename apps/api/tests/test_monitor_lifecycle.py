from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.domain import MonitorStatus
from app.services.repository import repository


def create_monitor(client: TestClient) -> str:
    response = client.post(
        "/monitors",
        json={
            "name": "Checkout page",
            "target_url": "https://example.com/checkout",
            "interval_minutes": 5,
            "timeout_seconds": 10,
            "expected_status_code": 200,
            "expected_substring": "Checkout",
            "alert_email": "ops@example.com",
        },
    )
    assert response.status_code == 201
    return response.json()["monitor_id"]


def test_create_and_pause_resume_monitor(client: TestClient) -> None:
    monitor_id = create_monitor(client)

    created = client.get(f"/monitors/{monitor_id}")
    paused = client.post(f"/monitors/{monitor_id}/pause")
    resumed = client.post(f"/monitors/{monitor_id}/resume")

    assert created.status_code == 200
    assert paused.status_code == 200
    assert paused.json()["status"] == "paused"
    assert resumed.status_code == 200
    assert resumed.json()["status"] == "active"


def test_dispatch_due_jobs_excludes_paused_monitors(client: TestClient) -> None:
    due_monitor_id = create_monitor(client)
    paused_monitor_id = create_monitor(client)

    repository.set_monitor_status(paused_monitor_id, status=MonitorStatus.PAUSED)
    repository.monitors[due_monitor_id].next_check_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    repository.monitors[paused_monitor_id].next_check_at = datetime.now(timezone.utc) - timedelta(minutes=1)

    response = client.get("/dispatch/due-jobs")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["monitor_id"] == due_monitor_id
