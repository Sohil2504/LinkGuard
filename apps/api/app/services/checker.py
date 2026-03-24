from time import perf_counter

import httpx

from app.domain import CheckResult, CheckStatus, FailureType, Monitor


def build_http_client(timeout_seconds: int) -> httpx.Client:
    return httpx.Client(timeout=timeout_seconds, follow_redirects=True)


def perform_http_check(monitor: Monitor) -> CheckResult:
    started_at = perf_counter()
    try:
        with build_http_client(monitor.timeout_seconds) as client:
            response = client.get(str(monitor.target_url))
    except httpx.TimeoutException:
        return CheckResult(
            monitor_id=monitor.monitor_id,
            status=CheckStatus.UNHEALTHY,
            latency_ms=int((perf_counter() - started_at) * 1000),
            failure_type=FailureType.TIMEOUT,
            reason="The target did not respond before the timeout.",
        )
    except httpx.ConnectError:
        return CheckResult(
            monitor_id=monitor.monitor_id,
            status=CheckStatus.UNHEALTHY,
            latency_ms=int((perf_counter() - started_at) * 1000),
            failure_type=FailureType.CONNECTION,
            reason="The checker could not establish a network connection.",
        )
    except httpx.HTTPError as error:
        return CheckResult(
            monitor_id=monitor.monitor_id,
            status=CheckStatus.UNHEALTHY,
            latency_ms=int((perf_counter() - started_at) * 1000),
            failure_type=FailureType.INTERNAL_ERROR,
            reason=f"Unexpected HTTP client error: {error.__class__.__name__}",
        )

    latency_ms = int((perf_counter() - started_at) * 1000)
    response_text = response.text[:240] if response.text else None

    if response.status_code != monitor.expected_status_code:
        return CheckResult(
            monitor_id=monitor.monitor_id,
            status=CheckStatus.UNHEALTHY,
            latency_ms=latency_ms,
            http_status=response.status_code,
            failure_type=FailureType.STATUS_MISMATCH,
            reason=(
                f"Expected HTTP {monitor.expected_status_code}, "
                f"received HTTP {response.status_code}."
            ),
            response_excerpt=response_text,
        )

    if monitor.expected_substring and monitor.expected_substring not in response.text:
        return CheckResult(
            monitor_id=monitor.monitor_id,
            status=CheckStatus.UNHEALTHY,
            latency_ms=latency_ms,
            http_status=response.status_code,
            failure_type=FailureType.CONTENT_MISMATCH,
            reason="The expected content marker was not found in the response body.",
            response_excerpt=response_text,
        )

    return CheckResult(
        monitor_id=monitor.monitor_id,
        status=CheckStatus.HEALTHY,
        latency_ms=latency_ms,
        http_status=response.status_code,
        reason="The target responded within policy.",
        response_excerpt=response_text,
    )
