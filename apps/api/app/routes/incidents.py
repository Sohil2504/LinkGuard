from fastapi import APIRouter

from app.domain import Incident
from app.services.repository import repository

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("", response_model=list[Incident])
def list_incidents() -> list[Incident]:
    return repository.list_incidents()
