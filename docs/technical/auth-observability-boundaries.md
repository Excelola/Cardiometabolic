# HILERA authentication observability and security boundaries

## Goal

HILERA needs enough operational visibility to detect outages, abuse and authentication failures without turning logs, metrics or traces into a second sensitive-data store.

This document defines the initial observability boundary for the authentication foundation. It does not approve a monitoring vendor.

## Monitor system health, not user secrets

Recommended service-level signals:

- request availability and error rate;
- server response latency;
- deployment/build failures;
- Node process crashes or restarts;
- PostgreSQL connectivity and connection-pool saturation;
- database statement latency and timeout rate;
- migration failures;
- backup job failures and restore-test outcomes;
- authentication success/failure volume;
- throttle saturation and temporary-unavailable outcomes;
- session validation/revocation failures at an aggregate operational level.

Do not use logs or metrics to reconstruct a user's health record.

## Forbidden telemetry

Application, platform and proxy telemetry must not intentionally contain:

- plaintext passwords;
- password hashes;
- raw session tokens;
- session-token digests;
- CSRF tokens or signing secrets;
- cookies or Authorization-like credentials;
- database URLs or passwords;
- raw health information;
- questionnaire answers;
- uploaded health-document contents;
- unnecessary raw email addresses;
- unrestricted request or response bodies.

If a platform automatically captures these values, configure redaction or disable that capture before real-user exposure.

## Authentication events

The database security-event table is deliberately minimal. It can support reviewed categories such as account creation, sign-in success/failure, sign-out and session revocation.

Failed sign-in events intentionally omit the attempted email. This reduces privacy exposure but also limits account-targeted investigation. Do not add raw email/IP/device fields merely for convenience. If future abuse monitoring needs a source or identity signal, define its purpose, derivation, retention and authorized readers first.

## Operational alerts

Before real-user production exposure, define alerting for at least:

- application unavailable or sustained elevated 5xx rate;
- authentication database unavailable;
- database pool saturation;
- abnormal authentication failure volume;
- sustained throttle saturation;
- backup failure;
- missed backup/restore verification;
- deployment failure or rollback;
- secret/configuration failure preventing authentication.

Thresholds are deployment/traffic decisions, not product requirements. Establish baseline traffic first and tune alerts to avoid both missed incidents and constant noise.

## Logs versus metrics

Use metrics for volume, latency, saturation and availability wherever possible. Use logs for bounded diagnostic events. Use traces only when configured to exclude credential and sensitive request bodies.

Next.js development Server Function logging is disabled because it includes invocation arguments, such as the session activity CSRF proof. Keep request bodies and authentication mutation arguments out of development logs as well as deployment logs.

Prefer an opaque operational request/correlation identifier when diagnosis needs cross-service correlation. It must not be a session token, user email, health record identifier or other reusable credential.

## Database visibility

Operators should be able to see:

- connection count and pool utilization;
- query latency/error rate;
- storage and transaction pressure;
- replica/backup health where applicable;
- migration status;
- restore-test result.

Normal operational dashboards should not expose credential rows or raw identity data. Database consoles are privileged tools, not observability dashboards.

## Access control

Observability access follows least privilege.

- Product/support access does not imply production log/database access.
- DevOps access does not imply permission to inspect health records.
- Security-event access is limited to defined operational/security purposes.
- Production investigation should use read-only access where feasible.
- Administrative access must be auditable.

Exact roles and vendor permissions require separate implementation review.

## Incident signals and response

An alert is not itself a user-facing clinical or product signal. Operational monitoring must not generate medical interpretation, diagnosis, treatment or emergency advice.

Security incidents affecting authentication or identity should trigger the relevant incident/recovery runbook. Any suspected exposure of identity or health data requires privacy/security incident handling outside ordinary debugging.

## Verification

Before launch, use synthetic canary values to check application logs, platform logs, traces and error reporting. Confirm forbidden values do not appear.

Review observability again when health-information persistence, document upload/extraction or external integrations are introduced because those features materially expand sensitive-data exposure.

PRD Sync Status: Not required. This is an operational/security control.
