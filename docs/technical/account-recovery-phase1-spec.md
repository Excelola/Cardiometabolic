# HILERA Phase 1 — Verified-Email Account Recovery: Technical Specification (Draft)

**Date:** 12 November 2026  
**Status:** Technical proposal for security/product review; **not** an implementation or production activation authorization  
**Authoritative product source:** [HILERA Master PRD](https://docs.google.com/document/d/184mETZUCAla2V8LaEwkMAfm4AkicImZ-OFmVoZNS22A/edit), Sections 4.4, 5.7, 6.5, 6.25, changelog 12 November 2026  
**Repository baseline:** `main` at `83fc561b21395b67d2b097c5ae779bdf7ba7d69a`  
**Implementation:** not started; all provider activation is out of scope

## 1. Approval boundary

### Approved product behaviour
- Verified ownership of the registered account email is a prerequisite for email-based password recovery.
- A public "Forgot password" entry path provides a generic response independent of account existence, verification status and eligibility.
- Recovery proof is cryptographically secure, single use, time limited and must be validated before credential change.
- A newly chosen password satisfies the existing V1 policy (15–128 Unicode code points, local compromised/common password blocking, Argon2id storage).
- Successful reset invalidates relevant outstanding recovery credentials, revokes all active account sessions, and returns the user to normal sign-in.
- Recovery actions are auditable with minimal sensitive state; no raw recovery secret or health data enters ordinary logs/analytics.
- The current sign-up → authenticated session → Onboarding and sign-in → Overview policies remain unchanged **until any additional verification gate is approved**.
- No production activation, SMS/WhatsApp/voice OTP, paid provider, auto-merge, or new medical behaviour is authorized.

### Open decisions / proposals, not approved
- Which transactional email delivery service (or self-managed delivery), its cost, deliverability, DPA/transfer terms, hosting region, and operational ownership.
- Exact email verification entry points/timing and whether verification must precede sensitive health-data capture.
- Legacy/unverified-account migration and loss-of-access handling.
- Token transport in reset emails (link in URL vs secure email code), TTL, resend policy and abuse limits.
- Whether an outbox/background dispatcher is required, the deployment worker/scheduler and notification retry semantics.
- Saved recovery codes or other secondary methods, email-change controls and recovery for compromised email.
- Exact retention/cleanup of verification challenges and email-delivery metadata; must align with existing HILERA policies.
- Rollout flags and staged activation conditions.

**Security critical:** Current HILERA signup does not prove inbox ownership. An email holder must not automatically gain access to historical health data for a previously unverified account merely because they can receive mail. Resolve the verified-email / existing-account ownership and pre-health-capture gate before real-user activation. Until then, recovery must fail closed for unverified accounts.

## 2. Existing code and system boundaries

The current architecture is a Next.js App Router + strict TypeScript modular monolith, PostgreSQL/Drizzle, first-party email/password auth.

Relevant modules verified on `main`:
- `src/server/db/schema.ts`: `users`, `passwordCredentials`, `authSessions`, `authThrottleBuckets`, `authSecurityEvents`.
- `src/server/auth/credentials.ts`: account creation / sign-in, Argon2id and transaction boundaries.
- `src/server/auth/sessions.ts`: `revokeAllUserSessions(tx,userId)`; takes user lock first, then revokes sessions; preserves current 1-hour idle / 24-hour absolute policy.
- `src/server/auth/input.ts`: normalized email retains the **exact local-part case**, lowercases domain only; do not silently lowercase entire addresses or merge existing users.
- `src/server/auth/mutation-security.ts`, `throttle.ts`, `security-events.ts`, `request-session.ts`: trusted origin, CSRF, throttling, sanitized audit and session handling.

Extend those boundaries. Do not add a new auth microservice, replace authentication, or create any client-authoritative identity state.

## 3. Proposed user journeys

### 3.1 Verify an account's registered email
1. An appropriately authenticated user requests verification for the **current registered account email**; never accept a browser-chosen target address as authoritative.
2. The server applies origin + CSRF + abuse admission, issues a purpose-scoped challenge and hands a minimal delivery job to the approved mail boundary only if it is available.
3. The email directs the recipient to a secure confirmation experience. The completion endpoint checks the purpose, recipient/account binding, age, single-use state and any re-authentication policy.
4. Under an owner-scoped transaction, mark the currently bound email verified only if the email identity has not changed and the challenge is valid; consume it atomically. Do not rotate an account into a different email.
5. Display a clear confirmation state; keep the existing account/session policy unless separately approved.

**Threat / decision gate:** For an unverified account created with someone else's email, inbox verification alone must not automatically grant recovery to pre-existing protected records. Require a separately approved migration/eligibility and pre-sensitive-data policy. Do not claim address ownership implies rightful ownership of historic account contents.

### 3.2 Request password recovery
1. Public `Forgot password?` accepts a bounded email input. Use the existing normalizer without changing local-part case equivalence.
2. Apply shared abuse controls **before expensive or deliverable work**; reserve comparable operations for nonexistent, unverified and existing accounts to reduce observable differences.
3. Always return generic copy such as "If your email is eligible, we'll send recovery instructions." Do not disclose whether a message was queued or delivered.
4. Only if the email was previously verified, eligible, and the approved delivery service is available, issue a one-time recovery challenge bound to the account and currently verified email, then deliver it privately.
5. An unavailable provider or unapproved verification/delivery path must fail closed without sending real emails or producing valid externally redeemable recovery credentials.

### 3.3 Complete password reset
1. The person opens a recovery link or provides the emailed proof through a reviewed transport. Prefer avoiding secrets in referrers, analytics, access logs and client storage; final design is pending.
2. Validate the exact purpose, digest, expiry, non-use, account/email binding and relevant password-change/version constraints.
3. Require a new password and confirmation; validate using the existing V1 password policy.
4. In one database transaction, acquire a consistent owner/credential/challenge lock order, conditionally consume the challenge, update the Argon2id credential and `password_changed_at`, invalidate other reset challenges, and revoke **every** session.
5. Log a minimal allowlisted security event and arrange a reset notification. Never return a reusable bearer or automatically sign in.
6. Return to sign-in. The old password and all old cookies must fail.

### 3.4 Exception paths
- Unknown account/unverified address: same public acknowledgement, no reset challenge.
- Expired/consumed/malformed/incorrect challenge: generic safe error, no credential mutation.
- Concurrent reset submissions: at most one successful commit.
- Concurrent sign-in or password update: lock and recheck credential version so stale authentication cannot issue valid sessions after reset.
- Delivery failure: no misleading public indication of account existence; bounded retries only after the provider strategy is reviewed.
- Verification email sent but address changed: invalidate old proof.
- Missing email access: no bypass via raw health data, identity questions, support impersonation or automatic account reassignment; secondary recovery remains deferred.
- Email compromise: email alone is a limited recovery assurance; review notifications and possible additional evidence before rollout.
- User actively logged in during reset: all sessions revoked after reset; browser redirects safely to sign-in.

## 4. Proposed typed data model (design only; migration not approved here)

### User email state
Candidate additive nullable `users.email_verified_at timestamptz`; this stores a verifiable state for the **current** `users.normalized_email`. An eventual email-change operation must reset/rebind verification state atomically and requires separate product approval. Consider verification method/version only when needed for meaningful audit or assurance; avoid copying email values.

### Purpose-bound challenges
Candidate `auth_email_challenges` table with:
- `id uuid` primary key
- `user_id uuid` owner FK (delete behaviour separately reviewed for the account deletion lifecycle)
- `purpose enum('verify_email','reset_password')` or distinct bounded types
- `token_digest bytea`, unique, 32-byte digest of an unpredictable high-entropy secret; **never store raw proof**
- `created_at timestamptz`, `expires_at timestamptz`, `consumed_at timestamptz null`
- bounded association to the registered email identity/version at issuance (candidate email fingerprint or version; avoid duplicating plaintext email if possible)
- optional issuance/delivery status only if necessary for a reviewed failure/expiry contract

Constraints: digest length, valid expiry order, one-time consumption, user/purpose indexes, expiry cleanup. Locking and conditional write predicates enforce replay protection. Retention must be minimal and comply with the already approved 12-month default for necessary security events and shorter TTL for ephemeral challenges; precise challenge cleanup requires design review.

### Security events
Propose allowlisted new event categories (e.g. `email_verified`, `password_reset_completed`, bounded `recovery_requested` if justified) and additive enum migration. Avoid free-text, raw email, full reset URL, token, IP fingerprint, health measurements or event fan-out under abuse. Review whether request events should be stored at all versus aggregate throttling metrics.

### Email delivery interface
Server-only `RecoveryEmailSender` / `VerificationEmailSender` interface. Production implementation must not exist until provider/security/privacy/cost review. A fake/sink provider may be used **only** in synthetic, explicitly flagged non-production tests and must remain unreachable in production builds/runtime. If an outbox is selected, create atomic intent in the credential transaction but never persist raw recovery tokens in outbox plaintext, URLs or normal logs; secure dispatch and token lifecycle need separate design review.

## 5. API / action contract proposals

All naming below is indicative and does **not** authorize endpoint creation:
- `POST /auth/verification/request` (session + CSRF + exact origin; existing identity only; generic public-safe result)
- `POST /auth/verification/complete` (purpose-bound proof; secure origin; no automatic account merge)
- `POST /auth/recovery/request` (public, origin-restricted, throttled, generic response)
- `POST /auth/recovery/complete` (validated recovery proof + new password; transactional reset; no automatic sign-in)

Authenticated verification mutation must bind to the server-resolved principal. Anonymous recovery must not use a browser-supplied `userId` as an authorization key. No account existence/status leaks via status, body, redirects, cookies, response timing or differing cache semantics. Set no-store on sensitive responses. Protect all write methods against CSRF and cross-origin submission using the existing reviewed approach where applicable.

## 6. Security and privacy controls

- Cryptographically strong independent challenges, purpose separated and digested at rest; bounded token attempts, expiry and single use.
- Database-enforced race safety and account-wide revocation using the current session primitive and lock order.
- Generic account existence response; effective global/identity throttling and limits on email sends per identity.
- No credentials, recovery secrets or protected health values in ordinary application/proxy logs, traces, analytics, page URLs, browser storage, error messages, test artifacts or emails. **Reset-link token transport requires explicit security design review** to prevent leakage; never pretend a conventional query-string URL is intrinsically safe.
- Email verification for recovery does not establish the authenticity of stored health measurements or the user's legal identity.
- Least-privilege database access, TLS, encrypted backups, event retention, DPO/DPIA/subprocessor/cross-border review if provider processes Nigerian data outside Nigeria.
- Real-account recovery cannot be tested with production health data. Use disposable PostgreSQL and synthetic mail sink only.
- Security notifications must contain no credentials or health content; provider deliverability and alert response are production readiness gates.

## 7. Tests and acceptance evidence

**Unit**
- Case-sensitive local-part email identity is preserved.
- Generate/digest, wrong-purpose, expired, consumed, malformed and purpose/owner mismatch.
- Blocklist/password length, Unicode input and repeated attempts.
- Generic responses for unknown/unverified/verified recipients, including status/body/header differences.
- Provider unavailable, fake provider disabled in production, send retries/rate limits and non-disclosure.

**Integration (disposable PostgreSQL)**
- First verification success, duplicate submission and stale email binding.
- Unverified account cannot reset.
- Correct password rehash + session revocation atomically; old cookies denied.
- Concurrent confirmation/reset succeeds only once.
- Concurrent reset versus sign-in or credential update cannot reissue stale authenticated sessions.
- Two-user isolation, throttling and deadlock/lock-order testing.
- Email challenge expiry/cleanup and retention; rollback after partial transaction failure.
- No raw challenge, email, health canary or secret in database audit extras, logs, traces and error payloads.

**Browser/E2E**
- Clear mobile/desktop "Forgot password?" and neutral request acknowledgement.
- Verified-user reset success and subsequent fresh sign-in.
- Expired/reused/missing proof; broken delivery and retry guidance.
- Accessibility: keyboard, labels, focus management, notices and contrast.
- Narrow sizes 320/390px; desktop 1440px; no sensitive token in browser history or analytics.

**Production-like release**
- HTTPS and verified PostgreSQL TLS, synthetic accounts, test CA, server-side session revocation, provider disabled/default fail closed; no live messages until approved.
- Reviewed vendor, DPA, cost limits, deliverability, bounce/abuse handling, secrets, observability, retention/deletion, rollback and incident runbook.

## 8. Explicit implementation and release gates

**Before any schema or application implementation:** security review of the above design; resolve email ownership migration/verification timing and challenge delivery design; clarify accepted token transport and timeouts. Product-visible decisions must be approved and synced to the Master PRD.

**Before production emails:** approve sender/provider (including any cost), transactional delivery, compliance review, sender domain DNS/SPF/DKIM/DMARC where applicable, environment separation, secret management and monitoring.

**Before real-user account/health data launch:** verified ownership access policy; recovery usability and abuse tests; legal/DPO/DPIA assessment as applicable; full production infrastructure and incident readiness. No medical/clinical logic changes under this workstream.

## 9. References

- Authoritative HILERA Master PRD (linked above; source of approved product behaviour)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [OWASP Email Validation and Verification Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html)
- [NIST SP 800-63B-4 (July 2025)](https://csrc.nist.gov/pubs/sp/800/63/B/4/final), account recovery and subscriber notification guidance

---
**PRD Sync:** Completed in the Google Doc on 12 November 2026. **Technical spec status:** Draft pending security/provider and remaining Product Owner decisions. **Production activation:** Not approved.
