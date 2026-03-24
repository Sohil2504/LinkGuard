# LinkGuard Decision Log

This file exists so every important choice has a reason, a rejected alternative, and a revisit trigger. That is what makes the project interviewable.

## Accepted decisions

### D-001: Use Lambda first, not ECS

- Why: the workload is bursty, event-driven, and small enough that Lambda fits naturally.
- Rejected alternative: ECS Fargate.
- Why rejected: higher setup cost and more moving parts before the product proves itself.
- Risk: browser checks or heavy long-running jobs may outgrow Lambda.
- Revisit when: we add headless-browser flows or sustained background processing.

### D-002: Use one scheduler-triggered dispatcher

- Why: one EventBridge Scheduler trigger is easier to manage than one schedule per monitor.
- Rejected alternative: one schedule per monitor.
- Why rejected: more control-plane complexity for monitor lifecycle operations.
- Risk: dispatcher query logic can become a hotspot if data access is sloppy.
- Revisit when: monitor count grows enough that per-monitor schedules are operationally cleaner.

### D-003: Put SQS between dispatch and check execution

- Why: SQS decouples the schedule from the checker, buffers spikes, and gives retries and DLQ behavior.
- Rejected alternative: scheduler invokes checker directly.
- Why rejected: no buffering, weaker failure isolation, harder to control concurrency.
- Risk: another moving part and another place messages can pile up.
- Revisit when: the system is tiny and the queue becomes unjustified, or when workloads split into multiple worker types.

### D-004: Start with DynamoDB and a simple model

- Why: low-ops, cheap, and good enough for monitors, incidents, and time-series check results.
- Rejected alternative: PostgreSQL.
- Why rejected: stronger relational power than v1 needs and more operational overhead for the flagship MVP.
- Risk: cross-entity querying is more constrained than in SQL.
- Revisit when: reporting, ad hoc analytics, or relational joins become a real product need.

### D-005: SES is the first alerting channel

- Why: it creates a real end-to-end user outcome without building too many integrations.
- Rejected alternative: Slack first.
- Why rejected: Slack is useful, but email is the lowest-friction path for the first real alert.
- Risk: SES sandbox and identity verification can slow down early demos.
- Revisit when: alert fatigue pushes users toward chat-based notifications.

## Open decisions that need sign-off

### O-001: GitHub repo shape

- Default recommendation: public repo named `linkguard`.
- Why: this is a flagship and you want build-in-public momentum.

### O-002: Persistence strategy during local-first development

- Default recommendation: in-memory repository for the first API scaffold, then swap to DynamoDB once the AWS slice starts.
- Why: fastest path to proving API shape and incident logic without blocking on cloud provisioning.

### O-003: Initial alert channel scope

- Default recommendation: email only in the first week.
- Why: enough to validate the product loop without channel sprawl.

### O-004: Frontend priority

- Default recommendation: basic operator dashboard in week 2, not a polished marketing site in week 1.
- Why: the monitoring loop is the product; the dashboard is the interface to it.
