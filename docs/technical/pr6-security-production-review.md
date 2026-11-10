# PR #6 security and production-readiness review

## Review status

Comprehensive static review completed on 10 November 2026 for draft PR #6, `backend/auth-foundation`.

This review covers the authentication/database scope implemented by PR #6. It does not approve the PR for merge or production exposure. Runtime PostgreSQL validation, lockfile/toolchain regeneration and deployment-specific security checks remain outstanding.

## Scope reviewed

The review covered:

- password policy, hashing and common-password blocking;
- signup/signin service and Server Action boundaries;
- session issuance, lookup, idle/absolute expiry, renewal and revocation;
- cookies and CSRF/origin checks;
- server-side protected-route behavior;
- PostgreSQL schema, constraints, indexes and migration intent;
- shared authentication throttling;
- minimal security-event persistence;
- database safety, backup/restore and stale-session risk;
- secrets/environment configuration;
- dependency/security-patch posture;
- logging/observability privacy boundaries;
- production release gates;
- technical-document consistency with the approved Master PRD.

No health-information persistence, document upload/OCR, clinical logic, medication logic, risk calculation, email verification, recovery, phone auth or external auth provider was added during this review.

## Material issues found and resolved

### 1. Idle timeout semantics

**Finding:** The first implementation created a one-hour idle deadline but never renewed it. That was effectively a fixed one-hour session lifetime rather than the approved one-hour inactivity timeout.

**Resolution:** Added explicit bounded idle renewal. Browser-trusted pointer/touch interaction, trusted wheel/trackpad scrolling and non-repeated keyboard input can request renewal. Script-generated events, passive reads, direct navigation, RSC prefetch, timers and background work do not renew. Client requests and server writes are coalesced. The 24-hour absolute deadline never moves and expired/revoked sessions cannot be revived.

**Remaining evidence:** Execute the PostgreSQL concurrency/expiry integration tests.

### 2. Security-sensitive framework pin

**Finding:** Next.js resolved to 16.4.6 but the direct dependency used a caret range.

**Resolution:** Pin Next.js exactly to 16.4.6.

**Remaining evidence:** Use pnpm on the development machine to align `eslint-config-next` to the reviewed compatible 16.4.6 release, regenerate the lockfile, and rerun frozen-install/audit/lint/typecheck/test/build checks.

### 3. Unicode password normalization

**Finding:** Unicode passwords were accepted but hashed in their submitted normalization form. Canonically equivalent Unicode forms could therefore behave as different passwords.

**Resolution:** Normalize accepted passwords to Unicode NFC before hashing and verification. Blocklist comparison remains a separate compatibility comparison key. Tests now require canonically equivalent NFD/NFC input to authenticate consistently.

### 4. Authentication service boundary

**Finding:** The UI Server Action normalized email and enforced password policy, but lower-level authentication services assumed every future caller would do so.

**Resolution:** The server authentication service now normalizes/validates its own credential inputs before throttle/database/KDF work. Unit tests cover direct malformed calls.

### 5. Database restore can resurrect sessions

**Finding:** A backup can contain a session that was valid at the backup point but revoked later. Restoring that backup can make the old bearer valid again unless recovery explicitly invalidates sessions.

**Resolution:** The recovery runbook now requires restored-session invalidation before traffic resumes. The synthetic restore integration test demonstrates the resurrection risk and verifies invalidation of restored sessions.

**Remaining evidence:** Execute the dump/destroy/restore test against disposable PostgreSQL.

### 6. Technical-document drift

**Finding:** Several architecture documents still described authentication as a future preview and listed already-approved password/session decisions as unresolved.

**Resolution:** Updated the architecture, contracts, threat model, data model, decision register and implementation notes to distinguish implemented draft state from remaining release gates.

### 7. Database safety and operational readiness

**Finding:** Backup principles existed but needed a concrete release/incident procedure.

**Resolution:** Added:
- `auth-production-readiness.md`;
- `auth-observability-boundaries.md`;
- `database-incident-recovery-runbook.md`.

The database policy now requires a supported, security-patched PostgreSQL release and patched backup/restore tooling for validation.

## Security posture after fixes

### Passwords

- 15–128 Unicode code points.
- NFC normalization before hashing/verification.
- No arbitrary composition rules.
- Local/offline common-password blocklist.
- Argon2id with fresh salt.
- Password/hash excluded from public output and intended telemetry.
- Hash concurrency bounded.

### Sessions

- 256-bit opaque random bearer.
- Database stores only SHA-256 bearer digest.
- Production host-only Secure/HttpOnly/SameSite=Lax cookie.
- One-hour inactivity deadline.
- 24-hour absolute lifetime.
- Bounded explicit activity renewal.
- Concurrent sessions permitted.
- Current-session logout is server-side revocation.
- Account-wide internal revocation primitive exists for future credential/account lifecycle flows.

### Authorization

- Protected app/onboarding surfaces validate the authoritative database session server-side.
- Browser-supplied user IDs are not used for ownership.
- No role/clinician/admin model was added.
- Health-facing pages remain synthetic.

### Request integrity

- State-changing auth actions use exact configured origin validation.
- Referer is only a fallback when Origin is absent.
- Authenticated sign-out/activity renewal require a session-bound CSRF proof.
- Invalid/unverifiable origins fail closed.

### Abuse controls

- Shared PostgreSQL admission before Argon2 work.
- Global plus HMAC-pseudonymous identifier buckets.
- Temporary progressive cooldown.
- No permanent unauthenticated account lockout.
- Production numeric tuning remains explicit configuration/review.

### Privacy and telemetry

- Minimal security-event schema.
- Failed sign-in events do not store attempted raw email.
- No approved raw IP/device fingerprint collection.
- Observability policy prohibits credentials, session secrets, health information and unrestricted request bodies.

## Remaining merge blockers

PR #6 must remain draft until all of the following are evidenced:

1. Align `eslint-config-next` with Next.js 16.4.6 using pnpm and regenerate/freeze the lockfile.
2. Run PostgreSQL-dependent tests rather than skipping them.
3. Replay migration into an empty disposable PostgreSQL database.
4. Run duplicate-signup/concurrency, two-user isolation, throttle, renewal, revocation and expiry integration checks.
5. Run synthetic `pg_dump` -> destroy source DB -> `pg_restore` -> integrity verification.
6. Prove restored active sessions are invalidated before restored service traffic.
7. Run actual local synthetic journey: Create account -> Onboarding -> Sign out -> Sign in -> Overview.
8. Rerun lint, typecheck, complete tests, production build, production dependency audit and diff check.
9. Re-run browser QA after the local database is configured.
10. Review actual production TLS ingress, trusted origin, forwarded headers, shared-cache behavior, runtime DB grants and production throttle capacity before deployment.

## Production exposure blockers beyond merge

Merge readiness is not the same as production readiness.

Before normal real-user production exposure:

- select production PostgreSQL provider/version/region and validate against that major;
- enable automated encrypted backups and PITR where supported;
- define RPO/RTO/retention and periodic restore testing;
- configure operational monitoring and alerting without sensitive-data leakage;
- approve security-event retention and operator access;
- benchmark Argon2 on the actual deployment runtime;
- validate TLS ingress and security headers;
- implement approved secure account recovery, or explicitly document Product Owner + security acceptance of the residual loss-of-access risk;
- revisit email local-part case policy before recovery/email verification.

Before real **health-information** persistence, complete the separate health-data/database/privacy/clinical gates. Authentication readiness alone does not authorize storing health information.

## Email identity residual risk

The current canonicalization lowercases the domain but preserves local-part case. This is technically conservative under SMTP but can allow visually similar addresses with different local-part case to become separate HILERA identities even when a particular mailbox provider treats them as equivalent.

Do not silently fold local-part case or provider-specific dot/plus rules. Decide this intentionally before recovery/email verification or real-user rollout, with collision/migration analysis.

## Review conclusion

No static finding identified in this review justifies bypassing the remaining PostgreSQL or deployment validation gates. The branch is materially safer and more internally consistent after the fixes above, but it must remain draft and unmerged until the machine-dependent evidence is complete.

PRD Sync Status: Not required. This review and its fixes implement or harden already-approved authentication behavior and technical controls.
