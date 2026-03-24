from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, Field, HttpUrl


def utc_now() -> datetime:
    return datetime.now(UTC)


class MonitorStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"


class IncidentState(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"


class FailureType(StrEnum):
    TIMEOUT = "timeout"
    CONNECTION = "connection"
    NON_2XX = "non_2xx"
    CONTENT_MISMATCH = "content_mismatch"
    INTERNAL_ERROR = "internal_error"


class MonitorCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    target_url: HttpUrl
    interval_minutes: int = Field(default=5, ge=1, le=60)
    timeout_seconds: int = Field(default=10, ge=1, le=30)
    expected_status_code: int = Field(default=200, ge=100, le=599)
    expected_substring: str | None = Field(default=None, max_length=200)
    alert_email: str | None = Field(default=None, max_length=254)


class Monitor(BaseModel):
    monitor_id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    target_url: HttpUrl
    interval_minutes: int
    timeout_seconds: int
    expected_status_code: int
    expected_substring: str | None = None
    alert_email: str | None = None
    status: MonitorStatus = MonitorStatus.ACTIVE
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    next_check_at: datetime = Field(default_factory=utc_now)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class CheckResult(BaseModel):
    monitor_id: str
    checked_at: datetime = Field(default_factory=utc_now)
    status: str
    latency_ms: int
    http_status: int | None = None
    failure_type: FailureType | None = None
    reason: str | None = None


class Incident(BaseModel):
    incident_id: str = Field(default_factory=lambda: str(uuid4()))
    monitor_id: str
    state: IncidentState = IncidentState.OPEN
    opening_reason: str
    opened_at: datetime = Field(default_factory=utc_now)
    resolved_at: datetime | None = None
    failure_count: int = 0
    last_observed_status: str = "down"
