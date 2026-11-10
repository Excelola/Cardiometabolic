# HILERA Software Supply-Chain Review

## Status

**Type:** Security architecture / dependency governance  
**Status:** Review artifact; no dependency upgrade is approved solely by this document  
**Scope:** Current Next.js authentication branch and its direct build/runtime dependencies

References:
- OWASP Software Supply Chain Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html
- OWASP Dependency Graph & SBOM Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Dependency_Graph_SBOM_Cheat_Sheet.html
- NIST SSDF SP 800-218: https://csrc.nist.gov/pubs/sp/800/218/final
- NIST C-SCRM publications: https://csrc.nist.gov/Projects/cyber-supply-chain-risk-management/publications

OWASP recommends dependency inventory, monitoring, version pinning/lockfiles, strong source-control access, build isolation and automated security scanning. NIST SSDF treats secure development and vulnerability response as ongoing SDLC practices rather than one-time release checks.

## Current direct dependencies

Current manifest reviewed on the auth branch:

| Package | Current manifest | Security relevance | Review posture |
| --- | --- | --- | --- |
| next | 16.4.6 | Critical application/server framework; Server Actions and request boundary | Exact pin required; advisory monitoring required |
| react | ^19.2.8 | Core rendering/runtime dependency | Lockfile protects current install; exact manifest pin is recommended for reproducible production releases |
| react-dom | ^19.2.8 | Core browser/server rendering | Same as React |
| pg | 8.23.1 | PostgreSQL transport, credentials, TLS, query execution | Exact pin; high sensitivity |
| drizzle-orm | 0.45.4 | Database query/schema layer | Exact pin; high sensitivity |
| @node-rs/argon2 | 2.2.2 | Password hashing native binary | Exact pin; critical supply-chain/runtime compatibility review |
| @zxcvbn-ts/language-common | 4.1.3 | Offline common-password corpus | Exact pin; lower privilege but directly influences password acceptance |
| server-only | 0.0.1 | Server-boundary marker | Do not treat as an authorization control by itself |

Current key development dependencies include Drizzle Kit 0.31.11, Vitest 4.1.11, ESLint, eslint-config-next, TypeScript, and type packages.

## Current positive findings

1. **Next.js is exactly pinned to 16.4.6** after the PR #6 hardening pass.
2. **Argon2, pg, Drizzle ORM, Drizzle Kit and the password dictionary are exact pins.**
3. **pnpm lockfile is committed.**
4. **Vitest 4.1.11 is the patched release for GHSA-82fw-gwwq-j7x9**, a 2026 path traversal/arbitrary file-read issue affecting Vitest/@vitest/mocker before 4.1.11.
5. **source-map-js 1.2.2 is overridden** to the reviewed patched version in the branch.
6. Native Argon2 is isolated as a server external package and its production runtime compatibility is already a release gate.
7. Package changes are reviewed through Git and are not intended to self-update in production.

## Current gaps / actions

### SC-01 — Framework lint package mismatch

eslint-config-next remains on the prior 16.3.x line while Next.js is 16.4.6.

**Required before PR #6 readiness:** use pnpm locally to align it to the reviewed compatible 16.4.6 toolchain and regenerate the lockfile.

### SC-02 — Range-based dev/runtime manifest entries

React, React DOM, ESLint, TypeScript and Vitest currently use semver ranges in the manifest even though the lockfile resolves concrete versions.

**Recommendation:** for a production-intent health product, prefer exact direct-version declarations for security-sensitive runtime and build/test tooling once compatibility is verified. Do not mass-upgrade merely to satisfy exact-pinning; pin the already-reviewed working versions first.

This is a recommendation, not an approved package change in this branch.

### SC-03 — "latest" type dependencies

Some @types/* dependencies use latest.

They do not ship in the production runtime, but they can change type behavior on a regenerated install and reduce build reproducibility.

**Recommendation:** replace latest with reviewed exact versions in a dedicated toolchain maintenance change after PR #6, with lint/typecheck/build validation.

### SC-04 — Release-age exceptions

pnpm currently has exact release-age exceptions for the reviewed Next.js security patch and matching binaries.

**Control:** keep exceptions narrow, version-specific, documented and temporary. Remove them once the normal quarantine window no longer requires an exception.

### SC-05 — Automated advisory monitoring

A manual audit at merge time is insufficient because vulnerabilities are disclosed after release.

**Recommendation:** enable automated dependency alerting/SCA in GitHub or CI, but do not enable automatic dependency merging. Every security update still requires review, tests and health-product release discipline.

## Dependency risk tiers

### Tier 1 — Critical security/runtime

- Next.js
- pg
- @node-rs/argon2
- drizzle-orm

Controls:
- exact direct version;
- frozen lockfile;
- release/advisory monitoring;
- compatibility and production build tests;
- change review;
- rollback path;
- no unattended auto-merge.

### Tier 2 — Build/migration/test security

- drizzle-kit
- vitest
- eslint / eslint-config-next
- TypeScript
- build-time transitive tooling

These do not normally process production requests, but compromised or vulnerable development tooling can read local secrets, alter artifacts, or weaken tests. Treat advisories as real, not harmless because they are “dev-only.”

### Tier 3 — Data/support packages

- @zxcvbn-ts/language-common
- server-only

Review license, integrity, update source and behavior. A low-privilege package can still change password acceptance or build semantics.

## Required supply-chain controls

1. **Single package manager:** pnpm is authoritative; do not run npm install and commit a second lockfile.
2. **Frozen release installs:** CI/release must use the committed lockfile.
3. **Exact security-sensitive direct dependencies.**
4. **Review transitive dependency changes**, not only top-level package names.
5. **Production and full dependency audit** before merge/release.
6. **Automated vulnerability monitoring** between releases.
7. **Secret scanning** for Git history and new commits.
8. **Protected main / review before merge.**
9. **No untrusted package install scripts** without explicit review.
10. **Native binary review** for Argon2 platform/provenance compatibility.
11. **SBOM generation recommendation:** generate CycloneDX or equivalent per production release once CI is established.
12. **Release-to-commit traceability:** deployed artifact must map to an approved commit.
13. **Dependency incident response:** if a critical package is compromised, identify deployed versions, block new deployments if needed, patch/replace, rebuild from a trusted environment, rotate potentially exposed secrets, and verify the rebuilt artifact.

## SBOM recommendation

Before production, generate an SBOM for each release containing direct and transitive components and map it to the deployed commit/build. The SBOM is an inventory, not evidence that dependencies are safe. Vulnerability monitoring and exploitability review remain required.

## Dependency update policy

- **Security patch with applicable vulnerability:** prioritize, review advisory/exploitability, test, and release promptly.
- **Normal patch/minor:** batch when safe and validate.
- **Major version:** separate architecture/compatibility review.
- **Native/auth/database dependency:** never unattended.
- **Framework update:** include Server Actions, caching, auth/session and production-build regression tests.
- **Migration tooling update:** replay migrations and backup/restore tests.

## Current conclusion

The direct dependency set is intentionally small and generally well-controlled. The immediate blocker is toolchain alignment/regeneration around Next.js 16.4.6. The highest ongoing risks are framework/native/database dependencies and any drift caused by semver ranges or unreviewed transitive updates.

No claim of “zero vulnerabilities” is made. Final release evidence requires local pnpm audit results and continuous monitoring after deployment.

**PRD Sync Status: Not Required.** Dependency governance is technical/security implementation.
