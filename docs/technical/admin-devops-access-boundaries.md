# HILERA Admin, Support, Security and DevOps Access Boundaries

## Status

**Type:** Security/operations architecture  
**Status:** Design recommendation only  
**Important:** The Master PRD explicitly defers the exact internal administrative role and permission matrix. This document therefore does not create product roles or permissions.

The purpose is to define the boundary we should preserve when a formal role model is later approved.

## Core principle

**Operational access is not health-data access.**

Being able to deploy HILERA, inspect server health, manage backups, or support an account must not automatically grant permission to read a user's health information.

## Candidate operational functions

These are functions, not approved application roles.

### Product / customer support function

Potential needs:
- confirm that an account exists only through an approved support workflow;
- view minimal account-support status;
- help with approved account/recovery processes;
- record a support action;
- escalate security/privacy incidents.

Should not receive by default:
- plaintext passwords or hashes;
- session tokens;
- database credentials;
- unrestricted health history;
- raw uploaded health documents;
- clinical outputs unrelated to the support task;
- direct production database access.

### Platform / DevOps function

Potential needs:
- deployment status;
- server availability/latency/errors;
- database connection/saturation/backup health;
- infrastructure configuration;
- rollback/release operations;
- aggregate authentication/throttle metrics.

Should not receive by default:
- user health values;
- raw health documents;
- passwords/hashes/tokens;
- broad user profile browsing;
- support-style account search.

### Database operations function

Potential needs:
- schema/migration execution;
- backup/restore;
- storage/performance investigation;
- emergency recovery.

Controls:
- separate migration/backup credentials;
- read-only access for investigation where practical;
- write/admin access only for approved operation;
- no routine browsing of sensitive rows;
- audit privileged access.

### Security incident function

Potential needs:
- minimal authentication/security events;
- deployment/logging evidence;
- pseudonymous or internal account reference where justified;
- temporary elevated access during an incident.

Controls:
- purpose-bound;
- time-limited elevation;
- documented incident;
- no general health-data access unless the incident specifically requires it and privacy/security approval supports it.

### Product Owner / business function

Product ownership and approval authority do not imply technical production database or secret access.

## Architecture recommendation for future administrative capability

If HILERA later implements an internal admin interface:

1. Use a separate reviewed authorization model.
2. Do not reuse ordinary consumer authorization rules with a simple admin boolean as the only safeguard.
3. Authenticate privileged users strongly; consider phishing-resistant MFA/passkeys when that design phase is approved.
4. Reauthenticate for high-risk actions.
5. Enforce authorization server-side for every privileged operation.
6. Use purpose-specific endpoints/actions rather than direct database browsing.
7. Minimize data returned to the admin UI.
8. Audit privileged mutations.
9. Prevent silent user impersonation by default.
10. Add explicit approval for any health-data viewing capability.

No admin dashboard should expose credentials, hashes, session tokens, security secrets or raw database connection information.

## Support account lookup

A future support tool should avoid unrestricted search across sensitive identity data. Candidate controls include:
- exact lookup rather than broad browsing;
- minimal result fields;
- query logging/audit without copying full sensitive values into general telemetry;
- access reason/ticket reference for sensitive actions;
- rate limiting;
- no health values in search results unless separately authorized.

Exact behavior requires product/privacy approval.

## User impersonation

**Recommendation: do not implement support impersonation in V1 by default.**

Impersonation increases the risk of invisible access to a user's health information and complicates audit trails.

If ever approved:
- explicit privileged permission;
- user-visible or strongly auditable session distinction;
- short duration;
- reason/ticket required;
- no access to credentials/secrets;
- high-risk actions disabled or separately reauthorized;
- clear end-impersonation control.

## Break-glass access

Emergency access may be necessary for incident recovery, but should not become a normal workflow.

A future break-glass design should require:
- explicit incident;
- elevated approval;
- time-bound credentials;
- least privilege;
- complete audit;
- post-incident review;
- rotation/revocation after use when appropriate.

## Data exposure matrix

| Information | Support | DevOps | DB Ops | Security Incident | Normal consumer |
| --- | --- | --- | --- | --- | --- |
| Password plaintext | Never | Never | Never | Never | User only during entry |
| Password hash | Never | Never | Only exceptional DB-level need, not routine | Exceptional only | Never |
| Session token | Never | Never | Never | Never | Browser cookie only |
| DB secret | Never | Runtime should not reveal value | Controlled operations only | Exceptional | Never |
| Aggregate service metrics | Limited | Yes | Yes | Yes | No |
| Account support metadata | Yes, minimal | No by default | No by default | When incident requires | Own account |
| Raw health information | No by default | No | No routine access | Only incident/purpose exception | Own data |
| Raw uploaded document | No by default | No | No routine access | Only incident/purpose exception | Own data once approved |
| Security events | Minimal support-relevant | Aggregate | Operational only | Yes, scoped | No |

This matrix is a recommended boundary, not an approved role-permission table.

## Audit requirements for future privileged actions

Record at minimum:
- privileged actor identity;
- action type;
- time;
- target internal account/resource reference where justified;
- success/failure;
- approved reason/ticket when required.

Do not put raw health values, passwords, tokens or secret contents in the audit event.

Retention/access policy remains to be approved.

## Separation of duties

Where practical:
- code authors do not unilaterally approve and deploy their own sensitive production changes;
- migration credentials are distinct from runtime credentials;
- support staff cannot grant themselves platform/database access;
- DevOps staff cannot grant themselves product-level health-data permissions;
- high-risk break-glass usage receives post-event review.

## Production prerequisite

Before any internal administrative feature is implemented, the Product Owner must approve:
- actual role names;
- exact permissions;
- health-data visibility;
- support actions;
- audit/retention behavior;
- reauthentication/MFA requirements;
- break-glass process.

That decision will likely require a Master PRD sync because it changes permissions and internal product capabilities.

**PRD Sync Status: Not Required for this design recommendation. Required when the actual role/permission model is approved.**
