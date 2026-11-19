# Basic profile and onboarding

The authenticated profile stores the three approved fields: preferred name, date of birth as a calendar date, and Nigeria market context. Migration `0008` adds one owner-keyed row with nullable fields for partial setup; it does not alter health data. A complete profile has all three values. Profile completion does not imply consent, which remains pending.

The server action derives ownership from the session, validates the trusted origin and session CSRF token, checks each supplied field, and upserts only that owner's row. Save for later accepts valid partial fields; Continue requires all fields. Values are not placed in URLs or browser storage. Overview uses the stored name and offers setup while fields are incomplete. No age eligibility or clinical calculation is performed.

Only a synthetic disposable database may be migrated for testing. Applying migration `0008` to any persistent local, staging or production database requires separate Product Owner authorization and a reviewed backup and rollout plan.

## Migration 0008 procedure (not authorization)

1. Inventory the target and confirm its environment, owner, credentials and expected current migration `0007` without printing connection strings. Stop if the target or data is uncertain. Obtain explicit Product Owner authorization for that specific persistent target before proceeding. Production additionally requires its separate security/release and migration approvals.
2. Stop application writes and background jobs, including older app instances; restrict access to an approved operator. Confirm sufficient space and capture an encrypted, access-controlled backup or recovery point using the environment's approved tooling. Record its identifier and time without copying real records to a workstation. Verify restore and integrity in an isolated approved environment using synthetic or separately approved sanitized data; an untested backup is not operationally verified.
3. Rehearse the exact migration sequence from `0007` through `0008` on isolated synthetic PostgreSQL. Verify existing account, session, document and health data, profile ownership, nullable partial fields, foreign keys, market constraint, and migration journal. Record checks and the operator's rollback/forward-repair decision.
4. After authorization and a verified recovery point, apply the reviewed migration once with the designated migration role and approved deployment procedure. Do not expose credentials or record contents in command lines, logs or tickets. Check the journal and schema with least-privilege access; perform owner-scoped profile save, resume and sign-in checks with dedicated synthetic accounts only if the target permits them. Confirm health-write verification and session behavior remain intact, then restore service under the approved cutover plan.
5. If migration or smoke checks fail, stop writes and deployment. Preserve logs without secrets or identity/health values, assess journal/schema state and use a reviewed forward repair where possible. If recovery is necessary, restore the verified backup into an isolated replacement and verify integrity before any approved cutover. Do not drop `user_profiles`, overwrite databases or discard new profile data as an automatic rollback. Reconcile any writes made after the recovery point; escalation and data-loss decisions require explicit approval.

The profile date rejects future calendar dates using the Nigeria-first market's Lagos calendar. This is input data quality, not age eligibility or clinical behavior.

Verification guidance reports development sender configuration and the signed-in user's test-allowlist eligibility without exposing keys or changing public recovery responses. Production email remains disabled.
