from fastapi import APIRouter

from app.domain import CheckJob
from app.services.dispatcher import list_due_monitor_jobs

router = APIRouter(prefix="/dispatch", tags=["dispatch"])


@router.get("/due-jobs", response_model=list[CheckJob])
def get_due_jobs() -> list[CheckJob]:
    return list_due_monitor_jobs()
