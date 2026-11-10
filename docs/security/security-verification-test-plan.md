# HILERA Security Verification Test Plan

## Status

**Type:** Security assurance / test specification  
**Status:** Draft for execution and review  
**Scope:** Authentication foundation, supporting platform controls, and future sensitive-data boundary  
**Product behavior:** No new product or clinical behavior is approved by this document.

This plan is informed by OWASP ASVS 5.0.0, OWASP Cheat Sheet guidance, the HILERA authentication threat model, PR #6 security review, and the Master PRD. It is not a claim of ASVS certification or full conformance. Requirement-level ASVS mapping should be added only after the tests are executed and evidence is collected.

References:
- OWASP ASVS 5.0.0: https://asvs.owasp.org/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP Software Supply Chain Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html

## Security test principles

1. Use only synthetic identities and synthetic health information.
2. Never point destructive, restore, fuzz, load, or migration tests at production.
3. Treat every Server Action as directly callable and every browser input/header/cookie as untrusted.
4. Test the negative path, not only success.
5. Evidence must include command/test name, environment, result, and relevant sanitized output.
6. A passing unit test does not replace an integration test where PostgreSQL, cookies, browser behavior, or concurrency are part of the control.
7. Do not mark a security control complete if the required test was skipped because infrastructure was unavailable.
8. Do not weaken a control just to make a test pass.

## Severity model

- **Critical:** likely account compromise, cross-user health-data disclosure, credential/secret exposure, or destructive database failure.
- **High:** authentication/authorization bypass, persistent session compromise, serious injection, recovery takeover, or material privacy breach.
- **Medium:** meaningful abuse, denial-of-service, information leakage, unsafe configuration, or defense-in-depth failure.
- **Low:** hardening, usability-security ambiguity, or limited-scope issue with no direct sensitive-data compromise.

## A. Authentication and credential tests

| ID | Test | Attack / failure scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| AUTH-01 | Unknown vs wrong password parity | Compare unknown email and known email/wrong password | Same public-safe error category; no account existence detail | High |
| AUTH-02 | Duplicate registration | Register same canonical email concurrently | Exactly one account; duplicate cannot change/merge/sign into existing account | High |
| AUTH-03 | Direct service bypass | Call auth service with malformed/un-normalized input | Service rejects independently of UI validation | High |
| AUTH-04 | Password minimum | 14-character password | Rejected | Medium |
| AUTH-05 | Password maximum | 129 Unicode code points | Rejected before expensive work | Medium |
| AUTH-06 | Unicode canonical equivalence | Register NFC form, authenticate with canonically equivalent NFD | Authentication semantics remain stable under approved NFC normalization | Medium |
| AUTH-07 | Control characters | Password containing prohibited control character | Rejected safely; no logging of password | Medium |
| AUTH-08 | Common password | Known blocklisted password | Rejected locally/offline with safe guidance | Medium |
| AUTH-09 | Password network leakage | Observe outbound requests during password validation | No password or password-derived lookup sent to external service | Critical |
| AUTH-10 | Argon2 format | Inspect stored synthetic credential | Argon2id encoded hash only; no plaintext/reversible representation | Critical |
| AUTH-11 | Fresh salts | Hash same password twice | Encoded hashes differ | High |
| AUTH-12 | Rehash-on-success | Authenticate credential with approved weaker historical parameters | Successful verification can upgrade safely without changing password-change semantics | Medium |
| AUTH-13 | Hash overload | Exceed per-process hash concurrency | Work is bounded/fails safely; no unbounded queue | High |
| AUTH-14 | Oversized form | Submit oversized email/password/form fields | Rejected before expensive work; no process crash | Medium |
| AUTH-15 | Mass assignment | Add userId/role/admin/redirect fields to auth form | Unexpected fields rejected/ignored safely; no privilege effect | Critical |

## B. Session and cookie tests

| ID | Test | Attack / failure scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| SES-01 | Token entropy/shape | Inspect issued synthetic session | 256-bit opaque random bearer; canonical encoding | High |
| SES-02 | DB bearer storage | Inspect session row | Only SHA-256 digest stored; raw bearer absent | Critical |
| SES-03 | Cookie flags | Production-like HTTPS | __Host-hilera_session; Secure; HttpOnly; SameSite=Lax; Path=/; no Domain | High |
| SES-04 | Session fixation | Present an existing active bearer before sign-in | Successful sign-in rotates/replaces presented session per policy | High |
| SES-05 | Logout replay | Reuse bearer after logout | Rejected | Critical |
| SES-06 | Idle expiry | No qualifying activity for 1 hour | Session rejected at boundary | High |
| SES-07 | Idle renewal | Trusted pointer/touch/wheel/keyboard activity | Idle deadline renews within bounded write policy | Medium |
| SES-08 | Synthetic activity | Script-dispatched DOM events | Do not renew | Medium |
| SES-09 | Prefetch/background | RSC prefetch/navigation/background traffic | Do not renew | High |
| SES-10 | Absolute expiry | Keep interacting beyond 24-hour absolute age | Session still expires; absolute deadline never moves | High |
| SES-11 | Concurrent renewal | Two renewal requests at same time | Safe/coalesced; no deadline corruption | Medium |
| SES-12 | Revoked-session renewal | Renewal races with logout/revocation | Revoked session cannot be revived | Critical |
| SES-13 | Expired-session renewal | Renewal after idle/absolute expiry | Expired session cannot be revived | Critical |
| SES-14 | Concurrent sessions | Two legitimate device sessions | Both remain valid until independently revoked/expired | Medium |
| SES-15 | Account-wide primitive | Internal revoke-all invoked in test transaction | All sessions for owner revoked; other users unaffected | High |

## C. CSRF, origin and browser mutation tests

| ID | Test | Scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| CSRF-01 | Foreign Origin | POST auth mutation from foreign origin | Rejected | High |
| CSRF-02 | Sibling subdomain | POST from sibling origin | Rejected unless explicitly trusted | High |
| CSRF-03 | Null Origin | Null/malformed Origin | Fail closed | High |
| CSRF-04 | Referer fallback | Origin absent, exact trusted Referer present | Allowed only under documented fallback | Medium |
| CSRF-05 | Spoofed forwarding headers | Set Host/X-Forwarded-Host/X-Forwarded-Proto | Application must not trust them for auth origin decision | High |
| CSRF-06 | Session-bound proof | Use CSRF token from another session | Rejected | High |
| CSRF-07 | Modified proof | Change one byte/padding/canonical encoding | Rejected | Medium |
| CSRF-08 | Missing proof | Authenticated sign-out/activity mutation without proof | Rejected/no mutation | High |
| CSRF-09 | Direct Server Action | Invoke action without UI | Same validation and authorization as browser path | High |

## D. Authorization and cross-user isolation tests

| ID | Test | Scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| AUTHZ-01 | Direct protected route | Anonymous hard-refresh to every protected route | Redirect/fail closed; no protected payload emitted | Critical |
| AUTHZ-02 | RSC/prefetch | Anonymous prefetch/RSC request | No protected user content | Critical |
| AUTHZ-03 | Browser-supplied owner | Send another user ID in request/form | Ignored/rejected; server session remains authority | Critical |
| AUTHZ-04 | Cross-user auth-owned rows | User A attempts to revoke/read User B session | No effect/no disclosure | Critical |
| AUTHZ-05 | DB outage on protected read | Session database unavailable | Fail closed; no cached protected content | Critical |
| AUTHZ-06 | Shared cache | Inspect CDN/runtime caching of authenticated pages | Personalized/protected response must not enter shared public cache | Critical |

When health persistence is implemented, extend this section with object-level authorization tests for every health record read, correction, delete/request-delete, trend query, export, and document association.

## E. Input, injection and database tests

| ID | Test | Scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| DB-01 | SQL injection strings | Email/password/form inputs containing SQL metacharacters | Values parameterized; no SQL control | Critical |
| DB-02 | Empty migration replay | Apply migration to empty disposable DB | Successful and deterministic | High |
| DB-03 | Constraint enforcement | Invalid digest length/timestamp order/duplicate identity | Database rejects invalid state | High |
| DB-04 | Foreign-key isolation | Invalid ownership references | Database rejects | High |
| DB-05 | Destructive migration scan | Review SQL for DROP/TRUNCATE/data rewrite | No destructive operation without explicit approval/recovery plan | Critical |
| DB-06 | Runtime role | Runtime connection attempts schema/admin operation | Denied under least privilege once production role exists | High |
| DB-07 | TLS enforcement | Production DATABASE_URL without verify-full | Application refuses configuration | High |
| DB-08 | Statement timeout | Deliberately slow test query in controlled environment | Bounded according to runtime policy | Medium |

## F. Abuse, throttling and denial-of-service tests

| ID | Test | Scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| ABUSE-01 | Admission before KDF | Burst attempts | PostgreSQL admission decision occurs before Argon2 | High |
| ABUSE-02 | Fleet/global concurrency | Parallel distinct identities | Shared global budget respected | High |
| ABUSE-03 | Per-identity cooldown | Repeated same canonical identity | Progressive temporary cooldown | High |
| ABUSE-04 | No permanent lockout | Wait for approved window | Legitimate account can retry; no permanent unauthenticated lock | High |
| ABUSE-05 | Cooldown non-extension | Requests during cooldown | Do not indefinitely prolong cooldown by implication | Medium |
| ABUSE-06 | High-cardinality identities | Many random identifiers | Bucket storage remains bounded | High |
| ABUSE-07 | Throttle DB failure | Store unavailable | Auth work fails unavailable before expensive KDF | High |
| ABUSE-08 | Shared-network assumptions | Simulate high shared traffic | Document observed user friction before production tuning | Medium |

## G. Error handling, logging, telemetry and privacy tests

| ID | Test | Scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| LOG-01 | Password canary | Submit unique synthetic password marker | Marker absent from app/platform logs/traces | Critical |
| LOG-02 | Session canary | Use unique synthetic session/cookie marker | Raw bearer/digest absent from logs/traces | Critical |
| LOG-03 | CSRF canary | Unique proof marker | Absent from logs/URLs | High |
| LOG-04 | DB URL canary | Controlled invalid connection string | Credentials absent from surfaced error/logs | Critical |
| LOG-05 | Health-data canary | Future synthetic health marker | No raw health value in general analytics/logs by default | Critical |
| LOG-06 | Error response | Force DB/service error | Generic public failure; no SQL/stack/secret/internal IDs | High |
| LOG-07 | Failed-login event | Failed auth | Minimal allowlisted event; attempted raw email absent | Medium |
| LOG-08 | Observability role | Inspect normal dashboard permissions | System health visible without health/credential content | High |

## H. Backup, restore and migration-recovery tests

| ID | Test | Scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| REC-01 | Synthetic backup | pg_dump disposable migrated DB | Backup succeeds | High |
| REC-02 | Source destruction | Delete disposable source after backup | Restore does not rely on source remaining | High |
| REC-03 | Restore integrity | pg_restore into fresh disposable DB | Rows, constraints and indexes intact | Critical |
| REC-04 | Restored session resurrection | Bearer valid at backup point | Test demonstrates it is valid immediately after restore | Critical |
| REC-05 | Restore invalidation | Apply documented restore session invalidation | Backed-up bearer rejected before traffic | Critical |
| REC-06 | Duplicate identity after restore | Insert duplicate canonical email | Constraint still enforced | High |
| REC-07 | Authentication after restore | Sign in with synthetic credential after invalidating restored sessions | Fresh authentication succeeds and issues new session | High |
| REC-08 | Backup tool failure | Missing/incompatible pg_dump/pg_restore | Test fails explicitly; never silently skips success | Medium |

## I. Dependency, build and deployment security tests

| ID | Test | Scenario | Expected secure behavior | Severity |
| --- | --- | --- | --- | --- |
| SUP-01 | Frozen lock install | pnpm install --frozen-lockfile | Reproducible install | High |
| SUP-02 | Production audit | pnpm audit --prod | No unresolved critical/high finding accepted silently | High |
| SUP-03 | Full audit | Review dev and prod advisories | Dev-tool vulnerabilities triaged, especially reachable local servers | Medium |
| SUP-04 | Version drift | Compare package.json to lockfile | Security-sensitive packages aligned/pinned as reviewed | High |
| SUP-05 | Framework alignment | Next.js and eslint-config-next versions | Compatible reviewed toolchain | Medium |
| SUP-06 | Secret scan | Scan tracked files/history before release | No committed secrets | Critical |
| SUP-07 | Build provenance | CI/CD release artifact review | Artifact built from authorized reviewed branch/commit | High |
| SUP-08 | Branch protection | Attempt direct material change to main | Protected workflow prevents bypass where configured | High |

## J. Recovery tests — when recovery is separately approved

Recovery is not implemented by PR #6. Do not implement these tests until the Product Owner approves a mechanism.

Required cases will include:

- generic request response for existing/non-existing email;
- rate-limited recovery request;
- cryptographically random single-use reset token;
- secure server-side token storage;
- short expiry;
- trusted reset URL construction, never Host-header-derived;
- no reset-token leakage through logs, analytics, referrer, or third parties;
- password policy reused at reset;
- recovery does not auto-login the user;
- all prior sessions revoked after completed recovery;
- all outstanding recovery tokens invalidated after use;
- security notification after password reset;
- email local-part identity policy applied consistently across signup, signin and recovery;
- security questions prohibited as sole recovery proof;
- support-assisted recovery protected against social engineering if ever introduced.

## Execution phases

### Phase 1 — Authentication-foundation evidence baseline

This phase was executed for PR #6 before merge. The final evidence included real PostgreSQL integration, backup/restore, authenticated browser flows, security/runtime checks and dependency remediation. Retain these tests as the regression baseline for future authentication changes.

### Phase 2 — Production-like deployment review

Repeat cookie/origin/cache/TLS/logging and database-role tests through the actual ingress/runtime. Validate monitoring and backup alerts.

### Phase 3 — Before real health data

Extend authorization/privacy tests to the approved health-data model, Data Dictionary, correction behavior, retention/deletion behavior, and document upload architecture.

## Authentication regression criteria

For any future material authentication change, rerun the applicable PR #6 regression evidence. Do not accept an unresolved Critical or High authentication/security finding without explicit Product Owner and security review.

**PRD Sync Status: Not Required.** This plan verifies approved behavior and technical controls.
