# HILERA Security and Platform Assurance Package

## Purpose

This package prepares the next security, operations and backend-design decisions without adding unapproved product behavior.

It is intentionally separated from PR #6 implementation work. The branch is stacked on the authentication branch so its documents can use the current auth architecture while remaining independently reviewable.

## Included artifacts

1. **Security Verification Test Plan**
   - OWASP ASVS 5.0-informed test matrix.
   - Authentication, session, CSRF, authorization, database, abuse, logging, backup/restore and supply-chain tests.
   - Defines evidence and severity expectations.
   - Does not claim ASVS certification.

2. **Software Supply-Chain Review**
   - Reviews current direct dependency risk.
   - Records Vitest 4.1.11 security-patch status.
   - Identifies Next.js/eslint-config-next alignment as a PR #6 blocker.
   - Recommends frozen installs, exact reviewed direct pins, advisory monitoring and release SBOM.

3. **Secrets and Environment Architecture**
   - Separates local/test/staging/production secrets.
   - Separates runtime, migration and test database credentials.
   - Defines rotation/revocation and logging boundaries.
   - Does not select a hosting/secrets vendor.

4. **Admin, Support, Security and DevOps Access Boundaries**
   - Separates operations from health-data access.
   - Defines candidate functions and a recommended data-exposure boundary.
   - Does not create roles or permissions because the Master PRD defers the exact role matrix.

5. **Account Recovery Options Research**
   - Compares verified-email reset, recovery codes, passkeys/additional authenticators, phone-based recovery, support recovery and security questions.
   - Recommends verified-email reset as the primary candidate, recovery codes as a secondary resilience candidate, and passkeys/additional authenticators as a future stronger path.
   - No recovery mechanism is approved or implemented.

6. **Health Information Persistence Architecture — Draft**
   - Grounds the next backend phase in the Master PRD.
   - Requires the governed V1 Data Dictionary before final production health schema.
   - Recommends owner-scoped typed persistence instead of unrestricted generic JSON/EAV health storage.
   - Separates manual persistence from document upload/extraction.
   - Does not invent health fields, units, thresholds, clinical interpretation, retention rules or permissions.

## Governance status

### Already approved product behavior

This package may rely on the already-approved:
- email/password authentication direction;
- password/session policy;
- Add Health Information categories;
- manual entry;
- health-document upload candidate extraction with explicit confirmation before save;
- history/trends concepts;
- self-only consumer journey;
- clinical safety boundaries;
- privacy/minimization principles.

### Research/recommendation only

The following remain unapproved:
- exact recovery mechanism;
- email ownership verification timing;
- exact email local-part comparison policy;
- recovery-code inclusion;
- exact admin/support/security/DevOps role matrix;
- any privileged health-data access;
- production secrets/hosting vendor;
- exact V1 health field inventory;
- final health database schema;
- retention/deletion periods/implementation;
- raw-document storage/retention;
- extraction/OCR provider;
- production alert thresholds;
- SBOM/CI tooling vendor.

## Recommended sequence after PR #6

1. Complete local PostgreSQL/auth validation and merge PR #6 after review.
2. Product Owner reviews account-recovery research; approve or defer mechanism.
3. Build/approve V1 Data Dictionary.
4. Write Phase 2 manual health-persistence technical specification.
5. Implement manual health persistence on a new scoped branch.
6. Run security/privacy/data-quality tests.
7. Merge only after evidence review.
8. Specify document upload/extraction separately.
9. Add clinical behavior only from approved Clinical Specifications.

## PRD Sync Status

**Not Required for this package.**

These files are security/technical/research artifacts. If the Product Owner approves a recovery mechanism, exact role/permission model, new health fields, retention/deletion behavior, or other material product-visible rules, perform the normal PRD sync before implementation where required.
