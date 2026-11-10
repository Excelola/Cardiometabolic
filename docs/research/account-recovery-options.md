# HILERA Account Recovery Options Research

## Status

**Type:** Research / recommendation  
**Status:** Not approved for implementation  
**Product behavior:** Account recovery is a P0 product need in the Master PRD, but the exact mechanism remains explicitly deferred. This document does not change that status.

References:
- OWASP Forgot Password Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Email Validation and Verification Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html
- NIST Digital Identity Guidelines / account recovery resources: https://pages.nist.gov/800-63-FAQ/

## Product context

HILERA currently uses:
- email as the MVP authentication identifier;
- first-party email/password authentication;
- no email-ownership verification;
- no recovery mechanism;
- 1-hour idle and 24-hour absolute sessions;
- future recovery must revoke all active sessions.

A real-user production launch with password-protected health information should not proceed until secure recovery is implemented or the residual loss-of-access risk is explicitly accepted through Product Owner + security review.

## Security principles

Any recovery design should:
- avoid revealing whether an email is registered;
- resist automated reset flooding;
- use a previously established recovery channel/evidence;
- use cryptographically random, single-use, time-limited reset credentials;
- store reset credentials securely;
- build reset URLs from a trusted configured origin, not Host headers;
- avoid putting reset tokens into logs/analytics/referrers;
- reuse the approved HILERA password policy;
- not auto-login after reset;
- revoke existing sessions after successful recovery;
- invalidate all outstanding reset credentials after use;
- notify the user about the password reset through an established safe channel;
- not use security questions as the sole recovery proof.

## Options

| Option | Security | Cost/operations | UX | HILERA fit | Key dependency |
| --- | --- | --- | --- | --- | --- |
| Verified-email reset link | Medium | Low–moderate ongoing email cost | Familiar/easy | Strong candidate | Email ownership verification + email delivery provider |
| Recovery codes | Medium–high when protected | Very low ongoing network cost | User must save codes | Strong secondary fallback | Secure enrollment/storage UX |
| Passkey/second authenticator recovery | High | Low per-use provider cost; higher build complexity | Good when device/account ecosystem works | Strong future direction | Authenticator enrollment and lifecycle design |
| SMS/WhatsApp/voice OTP | Medium/variable | Ongoing network/provider cost | Familiar | Poor current fit | Phone collection/verification, provider, SIM-swap risk |
| Support-assisted recovery | Variable; social-engineering risk | High operational cost | Works when self-service fails | Last-resort only | Identity proofing/support policy |
| Security questions | Low | Low | Familiar but unsafe | Reject as sole mechanism | None |

## Option A — Verified-email reset link

### Advantages

- Best fit with HILERA's current email identifier.
- No need to collect phone numbers.
- Avoids SMS/WhatsApp/voice costs.
- Standard browser UX.
- Can be implemented without a third-party authentication provider, although email delivery still requires an approved mail channel/provider.

### Risks

- Email compromise can become account compromise.
- HILERA currently does not verify email ownership.
- A mistyped/claimed email at registration can undermine recovery.
- Reset endpoints are common enumeration/abuse targets.
- Reset URLs can leak through logs/referrers if implemented badly.

### Required controls

Before email recovery is enabled:
1. Approve an email-ownership verification policy.
2. Apply one canonical email policy consistently across signup, signin, verification and recovery.
3. Use generic reset-request responses.
4. Rate limit reset requests.
5. Generate a strong random reset credential.
6. Store only a secure server-side representation sufficient to validate it.
7. Make it single-use and short-lived; exact expiry requires security/product approval.
8. Construct URLs from a configured trusted HILERA origin.
9. Use HTTPS and no-referrer controls on reset surfaces.
10. After valid reset, require normal sign-in rather than auto-login.
11. Revoke all existing sessions.
12. Invalidate remaining reset credentials.
13. Send a password-reset notification.

## Option B — Recovery codes

Recovery codes can provide a second path when the user loses access to email.

### Advantages

- No network delivery cost after enrollment.
- Works during email-provider outages.
- Strong when codes are high-entropy, one-time and stored by the user in a password manager/offline safe place.
- Reduces complete dependence on one email account.

### Risks

- Users may lose the codes.
- Codes may be screenshotted/stored insecurely.
- Adds onboarding/settings complexity.
- Requires regeneration/revocation behavior and support education.

### Technical direction

If later approved:
- generate multiple high-entropy one-time recovery codes;
- store only secure verifier representations;
- show/download once at enrollment/regeneration;
- never log raw codes;
- support regeneration only after reauthentication;
- invalidating/regenerating codes must invalidate old codes;
- successful recovery still revokes active sessions.

Recovery codes should complement, not silently replace, the approved primary recovery design.

## Option C — Passkeys / second authenticator

This is the strongest strategic direction for a future higher-assurance account model.

Benefits:
- phishing resistance depending on implementation;
- reduced dependence on memorized secrets;
- multiple authenticators can improve recovery resilience.

Trade-offs:
- more product and engineering complexity;
- device/account ecosystem considerations;
- requires an authenticator lifecycle, loss/replacement policy, and likely separate PRD/security work.

Recommendation: keep as a future capability, not a PR #6 blocker.

## Option D — SMS / WhatsApp / voice

Not recommended as HILERA's default recovery path now.

Reasons:
- contradicts the current cost-minimization direction;
- requires phone collection/verification and additional personal data;
- introduces external provider/network dependency;
- SIM-swap and number-reassignment risks;
- creates a new delivery/privacy/availability surface.

This option remains possible only through a future product decision.

## Option E — Support-assisted recovery

Use only as a carefully governed last resort if HILERA later decides it is necessary.

Do not let support staff reset accounts merely because a caller knows profile or health information.

If ever approved, it requires:
- explicit identity-proofing standard;
- privacy review;
- anti-social-engineering procedure;
- dual control/escalation for high-risk cases;
- complete privileged-action audit;
- clear handling when identity cannot safely be established.

## Recommendation

### Recommended target architecture

**Primary candidate:** verified-email password reset.

**Secondary resilience candidate:** user-held recovery codes.

**Future stronger path:** passkeys/additional authenticators.

**Do not use:** security questions as sole recovery proof.

**Do not prefer now:** SMS/WhatsApp/voice as the default recovery channel.

### Why

This direction best matches HILERA's existing email-first architecture and keeps ongoing network cost lower than phone-based recovery, while recovery codes provide a possible independent fallback. However, email recovery cannot safely be approved in isolation: HILERA must first make an explicit decision on email ownership verification and email canonicalization/case behavior.

## Recommended recovery flow for later approval

1. User opens Forgot password.
2. User enters email.
3. HILERA always returns a generic response.
4. If eligible, HILERA creates a random, single-use recovery credential with a short approved expiry and sends a reset link to the previously verified email.
5. User opens the trusted HTTPS HILERA reset page.
6. Server validates the recovery credential.
7. User sets and confirms a new password under the normal HILERA policy.
8. HILERA changes the credential atomically.
9. HILERA revokes all active sessions.
10. HILERA invalidates all outstanding recovery credentials.
11. HILERA sends a security notification.
12. User signs in normally.

No automatic login after reset.

## Open decisions requiring Product Owner approval

- Whether email ownership verification becomes required for all accounts or only before recovery activation.
- Exact email canonicalization/local-part case policy.
- Whether recovery codes are part of V1 recovery or later.
- Exact reset-token expiry.
- Email delivery provider and cost.
- Notification wording/behavior.
- Support-assisted fallback, if any.
- Recovery-event retention/audit policy.

## PRD Sync Status

**Not Required now — research only.**

If the Product Owner approves a specific recovery mechanism, **PRD Sync Status becomes Required** because authentication journey, verification behavior, collected/verified identity state, and account-access rules will materially change.
