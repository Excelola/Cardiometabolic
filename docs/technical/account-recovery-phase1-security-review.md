# HILERA — Account Recovery Security Architecture Review

**Reviewed:** 12 November 2026  
**Review status:** Completed design review; implementation **BLOCKED on remaining product and security decisions**  
**Scope:** Draft PR #20, approved Phase 1 PRD direction, existing `main` authentication modules  
**Reviewed baseline:** `main` at `83fc561b21395b67d2b097c5ae779bdf7ba7d69a`; PR #20 at `c3533797aa59a5b87ac630061062fca4ada3f477` before this review note  
**No code, schema, clinical, provider, production or PRD changes made by this review.**

## Executive decision

**Architecture is suitable in principle**: extend HILERA's existing typed Next.js/Drizzle modular monolith, PostgreSQL auth tables, Argon2id password policy, trusted-origin/CSRF controls and DB-backed revocable sessions. **Do not start recovery persistence or activation until the P0 account-email ownership rule and existing-unverified-user handling are approved.** A verification message delivered to an inbox proves access to that mailbox at that time, not rightful ownership of health records created earlier under the account.

A documentation-only PR may be separately reviewed for merge without approving the unresolved product rules; no implementation or provider contract is authorized by merging documentation.

## Findings and dispositions

### AR-SEC-01 — P0 / Critical — Account-ownership and historical health-data exposure

**Observed:** `src/server/auth/credentials.ts` creates account, Argon2id credential and active session immediately on sign-up. `users` currently stores only normalized email and creation time. Email ownership is not verified. Approved recovery requires a *previously verified* account email.

**Failure mode:** A person enters an address they do not control, signs in with their own password and creates health records. Later the actual inbox owner clicks a newly issued verification message and resets that account's password. Without a legacy policy, verification could unintentionally transfer access to health records created by another person.

**Required decision (Product Owner, security/privacy):**
- Define the verification requirement before first **production** sensitive-health-data save; decide whether unverified users may sign in/onboard but must not save health records.
- Define the status and remediation for already-created unverified accounts, including accounts with existing data; never bulk-backfill `verified` or infer it from a prior successful login.
- Do not retroactively make past unverified-record ownership recoverable solely by demonstrating present-day inbox control.
- Define non-deceptive UX for unverified users who lose their password or access to their mailbox.
- Apply any health-data gate in **server-side data mutation services**, not merely navigation/UI. Cover manual entry, corrections and document confirmation; constrain data reads as required by the approved policy.
- No accidental deletion, reassignment or account merging.

**Disposition:** BLOCKS implementation planning and real-user release; needs additional product approval and scoped PRD sync.

### AR-SEC-02 — High — Token transport and secret handling

**Observed:** The draft mentions email reset links or manually entered codes without selecting the mechanism. It correctly prohibits secrets in ordinary logs, analytics and URLs, but these requirements cannot be enforced with a naive query-string reset link.

**Alternatives for decision:**
- **High-entropy link (256-bit random token):** easier for users and standard OWASP recovery pattern; may enter browser history, referrer, analytics, reverse-proxy request logs, screenshots or forwarded messages. Requires an agreed URL-exposure exception and strong mitigation: fixed trusted origin, HTTPS, strict Referrer-Policy, no third-party content, request masking, no GET-side mutation, single-use POST exchange, and immediate removal of the token from URL on navigation where technically possible. Do not pretend these controls eliminate all browser/history leakage.
- **Email-delivered manual code:** avoids placing the proof in the page URL and aligns with strict no-secret-in-URL posture. Lower-entropy human-entered codes need tighter attempt bounds, short expiry, an account/session-bound ceremony, and a **keyed digest (HMAC or similarly protected lookup)**; plain SHA-256 of a short numeric code is vulnerable to offline enumeration if the database leaks.

**Required decision:** Select the transport, token entropy or code length, expiration, failed-attempt bounds, resend invalidation and handling of copied/forwarded emails. The previously mentioned 20-minute lifetime remains a proposal, not approved policy. Avoid assuming NIST-specific assurance requirements are automatically satisfied by email-only recovery.

**Disposition:** BLOCKS credential implementation.

### AR-SEC-03 — High — Transaction ordering and sign-in/reset race

**Observed:** `authenticateAccount` reads/validates Argon2id outside its transaction, then locks `users` followed by `passwordCredentials` and verifies the hash again. `revokeAllUserSessions(tx,userId)` takes the `users` lock before session writes.

**Required implementation invariant:** In reset completion, acquire **users → credential → challenge/session** locks in a consistent order (check actual schema dependency and foreign-key locking). Recheck current credential version and email verification state under the owner lock. Consume the challenge conditionally, update the credential, invalidate all other reset challenges, revoke *all* sessions and record a minimal event in one atomic DB transaction. No session may be created using a credential snapshot that was invalidated by a completed reset. Use a DB-generated trusted timestamp for expiry/consumption where useful.

**Tests:** Two simultaneous valid reset submissions; reset vs sign-in using old password; reset vs rehash; reset vs resend; transaction rollback; other-device session rejection; expired or revoked session not renewed.

**Disposition:** Security acceptance criteria required in implementation PR. No observed current-v1 vulnerability from this future feature.

### AR-SEC-04 — High — Abuse throttling, request amplification and deliverability

**Observed:** `reserveAuthAdmission` currently uses one global key and one identity HMAC namespace; `auth_throttle_buckets` scope enum is `global|identity`. Blind reuse for password reset would compete with legitimate sign-in attempts and could enable email-send flooding or throttling-induced denial of access.

**Recommended technical approach:** Purpose-separated, server-authoritative rate-control budgets (e.g. request and verification attempt budgets) plus global bounded work and email delivery quotas; maintain account-existence-neutral observable results. Keyed pseudonyms only, bounded storage/key cardinality, staged backoff, no permanent lockout, and deliberate handling of provider saturation and retries. Do not create unaudited free-text or high-cardinality per-attempt security events.

**Disposition:** Required design and load testing before public recovery endpoints.

### AR-SEC-05 — Medium / High for production — Email sender availability and delivery consistency

**Observed:** No approved transactional email service, sender domain, secrets, deliverability monitoring, privacy agreement, data location or cost ceiling. Provider choice is explicitly out of approved scope.

**Required design:** Choose a trusted sender boundary only after vendor or self-managed cost/privacy/security review. Ensure errors fail closed. Do not mark a recovery message sent merely because a challenge was stored. A database commit plus synchronous email send can fail partway; define whether to revoke unsent challenges, retry safely, or introduce an audited outbox. If a queue stores proof, raw/low-entropy secrets may **not** be persisted in plaintext; encrypted payload retention, envelope-key access and expiry need separate review. Avoid premature queue infrastructure and unlimited resends.

**Disposition:** Blocks real mail, staging integration and production activation. Synthetic mail sink only for approved tests.

### AR-SEC-06 — Medium — Existing security-event schema constraints

**Observed:** `auth_security_event_type` enum permits `account_created`, `sign_in_succeeded`, `sign_in_failed`, `sign_out` and `session_revoked`. Database constraint `auth_security_event_attribution` explicitly requires `userId IS NULL` only for `sign_in_failed`; the typed writer matches this contract.

**Implication:** Adding anonymous `recovery_requested` events with null user ID would violate the existing check. Never add event types without reviewing the check, migration, typed writer and event retention. Prefer bounded aggregate recovery-request metrics for abuse-heavy public traffic and event records only where useful and justified.

**Disposition:** Additive migration/security review before implementation.

### AR-SEC-07 — Medium — Case-sensitive identity preservation

**Observed:** `normalizeEmail()` lowercases the **domain only**, preserves local-part case, does not apply Gmail-dot or plus-address transformations. Current DB `users.normalized_email` is unique on exact value.

**Required:** Preserve these semantics across email verification, recovery request, challenge binding, canonical owner lookup and email provider delivery. Revisit any local-part comparison change separately with collision/duplicate-account migration analysis. Include `User@Example.com` vs `user@example.com` and dot/plus tests; never merge accounts implicitly.

**Disposition:** Must be covered in implementation QA; no normalization change authorized.

### AR-SEC-08 — Medium — Assurance and communication claims

**Observed:** Verification demonstrates control of a mailbox, not a person's legal identity, clinical accuracy or authority over another person's record. Email-only recovery is comparatively vulnerable to mailbox compromise and does not constitute phishing-resistant MFA.

**Required:** State this limitation in security design, do not overclaim NIST compliance; user-visible reset confirmation and independent notification may require additional notification destinations and a separately approved incident/recovery route. Saved recovery codes, MFA, passkeys, other channels and user email-change management remain unapproved.

**Disposition:** Product/security review before production release.

## Recommended minimum technical architecture (non-binding)

```text
Public recovery request / authenticated verify-email request
          |
          v
Next.js server entry — trusted-origin checks and request validation
          |
          v
Purpose-scoped abuse admission (bounded + pseudonymous)
          |
          v
Auth recovery service (server-only, typed)
       /             |               \
      v              v                v
PostgreSQL       Mail adapter      Security events
users/credential   (sink only       allowlist +
sessions/challenge until approved)  aggregate metrics

Approved recovery completion transaction:
lock user → lock credential + verify state → validate/consume proof
→ replace Argon2id password → invalidate related proofs
→ revoke all user sessions → audit minimal event → commit
→ normal sign-in required (no automatic login)
```

**No database migration is authorized by this review.** Candidate `email_verified_at` and challenge tables need independent schema review and additive migration only after product/email-ownership decisions.

## Acceptance/review matrix for future implementation

| ID | Required evidence |
| --- | --- |
| SECURITY-01 | Unverified or legacy-email address cannot seize existing account or health records |
| SECURITY-02 | Unknown, verified and unverified requests have generic responses; timing/headers/cookies considered |
| SECURITY-03 | Only correct purpose/account/email binding and non-expired unconsumed proof can reset |
| SECURITY-04 | Reset updates password and invalidates all sessions atomically; sign-in/reset race handled |
| SECURITY-05 | No raw tokens, reset URL, password, email, health data or CSRF values in logs/analytics or error payloads |
| SECURITY-06 | Token/code entropy, hashing strategy, attempts and expiry match approved transport |
| SECURITY-07 | Delivery failures and production-unconfigured sender fail closed; fake sender cannot activate in production |
| SECURITY-08 | Throttling does not amplify outbound email or starve legitimate normal sign-in |
| SECURITY-09 | Additive migration, security-event constraints, permissions and cleanup/backup rehearsal pass |
| SECURITY-10 | 320/390/1440px, keyboard, focus, screen-reader labels, expiry and error-state UX tested |
| SECURITY-11 | Real disposable PostgreSQL integration + concurrency + HTTPS/TLS synthetic browser tests pass |
| SECURITY-12 | Product Owner, security/privacy/legal/provider and release approvals are recorded; no implicit production activation |

## Immediate recommended decisions (not silently approved)

**Decision A — Sensitive-health-data access:** Should all **new** accounts be required to verify their email before the first real sensitive-health-data save, while otherwise preserving the approved sign-up session and Onboarding journey? This is a **new product-visible gate** needing explicit approval and Master PRD sync.

**Decision B — Existing accounts:** Should existing unverified accounts with prior health data be excluded from self-service email reset until a separate verified-ownership remedy exists, without deleting or reallocating data? This is the lowest-risk provisional recommendation, subject to Product Owner approval. Accounts with no health data may have a different re-verification path only after review.

**Decision C — Proof delivery:** Prefer manually entered email code under strict no-credentials-in-URLs policy; alternatively high-entropy emailed link with signed-off URL/log/referrer/history risk controls. Exact user experience and entropy/expiry remain unresolved.

**Decision D — Sender/provider:** Research free/self-managed versus transactional email options and review cost, Nigerian data protection obligations, support and deliverability. Do not select one silently.

## Rollout, rollback and production gates

1. Complete A–D decisions and additional PRD sync as required.
2. Security/design review on an implementation-ready technical spec.
3. Implement in scoped branch with flags disabled until approved; additive migration rehearsal on disposable PostgreSQL.
4. Test verified vs unverified, cross-user, session revocation, abuse and provider failure; inspect synthetic canaries in logs, URLs and storage.
5. Stage on HTTPS/verified TLS with synthetic accounts, isolated sender sandbox and operational alerting.
6. Activate only via separate Product Owner approval and security/privacy/provider signoff. Rollback disables new challenges and delivery, invalidates outstanding proofs, and preserves account health data and integrity. Do not destructively roll back applied migrations.

## Source references

- HILERA Master PRD, approved 12 November 2026 Phase 1 amendments in Sections 4.4, 5.7, 6.5, 6.25 and changelog.
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- [OWASP Email Validation and Verification Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html).
- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), recovery / notification guidance as comparative standards, **not** a claim of conformance.

**Review conclusion:** PR #20 may continue as a documentation review, but the recovery implementation and provider selection remain gated. **PRD Sync Status:** Completed for the direction already approved; **Required** if Decisions A/B or any further product-visible flow receives approval.
