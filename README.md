# LinkGuard

LinkGuard is a serverless link monitoring system built to detect broken business-critical links before they cost teams revenue.

This project is being built as a practical AWS-first portfolio piece focused on event-driven architecture, queue-based processing, alerting, and observability.

## Status

Currently in active development.

Working on:
- monitor CRUD
- dispatcher flow
- worker-based checks
- incident logic
- first AWS deployment

## The problem

Small teams often rely on a handful of critical links like checkout pages, booking flows, lead forms, or campaign landing pages. When one of those links breaks, the issue can sit unnoticed for hours and quietly cost money.

LinkGuard is built to reduce that gap. It checks important links on a fixed cadence, records what happened, opens incidents only after repeated failures, and sends alerts with enough context to act on them.

## What LinkGuard does

In its first version, LinkGuard focuses on a simple but realistic monitoring flow:

- create and manage monitors
- check monitored URLs on a schedule
- store check results
- open incidents after repeated failures
- resolve incidents after recovery
- send email alerts

The goal is not to build a huge monitoring platform. The goal is to build a small system with real reliability patterns and clear technical tradeoffs.

## MVP scope

The first vertical slice is:

1. Create a monitor
2. Find monitors that are due for a check
3. Run the check
4. Store the result
5. Open an incident after repeated failures
6. Send an alert

Everything else is secondary to that flow.

## Architecture

### Current project layout

- `apps/api` — FastAPI backend for monitor and incident APIs
- `apps/web` — React + Vite frontend for dashboard and landing page
- `infra/terraform` — Terraform for AWS infrastructure
- `docs` — architecture notes, decision log, and build-in-public progress

### Current design choices

- **Compute:** AWS Lambda first, not ECS
- **Scheduling:** one scheduler wakes a dispatcher every minute
- **Queueing:** dispatcher sends due checks to SQS
- **Workers:** check jobs are processed asynchronously by workers
- **Data store:** DynamoDB for monitors, results, and incidents
- **Alerts:** SES first, webhooks later
- **Observability:** CloudWatch, X-Ray, and Powertools first; Sentry later

These choices are meant to keep the MVP small, affordable, and easy to explain while still showing real cloud engineering patterns.

## Why these choices

This project is intentionally AWS-native and serverless-first.

I chose Lambda because the workload is event-driven and low-ops.  
I chose SQS because I wanted decoupling, retries, and buffering between scheduling and execution.  
I chose DynamoDB because it fits monitor metadata, incident state, and time-based result storage well for this size of system.  
I chose SES first because email is the simplest useful alerting channel for an MVP.

As the project grows, I may add webhooks, richer incident context, and stronger UI workflows, but the core goal is to keep the design practical and defensible.

## Documentation

- [Architecture](docs/architecture.md)
- [Backend Design](docs/backend.md)
- [Decision Log](docs/decision-log.md)
- [Build in Public](docs/build-in-public.md)

## Repository structure

```text
apps/
  api/          FastAPI app and tests
  web/          React + Vite app
docs/           Architecture and execution docs
infra/terraform Terraform for AWS resources


## Near-term priorities:

persist monitors and results cleanly
implement dispatcher logic
add queue-backed check workers
open and resolve incidents based on repeated failures
send SES alerts
deploy the first AWS version with Terraform
add observability and alarms

## Why I built this

I’m building LinkGuard as a flagship cloud/backend project to get stronger at designing systems that feel operationally real, not just feature-complete.

The main goal is to practice and demonstrate:

serverless architecture
async job processing
reliability-oriented design
AWS infrastructure
observability
clear technical decision-making


## About me

I’m Sohil Marreddi, a software engineer focused on backend, cloud, and infrastructure-oriented projects.

I’m using LinkGuard to deepen my understanding of serverless systems, async processing, observability, and production-minded design.
