# HILERA authentication server contracts

Implemented for draft review in PR #6. `/sign-up` and `/sign-in` use first-party Server Actions backed by PostgreSQL authentication services; `/app` and `/onboarding` are protected by server-side session validation. Health-facing screens still use synthetic preview data. The Master PRD remains authoritative for product behaviour, and real-user exposure remains blocked by the release gates in the implementation notes and production-readiness checklist.

## Transport and trust boundary

| Option | Fit for HILERA | Cost and boundary |
| --- | --- | --- |
| App Router Server Actions | First-party form mutations for sign-up, sign-in and sign-out. Form errors and redirects fit the existing UI. | The framework transport is reachable by direct `POST`. Every action still needs server-side validation, origin checks, authorization where applicable and abuse controls. Action IDs provide no access control. |
| Route Handlers | A future explicit HTTP contract if another approved client needs stable URLs, status codes or representations. | Additional HTTP surface and contract maintenance. A browser cookie-based handler would need its own CSRF enforcement, and a cross-origin or mobile client would need a separate trust design. |
| Direct server calls | Session and current-user reads by App Router Server Components and trusted server callers. | No public read endpoint needed. A server-only data access layer (DAL) returns explicit data transfer objects. |

Use three Server Actions as thin adapters around reusable server-only authentication services on the Node runtime. Use direct server-only reads for current session and current user. This separates input, cookie and redirect handling from identity, session and query logic. A future Route Handler can call the same services after its HTTP contract and security boundary are reviewed. [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication) · [Next.js data security guide](https://nextjs.org/docs/app/guides/data-security)

## Rules shared by the contracts

- Serve browser credentials and sessions over HTTPS in deployed environments. The proposed `__Host-hilera_session` cookie carries a random opaque bearer value with `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` and no `Domain`. The session table holds a digest, and the DAL checks account eligibility, idle expiry, absolute expiry and revocation. Keep session durations, activity rules and concurrent-session limits open for review.
- Parse and bound inputs before database or expensive hash work. Allow only declared fields and strip framework-owned action metadata at the adapter. Reject unexpected application fields, repeated scalar fields and wrong types. Normalize email on the server according to the eventual approved canonicalization rules. Process the password exactly as supplied within approved policy and technical size bounds. Never put either input in URLs, telemetry, exception output or action responses.
- For every browser mutation, require an exact `Origin` match against deployment-configured scheme, hostname and port. If `Origin` is genuinely absent, parse `Referer` and require its origin to match exactly. Reject a present malformed, `null` or untrusted `Origin` without falling back. Reject the request if both usable signals are absent. Sanitize forwarded headers at the trusted ingress and avoid wildcard origins. Next.js origin/host checks and `SameSite=Lax` are additional safeguards. Keep `GET`, `HEAD` and `OPTIONS` free of application mutations. [Next.js data security guide](https://nextjs.org/docs/app/guides/data-security#allowed-origins-advanced) · [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- For authenticated browser mutations, require a session-bound synchronizer token in addition to the origin check. Derive it using a domain-separated HMAC with a dedicated server-only key and the internal identity of the active session. Verify the expected encoding and length and compare in constant time. Rotation of the session changes the token, and the active-session check rejects expired or revoked sessions before token comparison. This needs no new CSRF database field. Render the token only where the same-origin mutation needs it and keep it out of URLs, logs and shared caches. Pre-auth sign-up and sign-in have no authenticated token. Protect them with the exact-origin policy, Next.js origin/host validation and POST-only semantics, and test login CSRF with foreign and same-site sibling origins. If the deployment cannot reliably establish exact origin for anonymous submissions, evaluate a short-lived pre-session token before release. Any pre-session must be discarded before minting a real session. [OWASP login CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#possible-csrf-vulnerabilities-in-login-forms)
- Apply shared PostgreSQL-backed abuse controls before expensive credential work. Use atomic, time-bounded counters shared across instances and an application concurrency cap for expensive hashing. Combine identifier-derived and source or service-wide budgets so one shared connection or targeted email cannot be the only factor. Use keyed digests of normalized identifiers and review any transient source-derived keys for data minimisation and expiry. Throttle behaviour, capacities and windows require separate review. [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#protect-against-automated-attacks)
- Public error categories below are conceptual outcomes, independent of the framework's wire format. Keep safe, typed validation hints limited to malformed input or approved password policy. Use an allowlisted first-party destination determined by approved product state. Do not accept arbitrary redirect URLs, owner IDs, roles or state from a browser. Return no SQL errors, stack traces, raw internal identifiers or secret-bearing objects. Separate bounded diagnostics and an opaque incident reference from the response. A storage or throttle outage is a temporary-unavailable outcome for credential mutations. Protected reads fail closed.
- Across all five contracts, response DTOs omit plaintext passwords, password hashes or parameters, raw session bearers or digests, security-event internals, abuse-control keys or counters, database errors and unrelated personal or health information. The raw bearer travels only in the HTTPS session cookie at issuance and on later requests. Clearing the cookie carries no bearer. Treat a CSRF form token as separate from session and user response DTOs.

## Sign up

| Contract element | Proposed design |
| --- | --- |
| Purpose and request | Create an email/password account from `/sign-up`. Accept email and password only, with action transport metadata handled separately. |
| Validation | Enforce origin, payload shape and approved credential policy. Canonicalize email, apply abuse gates and hash the password with the approved Argon2id configuration outside the write transaction. The transaction creates the user and credential together. A database unique constraint decides duplicate races. A prior lookup is only advisory. |
| Authentication and authorization | Public operation. The service creates only a consumer account under server policy. A duplicate cannot alter, merge, replace or sign into the existing account. Do not silently switch or merge an existing authenticated browser identity. |
| Success | Commit user and credential before success. After the product owner decides immediate sign-in versus a sign-in step, the adapter issues a fresh session and uses an approved product-state destination, or sends the user to sign-in. If session creation is in the creation transaction, set its cookie only after commit. Define the committed-account retry path if a later response fails. |
| Safe errors | Invalid input, a generic registration failure for an unavailable identity, retry later or temporary unavailable. Keep duplicate response copy, status and timing free of avoidable disclosure. Successful creation or automatic sign-in can still differ observably from a duplicate. Treat that residual enumeration risk as part of the sign-up policy decision. |
| Rate limit | Shared registration attempt budget keyed independently of whether the identity exists, plus an approved coarse source or service budget and hash-capacity guard. |
| Security events and sensitive output | Record `account_created` after commit, plus minimal registration rejection or throttling signal if approved. Omit password, hash, session internals, entered email on errors and any indicator of existing account ownership. |

Sign-up uses the approved email/password identifier model and approved 15–128 character password policy. Successful sign-up creates a session and routes to `/onboarding`. Duplicate registration returns a generic failure and never modifies or merges an existing account. Email ownership verification, paid provider calls, phone verification, OTP and recovery remain outside this contract.

## Sign in

| Contract element | Proposed design |
| --- | --- |
| Purpose and request | Authenticate from `/sign-in` with email and password only. The browser does not supply the user ID or requested product state. |
| Validation | Check origin, shape and bounds. Apply shared abuse admission before expensive verification. Resolve the normalized identifier on the server. Verify using the stored Argon2id representation or perform equivalent dummy verification for a missing credential. Measure observable differences across missing, incorrect and ineligible cases under representative load. |
| Authentication and authorization | Public entry point. Create a session only after verifying the credential and confirming account eligibility. Protect against a concurrent credential change or account disable between verification and issuance by rechecking the verified credential version and account inside the session-creation transaction. |
| Success | Generate a fresh random token and persist its digest in a revocable session. Rotate the session presented by this browser at the authentication boundary where applicable, and issue the cookie after commit. Route successful sign-in to `/app/dashboard` (Overview). Other active sessions remain valid because concurrent sessions are approved. An eligible older hash can be rehashed after successful verification with a conditional update that cannot overwrite a newer credential. |
| Safe errors | Invalid input, generic sign-in failure for unknown identity, wrong password or ineligible account, retry later, or temporary unavailable. Compare copy, status, redirects, headers, response body shape and timing for account-existence discrepancies. |
| Rate limit | Multi-key, shared login budgets with atomic accounting, bounded work and a reviewable retry policy. Keep retries and throttle behaviour independent of account existence where practical. Avoid irreversible lockout triggered by unauthenticated traffic. |
| Security events and sensitive output | `login_succeeded`, `login_failed` or a minimal throttling signal as approved. Use a user ID only where necessary and justified. Omit credential representations, entered email, session internals and account eligibility or existence details. |

## Sign out

| Contract element | Proposed design |
| --- | --- |
| Purpose and request | End the current browser session. Accept only the session-bound CSRF proof. Resolve the active session from the cookie. No browser-selected session ID. |
| Validation | Require POST and trusted origin. Verify the token against the current active session. A missing or already-invalid session can return the same signed-out outcome after origin validation, with no session mutation. |
| Authentication and authorization | Scope the mutation to the session presented by this browser and the corresponding user. An account-wide sign-out policy is separate. |
| Success | Commit revocation of the current server session, then clear the matching cookie and redirect to an approved public route. Clear client views of protected content and revalidate relevant route state. Retrying a completed sign-out is safe. |
| Safe errors | Invalid mutation proof or temporary unavailable. A datastore failure must not be reported as successful server-side sign-out. Never reveal which session existed. |
| Rate limit | Bound request abuse at the service edge. Avoid a login throttle that makes valid users unable to revoke their current session. |
| Security events and sensitive output | Record `logout` or `session_revoked` when an actual revocation is committed, without a raw session ID, bearer, digest or credentials in the public result. |

## Get current session

| Contract element | Proposed design |
| --- | --- |
| Purpose and request | Server-only `getCurrentSession()` resolves request-bound authentication from the HttpOnly cookie. Accept no browser-provided identity. `requireSession()` wraps the result for protected callers. |
| Validation | Validate token shape, derive the digest, find a matching server record, and check revocation, idle and absolute expiry and account eligibility. Resolve missing, malformed, expired and revoked credentials as unauthenticated. |
| Authentication and authorization | An unprotected server caller may resolve an anonymous request. A protected caller must require the active session. Return only the principal needed by the trusted caller. Use any internal session row key only where server logic requires it. |
| Success | Return a minimal server-only principal or an anonymous result. Protected pages redirect unauthenticated requests to sign-in before rendering protected data. Session lookup and page prefetch do not renew idle expiry. Renew only on activity approved under AUTH-ARCH-016 through a protected mutation. |
| Safe errors | Anonymous or temporary unavailable. Distinguish infrastructure failure from invalid credentials internally and fail closed for protected reads. |
| Rate limit | Bound request volume at the server and query layer. A request-local check can be reused during a single render. Never share session results across users or requests. |
| Security events and sensitive output | Routine reads need no persistent security event. Use bounded, reviewed anomaly signals rather than recording each read. Omit the bearer, digest and session internals from browser outputs. |

## Get current user

| Contract element | Proposed design |
| --- | --- |
| Purpose and request | Server-only `getCurrentUser()` selects the minimum user fields for the current view. `requireUser()` makes a valid user mandatory. No browser-supplied user ID. |
| Validation | Resolve a valid session first. Query the user by the session principal and enforce account eligibility. Protected data access additionally constrains the resource to that owner. |
| Authentication and authorization | A valid session is required to return any user data. The initial consumer user sees their own allowed fields only. Administrative capabilities require a separate design. |
| Success | Return the minimum view DTO, or an anonymous result to an unprotected caller. Include an email only where a specific view requires it. The internal user ID used for ownership need not cross the server/browser boundary. |
| Safe errors | Anonymous, generic access denial or temporary unavailable. Do not distinguish another person's record from an absent record in a public result. |
| Rate limit | Use normal server request limits and request-local deduplication. No public current-user endpoint or separate authentication budget proposed. |
| Security events and sensitive output | Do not log routine reads. Consider an approved signal for suspicious access denials. Exclude credential, session and audit fields and unrelated personal or health data. |

## Protected route adoption

Apply server checks to `/app/dashboard`, `/app/measurements/new`, `/app/measurements/history`, `/app/trends`, `/app/risk-summary` and `/app/education` before returning protected content. Use a server entry-point check for direct requests and authenticated navigation. Re-check in every sensitive DAL operation and mutation, including any future handler, regardless of how its caller reached it. A Next.js Proxy can redirect early based on missing cookie presence and avoid a database check on every matched request. Presence cannot prove a session is valid. A persistent layout cannot be the sole guard. Keep authenticated data, HTML and React Server Component payloads out of shared caches, static exports and public previews. Test direct URLs, prefetch and client navigation, plus two-account ownership isolation. [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication#authorization) · [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

## Deferred contracts

Reserve a server-only recovery service boundary. It can call the credential and session revocation services after a recovery mechanism, proof, privacy policy, notifications and revocation rules are approved. There is no recovery endpoint or email-ownership requirement in this proposal. Any future request and completion interfaces need generic responses, anti-enumeration and replay controls, and an approved method before design moves to implementation. See the [security decisions](auth-security-decisions.md), [conceptual data model](auth-data-model.md) and [threat model](auth-threat-model.md).
