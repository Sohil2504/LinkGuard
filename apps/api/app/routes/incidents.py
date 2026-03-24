from fastapi import APIRouter

from app.services.repository import repository

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("")
def list_incidents():
    return repository.list_incidents()
