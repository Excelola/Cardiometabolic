# HILERA authentication data model

This is the reviewed PostgreSQL authentication model implemented on draft PR #6 under [AUTH-ARCH-002, AUTH-ARCH-003, AUTH-ARCH-004, AUTH-ARCH-005, AUTH-ARCH-010, AUTH-ARCH-012 and AUTH-ARCH-016](auth-security-decisions.md). The migration remains subject to disposable PostgreSQL replay, concurrency and restore validation before merge/readiness. The Master PRD governs account behaviour and user data. The model covers email/password identity, credentials, revocable sessions, bounded abuse controls and minimal security events. Health records, questionnaires, clinical data, recovery credentials and email verification are outside its scope.

“Required technical field” means required **if the recommended design is approved**. Recommended fields have a concrete operational purpose. Optional fields need a specific justification before adoption. Deferred fields need a product or privacy decision. PostgreSQL types and names below are proposals, with the migration design subject to review.

```text
users 1 ───── 1 credentials
users 1 ───── * sessions
users 0..1 ── * security_events

auth_throttle_buckets   separate, expiring, pseudonymous counters
```

## User identity

| Field and candidate type | Classification | Purpose and handling |
| --- | --- | --- |
| `id` · UUID | Required technical field | Immutable, server-generated primary key. Internal ownership key, separate from the sign-in identifier. Possession of an ID confers no access. |
| `normalized_email` · text | Required technical field | Canonical, sensitive sign-in identifier. Non-null and unique under a deterministic comparison that matches the approved canonicalization. |
| `email` · text | Optional | Presentation form of the submitted address. Prefer a single canonical field unless retaining the exact presentation has an approved purpose. Both values would be sensitive. |
| `account_status` · constrained text | Deferred pending product/privacy decision | Requires an approved lifecycle and transitions. Keep the existing product journey states separate from account access. |
| `created_at` · timestamptz | Required technical field | Server-generated account creation time. |
| `updated_at` · timestamptz | Optional | Add only with a defined mutable identity operation and reliable update semantics. |

## Credential

| Field and candidate type | Classification | Purpose and handling |
| --- | --- | --- |
| `user_id` · UUID | Required technical field | Primary key and foreign key to `users.id`. Enforces at most one password credential per user. A signup transaction enforces that a new account has one. |
| `password_hash` · text | Required technical field | Sensitive Argon2id encoded hash containing algorithm, format version, parameters and per-password salt. The library produces a fresh salt for each hash. Limit reads to server-side verification and credential maintenance. |
| `password_changed_at` · timestamptz | Recommended technical field | Initial password set or actual replacement time, kept distinct from a parameter-only rehash. Include when its approved security use is specified. |
| `created_at` · timestamptz | Recommended technical field | Server-generated credential-row creation time. |
| `hash_algorithm` or `hash_policy_version` · constrained identifier | Optional | The encoded hash already carries verification parameters. Add separate policy metadata only when a migration or key rotation needs information the format cannot express. |

Raw passwords exist only in bounded server-side request and verification handling. They are excluded from rows, logs, background jobs, trace payloads and client responses. Credential hashes and salts stay in the credential boundary. On valid sign-in, compare stored parameters against the approved policy and rehash if needed. A parameter-only rehash preserves password-change semantics. [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## Session

| Field and candidate type | Classification | Purpose and handling |
| --- | --- | --- |
| `id` · UUID | Required technical field | Internal primary key. It is neither the cookie bearer nor a public identifier. |
| `user_id` · UUID | Required technical field | Non-null foreign key to `users.id`. Defines which user owns this session. |
| `token_hash` · bytea | Required technical field | Unique 32-byte SHA-256 digest of a canonical 256-bit random token. Internal only, including in logs and responses. |
| `created_at` · timestamptz | Required technical field | Server-generated issuance time. |
| `idle_expires_at` · timestamptz | Required technical field | Server-enforced idle deadline. Activity writes use a bounded cadence and never extend past the absolute deadline. |
| `absolute_expires_at` · timestamptz | Required technical field | Server-enforced maximum lifetime. Remains fixed for the life of the session. |
| `revoked_at` · nullable timestamptz | Required technical field | Null until revoked. Record the first server-side revocation. |
| `last_seen_at` · timestamptz | Optional | Omit initially. The idle deadline is sufficient for validation and avoids an additional activity history field. |
| IP, user agent or device fingerprint | Deferred pending product/privacy decision | Requires a specific purpose, minimization, access and retention decision. The MVP session check does not depend on device identity. |

The random bearer is issued only through the secure session cookie and persisted only as its digest. Database possession of a digest alone does not provide a reusable cookie. An active lookup requires an owned row with a matching digest, no revocation and both deadlines in the future. Check the expiry and revocation conditions again in any guarded idle renewal so a racing request cannot revive a revoked or expired row. Use a consistent trusted clock for each comparison and update. V1 uses a 1-hour idle timeout, a 24-hour absolute lifetime and permits concurrent sessions. Qualifying renewal activity is explicit authenticated pointer interaction (including touch through Pointer Events), trusted wheel/trackpad scrolling, or non-repeated keyboard input; passive reads, direct navigation, prefetch, timers and background work do not renew. [Node.js crypto](https://nodejs.org/api/crypto.html), [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## Security event

| Field and candidate type | Classification | Purpose and handling |
| --- | --- | --- |
| `id` · UUID | Required technical field | Event primary key. |
| `user_id` · nullable UUID | Recommended technical field | Link only when necessary and authorized. Failure paths can use a null actor reference without storing the attempted address. |
| `event_type` · constrained identifier | Required technical field | Closed set of reviewed categories. Candidate events include account creation, sign-in, sign-out and session revocation. Password change and recovery events depend on those workflows being approved. |
| `outcome` · constrained identifier | Optional in the initial schema | The initial implementation encodes the coarse outcome in the closed `event_type` itself (`sign_in_succeeded`, `sign_in_failed`, and similar) and enforces attribution with schema constraints. Add a separate outcome column only if a later reviewed event taxonomy needs it. |
| `occurred_at` · timestamptz | Required technical field | Server-generated event time. |
| `context_code` · constrained identifier | Optional | Allowlisted operational category when needed. No free text, arbitrary payloads or request dumps. |
| IP address, network/device metadata or persistent correlation identifier | Deferred pending product/privacy decision | Requires a defined abuse or incident purpose, retention and authorized readers. |

Treat all event rows as sensitive, including rows with no user reference. Append through an allowlisted writer with scoped access, defined retention and bounded event volume. A separate retention role can remove eligible rows. Successful transactional writes and their event recording should agree on whether the operation committed. Failed login observation can use bounded counters and reviewed event sampling so an unauthenticated flood cannot create an unbounded audit stream. Exclude passwords, hashes, bearers, raw email addresses, health values and questionnaire answers. [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## Shared abuse-control bucket

| Field and candidate type | Classification | Purpose and handling |
| --- | --- | --- |
| `scope` · constrained identifier | Required technical field | Separates global admission from per-identifier controls for existing and unknown accounts. Any source-signal scope requires privacy review. |
| `bucket_key` · bytea or bounded integer | Required technical field | Server-derived pseudonymous key or bounded bucket number. For identifier-based keys, use a dedicated keyed HMAC over the canonical identifier and scope, then retain only the result needed for lookup. |
| `window_ends_at` · timestamptz | Required technical field | Server-defined boundary for resetting or expiring a window. |
| `attempt_count` · bounded integer | Required technical field | Non-negative atomic counter with saturation or an equivalent overflow guard. |
| `failure_count` · bounded integer | Recommended technical field | Track outcomes independently where useful so admission can reserve capacity before expensive verification. |
| `key_version` · constrained identifier | Optional | Supports a reviewed rotation policy if overlapping bucket keys are needed. |
| Network or device keys | Deferred pending product/privacy decision | Derive any approved network key at a trusted ingress boundary. Raw identifiers and raw forwarded headers are not persisted in this table. |

Use one shared PostgreSQL store so replicas enforce the same limits. Increment or reset counters atomically. If an outcome is recorded after admission, tie it to the reserved window so a late failure cannot alter a new window. Bound new-key admission and storage as well as request volume. A short retention window alone cannot cap high-cardinality traffic. Evaluate capped admission for identifier keys and bounded coarse buckets for saturation, then test collision and shared-network effects before choosing the algorithm. Never use these rows to merge accounts or impose a permanent account lock. The product policy of temporary progressive throttling without permanent lockout is approved; exact production thresholds, windows and backoff remain security/operational tuning parameters.

## Constraints, indexes and write ordering

- Keep the unique canonical identity constraint and the unique session digest constraint named. Enforce non-null identifiers, valid digest length, non-negative bounded counters and timestamp ordering. Session rows require `created_at ≤ idle_expires_at ≤ absolute_expires_at` and revocation at or after issuance.
- The credential primary key already supports user lookup. Add a session index on `user_id` for owned revocation, an expiry index on each idle and absolute deadline for batched expiry scans, and an index on `revoked_at` if the approved retention job uses it. PostgreSQL does not automatically index referencing foreign keys. Use predicates that are stable in stored row terms, such as `revoked_at IS NULL`, rather than an index predicate that changes with the clock. [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), [PostgreSQL partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- Index security events by `occurred_at` for authorized time-window queries and cleanup. Add `(user_id, occurred_at)` only if an approved investigation needs it. Give throttle buckets a composite primary key on `(scope, bucket_key)` and index `window_ends_at` for bounded cleanup.
- Use `ON DELETE CASCADE` as a candidate only for directly owned credential and session rows when an approved hard deletion of the user occurs. For event history, a candidate nullable link with `ON DELETE SET NULL` supports approved retention without the user foreign key. Unlinking alone does not make a row anonymous. The approved deletion and retention procedure must decide whether to delete events, unlink and retain them, or prevent physical deletion pending review. Keep account deletion unavailable until that procedure exists. No future health table inherits these cascade rules.
- Use parameterized queries and explicit field selection. The application role gets only needed read/write grants. Migration and retention operations have separate permissions. Exclude sensitive SQL bind values from query logs.

## Identity and transaction boundaries

Use one server-side normalization function for sign-up, sign-in and abuse-key derivation, including consistent input size limits and validation before expensive work. Lowercase the domain using a reviewed domain policy. The local part can be case-sensitive under SMTP. A case-insensitive HILERA identity policy, internationalized address support and permitted address syntax require an explicit compatibility and usability decision. Avoid removing dots, folding plus aliases or guessing equivalence across providers. Store and compare the canonical result using a deterministic unique constraint. Changes to normalization require collision analysis and a migration that fails safely on conflicts. [SMTP case handling, RFC 5321 §2.4](https://www.rfc-editor.org/rfc/rfc5321.html#section-2.4)

1. **Sign-up.** Validate and normalize before database work. Perform approved Argon2id hashing outside a long-lived transaction. Atomically insert the user and credential. Include session issuance only if immediate sign-in is approved. A pre-check is an optimization, while the named uniqueness constraint decides concurrent inserts. A duplicate may use an explicitly targeted conflict path with no update. Never change the existing credential, link identities, or merge records as a conflict response. Roll back a partial signup and emit a public-safe result. [PostgreSQL INSERT and conflict handling](https://www.postgresql.org/docs/current/sql-insert.html)
2. **Sign-in and rehash.** Bound request admission, verify the observed credential outside the transaction, then recheck that same credential under a short transaction before issuing a session. Use row locking or compare-and-swap with an equivalent integrity guarantee. Retry safely or reject if a concurrent password replacement or rehash changed the observed row. Make session rotation and any old-session revocation required by policy atomic. Set the cookie only after commit.
3. **Sign-out and revocation.** Verify the caller's session ownership, revoke the matching row idempotently and commit before clearing the cookie. For operations that acquire multiple auth locks, use the same order across issuance, credential changes and lifecycle operations: user row, credential row, then affected session rows in stable ID order. An operation that locks only a session row must not acquire a user or credential lock afterward. Future password change, recovery and deletion must coordinate with concurrent sign-in so a session cannot be issued against a superseded credential or deleted account. Where protected mutations must be ordered against revocation, check the session inside the guarded write transaction. [PostgreSQL row locks](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS)
4. **Expiry and cleanup.** Access checks reject expired rows immediately. Cleanup can remove eligible rows later in bounded batches under the approved retention policy. If a database restore could restore already revoked sessions, the recovery runbook needs an explicit invalidation step before traffic resumes.

See the [implementation plan](backend-implementation-plan.md) for migration verification and release gates.
