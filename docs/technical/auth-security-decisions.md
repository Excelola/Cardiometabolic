# HILERA authentication security decisions

Reviewed 9 November 2026. This register records technical recommendations for HILERA's own email-and-password MVP. The Master PRD governs product behaviour. The branch is architecture documentation only.

**Decision status** distinguishes a technical recommendation from a gate requiring product, security or privacy review. **PRD Sync Impact** describes potential impact when a decision is implemented. This documentation changes no product behaviour and requires no Master PRD update.

## Foundation approval

On 9 November 2026, the product owner approved the backend architecture
foundation. That approval covers AUTH-ARCH-001, AUTH-ARCH-002, AUTH-ARCH-003,
AUTH-ARCH-005, AUTH-ARCH-007, AUTH-ARCH-008, AUTH-ARCH-011 and AUTH-ARCH-013.
The approved entries establish the technical direction for review and planning.
The separate security, privacy and product approvals recorded below still apply.
Implementation and deployment require separate authorization.

See the [architecture overview](backend-authentication-architecture.md), [data model](auth-data-model.md), [server contracts](auth-api-contracts.md), [threat model](auth-threat-model.md) and [implementation plan](backend-implementation-plan.md).

## AUTH-ARCH-001 — Backend architecture style

- **Context** The existing Next.js App Router delivers a frontend preview. HILERA needs its own password authentication on an affordable, maintainable deployment.
- **Options** Modular Next.js Node application, separate authentication service, or a third-party authentication provider.
- **Recommendation** Use the existing Next.js deployment as a modular Node.js monolith. Keep authentication, session management, authorization, persistence and presentation in separate modules. Mark data and security modules server-only.
- **Reasoning** One application can implement the approved web workflow without adding a service boundary, distributed credentials or a paid auth dependency. Service interfaces preserve an extraction path if isolation or measured load later warrants it.
- **Security impact** Only server modules use the database and credentials. A shared process has a larger blast radius than a separate service, so restrict runtime permissions, secrets and dependency access.
- **Privacy impact** Credentials and identifiers stay within the HILERA-controlled boundary. Review infrastructure operators and data location separately.
- **Cost impact** One application deployment and one database to operate initially. Hosting, monitoring and backups still have costs.
- **Complexity** Low to moderate. Explicit module boundaries and tests are required.
- **Product behaviour impact** Enables the already-approved authentication method. Login, recovery and session policies are decided separately.
- **PRD Sync Impact** Not required for the internal service boundary.
- **Decision status** Approved

Reference: [Next.js data security guide](https://nextjs.org/docs/app/guides/data-security).

## AUTH-ARCH-002 — Primary database

- **Context** Account uniqueness, credential ownership, revocation and security events need reliable shared state.
- **Options** PostgreSQL, SQLite, or a document store.
- **Recommendation** Use PostgreSQL. For development, evaluate a local PostgreSQL installation or a local Docker container with synthetic data and environment-specific credentials. Choose a supported engine version and hosting model at implementation review.
- **Reasoning** Unique constraints, foreign keys and transactions make account creation and session lifecycle rules enforceable across application instances. SQLite is viable for simpler single-host workloads, but shared state, deployment topology and write contention matter here. A document store would shift relational invariants into more application code.
- **Security impact** Give runtime and migration processes separate roles. Require secure connections outside trusted local development, reviewed migrations, restricted network access and tested backups.
- **Privacy impact** Restrict stored data to the approved account and security purpose. Production hosting location, access, backup retention and deletion need separate review.
- **Cost impact** Local options avoid a hosted database subscription for development. Production still needs storage, backup and operational capacity.
- **Complexity** Moderate. Pool sizing, schema changes, backup restores and engine upgrades require ownership.
- **Product behaviour impact** Provides durable account and session storage for the approved workflow. The database engine choice is internal.
- **PRD Sync Impact** Not required for engine selection. New user-visible data or lifecycle rules require their own review.
- **Decision status** Approved

References: [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) and [PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html).

## AUTH-ARCH-003 — Data access / ORM

- **Context** Authentication must enforce transactional invariants with a TypeScript codebase and reviewable migrations.
- **Options** Drizzle ORM with node-postgres, Prisma ORM, or typed SQL with postgres.js and a separate migration runner.
- **Recommendation** Use Drizzle ORM and node-postgres in a server-only data-access layer. Generate versioned SQL with Drizzle Kit, review it, and apply it as a controlled deployment step. Pin a compatible stable pair after an integration and migration replay test.
- **Reasoning** Drizzle uses TypeScript schema definitions and supports pooled PostgreSQL access while keeping SQL visible. Prisma also has typed queries, transaction support and reviewable migrations, with a separate schema and generated contract/client workflow to maintain. Postgres.js supports transactions and parameterized tagged SQL with fewer abstractions, but the team would own more mapping, validation and migration conventions. Drizzle fits the existing Next.js Node runtime and keeps constraints and migration SQL visible as structured health data grows.
- **Security impact** Parameterize values and allowlist dynamic identifiers. Use short transactions and keep ownership filters explicit. Review generated SQL for destructive changes, lock impact and constraints. Test both empty-database replay and representative upgrades. Protect migrations from concurrent runners.
- **Privacy impact** Explicit projections and ownership predicates reduce disclosure. An ORM does not confer health-data authorization, encryption or compliance.
- **Cost impact** Developer review and migration operations are the main costs. No hosted data-access service is needed.
- **Complexity** Moderate. The maintained Drizzle 0.x line and separate 1.0 prerelease work make version pinning and migration compatibility checks important. Prisma's separate tooling adds workflow steps, while typed SQL shifts tooling to the team.
- **Product behaviour impact** Internal developer and operations choice.
- **PRD Sync Impact** Not required for the library or migration tool.
- **Decision status** Approved

References: [Drizzle PostgreSQL drivers](https://orm.drizzle.team/docs/get-started-postgresql), [Drizzle migration generation](https://orm.drizzle.team/docs/drizzle-kit-generate), [Drizzle releases](https://github.com/drizzle-team/drizzle-orm/releases), [node-postgres transactions](https://node-postgres.com/features/transactions), [Prisma migrations](https://www.prisma.io/docs/orm/migrations/how-migrations-work) and [Postgres.js](https://github.com/porsager/postgres).

## AUTH-ARCH-004 — Password hashing

- **Context** Passwords must only be persisted as secure hashes. The Product Owner approved the V1 password policy on 10 November 2026; deployment runtime and final Argon2id cost parameters still need implementation benchmarking.
- **Options** Argon2id with a maintained Node binding, scrypt as a reviewed fallback, or a future platform-native Argon2 implementation on an approved runtime.
- **Recommendation** Evaluate the asynchronous `@node-rs/argon2` Argon2id API. Use the library's unique random salt per credential and persist the encoded hash with its algorithm, version and cost parameters. Select costs after benchmarking the target deployment against current OWASP guidance. Rehash on successful authentication when parameters are outdated, using a conditional update so rehash cannot overwrite a concurrently changed credential.
- **Reasoning** A memory-hard password hash increases the cost of offline guessing. The candidate provides encoded hashes, asynchronous verification and parameter inspection. Validate supported binaries on local, CI and deployment platforms and review the pinned package and its release provenance before adoption.
- **Security impact** Apply size and concurrency bounds before expensive verification. Protect raw passwords in transit with TLS, exclude them and hashes from logging and response serialization, and use the library verifier. Bound allowed hash parameters on verification and treat malformed stored hashes as internal errors.
- **Privacy impact** A password hash remains sensitive. Confine it to credential access and backups with restricted permissions.
- **Cost impact** Hashing consumes memory and CPU per attempt. Profile under abuse load so security settings and capacity can be reviewed together.
- **Complexity** Moderate. Native binary packaging, test vectors and a rehash path need validation.
- **Product behaviour impact** V1 accepts passwords from 15 through 128 characters, does not impose arbitrary uppercase/lowercase/number/symbol composition rules, permits password-manager-friendly input including spaces and Unicode where technically safe, does not require routine periodic changes, and blocks common or compromised passwords using a reviewed local blocklist or equivalent method that does not send plaintext passwords to an external service.
- **PRD Sync Impact** Not required for internal hashing parameters. Sync material password acceptance and credential-change rules once approved.
- **Decision status** Product policy approved; Argon2id implementation parameters remain subject to security benchmarking and review.

References: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), [node-rs Argon2 binding](https://raw.githubusercontent.com/napi-rs/node-rs/main/packages/argon2/src/lib.rs) and [node-rs releases](https://github.com/napi-rs/node-rs/releases).

## AUTH-ARCH-005 — Session model

- **Context** HILERA must revoke access reliably after logout, compromise or credential changes, with a path to future recovery.
- **Options** Opaque database-backed sessions or stateless signed JWT sessions.
- **Recommendation** Generate opaque session tokens with a cryptographic RNG. Use 32 random bytes as a technical baseline, encode for the cookie, and store only a unique indexed SHA-256 digest with server-side metadata. Require a valid row and account state for protected requests.
- **Reasoning** A database row gives HILERA a direct revocation and expiry control. JWTs avoid a read for some requests, but prompt revocation typically needs a denylist, token-version checks or refresh-token state. A fast token digest is appropriate for a high-entropy random secret, while user passwords need the slow hash in AUTH-ARCH-004.
- **Security impact** Rotate at successful sign-in and relevant privilege or credential changes. A stolen active token remains replayable until it expires or is revoked. Fail closed if session validity cannot be verified and do not create session state for a caller-supplied token.
- **Privacy impact** Keep the token opaque and separate from identity and health data. Do not log raw tokens, token digests or session IDs.
- **Cost impact** Indexed reads and cleanup add database load. Size the pool and measure before introducing a cache with stale-authorization risk.
- **Complexity** Moderate. Session issuance, lookup and revocation require a shared contract and concurrency tests.
- **Product behaviour impact** Supports logout and future account-wide revocation. Idle, absolute and concurrent-session policies are AUTH-ARCH-016.
- **PRD Sync Impact** Not required for the internal representation.
- **Decision status** Approved

Reference: [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## AUTH-ARCH-006 — Session cookie model

- **Context** The browser needs an opaque session credential for first-party requests.
- **Options** Host-only `__Host-` cookie, broader Domain cookie, or a JavaScript-managed browser bearer token. Evaluate SameSite Lax against Strict.
- **Recommendation** Use `__Host-hilera_session` over HTTPS with HttpOnly, Secure, explicit SameSite=Lax, Path=/ and no Domain attribute. Use a distinct host-only name only for an explicitly isolated HTTP loopback development mode. A deployed environment requires the production posture.
- **Reasoning** Host-only scope reduces sibling-subdomain cookie exposure. Lax supports ordinary top-level link navigation while AUTH-ARCH-009 protects writes. Strict may disrupt legitimate arrivals and should be evaluated with journey tests before changing it.
- **Security impact** The cookie contains only the opaque token. Expire it with matching scope on logout after invalidating the server session. If persistent cookie storage is approved, cap its lifetime at the absolute server expiry. HttpOnly reduces direct token access from JavaScript, while XSS can still issue authenticated requests.
- **Privacy impact** A single first-party auth cookie limits exposure. Exclude Set-Cookie and Cookie headers from application and proxy logs.
- **Cost impact** No additional provider. TLS configuration and browser interoperability testing are operational costs.
- **Complexity** Low to moderate. Test attributes, logout, redirects, local/production name isolation and deployment proxy behaviour.
- **Product behaviour impact** Normal first-party web session. Remember-me and exact expiry remain separate policy questions.
- **PRD Sync Impact** Not required for flags and naming. Approved changes to visible session persistence belong under AUTH-ARCH-016.
- **Decision status** Requires security approval

References: [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [HTTP State Management Mechanism](https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html).

## AUTH-ARCH-007 — Route protection

- **Context** The preview's `/app` routes currently render without authentication. Future health reads and writes need server-side protection.
- **Options** Proxy-only protection, repeated checks in presentation, or centralized server guards at data and mutation boundaries with optional routing checks.
- **Recommendation** Use server-only `requireSession()` and `requireUser()` guards near protected reads and mutations. Use an optional Next.js Proxy cookie-presence check for an early redirect. Require validated session state for every protected operation and scope all user data queries.
- **Reasoning** Proxy, layout and navigation checks improve routing but can be bypassed as data authorization boundaries. Reuse the session check within a single request where safe, and avoid shared caching of protected data.
- **Security impact** Reject missing, malformed, expired and revoked tokens. Include direct action calls and rendered or prefetched payloads in tests. Validate any return destination against first-party safe paths.
- **Privacy impact** Keep protected health data out of unauthenticated responses and shared caches. Send only minimal data transfer objects to rendering code.
- **Cost impact** Session checks need indexed database reads. Avoid an additional Proxy database check for every navigation or prefetch.
- **Complexity** Moderate. Coordinate protected page, Server Action and data-access entry points.
- **Product behaviour impact** Unauthenticated visitors get an approved sign-in route once protection is implemented. Return-to and onboarding transitions need explicit agreement.
- **PRD Sync Impact** Not required for guard implementation. Review material sign-in redirects or changed onboarding journeys for sync.
- **Decision status** Approved

References: [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication) and [Next.js data security guide](https://nextjs.org/docs/app/guides/data-security).

## AUTH-ARCH-008 — Authorization pattern

- **Context** MVP consumers should only access their own protected resources.
- **Options** Ownership checks in each UI route, centralized deny-by-default resource checks, or introducing an administrative role system or PostgreSQL row security from the start.
- **Recommendation** Centralize consumer ownership checks in server services and DAL queries using the authenticated user ID. Scope record fetches, updates and deletes in the query itself. Treat future admin and delegated access as separate design decisions.
- **Reasoning** A single consumer permission model fits the current product. Ownership-scoped queries prevent browser IDs from setting the authorization context and support direct object reference tests.
- **Security impact** Deny access unless the operation is explicitly permitted. Parse inputs with allowlisted fields, enforce authorization near the read or write, and verify cross-user failures without existence leaks.
- **Privacy impact** Return only necessary fields. No clinician, caregiver, employer or shared administrative access is assumed.
- **Cost impact** No new service. Integration tests and future policy reviews are part of normal engineering cost.
- **Complexity** Moderate. Review all query entry points and transaction boundaries.
- **Product behaviour impact** Enforces least privilege in the approved consumer flow.
- **PRD Sync Impact** Not required for implementing ownership. New roles, delegated access or changed permissions require sync if approved.
- **Decision status** Approved

References: [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) and [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication).

## AUTH-ARCH-009 — CSRF protection

- **Context** Browsers attach session cookies automatically. Login itself can be a CSRF target before a session exists.
- **Options** SameSite only, framework origin checks only, explicit trusted-origin validation with a synchronizer-style token, or a signed double-submit pattern.
- **Recommendation** Limit browser writes to intended non-GET methods. Validate the exact scheme, host and port of the source against configured trusted origins for every browser mutation, including sign-up and sign-in. Only when Origin is absent may a safely parsed exact Referer origin serve as fallback. Reject null, malformed, mismatched or unprovable origins. For cookie-authenticated writes, including logout, also require a session-bound token derived with a dedicated server-side keyed HMAC over purpose and current session identity. Verify with a constant-time comparison and rotate it with session issuance and replacement.
- **Reasoning** SameSite=Lax and Next.js Server Action checks are defense in depth. Next.js documents that its action host comparison can let a missing Origin through with a warning. HILERA's policy handles that case explicitly and uses a token so accepting a cookie alone cannot authorize a write.
- **Security impact** Never infer the target from untrusted Host or forwarded headers. Configure trusted proxies to overwrite external forwarded values. Keep framework allowed origins tight, keep CSRF tokens out of URLs and logs, and apply the same checks to future cookie-authenticated Route Handlers. Never rely on CSRF protection to mitigate an already executing same-origin XSS payload.
- **Privacy impact** No new tracking identifier, third-party verification call or extra session field is required. Treat origin validation failures as sanitized event categories.
- **Cost impact** No provider fee. Requires browser tests, a dedicated server key and tested proxy configuration.
- **Complexity** Moderate. Test legitimate browser and same-site cross-origin traffic, missing and null headers, token mismatch, logout and session rotation.
- **Product behaviour impact** Valid first-party forms should continue normally. Cross-origin writes are outside the MVP contract.
- **PRD Sync Impact** Not required for first-party technical controls. A future cross-origin client or integration requires separate review.
- **Decision status** Requires security approval

References: [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) and [Next.js Server Actions origin configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#allowedorigins).

## AUTH-ARCH-010 — Login abuse protection

- **Context** Password authentication is exposed to stuffing, guessing, spraying, enumeration and resource exhaustion.
- **Options** Process-local limits, shared PostgreSQL counters, separate rate-limit infrastructure, or persistent account lockout.
- **Recommendation** Use bounded PostgreSQL-backed admission buckets shared across application instances before password hashing. Apply global capacity limits and per-normalized-identifier controls for both existing and unknown identities. Add a short-lived source-signal bucket only with privacy approval and trusted ingress. Use atomic counter updates, expiry cleanup, bounded key cardinality and a hashing concurrency cap. Recommend temporary throttling over persistent account lockout.
- **Reasoning** Process-local limits diverge across workers. A shared store controls that gap without adding a service. Permanent lockout lets attackers deny access to known users. Keyed pseudonyms and expiry keep raw identifiers and unbounded counter growth out of the design.
- **Security impact** Check admission before KDF work. For admitted syntactically valid attempts, verify an equivalent dummy hash when needed to reduce timing differences for unknown accounts. Return indistinguishable invalid-credential responses and an account-independent throttle response. If a required limiter is unavailable, refuse new credential attempts safely and record sanitized operational state.
- **Privacy impact** Keep raw email addresses, IP addresses and device fingerprints out of security logs. Treat pseudonymous bucket keys as sensitive and retain only for the approved abuse window.
- **Cost impact** Avoids a dedicated throttling service initially. PostgreSQL counter write load and hash admission need load testing, especially with randomized identifiers and traffic bursts.
- **Complexity** Moderate. Test concurrent requests, unknown identities, shared networks, spoofed source headers, bucket limits and degraded storage.
- **Product behaviour impact** Product policy approves generic public-safe credential failures and temporary progressive throttling without permanent account lockout. Exact numeric thresholds, windows, and shared-network tuning remain security/operational parameters and must be tested before exposure.
- **PRD Sync Impact** Required if approved throttling or lockout rules materially change access behaviour. Internal store selection does not require sync.
- **Decision status** Product behaviour approved; implementation thresholds and source-signal privacy controls remain subject to security/privacy review.

References: [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) and [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html).

## AUTH-ARCH-011 — Authentication transport

- **Context** HILERA currently has first-party web forms and no approved external API consumer.
- **Options** Server Actions for forms, dedicated Route Handler endpoints, or a limited hybrid with direct server reads.
- **Recommendation** Use Server Actions as thin sign-up, sign-in and sign-out adapters. Implement current-session and current-user reads as direct server-only function calls. Consider Route Handlers only for a separately approved HTTP consumer, reusing the same domain services and security controls.
- **Reasoning** The proposed split fits App Router rendering without adding an internal HTTP hop or stable public auth API. Isolating services from the framework transport preserves a future explicit API option.
- **Security impact** Treat actions as directly callable endpoints. Validate input and enforce CSRF, authentication and ownership where applicable. Return allowlisted DTOs or public-safe errors. Keep raw credentials, hashes, session IDs, tokens, stack traces and database errors out of responses. Normalize status, redirects and timing for account-existence-sensitive failures.
- **Privacy impact** Form handling and session reads remain first-party. Prevent sensitive request bodies, cookies, action return values and personalized output from entering logs or shared caches.
- **Cost impact** No additional service or HTTP compatibility surface for MVP.
- **Complexity** Low to moderate. Contract and browser tests must exercise direct access and progressive form handling.
- **Product behaviour impact** Successful sign-up creates an authenticated session and routes to Onboarding. Successful sign-in routes to Overview. Transport does not change the approved email-and-password method.
- **PRD Sync Impact** Not required for transport selection. Approved changes to sign-up or sign-in journeys may require sync.
- **Decision status** Approved

References: [Next.js data security guide](https://nextjs.org/docs/app/guides/data-security) and [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## AUTH-ARCH-012 — Security event logging

- **Context** Incident response needs reliable signals without creating a secondary store of sensitive information.
- **Options** Minimal structured server events, unrestricted diagnostic logging, or a dedicated external security platform.
- **Recommendation** Start with structured security events for account creation, successful and failed sign-in, sign-out and session revocation. Add password-change or recovery events only if those workflows are approved. Store a bounded event type, outcome, time and an internal user reference only when justified. Use a server-generated request correlation ID when needed.
- **Reasoning** A narrow schema supports investigation and throttling analysis with less risk of leaking form values. Keep admission counters separate from audit events and document event retention and access before launch.
- **Security impact** Restrict writes and reads, sanitize untrusted values and test redaction in normal, failure and exception paths. Do not log passwords, hashes, tokens, token digests, session IDs, CSRF tokens, connection strings or raw request bodies.
- **Privacy impact** Avoid raw emails, IP addresses, device identifiers, health values and questionnaire answers. Require privacy review for any security context that can identify or profile a person, including retention and incident access.
- **Cost impact** Event storage, retention and review require capacity. No external logging subscription is assumed.
- **Complexity** Moderate. Define event ownership, monitoring, failure handling, deletion and redaction tests.
- **Product behaviour impact** Operational only within the proposed limited purpose. Any user-facing security alerts or activity history remain separate.
- **PRD Sync Impact** Uncertain pending review of identity-linked event scope, retention and user rights. Internal error telemetry within existing policy normally belongs in technical documentation.
- **Decision status** Requires privacy review

Reference: [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).

## AUTH-ARCH-013 — Secrets management

- **Context** Database credentials and application keys become necessary once the approved backend is implemented.
- **Options** Server environment backed by deployment secrets, local ignored environment files for development, or a separate managed vault when operational needs justify it.
- **Recommendation** Inject secrets into server environments and validate required configuration at startup. Separate keys by purpose and environment, including CSRF signing and any abuse-key HMAC. Keep local secret files ignored and use only names or inert placeholders in examples. Production secrets stay in the chosen deployment's controlled secret store.
- **Reasoning** This keeps secret access auditable and scoped while avoiding a new provider decision. Separate runtime and migration credentials limit blast radius.
- **Security impact** Never put secrets in `NEXT_PUBLIC_*`, source control, telemetry, build artifacts or client bundles. Document ownership, rotation, incident response and redaction before rollout. Test that missing secrets fail safely outside development.
- **Privacy impact** Scoped, environment-specific credentials prevent previews or tests from accessing production health or identity data.
- **Cost impact** Operational review and rotation work. A dedicated vault or its cost is a separate decision.
- **Complexity** Moderate. Inventory purposes, restrict access and test key-rotation consequences.
- **Product behaviour impact** Internal deployment design. Emergency key rotation can invalidate affected forms or credentials and needs an operational runbook.
- **PRD Sync Impact** Not required for technical secrets management.
- **Decision status** Approved

References: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) and [Next.js data security guide](https://nextjs.org/docs/app/guides/data-security).

## AUTH-ARCH-014 — Account recovery

- **Context** Recovery remains deferred from the A–D implementation. The Product Owner approved that a real-user production launch with password-protected health information must not proceed until a secure recovery mechanism is implemented or the residual loss-of-access risk is explicitly accepted after security review. Email ownership verification remains deferred.
- **Options** Defer implementation until proof, channels, security and access policy are approved. Email links, OTP, security questions, admin resets and recovery codes remain unselected mechanisms.
- **Recommendation** Reserve a future recovery service boundary and an account-wide revocation primitive. Before implementation, decide proof of ownership, delivery or support model, expiry and replay controls, abuse limits, event logging, post-recovery session handling and fallback UX. Use generic acknowledgement for any eventual recovery request.
- **Reasoning** An email address used as an identifier does not establish ownership. A recovery mechanism becomes an alternate path into sensitive records and needs independent assurance.
- **Security impact** Future changes need single-use proof where appropriate, timing and enumeration tests, credential replacement and session revocation within a reviewed transaction. Avoid identity shortcuts based on merely knowing an email address.
- **Privacy impact** New contact data, third-party delivery and support access would need separate privacy review and a minimal data policy.
- **Cost impact** Unknown until mechanism and operational support are approved. The architecture selects no paid delivery service.
- **Complexity** High once implemented. Account takeover and loss of access need adversarial testing.
- **Product behaviour impact** No recovery UI or behaviour is added in A–D. Any future recovery capability must revoke all active sessions after credential replacement. The recovery method and proof standard remain open.
- **PRD Sync Impact** Required when an approved recovery flow, proof requirement or session consequence adds product behaviour.
- **Decision status** Deferred by Product Owner; excluded from A–D.

Reference: [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## AUTH-ARCH-015 — Email ownership verification

- **Context** Email is the sign-in identifier, and verifying mailbox control is deferred.
- **Options** Leave verification deferred, require it at sign-up, or require it before a separately approved sensitive action.
- **Recommendation** Follow the deferred scope. Treat an entered email as a login identifier and never as evidence of mailbox control. Do not add a verification state transition or requirement to the initial contract.
- **Reasoning** Verification would change sign-up and delivery operations. Without it, typo-related lockout and email squatting remain residual risks. A duplicate email must be handled safely and never trigger automatic account merging.
- **Security impact** Never grant recovery, access, trust claims or account association based solely on the unverified email value. Use a database uniqueness constraint and enumeration-resistant duplicate handling.
- **Privacy impact** Store only account identity data with a defined purpose. Avoid sending account or health information to an unverified address.
- **Cost impact** No verification delivery service is needed for the initial scope. Support burden from mistakes and contested identifiers may remain.
- **Complexity** Low for deferral. Revisit migration and existing-account handling before a later verification flow.
- **Product behaviour impact** No mailbox check in the initial journey. Future verification timing and affected actions require approval.
- **PRD Sync Impact** Not required to retain the deferral. Required if a future approved verification flow changes registration or access.
- **Decision status** Deferred

Reference: [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## AUTH-ARCH-016 — Session expiration/revocation policy

- **Context** Session model and cookie attributes leave open how long access lasts and which sessions end after account events.
- **Options** Fixed absolute expiry only, server-enforced idle and absolute expiry, or short-lived access sessions with separately managed refresh credentials.
- **Recommendation** Enforce a 1-hour idle timeout and a 24-hour absolute lifetime on the server. Revoke the current session for sign-out with an idempotent invalidation path. Permit concurrent sessions across devices. Rotate on successful sign-in and reviewed security transitions. Provide a transactional account-wide revocation primitive; future password change, recovery, and account deletion must revoke all active sessions when implemented. Read-only prefetch or background requests must not silently extend the idle deadline unless explicitly classified as qualifying user activity.
- **Reasoning** Idle expiry reduces exposure from abandoned sessions. Absolute expiry bounds exposure even when an attacker keeps a stolen token active. Account-wide revocation supports incident response without introducing an initial refresh-token flow.
- **Security impact** Reject expired or revoked sessions on every protected operation. Enforce consistent server time, prevent activity updates from reviving expired sessions, and test competing requests around expiry and revocation. Never extend the absolute deadline on an activity touch. Do not report logout success until the server invalidation succeeds.
- **Privacy impact** Use only the timestamps and metadata needed for expiry, revocation and approved security review. Approve retention and deletion policy before keeping revoked sessions for diagnostics.
- **Cost impact** Indexed lookup, bounded writes to renew the idle deadline and expiry cleanup add database work. Measure it under load.
- **Complexity** Moderate. Test concurrent tabs, multiple sessions, clock boundaries, cleanup and credential-change races.
- **Product behaviour impact** Users may remain signed in on multiple devices, are signed out after 1 hour of inactivity or 24 hours absolute session age, and current-session sign-out revokes that server-side session. Future password change, recovery and account deletion revoke all active sessions.
- **PRD Sync Impact** Required when approved session lifetime, account deletion or credential lifecycle rules materially change the product journey.
- **Decision status** Approved by Product Owner on 10 November 2026.

References: [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html).

## Open product and security decisions

The Product Owner approved the V1 password policy, post-signup/post-signin routing, session lifetimes, concurrent-session behaviour, current-session logout, future all-session revocation on password change/recovery/deletion, and temporary throttling without permanent lockout on 10 November 2026.

Remaining controlled decisions are:

- Choose an account recovery mechanism and proof standard in a separate review before real-user production launch, unless residual loss-of-access risk is explicitly accepted after security review.
- Confirm when email ownership verification should be reconsidered and which actions would depend on it.
- Finalise implementation-level throttling thresholds, windows, shared-network behaviour and any source-signal privacy controls through security/privacy testing.
- Finalise what request activity qualifies to renew the 1-hour idle deadline; passive prefetch and background requests must not renew by implication.
- Define retention and deletion behaviour for revoked sessions and security events.
- Benchmark and approve final Argon2id parameters on the intended runtime.
