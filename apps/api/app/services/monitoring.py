from app.domain import (
    CheckExecution,
    CheckResult,
    CheckStatus,
    INCIDENT_OPEN_FAILURE_THRESHOLD,
    INCIDENT_RESOLVE_SUCCESS_THRESHOLD,
    Incident,
    IncidentAction,
)
from app.services.checker import perform_http_check
from app.services.repository import repository


def execute_monitor_check(monitor_id: str) -> CheckExecution | None:
    monitor = repository.get_monitor(monitor_id)
    if monitor is None:
        return None

    result = perform_http_check(monitor)
    return apply_check_result(monitor_id, result)


def apply_check_result(monitor_id: str, result: CheckResult) -> CheckExecution | None:
    monitor = repository.get_monitor(monitor_id)
    if monitor is None:
        return None

    repository.save_check_result(result)
    open_incident = repository.get_open_incident(monitor_id)
    incident_action = IncidentAction.NONE

    if result.status == CheckStatus.HEALTHY:
        monitor.consecutive_successes += 1
        monitor.consecutive_failures = 0
        if open_incident is not None:
            open_incident.last_observed_status = result.status
            open_incident.last_reason = result.reason
            incident_action = IncidentAction.UPDATED
            if monitor.consecutive_successes >= INCIDENT_RESOLVE_SUCCESS_THRESHOLD:
                repository.resolve_incident(open_incident.incident_id)
                incident_action = IncidentAction.RESOLVED
                open_incident = None
    else:
        monitor.consecutive_failures += 1
        monitor.consecutive_successes = 0
        if open_incident is None and monitor.consecutive_failures >= INCIDENT_OPEN_FAILURE_THRESHOLD:
            open_incident = repository.open_incident(
                Incident(
                    monitor_id=monitor_id,
                    opening_reason=result.reason or "Repeated monitor failures.",
                    failure_count=monitor.consecutive_failures,
                    last_observed_status=result.status,
                    last_reason=result.reason,
                )
            )
            incident_action = IncidentAction.OPENED
        elif open_incident is not None:
            open_incident.failure_count = monitor.consecutive_failures
            open_incident.last_observed_status = result.status
            open_incident.last_reason = result.reason
            incident_action = IncidentAction.UPDATED

    repository.advance_next_check(monitor.monitor_id)

    return CheckExecution(
        monitor=monitor,
        result=result,
        incident_action=incident_action,
        active_incident=open_incident,
    )
