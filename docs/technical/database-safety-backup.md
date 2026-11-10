# HILERA database safety, backup and restore

## Purpose

This document governs operational safety for HILERA PostgreSQL environments. It is a technical and security control, not a product requirement. The Master PRD remains authoritative for product-visible data and behaviour.

## Environment separation

HILERA must maintain separate development, test/staging, and production database environments and credentials.

- Local development and automated tests use synthetic data.
- Production credentials must not be exposed to local development scripts by default.
- Read-only production access should be used for investigation where feasible.
- Write or administrative access is reserved for explicitly approved operations.
- Real production health data must not be routinely copied to a developer workstation.

## Destructive-operation guardrail

Do not run destructive production operations such as DROP DATABASE, DROP TABLE, TRUNCATE, reset commands, bulk deletion, destructive migration rollback, or equivalent operations without explicit approval and a reviewed recovery plan.

Before any risky production migration or material data operation:

1. identify the affected entities and expected data impact;
2. confirm a current applicable backup or recovery point;
3. review generated SQL and locking behaviour;
4. document rollback or forward-repair steps;
5. verify the environment and credentials before execution;
6. run the migration or operation first against an isolated representative environment.

## Local PostgreSQL role

A local PostgreSQL installation or container is recommended. Use a currently supported PostgreSQL major at a current security-patched minor release; do not use an end-of-life server or outdated pg_dump/pg_restore client. Re-run compatibility tests against the eventual production major before launch.

Use the local database for:

- application development;
- migration rehearsal;
- integration tests;
- synthetic backup creation;
- restore drills;
- recovery-procedure validation.

The local database is not the production backup destination and must not be treated as the sole backup of production data.

A standard local restore drill is:

1. create a disposable database;
2. seed synthetic HILERA data;
3. create a PostgreSQL logical backup;
4. destroy the disposable database;
5. restore the backup into a new disposable database;
6. run schema and integrity checks;
7. verify expected synthetic records and constraints;
8. destroy the restore-test environment when complete.

## Production backup requirements

Before HILERA stores real health data in production, the selected database platform must support and document:

- automated backups;
- encrypted backup storage;
- point-in-time recovery where supported by the platform;
- backup failure monitoring or alerting;
- access control separate from ordinary application access;
- a defined backup retention policy;
- a documented restore procedure;
- periodic restore verification.

Exact retention periods, recovery-point objective, recovery-time objective, provider-specific configuration, and storage location remain deployment decisions requiring review before production launch.

## Restore verification

A backup is not considered operationally verified merely because the backup job reports success. HILERA must periodically prove that a backup can be restored into an isolated environment and that the restored database passes appropriate integrity checks.

Restore tests must use synthetic data or a separately approved sanitized dataset unless a production incident requires a controlled production restore under the incident procedure.

## Migration safety

Schema changes must be forward-compatible where practical, narrowly scoped, reviewed, and tested against disposable databases before production.

For migrations affecting identity, authentication, health information, provenance, audit records, or clinical-output traceability:

- preserve existing records unless deletion is explicitly approved;
- identify transaction and lock risks;
- define failure recovery;
- ensure backups or recovery points cover the operation;
- run post-migration integrity checks;
- do not allow restored data to unintentionally reactivate revoked authentication sessions.

## Secrets and logging

Backup files, database URLs, credentials, connection strings, tokens, and health information must not be written to source control or unnecessary logs. Backup access must follow least privilege and environment-specific secret management.

## Approval status

Approved by the Product Owner on 10 November 2026 as the baseline database-safety and backup/restore policy for HILERA backend implementation.

PRD Sync Status: Not required. These controls govern technical and operational implementation and do not introduce new product-visible behaviour.
