# HILERA backend authentication A–D implementation specification

## Status

Implementation authorized by the Product Owner on 10 November 2026.

This specification translates the approved Master PRD authentication behaviour and approved backend architecture into implementation scope. The Master PRD remains authoritative for product behaviour.

## Goal

Replace the current non-submitting authentication preview with a production-intent first-party email-and-password authentication foundation using the existing Next.js application, PostgreSQL, Drizzle ORM and opaque server-side sessions.

This batch covers only: A database and migrations; B credentials, sign-up and sign-in; C sessions, cookie, sign-out and protected-route enforcement; D abuse controls, minimal security events and hardened public responses.

Account recovery, email ownership verification, health-information persistence, document upload/extraction, clinical logic and external authentication providers are excluded.

## Approved product behaviour

### Password policy

- Minimum 15 characters.
- Maximum 128 characters.
- No arbitrary uppercase/lowercase/number/symbol composition rule.
- Support password-manager-friendly input, including spaces and Unicode where technically safe. Normalize accepted Unicode passwords to NFC before hashing and verification.
- No routine periodic password-change requirement.
- Block common or compromised passwords using a reviewed local/offline blocklist or equivalent approach.
- Plaintext passwords must never be sent to an external password-checking service.
- Plaintext passwords must never be persisted or logged.

### Sign-up and sign-in

- Email is the initial MVP authentication identifier.
- Authentication is implemented through HILERA's own backend.
- Successful sign-up creates a secure session and routes to /onboarding.
- Successful sign-in creates a fresh secure session and routes to /app/dashboard (Overview).
- Phone authentication, SMS/WhatsApp/voice OTP, email verification and paid third-party authentication providers are excluded.
- Account recovery is excluded from A–D.
- Credential failures use generic public-safe messages and must not reveal account existence unnecessarily.

### Sessions

- Opaque random server-side session tokens.
- Only a digest of the bearer token is stored in PostgreSQL.
- Cookie name: __Host-hilera_session.
- Cookie is HttpOnly, Secure in production, SameSite=Lax, Path=/, and has no Domain attribute.
- Server-enforced 1-hour idle timeout.
- Server-enforced 24-hour absolute lifetime.
- Concurrent sessions are permitted.
- Sign out revokes the current server-side session.
- Provide an internal transactional account-wide revocation primitive for future password change, recovery and account deletion; those future capabilities must revoke all sessions when implemented.
- Passive prefetch/background activity must not renew the idle deadline by implication.

### Abuse protection

- Use temporary progressive throttling; do not implement permanent account lockout.
- Admission control occurs before expensive password hashing.
- Use shared bounded PostgreSQL-backed counters rather than process-local-only limits.
- Existing and unknown identifiers receive equivalent public-safe credential failure handling.
- Exact production numeric thresholds/windows remain security tuning parameters. Development/test values may be explicit and deterministic. Production must not silently inherit test-only thresholds.
- Any source/network signal requires trusted-ingress and privacy review; raw IP/device fingerprints must not be placed in ordinary security events by default.

### Recovery and verification

- Recovery is deferred and must not be implemented in A–D.
- Email ownership verification is deferred and must not be implemented in A–D.
- A real-user production health-account launch must not proceed until secure recovery is implemented or the Product Owner and security review explicitly accept the residual loss-of-access risk.

## Database scope

Implement only authentication/security-owned tables required by the approved technical model. Do not create health-information, measurement, document-upload, clinical, medication or risk tables.

The schema should cover users, password credentials, sessions, bounded authentication throttle/admission buckets, and minimal allowlisted security events where required by bundle D.

Requirements:

- stable internal user identifier independent of email;
- canonical email uniqueness enforced by the database;
- credential belongs to exactly one user;
- session belongs to exactly one user;
- session bearer stored only as a digest;
- expiry/revocation indexes adequate for protected-request lookup and cleanup;
- foreign keys and constraints explicitly reviewed;
- timestamps stored consistently;
- no cascade behavior that could silently erase protected audit/security information without an approved policy.

Use reviewable SQL migrations generated through Drizzle and inspect the generated SQL. Do not infer a production database provider; use environment configuration for PostgreSQL.

## Database safety and backup

Follow AGENTS.md and docs/technical/database-safety-backup.md.

For development and integration testing:

- use local PostgreSQL or a disposable PostgreSQL container if already available;
- use synthetic data only;
- never connect tests to production;
- create a logical backup from a synthetic disposable database;
- destroy the disposable source database;
- restore the backup into a new disposable database;
- run schema/integrity assertions after restore.

Do not install system-level software or use a paid provider without explicit approval. If no local PostgreSQL or Docker runtime is available, implement the test harness and report the restore drill as blocked rather than weakening the requirement.

## Credential hashing

Use the approved Argon2id architecture. Candidate package: @node-rs/argon2, subject to compatibility and dependency review.

Before finalizing parameters:

- verify the package on the repository's Node runtime;
- benchmark asynchronous verify/hash behavior on the available target-like runtime;
- select a configuration that meets current approved security guidance and reasonable HILERA capacity;
- document exact selected parameters and benchmark result;
- use fresh random salts;
- support rehash-on-success when accepted parameters become outdated;
- bound password input and hash concurrency.

Do not use plaintext comparison, reversible encryption or fast general-purpose hashing for passwords.

## Common/compromised password blocking

The implementation must be local/offline at runtime. Before adding a dependency or dataset, review maintenance status and license, ensure it makes no runtime network call containing the password, keep the dependency/data purpose narrow, and document the chosen approach. Do not silently add an external password-breach API.

## Server contracts

Use thin Next.js Server Actions for sign-up, sign-in and sign-out; server-only services/repositories for auth logic; and direct server-only current-session/current-user reads. Do not add a new public REST authentication API unless separately approved.

Expected successful navigation:

- sign-up -> /onboarding;
- sign-in -> /app/dashboard;
- sign-out -> use the existing approved public/sign-in destination consistently; do not add new account-lifecycle behaviour.

## Route protection and authorization

Protect authenticated HILERA application surfaces server-side, including direct requests. At minimum cover the existing /app journal routes and onboarding where authenticated state is required by the approved journey.

- Never treat the /app URL prefix by itself as authorization.
- Derive user identity only from a validated server-side session.
- Never trust a browser-provided user ID for ownership.
- Fail closed when session validity cannot be checked.
- Prevent protected content from being emitted into unauthenticated HTML/server payloads or shared caches.

No clinician, caregiver, employer, shared-account or admin role model is introduced by this batch.

## CSRF and origin controls

Implement the candidate controls documented in AUTH-ARCH-009 for review in this PR: non-GET browser mutations; exact trusted-origin validation; safe Referer fallback only when Origin is absent; rejection of null/malformed/mismatched origins; session-bound CSRF token for cookie-authenticated writes using a dedicated signing key; no token in URLs/logs; explicit proxy/forwarded-header assumptions and tests.

Treat this as controlled security implementation subject to final security review before merge/exposure. Do not weaken it for convenience.

## Session activity

Implement the approved idle-renewal policy. Qualifying activity is explicit authenticated pointer interaction (including touch through Pointer Events) or non-repeated keyboard input. Passive page reads, direct navigation, Next.js prefetch, timers and background work must not renew. Coalesce client renewal requests and bound server writes to approximately one write per five minutes per active session. Absolute expiry never extends; expired or revoked sessions cannot revive. Concurrent renewal attempts must be safe and tested.

## Security events and logging

Keep security events minimal and allowlisted. Initial categories may include account creation, successful sign-in, failed sign-in, sign-out, session revocation and operational throttle state where justified.

Do not log or persist plaintext passwords, password hashes, raw session tokens, session-token digests, CSRF tokens, cookies, database credentials, raw health information, questionnaire answers, raw request bodies, raw email addresses unless separately justified, or raw IP/device fingerprints by default.

Exact retention/deletion policy for security events is not approved for production exposure. Keep implementation compatible with a later retention job and document the unresolved gate.

## Environment and secrets

- Use server-only environment variables.
- Do not introduce NEXT_PUBLIC_* secrets.
- Keep local secret files ignored.
- Update an inert .env.example only if needed, with names but no secrets.
- Separate runtime and migration database roles/configuration where practical.
- Production configuration must fail safely when required secrets are missing.
- No production secrets in tests, screenshots, docs, logs or Git history.

## UI requirements

Preserve the approved Editorial Health Journal visual system. Convert the existing sign-up/sign-in previews into working forms without redesigning unrelated pages. Validation must be understandable and accessible. Password guidance must state the 15-character minimum without arbitrary composition instructions. Browser/password-manager autofill should work. Do not expose account existence through sign-in failure copy. Recovery remains visibly unavailable/deferred.

Do not add health-information persistence in this batch.

## Dependencies, assumptions and controlled risks

Dependencies: compatible Node runtime, PostgreSQL for integration/restore testing, approved Drizzle + node-postgres architecture, TLS in production, and no selected production DB provider.

Assumptions: email is an identifier rather than proof of mailbox ownership; recovery and verification are absent; no health data is stored in this batch; local/test data is synthetic.

Key risks and mitigations:

- Password-only access without recovery: recovery is a production exposure gate; do not invent a mechanism.
- Unverified email: canonical uniqueness and enumeration-resistant behavior; never claim mailbox ownership.
- Argon2 resource exhaustion: admission control before KDF, bounded concurrency, benchmarked parameters.
- Session theft: strong opaque tokens, secure cookie, server-side revocation, idle/absolute expiry, no logging.
- Database damage: strict environment separation, synthetic disposable DBs, reviewed migrations and restore drill.
- Throttle denial of service: temporary throttling, no permanent lockout, bounded keys and shared-network testing.

## Acceptance criteria

Implementation is not ready for review until all applicable checks pass:

1. pnpm lint.
2. pnpm typecheck.
3. existing and new unit tests.
4. PostgreSQL integration tests using a disposable synthetic database.
5. production build.
6. git diff --check.
7. migration SQL reviewed and replayed from empty database.
8. synthetic backup/restore drill completed when local PostgreSQL/container is available.
9. sign-up creates one account/credential/session atomically and routes to Onboarding.
10. sign-in validates credentials, issues a fresh session and routes to Overview.
11. duplicate/canonical email concurrency cannot create duplicate accounts.
12. passwords are never persisted/logged plaintext and hashes are Argon2id with reviewed parameters.
13. common/compromised-password blocking works locally/offline.
14. unauthenticated direct requests cannot receive protected content.
15. two synthetic users cannot cross user boundaries in auth-owned data.
16. logout revokes the server session and replay fails.
17. idle and absolute session expiry are deterministic and tested.
18. concurrent sessions behave according to approved policy.
19. account-wide revocation primitive is tested internally but no unapproved password-change/recovery/deletion UI is added.
20. generic invalid-credential responses do not distinguish unknown email versus wrong password through normal response semantics.
21. throttling occurs before expensive KDF work and expires without permanent lockout.
22. cross-origin state-changing requests fail according to reviewed CSRF/origin controls.
23. logs/events are inspected for credential/session/health-data leakage.
24. no health tables, document upload, OCR, clinical logic, medication logic, AI interpretation or external auth provider is added.
25. responsive sign-up/sign-in UI is visually checked at representative desktop/mobile widths.
26. technical documentation is updated to match implemented behavior.

## Required final report from Codex

Return branch and final commit SHA; implementation summary by A/B/C/D; migrations/schema summary; dependencies with versions/rationale; Argon2id parameters and benchmark; password-blocklist approach and license/runtime-network confirmation; session idle-renewal definition; throttling configuration model and dev/test values; CSRF/origin summary; backup/restore drill result; all tests/checks; security/privacy findings; unresolved gates; changed files; confirmation that no health/document/clinical functionality was added; and PR URL.

Do not merge the PR. Stop after pushing implementation and opening the PR for review.