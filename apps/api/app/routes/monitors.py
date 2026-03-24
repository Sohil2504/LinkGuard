from fastapi import APIRouter, HTTPException, Query, status

from app.domain import CheckExecution, CheckResult, Monitor, MonitorCreate, MonitorStatus
from app.services.monitoring import execute_monitor_check
from app.services.repository import repository

router = APIRouter(prefix="/monitors", tags=["monitors"])


def require_monitor(monitor_id: str) -> Monitor:
    monitor = repository.get_monitor(monitor_id)
    if monitor is None:
        raise HTTPException(status_code=404, detail="monitor not found")
    return monitor


@router.post("", response_model=Monitor, status_code=status.HTTP_201_CREATED)
def create_monitor(payload: MonitorCreate) -> Monitor:
    return repository.create_monitor(payload)


@router.get("", response_model=list[Monitor])
def list_monitors() -> list[Monitor]:
    return repository.list_monitors()


@router.get("/{monitor_id}", response_model=Monitor)
def get_monitor(monitor_id: str) -> Monitor:
    return require_monitor(monitor_id)


@router.post("/{monitor_id}/pause", response_model=Monitor)
def pause_monitor(monitor_id: str) -> Monitor:
    monitor = repository.set_monitor_status(monitor_id, MonitorStatus.PAUSED)
    if monitor is None:
        raise HTTPException(status_code=404, detail="monitor not found")
    return monitor


@router.post("/{monitor_id}/resume", response_model=Monitor)
def resume_monitor(monitor_id: str) -> Monitor:
    monitor = repository.set_monitor_status(monitor_id, MonitorStatus.ACTIVE)
    if monitor is None:
        raise HTTPException(status_code=404, detail="monitor not found")
    return monitor


@router.get("/{monitor_id}/results", response_model=list[CheckResult])
def list_monitor_results(
    monitor_id: str,
    limit: int = Query(default=20, ge=1, le=100),
) -> list[CheckResult]:
    require_monitor(monitor_id)
    return repository.list_check_results(monitor_id=monitor_id, limit=limit)


@router.post("/{monitor_id}/run-check", response_model=CheckExecution)
def run_monitor_check(monitor_id: str) -> CheckExecution:
    execution = execute_monitor_check(monitor_id)
    if execution is None:
        raise HTTPException(status_code=404, detail="monitor not found")
    return execution
