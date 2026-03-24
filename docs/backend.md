# Backend Design

## What the FastAPI slice proves

The backend is not just a CRUD shell. It is meant to prove the first real LinkGuard control plane and the policy logic behind the monitoring loop.

This slice is successful when you can:

- create a monitor
- pause or resume it
- list due check jobs
- execute a check
- see the result history
- watch an incident open after repeated failures
- watch an incident resolve after repeated recovery

That is enough to demonstrate that the product rules exist independently of AWS plumbing.

## Current API surface

### Health

- `GET /health`

### Monitors

- `POST /monitors`
- `GET /monitors`
- `GET /monitors/{monitor_id}`
- `POST /monitors/{monitor_id}/pause`
- `POST /monitors/{monitor_id}/resume`
- `GET /monitors/{monitor_id}/results`
- `POST /monitors/{monitor_id}/run-check`

### Dispatch

- `GET /dispatch/due-jobs`

This is a local preview of the eventual queue payload shape. In AWS, these jobs will be emitted into SQS rather than returned directly to the caller.

### Incidents

- `GET /incidents`

## Local-first design choice

The backend currently uses an in-memory repository instead of DynamoDB. This is intentional.

Why:

- the first job is to prove the domain and policy rules
- it keeps local iteration fast
- it avoids doing cloud plumbing before the product behavior is clear

What changes later:

- `repository.py` becomes a DynamoDB-backed adapter
- the rest of the domain and policy code should stay mostly intact

That separation is the point of the backend design.

## Incident policy behavior

LinkGuard does not page on the first failed check because that would create noise for transient issues.

The current rules are:

- first failure: record evidence only
- second consecutive failure: open incident
- additional failures while open: update incident
- first success after failure: keep incident open but mark recovery evidence
- second consecutive success: resolve incident

This is one of the most important parts of the project to explain clearly. It shows you made an operational tradeoff instead of just sending alerts mechanically.

## Why the manual run-check endpoint exists

`POST /monitors/{id}/run-check` is a development and demo affordance.

It exists so you can:

- prove the checker logic locally
- test incident behavior without the AWS queue path
- demo the vertical slice before Scheduler, SQS, and Lambda workers are wired up

Once the worker path is deployed, the same business logic should be reused there. The point is to keep the product rules in one place.
