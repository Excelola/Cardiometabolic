# HILERA backend and authentication architecture

The product owner approved the architecture foundation on 9 November 2026.
The [decision register](auth-security-decisions.md#foundation-approval)
identifies the approved entries and the remaining review gates. The Master PRD
is authoritative. The approved MVP requirement is email and password through
HILERA's own backend, with no paid authentication or network provider in the
credential path. The password is never persisted in plaintext. Phone
authentication and SMS, WhatsApp and voice OTP are deferred. Email ownership
verification is deferred and requires separate approval. Recovery is a future
requirement with no mechanism selected. A duplicate email never merges accounts.

This package consists of the [decision register](auth-security-decisions.md),
[data model](auth-data-model.md), [server contracts](auth-api-contracts.md),
[threat model](auth-threat-model.md) and [implementation plan](backend-implementation-plan.md).
The proposed schema, contracts, security settings and product policies
remain subject to their respective reviews before implementation or deployment.

## Repository baseline

The review started from clean `main` at Bundle 1 merge
`026ba4b0e8ed55e6c83b5f9550bffafcfcde16a9`. The manifest requests Next.js
`^16.3.3` and pnpm `11.19.0`. The lockfile resolves Next.js `16.3.3`. The
existing Next.js App Router already has a Node-capable server build and
loopback preview workflow. These are application runtime capabilities, not an
implemented authentication backend. See [frontend architecture](../frontend-architecture.md).

| Surface | Current boundary |
| --- | --- |
| `/sign-up`, `/sign-in` | Share the credential form. The client submit handler prevents submission after hydration. HTML labels, required flags and autocomplete hints are UX placeholders, not server validation or policy. No account or session is created. |
| `/auth`, `/auth/identifier/[channel]`, `/auth/verify` | Legacy informational routes link to the active forms. They supply no identifier, OTP or verification service. |
| `/app` and its layout | The index redirects to Dashboard. The shell provides navigation and framing. Its component name and URL prefix do not enforce access. |
| `/onboarding` and product-state configuration | The forms and eight workflow labels are preview presentation, separate from an account lifecycle or permission model. The dashboard uses a mock current state. Future routing consumes only approved, server-derived state. |
| Environment and package boundaries | The tracked environment example contains display-only configuration. There is no auth provider, database client, API route, session middleware or persistence in the reviewed source. |

Preview use is limited to fictional data. In particular, the source preview
form has named inputs and relies on a client handler. A native submission
before hydration or with script unavailable must be treated as a possible
credential-in-URL path. Before any real credential collection, test
progressive enhancement and script-failure cases to ensure only a protected
POST can carry credentials, with request bodies and URLs excluded from logs.

## Approved system direction

Use a modular monolith inside the existing Next.js application. Run auth on
the Node runtime and mark service, credential, session and database modules
server-only. Keep thin UI adapters, typed domain operations, authorization
and persistence separate. The browser receives only safe projections.

```text
Browser on the HILERA origin
  │ HTTPS + host-only opaque session cookie
  ▼
Next.js App Router (Node)
  ├─ Server Actions → validate → origin/CSRF gate → auth service
  └─ Server pages / future explicit adapters → session and authorization gate
                                              │
                          Password verifier + session lifecycle service
                                              │
                             Ownership-scoped data-access functions
                                              │
                  Drizzle + bounded node-postgres pool → PostgreSQL
                    accounts · credentials · sessions · limited events
```

The same-origin browser path avoids cross-origin credential plumbing and a
second service boundary. A separate auth service would require another
deployment, credential and trust boundary, incident surface and network hop
before the MVP has a demonstrated independent scaling or isolation need. A
self-hosted auth library can be evaluated later if security review finds it
reduces risk while preserving these contracts. HILERA still owns patching,
abuse controls, authorization, and incident response. Custom auth warrants
review of those controls before any real accounts are accepted. Keep the
service interfaces portable so workload isolation remains possible.

PostgreSQL is the primary recommendation. Its constraints and transactions
can make unique email identity and credential creation atomic, and enforce
references between accounts and sessions. It also offers a future path for
structured health data after separate design approval. A single database keeps
operations and shared throttling simple initially but concentrates load and
failure risk. Use bounded pools and workload limits, and deny protected access
if the authoritative database is unavailable. A local SQLite database would
be convenient for isolated development but would not exercise the production
transaction, concurrency and migration semantics. A hosted database vendor,
location, operating model and retention policy remain separate decisions.
Before production, review encryption, backup and restore, provider access,
and the privacy implications of where identity and future health data are
processed. [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) ·
[PostgreSQL support lifecycle](https://www.postgresql.org/support/versioning/)

For a future synthetic development environment, a native local PostgreSQL
installation is viable with fewer runtime layers. A local container is
preferable for reproducible engine versions and disposable integration tests
if a suitable container engine is already available and its terms fit the
team. Both approaches can run without a hosted subscription. Restrict local
connections to the development host and use disposable data and credentials.
Pin a supported PostgreSQL major after compatibility review. Keep distinct
least-privilege runtime and migration roles, and budget for databases, backups
and operating time when choosing production infrastructure.

## Data-access recommendation

Prefer **Drizzle ORM with the Node `pg` driver and reviewed Drizzle Kit SQL
migrations**. Use a small explicit PostgreSQL pool and encapsulate typed queries
inside the server data-access layer. One driver client must hold each
transaction. Parameterize all values and permit raw SQL only through reviewed
parameterized paths. Stage migration generation and review separately from
applying migrations. Apply approved versioned files with the migration role
and record rollout and recovery steps. Never use schema push as production
change control. [Drizzle PostgreSQL adapters](https://orm.drizzle.team/docs/get-started-postgresql) ·
[Drizzle Kit SQL generation](https://orm.drizzle.team/docs/drizzle-kit-generate) ·
[node-postgres transactions](https://node-postgres.com/features/transactions)

| Option | Fit for HILERA | Operational and maturity trade-off |
| --- | --- | --- |
| Drizzle + `pg` | TypeScript-native schemas and typed results, visible SQL, PostgreSQL constraints, and explicit transactions. Fits a Next.js Node server without a generated application client. | ORM and Kit versions must be paired. The observed stable ORM release is 0.45.4 while the current getting-started examples use a 1.0 release candidate. Avoid pre-release tooling. Test replay and upgrade from the previously applied migration, including indexes and custom SQL. Review every generated migration. |
| Prisma ORM | Generated typed client, documented PostgreSQL and Next.js workflows, transaction APIs, and reviewable migration SQL in the stable line. Strong option where the team already operates Prisma. | The client generation and adapter/version choices add build steps. The checked latest stable GitHub release is 7.10.1 while the default migration guide describes a different major workflow. Use version-matched docs and verify the generated artifacts and migration history on upgrades. |
| Typed SQL using postgres.js | Direct parameterized SQL with TypeScript query types, a small runtime surface and explicit scoped transactions. Schema review can be pure SQL. | Type assertions and migration tooling/conventions require more ownership. The checked upstream release is v4.1.0. Verify migration replay independently and test prepared-statement and pooling behavior against the selected production connection model. |

The release references were reviewed on 9 November 2026 as maturity evidence.
They are not version pins or a supply-chain review. Drizzle balances a small
toolchain with readable SQL and enforceable database constraints. Each option
can support future health data if queries, permissions, migrations and access
reviews are designed correctly. Type inference does not enforce ownership.
Verify compatible stable versions, known advisories, native/driver behavior
and representative concurrent operations before adoption.
[Drizzle release](https://github.com/drizzle-team/drizzle-orm/releases/tag/0.45.4) ·
[Prisma release](https://github.com/prisma/orm/releases/tag/7.10.1) ·
[Prisma 7 migration workflow](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production) ·
[Postgres.js documentation](https://github.com/porsager/postgres) ·
[Postgres.js release](https://github.com/porsager/postgres/releases/tag/v4.1.0)

## Credential, session and cookie boundary

- **Passwords:** Prefer Argon2id with a supported Node binding. Evaluate
  `@node-rs/argon2` first for asynchronous hashing, library-generated salts
  and portable encoded hash strings. Upstream has published a 2.2.2 release.
  Verify release and advisory status, Node/OS/architecture and production
  bundler compatibility, binary supply
  chain, library defaults, test vectors and failure modes before selection.
  If a native target is incompatible, assess another maintained Argon2id
  binding behind the same verifier contract and return for security review.
  Keep the encoded algorithm, parameters, salt and digest in the credential
  record. Rehash after successful verification when approved parameters
  change, using a conditional update so a stale hash cannot overwrite a
  later password change. Benchmark against an OWASP baseline and cap parallel
  hashing and request size. These resource controls are separate from the
  open password policy. Raw passwords and stored hashes never appear in
  logs or responses. [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) ·
  [Node-RS Argon2 release](https://github.com/napi-rs/node-rs/releases/tag/%40node-rs%2Fargon2%402.2.2)
- **Sessions:** Prefer a cryptographically random 256-bit opaque token from
  the server. Set the raw token only as a cookie and store its SHA-256 digest
  and metadata in PostgreSQL. A digest is appropriate here because the token
  has high entropy. Human passwords require the separate slow hash above.
  Check session existence, login eligibility, idle and absolute expiry, and
  revocation at the server. Rotate on successful authentication and approved
  privilege or credential transitions, invalidating replaced sessions.
  Logout revokes the current session server-side before reporting success.
  Decide lifetime, concurrency and scope of credential-change/recovery
  revocation separately. A stolen live bearer can still be replayed until
  it expires or is revoked. Stateless JWTs avoid a lookup but make immediate
  revocation, logout and credential-change response harder unless state is
  reintroduced. A database lookup and explicit invalidation are preferable
  for these account and future health-data boundaries. [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- **Cookie:** Recommend `__Host-hilera_session` over HTTPS with `Secure`,
  `HttpOnly`, `SameSite=Lax`, `Path=/`, and no `Domain`. Test a stricter
  setting against approved journeys before changing it. Browser expiration
  cannot extend either authoritative server expiry. Clear with matching name,
  host and path. Test the production attributes over HTTPS. If local HTTP
  compatibility is needed later, keep a distinct loopback-only development
  cookie and configuration. No insecure fallback is permitted in a deployed
  environment. [Set-Cookie attribute reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)

## Protected routes and writes

- `/app/dashboard`, `/app/measurements/new`,
  `/app/measurements/history`, `/app/trends`, `/app/risk-summary` and
  `/app/education` each need a server check before protected content is read,
  rendered, serialized or returned. Include direct navigation and prefetch/RSC
  requests. A shared layout or a cheap Proxy cookie-presence check may improve
  redirects but cannot establish validity or ownership. Choose unauthenticated
  redirects versus typed errors at the presentation boundary. Never accept
  an unvalidated external return URL. [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication)
- `requireSession()` resolves the request cookie against the authoritative
  session store. `requireUser()` derives a minimal principal from that session
  and the account lifecycle rules. Domain operations scope reads and writes
  by the principal's user ID in the database query. Where needed for races,
  validate session/lifecycle and ownership in the same write transaction.
  Direct calls and cross-user object IDs must fail safely. Avoid shared caching
  of session or user data, and ensure safe DTOs for page, client and API
  boundaries. The normal consumer has access only to their own data.
  Administrative access requires a separate reviewed authorization model.
  [Next.js data security](https://nextjs.org/docs/app/guides/data-security)
- Prefer first-party Server Actions for sign-up, sign-in and sign-out.
  Use server-only calls for current-session and current-user reads. A future
  Route Handler is justified by a specific approved HTTP consumer and reuses
  the same validation, CSRF and authorization checks. Treat every action as
  directly callable. For browser writes, use POST, exact configured
  origin validation and a session-bound CSRF token for authenticated writes,
  in addition to cookie and framework protections. Verify trusted proxy
  configuration and login CSRF cases. [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- Gate expensive verification with distributed, bounded PostgreSQL throttle
  buckets, a fleet-wide admission budget, per-process hashing concurrency
  limits and generic responses for unknown email
  and wrong password. A source signal alone would penalize shared networks.
  Use privacy-reviewed inputs, avoid persistent hard lockouts and keep exact
  thresholds and temporary throttling behavior open. Bound or suppress
  per-attempt event volume. Store minimal security events under a reviewed
  retention policy. Exclude credentials, tokens, health data and sensitive
  answers from logs and telemetry. Review safe response parity for duplicate
  registration and any later recovery. [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Decisions and release boundaries

Without email verification, a successful sign-in proves possession of the
account password but says nothing about mailbox ownership. A mistyped or
claimed address can block a rightful owner from registering. Keep email out
of trusted notification, proof-of-identity or recovery paths until each is
approved. Never link or transfer accounts based on an email match. Leave a
server-side recovery seam disabled until product, security and privacy approve
a specific method and abuse controls.

Open decisions include password acceptance policy, duplicate sign-up
presentation and auto sign-in, idle and absolute session durations,
concurrent sessions, login throttle effects, recovery, email verification
timing, account deletion and session revocation behavior. Hosting, regional
placement, cryptographic cost and key rotation, logging retention, access
governance and safety review are separate technical and privacy decisions.
For a Nigeria-first MVP, one same-origin form round trip, a password-manager
compatible UX, and no paid messaging dependency keep the credential path
usable on slower connections and simpler to operate. Validate actual latency
and resource use on the eventual approved deployment.

**PRD sync for this documentation:** Not required. If approved later,
product-visible sign-up or recovery journeys, identity verification, password
acceptance, access and deletion permissions, required reauthentication,
user-visible session or abuse policy, new data collection and external
integrations should be reviewed for PRD sync. Internal module layout, database
and hashing library selection, and implementation details belong in technical
documentation unless they change those product outcomes.
