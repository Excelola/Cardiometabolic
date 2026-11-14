# Verified-email recovery: implementation security review

This work implements the 13 November 2026 A–D product decisions. The earlier draft in PR #20 is a reference; its statements that verification timing and manual-code transport are undecided are superseded by those decisions. It does not authorize real email delivery or production activation.

## Boundaries and risks

- Existing accounts must remain eligible for existing-password sign-in. Inbox control alone must never create recovery access to pre-policy health records. The migration must conservatively mark existing accounts as restricted. No account or health data is moved or deleted. Legacy remediation remains a separate approval.
- New account health writes must verify current email ownership inside the write transaction. Manual entry, correction, document confirmation, and temporary extracted candidate persistence all require review. The lock order must start with the owning user, followed by the affected health/document rows.
- Account recovery must lock the owner, credential, challenge, then session rows. Existing sign-in locks owner then credential and rechecks its credential hash before session issuance. Reset and sign-in race tests must establish that an old password cannot create a surviving session after reset.
- An email challenge must bind purpose, owner and exact normalized registered email. Preserve the case of the email local part. Codes are never placed in URLs, normal logs or browser storage.
- A manual code carries 128 random bits. A keyed HMAC under an independent server-side 32-byte key binds the code and context; its digest alone cannot verify guesses without the key. The proposed technical window is ten minutes with at most five failed attempts, and a resend replaces the previous code. These limits are security design choices for review, not product commitments.
- Recovery admission must use budgets separate from sign-in. Generic public responses must not reveal account existence, verification, legacy status or delivery status. Timing, saturation and delivery failures need adversarial tests. No real delivery provider is selected.
- Production must fail closed without an approved sender, even if synthetic adapter configuration is present. Fake delivery must be explicitly enabled for synthetic non-production testing and must never log messages or codes.
- Additive schema and migration need review for concurrent account creation and health writes at cutover. Rollback should disable issuance and invalidate outstanding challenges; preserve already-applied schema and all user data, with forward repair if necessary.
- Sensitive temporary candidates require the existing 24-hour cleanup behavior. Challenge expiry cleanup and security event retention need operational ownership before production. No raw codes, passwords, health data or full email addresses belong in ordinary telemetry.
- Migration rehearsal, concurrent redemption and sign-in races, two-user isolation, fail-closed production HTTPS/TLS checks, and browser privacy and accessibility tests are mandatory before the implementation can be recommended for review.

Provider cost, deliverability, DPA, cross-border transfers, Nigerian DPO/legal review, secret management, alerting and real-user activation remain separate gates.
