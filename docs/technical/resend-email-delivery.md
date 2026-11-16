# Resend Free — transactional email adapter preparation

Status: **development-only delivery integration; production remains disabled**
Date: 16 November 2026
Owner decision: Resend Free was conditionally selected as the proposed HILERA MVP transactional email provider, recorded in the Google Drive Master PRD on 16 November 2026.

## Approved functional boundary

The only proposed delivery purposes are:
- registered-email ownership verification;
- manually entered single-use password-recovery codes for eligible accounts.

The approved account-ownership, challenge generation, validation, throttling, password reset, session revocation, and legacy-account restrictions remain owned by HILERA's existing server code. No medical measurements, diagnostic information, file contents or URLs carrying codes may be included in email. No marketing sending is approved.

## What's implemented in this draft PR

- `src/server/auth/resend-delivery.ts` provides a typed `ResendEmailDelivery` class matching the already merged `EmailDelivery` interface.
- Sends the smallest transaction to Resend's `POST https://api.resend.com/emails` endpoint: one recipient, verified configured sender, subject, plain text and HTML containing the manual code. Uses bearer authorization, a random per-request idempotency identifier and an abort timeout.
- Does **not** retry ambiguous failures. HTTP failures, missing success confirmation, malformed input or thrown transport exceptions produce one generic non-sensitive error without propagating provider responses.
- `src/server/auth/resend-delivery.test.ts` uses injected mock HTTP transport to check message shape, code privacy, failure behavior and that a Resend-shaped environment variable does not activate production delivery.
- The server selector wires the adapter to the existing verification and recovery actions only in non-production, with explicit enablement and exact recipient allowlisting. Automated tests make no real provider calls.
- No dependency, database migration, or clinical logic was added. Development can now send codes to explicitly configured test recipients after separate send authorization.

## Production remains deliberately fail-closed

The selector returns `null` in production regardless of flags or keys. For non-production Resend tests set `HILERA_EMAIL_PROVIDER=resend`, `HILERA_RESEND_TEST_DELIVERY=enabled`, `HILERA_RESEND_TEST_RECIPIENTS` to comma-separated exact authorized addresses, `HILERA_RESEND_FROM` to a plain verified sender email, and `RESEND_API_KEY` in server-side secret storage. Synthetic delivery remains available via `HILERA_SYNTHETIC_EMAIL=enabled` with no provider selected. A real test send requires separate explicit approval. Do not configure real credentials in the repository.

A provider `200` response indicates API acceptance, **not delivery into the recipient's inbox**. Bounce, rejection, complaints, suppression and deliverability operational behavior still need separately approved handling. The existing code activates a challenge after a sender returns successfully; real activation must review the consequences of delayed bounces.

## Resend Free allowances and dependencies

The published Free plan currently provides 3,000 outbound emails/month, 100/day, up to three domains and 30-day message data retention; verify again before activation. These limits can make a production trial unavailable to additional users if exhausted. Resend's Data Processing Addendum identifies primary processing in the United States. Assess international transfer obligations under applicable Nigerian privacy law.

Before any real transmission, obtain explicit Product Owner/security/privacy approval and verify:
1. HILERA-owned sender domain and SPF/DKIM/DMARC, bounce handling, and suppression policy; no unverified/from addresses.
2. Current Resend terms, DPA, subprocessors, data minimization, retention and transfer assessment; no health data in emails.
3. Least-privilege sending API key stored only in server-side secret management; never `NEXT_PUBLIC_*`, Git, tickets, test fixtures or normal logs.
4. Production feature activation mechanism with explicit allowlist/flag and negative tests; the default must remain off even when secrets exist.
5. Throttles, daily/monthly quotas, provider 429/5xx, timeout, duplicate send/retry behavior, observability and incident response; no email or secret telemetry.
6. Provider webhooks/event authentication if adopted, bounce/complaint monitoring, handling blocked verification due to delivery failure, and operational cleanup of expired challenges.
7. Production-like tests with synthetic, non-personal addresses and reviewed provider test mechanisms; independent security/privacy assessment and coordinated deployment controls.
8. Explicit separate permission before live real-user emails, account changes, paid upgrades or production release.

## Testing and handoff

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:postgres` with disposable PostgreSQL, `pnpm db:check`, `pnpm build`, `pnpm audit --prod`, and `git diff --check`.

The current agent handoff lives in **draft documentation PR #22** (`docs/AGENT_HANDOFF.md`) and is not merged into `main`. Next agent should inspect that PR and current Git status before continuing and update `docs/AGENT_HANDOFF.md` on an approved documentation or feature branch after substantial work, without editing the same working tree concurrently.

## Official references

- https://resend.com/pricing
- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/changelog/idempotency-keys
- https://resend.com/legal/dpa

**PRD Sync Status:** Not required for this adapter-only preparation; the conditional provider choice was previously synchronized. Actual product-visible or production activation changes require a separate approval and potential PRD sync.
