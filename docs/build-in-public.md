# 2-Week Build Timeline

This is optimized for shipping an explainable flagship MVP in roughly 14 days. Each day should end with one concrete proof artifact: screenshot, trace, metric, diagram, or clip.

## Daily post format

Use this structure at the end of each day:

```text
Day X/14 building LinkGuard

What shipped:
[one concrete thing]

Why it matters:
[one sentence tied to user pain or reliability]

Technical choice:
[one decision and why]

Proof:
[screenshot, log snippet, diagram, trace, or short clip]

Next:
[tomorrow's deliverable]
```

## Day-by-day plan

### Day 1

- Finalize scope and architecture.
- Create repo, scaffold FastAPI, React, Terraform, and docs.
- Write the first 5 decisions in the decision log.

Post angle:
- "Started LinkGuard. It monitors revenue-critical links and opens incidents only after repeated failures, not after one blip."

### Day 2

- Implement monitor domain models and CRUD endpoints.
- Add local in-memory persistence.
- Define failure taxonomy and interval constraints.

Post angle:
- "Scoped the product around reliability, not generic uptime. Failure types matter because 'timeout' and '404' should not be treated the same."

### Day 3

- Add dispatcher logic to find due monitors.
- Create queued check job payload contract.
- Document idempotency strategy.

Post angle:
- "Chose one global scheduler plus SQS instead of one schedule per monitor. Simpler control plane, easier to explain."

### Day 4

- Build worker path for HTTP checks.
- Capture latency, status, and normalized failure reasons.
- Store check results locally.

Post angle:
- "First outside-in checks are running. The goal is not just up/down, it is actionable evidence."

### Day 5

- Implement incident state machine.
- Open after 2 failures, resolve after 2 successes.
- Add tests for incident transitions.

Post angle:
- "Refused to alert on first failure. Noise reduction is part of the product, not a nice-to-have."

### Day 6

- Add local dashboard view for monitors and incidents.
- Show recent checks and incident state.

Post angle:
- "Put the ops story in the UI: monitor state, latest evidence, and incident lifecycle."

### Day 7

- Deploy first AWS slice: API Gateway, Lambda, and DynamoDB.
- Verify API runs in cloud.

Post angle:
- "First cloud deployment is live. Kept compute on Lambda because this workload is bursty and event-driven."

### Day 8

- Add EventBridge Scheduler and SQS.
- Wire dispatcher to queue.
- Add DLQ.

Post angle:
- "Added the queueing layer. Scheduler should not call the checker directly if I want buffering, retries, and clean failure isolation."

### Day 9

- Run worker in AWS from SQS.
- Persist results to DynamoDB.
- Add TTL policy for check history.

Post angle:
- "Cheap retention matters. Check history is useful, but it should expire automatically instead of becoming silent spend."

### Day 10

- Add SES email alerts.
- Verify verified sender flow and end-to-end incident emails.

Post angle:
- "First real alert channel works. The product now closes the loop from detection to notification."

### Day 11

- Add CloudWatch metrics, alarms, and X-Ray tracing.
- Capture queue depth, error rate, and worker latency.

Post angle:
- "A monitoring product without its own observability is a contradiction, so I instrumented the system itself."

### Day 12

- Add Terraform cleanup and IAM tightening.
- Review least-privilege boundaries.

Post angle:
- "Tightened IAM and infra boundaries. 'Works' is not enough if permissions are sloppy."

### Day 13

- Add CI with GitHub Actions and AWS OIDC.
- Run lint, tests, and deploy to dev.

Post angle:
- "Used GitHub OIDC instead of long-lived AWS keys. Better default, fewer secrets, better story."

### Day 14

- Record demo, clean docs, and summarize tradeoffs.
- Publish architecture diagram and first retrospective.

Post angle:
- "Finished the first LinkGuard MVP. The most useful part of the project is the decision trail, not the screenshot."

## Content rules

- Post one decision per day, not ten.
- Always attach proof.
- Tie each update to the user pain or a reliability concern.
- Avoid vague AI language unless the feature is real and measured.
