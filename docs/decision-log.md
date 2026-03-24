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

### D-006: Start local-first with an in-memory repository

- Why: it proves domain rules and API shape before cloud infrastructure slows iteration down.
- Rejected alternative: wire DynamoDB immediately.
- Why rejected: it would front-load plumbing before monitor policy and incident logic are stable.
- Risk: local behavior can drift from production data access patterns if the adapter boundary is sloppy.
- Revisit when: the first AWS vertical slice is ready.

### D-007: Keep week 1 alerting to email only

- Why: one real alerting path is enough to validate the loop from detection to action.
- Rejected alternative: build Slack and webhook integrations immediately.
- Why rejected: more integration surface without improving the core product behavior.
- Risk: some users prefer chat-based alerts and will see email as weaker.
- Revisit when: the email path is stable.

### D-008: Keep v1 checks to HTTP GET plus status and body match

- Why: it delivers a real product while keeping the checker cheap and explainable.
- Rejected alternative: start with browser automation and screenshots.
- Why rejected: much higher cost and complexity before basic monitoring is proven.
- Risk: some real failures only show up in logged-in or JavaScript-heavy flows.
- Revisit when: the simple check pipeline is stable and users need deeper flows.

## Open decisions to revisit later

### O-001: When to add Slack or generic webhooks

- Default recommendation: after SES is proven end to end.
- Why: alerting breadth should follow a stable core loop, not replace it.

### O-002: When to replace the local repository with DynamoDB

- Default recommendation: as soon as the first AWS vertical slice is deployed.
- Why: local-first was chosen for speed, not as a permanent storage strategy.

### O-003: When to add browser-based checks

- Default recommendation: only after the queue-backed worker path and incident loop are stable.
- Why: browser checks should be an intentional expansion, not an excuse to avoid finishing the core system.
