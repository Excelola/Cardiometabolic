# HILERA authentication foundation implementation

This branch implements A–D from the [approved specification](backend-auth-implementation-spec.md).
The Master PRD governs product behaviour. This implementation is for review and
synthetic validation. Real-user exposure requires the release gates below.

## A. PostgreSQL and migration safety

`drizzle/0000_auth_foundation.sql` is the generated, reviewed initial migration.
It creates `users`, `password_credentials`, `auth_sessions`,
`auth_throttle_buckets`, and `auth_security_events`. User IDs are UUIDs. The
canonical email is unique, credentials have one row per user, and sessions and
attributed events have explicit restrictive ownership foreign keys. The session
digest is unique and 32 bytes. Expiry, revocation and ownership are indexed.
Throttle keys and counters have bounded types and constraints. The event enum
encodes the outcome and permits an unattributed failed sign-in only. There are
no health, measurement, document or clinical tables.

Use Node 22 or later with a supported PostgreSQL release. Use separate roles
and URLs for runtime and migrations. The runtime pool is limited to five
connections per process, with a three-second connection wait and a five-second
statement timeout. Drizzle query logging is disabled. Production runtime
connections require verified TLS (`sslmode=verify-full`). Review the provider,
certificate chain, runtime grants and connection budgets before exposure.

Use `pnpm db:generate` and `pnpm db:check` for migration review. To apply a
reviewed migration, set `HILERA_MIGRATION_DATABASE_URL` explicitly for the
authorized migration role and run `pnpm exec drizzle-kit migrate`. The app
does not migrate on startup. Inspect migration SQL and locks, preserve the
approved recovery point, and verify constraints and indexes afterwards. An
initial migration failure should roll back or be forward-repaired under the
[database safety runbook](database-safety-backup.md). Restore procedures must
invalidate stale sessions before returning traffic to a restored service.

For synthetic validation, set `HILERA_TEST_DATABASE_ADMIN_URL` to a dedicated
loopback PostgreSQL administrator connection ending in `/postgres`, then run
`pnpm test`. The suite creates randomly named disposable databases, applies the
migration and exercises constraints and account operations. The restore test
uses local `pg_dump` and `pg_restore` to dump, destroy and restore a synthetic
source before rechecking data and constraints. No runtime or migration URL is
used by the test harness. When the test URL is absent, the database-dependent
cases are reported as skipped. Never point this harness at a real database.

## B. Credentials and account flows

Sign-up and sign-in use first-party Server Actions. The server trims surrounding
email whitespace, checks bounded ASCII mailbox syntax, lowercases the domain
and preserves the local part, including case, dots and plus aliases. The local
part is not assumed case-insensitive. Mailbox ownership is not established.
Sign-up creates the account, credential, first session and success event in one
transaction. A named uniqueness constraint resolves duplicate races without
merging or modifying an existing account. Successful sign-up goes to
`/onboarding`; successful sign-in goes to `/app/dashboard`.

New passwords accept 15–128 Unicode code points, including spaces. Ill-formed
Unicode and ASCII control characters are rejected. Passwords are normalized to Unicode NFC before hashing and verification so canonically equivalent Unicode input has stable authentication semantics. The version-pinned `@zxcvbn-ts/language-common` package
provides 49,233 common-password entries from the package's documented public-domain
Burnett corpus. Only the password dictionary is used. The application checks
whole-password equality against local NFKC and lowercase comparison keys and
does not use that normalization for hashing. No password, prefix or lookup
goes over the network. This blocklist is a reviewed initial corpus and does not
cover every compromised password. The package is MIT and ships its notices.
See the [dataset and licence notes](https://github.com/zxcvbn-ts/zxcvbn/tree/master/packages/languages/common).

`@node-rs/argon2` uses asynchronous Argon2id v19 at 19,456 KiB, two iterations,
one lane, a 32-byte output, and a fresh random 16-byte salt. These are the
[OWASP minimum Argon2id parameters](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id).
At most four jobs may run per process, with no waiting queue. Successful
verification can upgrade accepted weaker parameters by a conditional write
after locking the user and credential. Unknown identities perform a dummy
Argon2id verification at the current cost, and unknown and incorrect passwords
use the same public credential failure. Timing parity under real traffic and
database load is a review gate. Successful signup is observably different from
duplicate signup, even though duplicate failure is generic.

The synthetic benchmark ran on Windows x64 and Node v26.13.0 after warm-up.

| Operation | Samples | p50 | p95 |
| --- | ---: | ---: | ---: |
| Hash with fresh salt | 30 | 38.0 ms | 56.2 ms |
| Verify correct password | 30 | 37.3 ms | 56.2 ms |
| Verify incorrect password | 30 | 40.8 ms | 54.2 ms |
| Verify at concurrency four | 40 | 64.9 ms | 86.7 ms |

Repeat the benchmark on the deployment runtime and review native binary
provenance, capacity and memory before release.

The runtime is pinned exactly to Next.js 16.4.6 to address existing production
dependency findings, including the Server Actions denial-of-service advisory.
The `source-map-js` override addresses the indexed source-map advisory. pnpm's
release-age exception covers only the exact 16.4.6 framework release and its
matching environment and compiler packages. The general policy and integrity
checks still apply. Remove the exact exceptions once the release is outside
the default quarantine window.
[Next.js advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r) ·
[Source-map advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)

## C. Session and authorization policy

A newly generated 256-bit bearer is written only to the session cookie. The
database stores its SHA-256 digest. Production uses `__Host-hilera_session`
with Secure, HttpOnly, SameSite=Lax, Path=/ and no Domain. Loopback-only HTTP
development uses `hilera_session_dev` and requires explicit separate synthetic
keys. For local auth testing, set the server-only values from `.env.example`
in `.env.local`, use only a synthetic development database, and run
`pnpm dev --hostname localhost --port 3011` for the default exact origin.
Cookies are issued after commit. Sign-in rotates a presented active
session and issues a fresh one. Other concurrent sessions remain independent.

Session issuance sets a one-hour idle deadline and a 24-hour absolute deadline.
Only explicit authenticated user interaction can request idle renewal: pointer
interaction (including touch through Pointer Events) or a non-repeated keyboard
event. Passive page reads, direct navigation, RSC prefetch, timers and background
work do not renew the session. The client coalesces renewal requests and the
server performs a database write only when at least approximately five minutes
of the current idle window have elapsed. Concurrent renewal attempts are
coalesced by the conditional update. Renewal extends idle expiry to at most one
hour from the qualifying activity and never beyond the fixed 24-hour absolute
deadline. Expired or revoked sessions cannot be revived.

Sign-out validates the active session and revokes only that owned row before
clearing the cookie. The internal account-wide primitive locks the user row
before revoking their sessions. A future account-lifecycle operation can use
it in its own transaction. No recovery, password change or deletion workflow
is exposed. Individual app pages and Onboarding validate the session before
rendering, including direct requests. The app shell checks separately before
rendering the sign-out proof. Session lookup is request-local and fail-closed.
Protected routes are dynamic and must never be shared-cached by the ingress.

## D. Abuse controls, mutation integrity and events

Each well-formed attempt uses a shared PostgreSQL admission transaction before
any Argon2 work. A locked singleton controls the fleet budget. Per-identifier
keys are HMAC digests of canonical identifiers under a separate key. A bounded
identity set of 4,096 keys and expiry cleanup limit storage. Requests during a
cooldown do not prolong it. The progressive delay starts at one second after
the per-identity allowance and doubles to the configured cap within the window.
A store failure is unavailable and does not allow work to proceed. No network
or device signal is stored.

| Parameter | Development/test default | Proposed production starting point |
| --- | ---: | ---: |
| Fleet admissions per window | 60 | 40 |
| Fleet window | 60 seconds | 60 seconds |
| Identifier allowance before progressive delay | 5 | 4 |
| Identifier window | 10 minutes | 10 minutes |
| Maximum cooldown | 60 seconds | 60 seconds |

Production values are explicit required environment configuration, not
defaults. The lower proposed fleet budget limits sustained hashing pressure
while the identifier allowance slows repeated targeting without permanent lockout.
The proposed values are review inputs, not a fixed product policy.
Measure expected peak traffic, queueing, overload behaviour, shared-network
effects, pool saturation and event volume before selecting production values.

Server Actions use POST. Their adapters compare the exact configured origin
with the browser Origin, with a safely parsed exact Referer fallback only
when Origin is absent. Invalid or unverifiable origins fail closed. Sign-out
additionally checks a dedicated-key HMAC bound to the active session using a
constant-time comparison. Tokens are posted with forms and do not enter URLs
or logs. The candidate AUTH-ARCH-009 controls are pending final security review.
Trusted ingress must terminate HTTPS, prevent direct exposure of the app
origin, and overwrite client-provided Host forwarding headers with reviewed
values. Application origin decisions do not read forwarded headers.

Security events contain an allowlisted type, timestamp and only the internal
user reference needed for successful operations. Admitted failed sign-ins have
no user reference. No raw emails, IP/device attributes, credentials, bearer
or digest values, cookies, CSRF proof, request body or health data are logged
by this implementation. Review infrastructure logs and traces with synthetic
canaries separately. The volume of failed events is bounded by admission
budgets per window. A retention/deletion policy and operator access policy
remain gates for production.

## Local verification

Edge rendered sign-up and sign-in at 320, 390 and 1440 px. The loopback
browser smoke exercised short and blocked password responses and safe failure
without a configured database. The patched build rejected an untrusted origin.
Direct unauthenticated requests to all eight protected URLs redirected to
sign-in. Raw prefetches returned private route metadata without protected
content. Synthetic credential canaries were absent from the inspected local
application log. The audited production lockfile reported zero advisories.

The disposable PostgreSQL suite was unavailable on this machine. Its tests
remain a release gate for schema replay, real account transactions, two-user
isolation, concurrent throttling, and the backup and restore drill.

## Remaining release gates

- Run the migration replay, two-account and concurrency tests, and synthetic
  dump/destroy/restore drill against disposable PostgreSQL. Review runtime grants,
  backup retention and restore invalidation before rollout.
- Review origin and session controls through the actual TLS ingress and inspect
  browser actions, shared caches, database and infrastructure telemetry.
- Align `eslint-config-next` to the reviewed Next.js 16.4.6 toolchain and
  regenerate the pnpm lockfile with pnpm before final validation.
- Review production throttle tuning, native Argon2 compatibility and capacity,
  secret rotation, audit access and event retention.
- Complete approved recovery or obtain explicit Product Owner and security
  acceptance of loss-of-access risk before real-user exposure. Email ownership
  verification remains deferred, with account squatting and mistyped addresses
  as residual risks.
