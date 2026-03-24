import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.repository import repository


@pytest.fixture(autouse=True)
def reset_repository() -> None:
    repository.reset()


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)
