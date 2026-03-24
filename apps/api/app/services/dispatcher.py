from app.domain import Monitor
from app.services.repository import repository


def list_due_monitor_jobs() -> list[dict[str, str]]:
    due_monitors: list[Monitor] = repository.list_due_monitors()
    return [
        {
            "job_type": "http_check",
            "monitor_id": monitor.monitor_id,
            "target_url": str(monitor.target_url),
        }
        for monitor in due_monitors
    ]
