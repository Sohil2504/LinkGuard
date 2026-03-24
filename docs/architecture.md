# LinkGuard Architecture

## Problem statement

Creators and small teams often have one or two pages that directly convert revenue: checkout, booking, waitlist, sponsor, newsletter, or campaign landing pages. When one breaks, the failure is usually discovered by a customer first. LinkGuard exists to shorten that blind spot.

## Target user

The initial user is a solo creator or small business that needs outside-in monitoring for a handful of critical links and wants incident-style alerts without buying an enterprise monitoring product.

## V1 system

### Public API

- API Gateway HTTP API fronts the backend.
- FastAPI runs in Lambda.
- Lambda proxy integration keeps the request path simple and interviewable.

Why this exists:
- It is enough for CRUD and light control-plane work.
- It keeps operations overhead low.
- It aligns with bursty, event-driven traffic.

### Scheduling path

- One EventBridge Scheduler trigger runs every minute.
- The dispatcher finds monitors whose `next_check_at` is due.
- The dispatcher enqueues one SQS message per due monitor.

Why this exists:
- One shared schedule is easier to reason about than one schedule per monitor.
- It gives a clean control plane for monitor updates.
- It keeps the first version simpler while preserving a path to scale later.

### Check execution path

- An SQS-triggered worker Lambda executes the HTTP check.
- The worker classifies the result into a small error taxonomy.
- The worker writes the result and updates incident state.

Why this exists:
- SQS buffers bursts and decouples scheduling from execution.
- Retries and DLQ handling come from managed primitives instead of custom code.
- Workers can be rate-limited through queue and Lambda concurrency controls.

### Data model

- `monitors`: configuration, status, cadence, and alert settings.
- `check_results`: time-series status, latency, HTTP status, and failure reason.
- `incidents`: open and resolved incidents with counters and timestamps.

Why DynamoDB:
- Good fit for key-value and time-series access patterns in v1.
- Cheap at small scale with predictable operational overhead.
- TTL is useful for expiring check history.

### Alerts

- SES is the first alert channel.
- Slack, Discord, and generic webhooks come later.

Why SES first:
- Real-world enough to matter.
- Cheap to run.
- Keeps v1 focused on the reliability loop rather than integrations sprawl.

### Observability

- CloudWatch metrics and alarms for system health.
- X-Ray traces for request and worker tracing.
- AWS Lambda Powertools for structured logs, tracing, and metrics.
- Sentry later for app-level debugging once the system is deployed.

Why this exists:
- A reliability product without observability is not credible.
- Native AWS telemetry should be first because it covers the service boundaries you are actually building.

## Core reliability rules

- Do not alert on the first failed check.
- Open an incident after 2 consecutive failures.
- Resolve an incident after 2 consecutive successes.
- Use idempotency keys for queued check execution.
- Keep the DLQ retention longer than the source queue retention.

## Scope boundaries for the 2-week MVP

In scope:
- HTTP GET checks
- expected status code
- optional body substring match
- fixed intervals: 1, 5, 15, 60 minutes
- email alerts
- incident feed

Out of scope:
- browser automation
- screenshots
- login flows
- SMS
- AI root-cause summaries
- billing
- multi-region failover

## Cost discipline

The architecture is serverless-first because the MVP needs to be cheap, simple, and explainable.

Expected cost drivers:
- Lambda invocations
- SQS requests
- DynamoDB read/write volume
- SES email sends
- CloudWatch log retention

Cost controls:
- short log retention in non-prod
- DynamoDB TTL for check history
- limited check intervals in v1
- static frontend on S3 + CloudFront later
