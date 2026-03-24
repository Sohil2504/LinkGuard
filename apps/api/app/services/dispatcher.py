from app.domain import CheckJob, Monitor
from app.services.repository import repository


def list_due_monitor_jobs() -> list[CheckJob]:
    due_monitors: list[Monitor] = repository.list_due_monitors()
    return [
        CheckJob(
            monitor_id=monitor.monitor_id,
            target_url=str(monitor.target_url),
            timeout_seconds=monitor.timeout_seconds,
            expected_status_code=monitor.expected_status_code,
            expected_substring=monitor.expected_substring,
        )
        for monitor in due_monitors
    ]
