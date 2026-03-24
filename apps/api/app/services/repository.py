from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.domain import CheckResult, Incident, IncidentState, Monitor, MonitorCreate, MonitorStatus


class InMemoryRepository:
    def __init__(self) -> None:
        self.monitors: dict[str, Monitor] = {}
        self.incidents: dict[str, Incident] = {}
        self.results: dict[str, list[CheckResult]] = defaultdict(list)

    def reset(self) -> None:
        self.monitors.clear()
        self.incidents.clear()
        self.results.clear()

    def create_monitor(self, payload: MonitorCreate) -> Monitor:
        now = datetime.now(timezone.utc)
        monitor = Monitor(
            **payload.model_dump(),
            next_check_at=now,
            created_at=now,
            updated_at=now,
        )
        self.monitors[monitor.monitor_id] = monitor
        return monitor

    def list_monitors(self) -> list[Monitor]:
        return sorted(self.monitors.values(), key=lambda item: item.created_at, reverse=True)

    def get_monitor(self, monitor_id: str) -> Monitor | None:
        return self.monitors.get(monitor_id)

    def set_monitor_status(self, monitor_id: str, status: MonitorStatus) -> Monitor | None:
        monitor = self.monitors.get(monitor_id)
        if monitor is None:
            return None

        monitor.status = status
        monitor.updated_at = datetime.now(timezone.utc)
        return monitor

    def list_due_monitors(self, now: datetime | None = None) -> list[Monitor]:
        current_time = now or datetime.now(timezone.utc)
        due = [
            monitor
            for monitor in self.monitors.values()
            if monitor.status == MonitorStatus.ACTIVE and monitor.next_check_at <= current_time
        ]
        return sorted(due, key=lambda item: item.next_check_at)

    def advance_next_check(self, monitor_id: str) -> Monitor | None:
        monitor = self.monitors.get(monitor_id)
        if monitor is None:
            return None

        current_time = datetime.now(timezone.utc)
        monitor.next_check_at = current_time + timedelta(minutes=monitor.interval_minutes)
        monitor.updated_at = current_time
        return monitor

    def save_check_result(self, result: CheckResult) -> CheckResult:
        self.results[result.monitor_id].append(result)
        self.results[result.monitor_id].sort(key=lambda item: item.checked_at, reverse=True)
        return result

    def list_check_results(self, monitor_id: str, limit: int = 20) -> list[CheckResult]:
        return self.results.get(monitor_id, [])[:limit]

    def list_incidents(self) -> list[Incident]:
        return sorted(self.incidents.values(), key=lambda item: item.opened_at, reverse=True)

    def get_open_incident(self, monitor_id: str) -> Incident | None:
        for incident in self.incidents.values():
            if incident.monitor_id == monitor_id and incident.state == IncidentState.OPEN:
                return incident
        return None

    def open_incident(self, incident: Incident) -> Incident:
        self.incidents[incident.incident_id] = incident
        return incident

    def resolve_incident(self, incident_id: str) -> Incident | None:
        incident = self.incidents.get(incident_id)
        if incident is None:
            return None

        incident.state = IncidentState.RESOLVED
        incident.resolved_at = datetime.now(timezone.utc)
        return incident


repository = InMemoryRepository()
