from fastapi import APIRouter, HTTPException

from app.domain import MonitorCreate
from app.services.repository import repository

router = APIRouter(prefix="/monitors", tags=["monitors"])


@router.post("")
def create_monitor(payload: MonitorCreate):
    if payload.interval_minutes not in {1, 5, 15, 60}:
        raise HTTPException(status_code=422, detail="interval_minutes must be one of 1, 5, 15, 60")

    return repository.create_monitor(payload)


@router.get("")
def list_monitors():
    return repository.list_monitors()


@router.get("/{monitor_id}")
def get_monitor(monitor_id: str):
    monitor = repository.get_monitor(monitor_id)
    if monitor is None:
        raise HTTPException(status_code=404, detail="monitor not found")
    return monitor
