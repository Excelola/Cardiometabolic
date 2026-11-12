# HILERA Phase 1 — Account Recovery Implementation Plan (Planning Only)

**Date:** 12 November 2026  
**Status:** Planning complete; implementation **not yet authorized** pending explicit remaining security/product/provider gates  
**Master PRD:** https://docs.google.com/document/d/184mETZUCAla2V8LaEwkMAfm4AkicImZ-OFmVoZNS22A/edit  
**Technical specification:** [account-recovery-phase1-spec.md](account-recovery-phase1-spec.md)  
**Source branch:** `docs/account-recovery-phase1-spec-20261112` (documentation-only; draft PR; no direct changes on `main`)

## 1. Goal and business outcome

Enable HILERA users who control their **previously verified registered email** to reset a forgotten password securely without exposing protected health data or introducing an unreviewed paid provider. A completed backend feature is not sufficient: safe recovery and verified identity must be operational before real-user health data can be entrusted to the platform.

**North-star launch criterion:** In a realistic isolated production-like environment, an eligible user can recover access, old sessions are invalidated, old passwords fail, and an unknown/unverified email cannot gain access or learn private account state.

**Measures to instrument later (proposed, privacy-reviewed):** recovery request success (aggregate), verified email delivery success, completion rate, generic failure frequency, abuse throttling, user-reported loss of access, support escalations, p95 latency, provider delivery delay and monthly email cost. Never track raw email, full URLs, secret tokens or health measurements in ordinary analytics.

## 2. Workstream order and decision gates

| Step | Deliverable | Dependency | Approval gate |
| --- | --- | --- | --- |
| 0 — Research/reconciliation | Threat review; verified-account legacy policy; provider shortlisting; code/DB review | Approved PRD + current `main` | Product Owner + security/privacy |
| 1 — Freeze recovery policy | Verification timing and access impact; token transport/lifetime; loss-of-email policy | Step 0 | Product Owner for product-visible changes; PRD sync |
| 2 — Decide email operations | Mail service/provider or self-managed route, budget, DPA/data transfers, sender identity, bounce/delivery/incident approach | Step 0 | Explicit provider/cost/privacy/security approval |
| 3 — Implement foundation on scoped branch | Additive schema, token/challenge service, security events, shared throttle, fake-only test adapters, tests | Steps 1–2, security-reviewed design | Scoped PR review |
| 4 — Verification journey | Owner-bound email verification state, UI, delivery, invalidation, migration handling | Steps 1–3 | UX/security review |
| 5 — Reset journey | Request/complete pages, one-use proof, credential transaction and all-session revocation | Steps 1–4 | Security review |
| 6 — Release assurance | Disposable PG integration; concurrency; E2E; HTTPS/TLS; misuse; a11y/performance; notification correctness | Steps 3–5 | Product Owner PR and release approval |
| 7 — Controlled deployment | Staging activation, real sender setup, safety/retention/incident checks | Steps 2–6 + deployment infrastructure | Explicit production activation approval |

**No go-live before steps 1–7 and separate infrastructure/privacy/clinical release gates are met.** Do not silently choose an email vendor or a paid service. Batch cohesive low-risk implementation into one PR when safe; split if security review or migrations warrant it.

## 3. Product decisions to close

### P0 blockers
1. **Verification timing and protection of existing unverified accounts.** Current signup succeeds and immediately establishes a session; an unverified address can be entered. Agree whether verification becomes mandatory before the first sensitive-health-data save, before recovery alone, or under another risk-reviewed policy. An owner of an inbox is not automatically entitled to another person's prior health records. Existing-account remediation must be explicit and tested.
2. **Loss-of-access route for unverified users.** Under the approved verified-email-only primary path, unverified accounts are not recoverable. Define truthful UX and a narrowly permitted fallback. Saved codes are only an option, not approved scope.
3. **Email delivery trust boundary.** Determine the selected sender, data processing and contractual conditions, production/preview segregation, authentication of sender domain, operational failure/availability and budget.
4. **Reset proof and expiry policy.** Decide whether a reset link or typed code best satisfies HILERA's sensitive-token exposure restrictions; agree TTL, resend/rotation, replay and rate limits. Previous 20-minute validity was a proposal, not a fixed requirement.
5. **Post-reset notifications.** Define the minimum email/security alert and incident route without health data.

### Later / separately approved
- Email address change and re-verification; recovery codes/passkeys; additional contact channels; multi-factor authentication; production account deletion and user-data portability. No implication that this task approves them.

## 4. Proposed code ownership and boundaries

**Backend/security:** 
- Extend server-only auth domain with verification/recovery services and reusable token lifecycle helpers.
- Keep session owner, identity and authorization server derived.
- Preserve `normalizeEmail` semantics; local-part case currently remains significant.
- Reuse `revokeAllUserSessions` in the same transaction as credential change.
- Keep typed Drizzle schema and additive migrations with no existing table drops or data rewrites.
- No new health-data fields and no clinical outputs.

**UI/UX:**
- Plain-language sign-in "Forgot password?" affordance; neutral sent-state; check-inbox, expired/invalid and reset-complete states.
- No UI route that claims mail was sent when provider is unavailable.
- Avoid account enumeration in timing, status or copy.
- Existing signup/onboarding behaviour remains until explicit verification-gate approval.
- Responsive/accessibility audit at 320/390/1440 px.

**Email operations:**
- Interface with synthetic sink for testing; reviewed provider only in production.
- Prevent fake provider activation by deployment environment, not client flag.
- Reject missing provider safely; avoid silent send failures/retry storms.
- Do not hardcode secrets, provider credentials, costs or sender domains.

**Data migration impact:**
- Proposed nullable verification state + indexed purpose-bound expiring token records + allowlisted security-event changes.
- Migration must be reversible/repairable and validated on disposable PostgreSQL.
- Existing accounts remain unverified unless evidence justifies another state; never backfill as verified from possession of a password or historical email text.
- Audit retention and challenge expiry cleanup must be separately rehearsed.

## 5. Architecture and sequence plan

```text
Public visitor / Signed-in user
          |
          v
Next.js forms / Server Actions or Route Handlers
          |
   origin / CSRF / abuse admission
          |
          v
Auth domain recovery / verification service
   |                    |                    |
   v                    v                    v
PostgreSQL          Email-delivery        Security-event
(users, credential, adapter (unselected)    writer (allowlist)
sessions, challenges)      |
                      Provider staging/prod only after approval

Recovery completion transaction:
lock owner → recheck verified email+token → consume proof → replace password
→ revoke all account sessions → record minimal event → commit
→ notify appropriately → return to sign-in
```

**Important transaction risk:** Confirm consistent lock order with the existing login transaction and `revokeAllUserSessions`. A race with sign-in must not create an active old-credential session after reset. The specification is a starting point; prove the concurrency invariant with real disposable PostgreSQL tests.

## 6. Suggested implementation PR shape (after gates)

**Branch:** `feature/account-recovery-verified-email` from freshly synced `main`; do not touch `main` directly.

**One cohesive implementation PR** only after approvals. Candidate code changes (do not create yet):
- `src/server/db/schema.ts` + additive `drizzle/0003_*.sql` (actual migration number must match live journal).
- `src/server/auth/email-verification.ts`, `recovery.ts`, `email-delivery.ts` (names indicative).
- `src/server/auth/security-events.ts`, `throttle.ts`, `sessions.ts` only as necessary.
- `src/app/(public)/...` and auth forms/actions for verification/reset; preserve existing routes and roles.
- Tests: unit, real PG integration (including concurrency), HTTP, browser responsive/security smoke, synthetic email sink.
- Technical docs: contracts, threat model, data dictionary additions, operations and staging/rollout instructions.

**Required validations:** `pnpm lint`, `pnpm typecheck`, appropriate `pnpm test`, `pnpm test:postgres` with disposable DB, `pnpm build`, `pnpm db:check`, `git diff --check`, frozen install, dependency audit, logs/URL/storage canary checks, responsive/accessibility and production-like fail-closed tests. Report any test not executed.

## 7. Acceptance criteria / release gates

| ID | Acceptance condition |
| --- | --- |
| AR-01 | Only verified account email is eligible for email-based password reset; legacy/unverified policy explicitly enforced |
| AR-02 | Unknown/unverified/verified request outputs are public-safe and materially indistinguishable, with abuse controls |
| AR-03 | Challenges are bound to purpose and account, expire and cannot be reused or concurrently redeemed |
| AR-04 | Password change + token invalidation + all-session revocation occurs atomically; old sessions and old password stop working |
| AR-05 | No client-selected user ID, unauthorized email mutation or cross-account recovery |
| AR-06 | Failed delivery, invalid proof, DB failure and missing provider fail closed |
| AR-07 | Minimal audit without raw email, token, reset URL, password, health data or credential hashes in ordinary logging |
| AR-08 | Synthetic and production-like tests confirm fake provider cannot be activated in production |
| AR-09 | Account recovery UI is usable, understandable, keyboard operable and responsive |
| AR-10 | Approved sender/provider, contractual and privacy controls, cost caps, monitoring, incident procedure and cleanup in place before production |
| AR-11 | No medical features, health fields, account merging, alternative identities or unapproved permissions added |
| AR-12 | All results backed by tests; Product Owner explicitly approves review/merge/production rollout |

## 8. Risk register

| Risk | Impact | Mitigation / decision |
| --- | --- | --- |
| Registered but unverified email does not belong to account user | Account takeover, exposure of sensitive health records | **Critical:** decide verification gate and legacy account policy before production; do not mark existing emails verified automatically |
| Compromised mailbox | Recovery takeover | Notify account holder; assess secondary proof and incident route; disclose limits of email-only assurance |
| Enumeration or inbox flooding | Privacy and usability | Generic responses, per-identity/global throttle, bounded send volume and provider monitoring |
| Reset token leakage via URL/referrer/log | Account takeover | Security-review delivery transport, no-store/referrer controls, no third-party scripts, short TTL, log masking |
| Concurrent reset/sign-in | Old credentials regain access | Transactional owner/credential lock order and concurrency integration tests |
| Outbox/delivery inconsistency | False success and dangling reset proof | Define delivery contract, retries and idempotency before building queues |
| Paid email vendor lock-in/cross-border transfers | Unapproved spend, privacy/legal burden | Separate Product Owner/vendor/DPO gate; document costs and DPA |
| Raw token/health canary in logs | Sensitive disclosure | Strict allowlists and synthetic leakage tests |
| Rapid scope expansion | Delay | Keep recovery separate from email-change, passkeys, MFA and account deletion |

## 9. Definition of done for Phase 1

- Approved, traceable PRD requirement and versioned technical spec.
- Resolved verification eligibility for existing and new accounts.
- Written provider selection and security/privacy/cost acceptance.
- Scoped branch with migration and code reviews; `AGENTS.md` respected.
- Successful lint, typecheck, unit, disposable PG, browser, security, accessibility and production-like tests.
- Monitoring and operational incident/delivery controls ready.
- GitHub PR reviewed, explicitly approved, merged; local `main` updated.
- Real-user release only on separate explicit approval and overall HILERA go-live gate.

## 10. Codex task specification for the *next* design validation (do not implement)

**Model: GPT-6.1 Sol — Medium** for security-sensitive architecture review. Use Terra Medium for low-risk mechanical documentation once security review is complete.

```text
HILERA — ACCOUNT RECOVERY SECURITY DESIGN REVIEW ONLY.

Repository: C:\Users\USER\Projects\Cardiometabolic
GitHub: Excelola/Cardiometabolic
Expected base: currently merged main, verify it before starting.
Read AGENTS.md, HILERA Master PRD (Sections 4.4, 5.7, 6.5, 6.25),
docs/technical/account-recovery-phase1-spec.md and
docs/technical/account-recovery-phase1-implementation-plan.md.

Scope: review proposal for attack paths, exact owner-lock ordering,
migration compatibility, local-part email identity behavior, orphaned
unverified users, exposure of historical health data, token transport,
replay/concurrency, provider failure and secure message delivery.
Provide prioritized findings and product/security decisions needed.

Do not implement application or schema changes.
Do not choose or configure an email provider.
Do not modify auth runtime, real user data, production environment or main.
Do not enable recovery or activate production.
If any docs change is genuinely needed, work on a scoped docs branch only,
validate links/diff, open a DRAFT PR, never merge automatically.

Return: branch/base, findings by severity, unresolved decisions,
recommended minimal technical design, test plan, rollout/rollback plan,
cost/privacy dependencies, PRD Sync Status and Git/PR actions taken.
```

**PRD Sync Status:** Completed for approved Phase 1 direction. **Further PRD sync:** Required only if additional product-visible decisions receive explicit approval. **Current stage:** documentation and security/provider decision gates; no recovery functionality has been deployed.
