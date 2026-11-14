# Verified-email recovery implementation

The 13 November 2026 Master PRD A–D policy supersedes earlier verification-timing and transport proposals in draft PR #20. That PR remains a design reference. This branch implements synthetic development only; real delivery and production recovery remain disabled.

## Account and migration boundary

The additive migrations `0003`–`0007` add verification and recovery state, purpose-bound challenges, independent recovery-admission buckets, and two allowlisted security events. They do not modify health records or credentials. `legacy_recovery_restricted` defaults to true for safety. Migration therefore conservatively restricts every pre-existing account, including those without known health records. New accounts created by the revised signup service explicitly receive false. Existing accounts retain normal password sign-in and their prior health-write behavior; any later inbox verification does not clear their recovery restriction. Any broader remediation requires separate approval.

New accounts default to requiring email verification before a health write. Owner-row locking in the same transaction protects manual creation and correction, document confirmation, and extracted-candidate insertion. The document upload service checks before processing as well. Signup, sessions, onboarding and existing health reads retain their previous behavior.

The database migration alone cannot upgrade application instances that are already running old code. Production rollout requires a coordinated maintenance or equivalent cutover that prevents signup and health mutations through old instances after the migration and before the updated application is fully active. Back up and rehearse the migration first. Rollback must disable issuance and invalidate outstanding challenges while preserving user and health records; use a reviewed forward repair for applied schema changes rather than destructive reversal.

## Challenge and delivery behavior

The server generates a 128-bit random code, encodes it as 22 base64url characters, and stores only an HMAC-SHA256 digest bound to purpose, owner, exact registered email and an independent server secret. Recovery digests also bind the current credential hash without storing a second copy, so a credential change or rehash invalidates an earlier code. The implementation parameters proposed for security review are a ten-minute lifetime and five failed attempts. A newer request invalidates earlier pending codes for that user and purpose. Those values are technical controls, not a product promise or a substitute for production abuse testing.

`HILERA_AUTH_EMAIL_CODE_SECRET` is an independent 32-byte base64url server secret. It must differ from the CSRF and throttle secrets. The application has no real email sender. `HILERA_SYNTHETIC_EMAIL=enabled` selects an in-memory sink only in non-production, and the sink accepts only `@example.test` mailboxes. Its messages are bounded and discarded after the code lifetime. Production ignores the flag, cannot select the synthetic sink, and fails closed. Do not use real accounts in the synthetic environment. No mail provider, credential or production sender is configured.

A challenge remains inactive while delivery is pending. After the adapter reports success, a conditional database update activates the still-current, unexpired challenge. Delivery failure or a failure before activation leaves it unusable. A recovery request returns generic public copy and uses a separate database-backed global and identity budget from ordinary sign-in. The current response floor reduces simple timing differences but does not establish timing indistinguishability under load. Production security review and traffic tests must evaluate enumeration, queueing, saturation, identity budgets, and sender failure behavior before any real provider is integrated.

The current admission design gives each recovery or verification purpose a separate ten-minute fleet budget of 100 requests and a per-identity budget of five, with a maximum of 4,096 stored pseudonymous buckets. The budgets are implementation review values and require deployment-specific load and abuse testing. The response floor for eligible recovery request and completion processing is 750 milliseconds. Expired challenge and throttle cleanup require operational scheduling and monitoring before real-user activation.

Verification uses the authenticated server session, exact origin and session-bound CSRF. The server derives the account and registered email; browser-supplied account IDs and verified flags are never authority. Public recovery requires a trusted origin and generic response. Proofs are submitted in POST bodies and never intentionally placed in URLs, browser storage, analytics or application logs. An owner lock serializes verification, challenge issuance and recovery. Reset takes owner then credential then challenge/session locks, consumes the proof, changes the password under existing policy, revokes all sessions, and records a minimal event in one transaction. Sign-in rechecks the locked credential before issuing a session.

## Server Action contracts

- `requestVerification` accepts the session-bound `csrf` field and derives the registered address from the authenticated principal. `completeVerification` accepts `csrf` and `code` for that same principal.
- `requestRecovery` accepts a bounded `email` and returns a generic acknowledgement for valid address syntax. `completeRecovery` accepts `email`, `code`, `password` and `confirmPassword`; it returns a generic failure or redirects to sign-in on success. The code is never in the redirect or a URL.
- Each action rejects an untrusted origin, and authenticated actions check the session-bound CSRF proof. Actions reject unexpected or duplicate fields through the existing form parser. Neither the client nor a request field can set verification or legacy eligibility.
- During this development phase, direct production requests cannot issue or redeem challenges because no approved sender is configured. The pages explicitly show that delivery is unavailable.

The `email_verified` and `password_reset_completed` security events contain only the existing owner reference and timestamp. Expired challenges can be removed by the idempotent `cleanupExpiredEmailChallenges` routine. Scheduling, failure monitoring, code-secret rotation, deletion behavior and security-event retention are operational release gates. An email address change must invalidate verification and outstanding challenges in the same transaction if that separate feature is approved later.

## Release and recovery prerequisites

Real-user use requires an explicitly approved delivery provider and cost, privacy/DPA and cross-border review, DPO/legal review, domain and deliverability controls, secure secret management, incident response, cleanup scheduling, test evidence, rollout/rollback plans, and separate release authorization. The document-upload production gate remains in force. No live email is sent by this branch.
