# LinkGuard

LinkGuard is an AWS-native uptime and incident detection service for "money pages" like checkout links, booking pages, lead forms, and campaign landing pages.

The flagship story for this project is not "I built a FastAPI app." It is "I designed a reliability-focused, event-driven system with clear tradeoffs, cost boundaries, and operational discipline."

## Why this exists

Small teams lose revenue when critical links break and nobody notices for hours. LinkGuard checks those links on a fixed cadence, records evidence, opens incidents only after repeated failures, and alerts with enough context to act.

## V1 architecture

- `apps/api`: FastAPI service for monitor and incident APIs. Designed to run locally with Uvicorn and in AWS Lambda with Mangum.
- `apps/web`: React + Vite frontend for the operator dashboard and marketing site.
- `infra/terraform`: Terraform entrypoint for API Gateway, Lambda, EventBridge Scheduler, SQS, DLQ, DynamoDB, SES, CloudWatch, and IAM.
- `docs`: system design notes, decision log, and build-in-public timeline.

## Current design choices

- Compute: AWS Lambda first, not ECS.
- Scheduling: one EventBridge Scheduler trigger wakes a dispatcher every minute.
- Decoupling: dispatcher pushes due checks into SQS, workers consume from SQS.
- Data: DynamoDB for monitors, incidents, and check history.
- Alerts: SES first, webhooks later.
- Observability: CloudWatch + X-Ray + Powertools first, Sentry later.

These are intentional defaults for a 2-week flagship MVP. They are documented in [docs/architecture.md](/Users/sohil/Documents/New project/docs/architecture.md), [docs/backend.md](/Users/sohil/Documents/New project/docs/backend.md), and [docs/decision-log.md](/Users/sohil/Documents/New project/docs/decision-log.md).

## Documentation index

- [Architecture](/Users/sohil/Documents/New project/docs/architecture.md): system shape, flows, component responsibilities, and scope boundaries.
- [Backend Design](/Users/sohil/Documents/New project/docs/backend.md): what the FastAPI slice proves and how it maps to the eventual AWS path.
- [Decision Log](/Users/sohil/Documents/New project/docs/decision-log.md): the reasoning trail you should be able to defend in interviews.
- [Build In Public](/Users/sohil/Documents/New project/docs/build-in-public.md): 14-day execution and daily post structure.

## Repo structure

```text
apps/
  api/          FastAPI app and tests
  web/          React + Vite app
docs/           Architecture and execution docs
infra/terraform Terraform scaffold for AWS resources
```

## Local development

API:

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Web:

```bash
cd apps/web
npm install
npm run dev
```

## First vertical slice

1. Create a monitor.
2. Dispatcher finds due monitors.
3. Worker checks target URL.
4. Result is stored.
5. Incident opens after repeated failures.
6. Email alert fires.

That is the MVP heartbeat. Everything else is secondary.

## Current local backend endpoints

- `GET /health`
- `POST /monitors`
- `GET /monitors`
- `GET /monitors/{monitor_id}`
- `POST /monitors/{monitor_id}/pause`
- `POST /monitors/{monitor_id}/resume`
- `GET /monitors/{monitor_id}/results`
- `POST /monitors/{monitor_id}/run-check`
- `GET /dispatch/due-jobs`
- `GET /incidents`
