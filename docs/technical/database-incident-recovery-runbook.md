# HILERA database incident and restore runbook

## Purpose

This runbook covers authentication-database backup, restore and migration incidents. It supplements docs/technical/database-safety-backup.md.

It does not authorize destructive production actions. Explicit approval remains required for destructive or high-risk production operations.

## Before any production database change

1. Confirm the exact environment and database target.
2. Confirm the operator is using the intended migration/admin role rather than a developer default.
3. Review the migration SQL and expected locks/data impact.
4. Confirm the latest applicable backup or point-in-time recovery position.
5. Record the rollback or forward-repair decision point.
6. Rehearse the change against an isolated representative database.
7. Confirm monitoring and an incident contact are available during the change.

Never use real production data for ordinary local rehearsal.

## Backup failure

If an expected backup fails:

1. Treat the database as operating without the expected recovery guarantee.
2. Do not perform discretionary risky schema/data changes.
3. Verify whether earlier valid backups and point-in-time recovery remain usable.
4. Investigate provider/storage/credential/quota failures using sanitized logs.
5. Restore backup operation.
6. Perform or schedule a restore verification.
7. Record the incident and duration of reduced recoverability.

Do not declare the issue resolved merely because the next backup job reports success; verify recoverability according to policy.

## Migration failure

If a migration fails:

1. Stop further migration steps.
2. Do not run ad-hoc DROP/TRUNCATE/reset commands.
3. Determine whether PostgreSQL rolled back the failed transaction or whether partial non-transactional effects exist.
4. Keep application traffic disabled or constrained if schema compatibility is uncertain.
5. Compare actual schema state with the expected migration state.
6. Choose either:
   - safe retry after correcting the cause;
   - reviewed forward repair; or
   - restore/point-in-time recovery when forward repair is unsafe.
7. Run integrity checks before returning traffic.
8. Document exactly what happened.

## Restore procedure

For a controlled restore:

1. Isolate the target environment from user traffic.
2. Confirm the selected backup/recovery point and expected data-loss window.
3. Restore into a new or isolated target where possible rather than overwriting the only copy.
4. Run schema and constraint checks.
5. Verify representative account/credential/session records without exposing secrets.
6. Run application authentication smoke tests using approved synthetic or controlled recovery credentials.
7. Review sessions restored from backup.

### Session invalidation after restore

A database restore can resurrect session rows that had already been revoked after the backup point. Before returning traffic, invalidate restored active sessions unless a separately reviewed mechanism can prove they remain safe.

The conservative default is to revoke all sessions restored from a backup and require users to authenticate again. Implement the exact production invalidation step before the first real production restore procedure is approved.

8. Verify throttling/security-event tables are operational.
9. Re-enable traffic gradually.
10. Monitor authentication errors, database health and latency.
11. Record the recovery point, duration and validation evidence.

## Synthetic restore drill

The development drill is:

1. create a disposable loopback PostgreSQL database;
2. apply reviewed migrations;
3. insert synthetic HILERA authentication data;
4. create a pg_dump logical backup;
5. destroy the disposable source database;
6. create a new disposable target;
7. pg_restore the backup;
8. verify rows, indexes, constraints and authentication behavior;
9. destroy the restored test environment.

The drill must never target production or a persistent user database.

## Suspected database corruption

If corruption is suspected:

- stop risky writes;
- preserve evidence and provider diagnostics;
- do not repeatedly restart/reset the database hoping the issue disappears;
- determine whether corruption is logical, physical or application-generated;
- involve the database/provider incident path;
- restore only from a verified recovery point;
- run integrity checks before reopening.

## Accidental destructive command

If an operator accidentally deletes or changes data:

1. stop further writes if continued activity can worsen recovery;
2. record the command/time/environment;
3. preserve logs and recovery metadata;
4. determine the last safe backup/PITR point;
5. do not overwrite the affected database with an unverified backup;
6. restore into isolation and verify first;
7. choose the recovery strategy with explicit approval;
8. review why the destructive action was possible and strengthen permissions/process.

## Recovery objectives

RPO, RTO, retention duration, backup provider and restore frequency are not yet approved production values. They must be selected before real health information is stored.

## Post-incident review

After any material database incident:

- document root cause;
- document data and availability impact;
- confirm whether identity or health data confidentiality was affected;
- verify backups and alerts;
- update tests/runbooks;
- reduce permissions or automation risk where appropriate;
- track remediation to closure.

PRD Sync Status: Not required. This runbook governs technical operations.
