from collections import defaultdict
from datetime import UTC, datetime, timedelta

from app.domain import Incident, IncidentState, Monitor, MonitorCreate


class InMemoryRepository:
    def __init__(self) -> None:
        self.monitors: dict[str, Monitor] = {}
        self.incidents: dict[str, Incident] = {}
        self.results: dict[str, list[dict]] = defaultdict(list)

    def create_monitor(self, payload: MonitorCreate) -> Monitor:
        now = datetime.now(UTC)
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

    def list_due_monitors(self, now: datetime | None = None) -> list[Monitor]:
        current_time = now or datetime.now(UTC)
        return [
            monitor
            for monitor in self.monitors.values()
            if monitor.status == "active" and monitor.next_check_at <= current_time
        ]

    def touch_monitor_after_check(self, monitor_id: str) -> Monitor | None:
        monitor = self.monitors.get(monitor_id)
        if monitor is None:
            return None

        monitor.next_check_at = datetime.now(UTC) + timedelta(minutes=monitor.interval_minutes)
        monitor.updated_at = datetime.now(UTC)
        return monitor

    def list_incidents(self) -> list[Incident]:
        return sorted(self.incidents.values(), key=lambda item: item.opened_at, reverse=True)

    def open_incident(self, incident: Incident) -> Incident:
        self.incidents[incident.incident_id] = incident
        return incident

    def resolve_open_incident(self, monitor_id: str) -> Incident | None:
        for incident in self.incidents.values():
            if incident.monitor_id == monitor_id and incident.state == IncidentState.OPEN:
                incident.state = IncidentState.RESOLVED
                incident.resolved_at = datetime.now(UTC)
                return incident
        return None


repository = InMemoryRepository()
