# HILERA Secrets and Environment Architecture

## Status

**Type:** Technical/security architecture  
**Status:** Recommended baseline for implementation  
**Scope:** Development, test, staging and production secret handling  
**Product behavior:** No user-facing behavior is introduced.

Reference: OWASP Secrets Management Cheat Sheet  
https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

OWASP recommends centralized secret management, least privilege, rotation/revocation, auditability, and avoiding plaintext secrets in source code, logs and general configuration stores.

## Objectives

HILERA must:
- keep development, test, staging and production credentials separate;
- prevent secrets from entering Git, browser bundles, analytics, logs or screenshots;
- grant each workload only the secrets and privileges it needs;
- make compromised secrets revocable and replaceable;
- preserve auditability without exposing secret values;
- avoid routine human access to production secrets where workload identity can replace it.

## Current authentication secret inventory

| Secret | Purpose | Environment | Required handling |
| --- | --- | --- | --- |
| DATABASE_URL | Runtime PostgreSQL connection | Local synthetic / staging / production | Server-only; least-privilege runtime DB role; verified TLS in production |
| HILERA_MIGRATION_DATABASE_URL | Controlled schema migration connection | Local synthetic / staging / production migration job | Separate higher-privilege migration role; never application runtime |
| HILERA_AUTH_CSRF_SECRET | HMAC key for session-bound CSRF proof | Each environment | Independent random key; server-only |
| HILERA_AUTH_THROTTLE_SECRET | HMAC key for pseudonymous throttle identifiers | Each environment | Independent random key; server-only |
| HILERA_TEST_DATABASE_ADMIN_URL | Disposable integration-test administrator | Local only | Loopback only; synthetic database harness only; never production/staging |

Future provider/API secrets must not be added to this inventory until the corresponding integration is approved.

## Environment separation

### Local development

- Use ".env.local" or equivalent ignored local configuration.
- Only synthetic development/test data.
- Local database credentials must not be valid in staging or production.
- Local CSRF/throttle keys must be unrelated to deployed keys.
- HILERA_TEST_DATABASE_ADMIN_URL must resolve only to loopback and a disposable local PostgreSQL administrator.
- Never place production secrets on a developer workstation for ordinary development.

### Test / CI

- Use dedicated short-lived or restricted test credentials.
- Test databases contain synthetic data only.
- CI secrets are scoped to the specific workflow/environment.
- Pull-request builds from untrusted forks must not automatically receive production secrets.
- Prefer workload identity/OIDC to long-lived cloud access keys when the selected platform supports it.

### Staging

- Separate database, keys and service credentials from production.
- Staging should exercise production-like TLS, cookies, migrations and observability using synthetic or separately approved sanitized data.
- Staging credentials must not grant production access.

### Production

- Store secrets in the selected hosting/platform secret manager, not source control.
- Production runtime gets the least-privilege runtime DB credential only.
- Migration credentials are available only to the controlled migration/deployment path.
- Human access to secret values should be exceptional, authorized and auditable.
- Environment variables exposed to the browser, including NEXT_PUBLIC_* values, must never contain secrets.

## Secret generation

Authentication HMAC secrets should be generated from a cryptographically secure random source with sufficient entropy for their purpose. Do not use memorable phrases, UUIDs used for business identifiers, repository secrets copied across environments, or one key reused for multiple functions.

The CSRF and throttle keys must remain independent even though both use HMAC.

## Secret storage and delivery

Preferred production pattern:

1. Deployment workload authenticates to the platform using workload identity or platform-native identity.
2. The workload receives only the secrets it is authorized to consume.
3. The application process reads them server-side at startup/runtime.
4. Secret values are not printed.
5. Access to secret metadata/value is logged by the platform where supported.

Do not build a custom HILERA secrets vault for MVP.

## Least-privilege database credentials

### Runtime role

Allowed only what the running application needs, such as:
- SELECT/INSERT/UPDATE on approved runtime tables;
- transaction use;
- no schema creation/change;
- no database creation/drop;
- no role management;
- no unrestricted administrative functions.

Exact grants must be generated and tested once the production PostgreSQL provider/version is chosen.

### Migration role

May have the schema privileges required for reviewed migrations. It must not be exposed to normal application requests.

### Backup/restore role

Provider/operations specific. Backup and restore access must be separated from normal application runtime and handled through the approved database runbook.

## Rotation

### Routine

Do not rotate user passwords routinely. Application/service secrets have a separate lifecycle.

For static application secrets, define a documented rotation cadence based on risk/provider capability. Prefer automated or dual-key rotation where the protocol supports it.

### Emergency rotation

If a secret is exposed or suspected exposed:

1. Identify the exact secret, environment and consumers.
2. Revoke/disable the exposed secret as quickly as safe.
3. Generate a new independent secret.
4. Update authorized consumers.
5. Restart/redeploy where required.
6. Check logs/audit trail for misuse without exposing secret values.
7. Rotate dependent credentials if compromise scope is uncertain.
8. Record incident and corrective action.

For session-signing/CSRF-related key compromise, assess whether existing sessions/proofs also require invalidation. Do not assume replacing a key alone closes every active credential path.

## Secret metadata

Maintain an inventory with:
- secret name/purpose;
- environment;
- owner;
- consuming workload;
- privilege/scope;
- creation/last-rotation time;
- rotation/revocation procedure;
- incident contact.

The inventory contains metadata, never secret values.

## Logging and redaction

Forbidden in logs/traces/errors:
- database connection strings containing credentials;
- HMAC/CSRF/throttle secrets;
- session cookies or raw session tokens;
- recovery/reset tokens;
- API keys;
- encryption keys;
- password hashes;
- plaintext passwords;
- raw health information by default.

Use synthetic canaries before launch to verify platform/application logs do not capture these values.

## Git and CI/CD controls

- Never commit local environment files, production environment files, exported secret-manager values or database dumps containing sensitive data.
- Enable repository secret scanning where available.
- Require review for workflow changes that can access deployment secrets.
- Do not expose production secrets to pull-request jobs by default.
- Pin/review third-party CI actions if introduced.
- Prefer short-lived workload credentials over long-lived CI cloud keys.

## Backup secrets

Database backups containing identity/health data are sensitive assets even when application secrets are not embedded in them. Encrypt, access-control, monitor and test backups according to the database safety policy.

Do not place reusable application secrets inside backup archives for convenience.

## Break-glass

A future emergency/break-glass process must:
- be separately authorized;
- be time-bounded;
- use the minimum privileges needed;
- be auditable;
- avoid shared personal credentials;
- trigger post-use review and credential/key rotation when appropriate.

Exact production break-glass implementation depends on the selected hosting/database platform.

## Acceptance criteria

Before production:
- production secrets are absent from Git and local developer defaults;
- staging/production credentials are distinct;
- runtime/migration DB privileges are separated;
- production secret storage is selected and documented;
- secrets are not exposed to browser code;
- logs/traces pass canary leakage tests;
- rotation/revocation steps are tested for critical secrets;
- CI cannot expose production secrets to untrusted pull requests;
- operator access is least-privilege and auditable.

**PRD Sync Status: Not Required.** This is implementation security architecture; it does not change approved product behavior or collected data.
