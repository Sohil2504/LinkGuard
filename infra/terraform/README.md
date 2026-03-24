# Terraform Scaffold

This folder is intentionally thin right now. The first pass is meant to make the AWS resource boundaries explicit before implementation gets noisy.

Planned resources:

- API Gateway HTTP API
- Lambda functions for API, dispatcher, and worker
- EventBridge Scheduler
- SQS queue and DLQ
- DynamoDB tables for monitors, incidents, and check history
- SES identity and send permissions
- CloudWatch log groups, alarms, and dashboards
- IAM roles and least-privilege policies

The Terraform should stay boring and explainable. The value is in the resource relationships and permission boundaries, not in clever module indirection.
