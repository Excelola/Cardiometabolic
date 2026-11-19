# Basic profile and onboarding

The authenticated profile stores the three approved fields: preferred name, date of birth as a calendar date, and Nigeria market context. Migration `0008` adds one owner-keyed row with nullable fields for partial setup; it does not alter health data. A complete profile has all three values. Profile completion does not imply consent, which remains pending.

The server action derives ownership from the session, validates the trusted origin and session CSRF token, checks each supplied field, and upserts only that owner's row. Save for later accepts valid partial fields; Continue requires all fields. Values are not placed in URLs or browser storage. Overview uses the stored name and offers setup while fields are incomplete. No age eligibility or clinical calculation is performed.

Only a synthetic disposable database may be migrated for testing. Applying migration `0008` to any persistent local, staging or production database requires separate Product Owner authorization and a reviewed backup and rollout plan.

Verification guidance reports development sender configuration and the signed-in user's test-allowlist eligibility without exposing keys or changing public recovery responses. Production email remains disabled.
