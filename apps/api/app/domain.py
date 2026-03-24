from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, Field, HttpUrl, field_validator


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


ALLOWED_INTERVAL_MINUTES = (1, 5, 15, 60)
INCIDENT_OPEN_FAILURE_THRESHOLD = 2
INCIDENT_RESOLVE_SUCCESS_THRESHOLD = 2


class MonitorStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"


class CheckStatus(str, Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"


class IncidentState(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"


class FailureType(str, Enum):
    TIMEOUT = "timeout"
    CONNECTION = "connection"
    STATUS_MISMATCH = "status_mismatch"
    CONTENT_MISMATCH = "content_mismatch"
    INTERNAL_ERROR = "internal_error"


class IncidentAction(str, Enum):
    NONE = "none"
    OPENED = "opened"
    UPDATED = "updated"
    RESOLVED = "resolved"


class MonitorCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    target_url: HttpUrl
    interval_minutes: int = Field(default=5, ge=1, le=60)
    timeout_seconds: int = Field(default=10, ge=1, le=30)
    expected_status_code: int = Field(default=200, ge=100, le=599)
    expected_substring: str | None = Field(default=None, max_length=200)
    alert_email: str | None = Field(default=None, max_length=254)

    @field_validator("interval_minutes")
    @classmethod
    def validate_interval_minutes(cls, value: int) -> int:
        if value not in ALLOWED_INTERVAL_MINUTES:
            allowed = ", ".join(str(item) for item in ALLOWED_INTERVAL_MINUTES)
            raise ValueError(f"interval_minutes must be one of {allowed}")
        return value


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


class CheckJob(BaseModel):
    execution_id: str = Field(default_factory=lambda: str(uuid4()))
    job_type: str = "http_check"
    monitor_id: str
    target_url: str
    timeout_seconds: int
    expected_status_code: int
    expected_substring: str | None = None


class CheckResult(BaseModel):
    check_id: str = Field(default_factory=lambda: str(uuid4()))
    monitor_id: str
    checked_at: datetime = Field(default_factory=utc_now)
    status: CheckStatus
    latency_ms: int
    http_status: int | None = None
    failure_type: FailureType | None = None
    reason: str | None = None
    response_excerpt: str | None = Field(default=None, max_length=240)


class Incident(BaseModel):
    incident_id: str = Field(default_factory=lambda: str(uuid4()))
    monitor_id: str
    state: IncidentState = IncidentState.OPEN
    opening_reason: str
    opened_at: datetime = Field(default_factory=utc_now)
    resolved_at: datetime | None = None
    failure_count: int = 0
    last_observed_status: CheckStatus = CheckStatus.UNHEALTHY
    last_reason: str | None = None


class CheckExecution(BaseModel):
    monitor: Monitor
    result: CheckResult
    incident_action: IncidentAction
    active_incident: Incident | None = None
