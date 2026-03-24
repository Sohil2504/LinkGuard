# LinkGuard

LinkGuard is a serverless link monitoring system built to catch broken critical links before teams lose time or money

I’m building it as an AWS centered focused backend project to practice event driven architecture, async job processing, alerting, and observability.

## What it does

LinkGuard helps monitor important links such as checkout pages, booking flows, lead forms, and landing pages.

For the MVP, it:
- creates and manages monitors
- checks URLs on a schedule
- stores check results
- opens incidents after repeated failures
- sends email alerts

## Current architecture

- `apps/api` for the FastAPI backend
- `apps/web` for the React + Vite frontend
- `infra/terraform` for AWS infrastructure
- `docs` for architecture notes and decision logs

### Core design choices

- **Compute:** AWS Lambda
- **Scheduling:** one scheduler wakes a dispatcher every minute
- **Queueing:** dispatcher sends due checks to SQS
- **Workers:** checks run asynchronously
- **Data store:** DynamoDB
- **Alerts:** SES first, webhooks later
- **Observability:** CloudWatch, X-Ray, and Powertools first, Sentry later

## Why this design

I wanted the project to feel like a real cloud system, not just a CRUD app.

Lambda keeps the compute layer simple.  
SQS adds buffering and decouples scheduling from execution.  
DynamoDB fits monitor state, incidents, and check history well for this scale.  
SES is the simplest useful alerting path for a first version.

## MVP flow

1. Create a monitor  
2. Find monitors due for a check  
3. Run the check  
4. Store the result  
5. Open an incident after repeated failures  
6. Send an alert  

## Repository structure

```text
apps/
  api/          FastAPI app and tests
  web/          React + Vite app
docs/           Architecture and decision docs
infra/terraform Terraform for AWS resources
```
## About me

Hi! I am Sohil Marreddi, a software engineer focused on backend, cloud, and infrastructure oriented work.

I’m building LinkGuard as a flagship project to get better at designing and explaining systems end to end, from APIs and worker flows to deployment, alerting, and observability.
