# HILERA Retention & Deletion Policy Recommendation

## Status

Artifact type: Product/privacy/security recommendation
Status: Not yet approved as product policy
Scope: Nigeria-first V1 account, profile, health information, consent/audit, security logs, backups and future document uploads
Legal note: This is a product-policy recommendation informed by the Nigeria Data Protection Act 2023 and NDPC GAID 2025. It is not a substitute for Nigerian legal/DPO review.

## Regulatory baseline

The Nigeria data-protection framework requires purpose limitation, data minimisation, storage limitation, appropriate security, rectification/erasure rights, and a clear retention policy. It does not prescribe one universal retention duration for HILERA data.

Official references:
- https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf
- https://erp.ndpc.gov.ng/privacy_policies

The GAID states that once the specified purpose for retaining personal data has been achieved or is no longer pursued, the legitimate basis for retaining it ceases; unnecessary residue should be destroyed or irreversibly de-identified. It also requires a clear retention/storage policy communicated to data subjects.

Because HILERA processes Sensitive Health information and is production-intent software, DPIA/DPO review is a production-launch gate.

## Recommended policy model

Use purpose-based retention with explicit category triggers, not indefinite retention and not one blanket period for all data.

### 1. Active account and profile

Recommended rule: retain account/profile data while the account is active and the data remains necessary to provide the approved HILERA service.

On account-deletion initiation:
- immediately revoke all active sessions;
- make the account unavailable for normal use;
- stop ordinary product processing;
- begin the deletion workflow.

Recommended live-system deletion SLA: complete normal deletion/anonymisation within 30 days unless a valid legal, security, dispute, or regulatory hold applies.

### 2. Health information

Retain health records and correction lineage while the account is active and the information remains necessary for the approved longitudinal HILERA service.

On approved account deletion:
- remove health data from normal live product storage within the same 30-day deletion window;
- preserve only the minimum information that a documented legal/regulatory/security obligation genuinely requires;
- any retained exception must be access-restricted and purpose-limited.

### 3. Consent/privacy records

Recommended operational default: retain a minimal compliance record for 36 months after account closure/deletion, subject to Nigerian DPO/legal review before launch.

Do not retain the user's full health history merely to prove consent.

### 4. Authentication/security events

Recommended operational default: retain for 12 months unless an active investigation or legal/regulatory obligation justifies longer retention.

Do not retain passwords, raw session tokens, or unnecessary sensitive content in these logs.

### 5. Technical logs

Recommended default: 30 days or less, with longer retention only for specifically justified security/availability needs.

Raw Sensitive Health data must not enter ordinary logs at all.

### 6. Product analytics

General analytics must not contain raw health measurements or clinically governed outputs.
Prefer aggregation/de-identification and define a separate analytics retention period before production analytics is enabled.

### 7. Database backups

Backups containing identity or health information are sensitive copies.

Recommended controls:
- encrypted backups;
- strict access separation;
- monitored failures;
- restore verification;
- documented RPO/RTO;
- deletion/tombstone reconciliation so restored backups cannot silently reactivate deleted users/data.

Recommended maximum routine backup retention target: 35 days for the initial consumer MVP, subject to provider, RPO/RTO, legal, and DPO review.

### 8. Future uploaded health documents

Privacy-minimising recommendation: do not retain raw uploaded health documents by default after extraction/review is complete.

Proposed lifecycle:
- raw document lives only in encrypted temporary storage;
- candidate extraction remains temporary;
- after user confirms supported values, save only the confirmed structured HILERA health data and approved source/provenance metadata;
- automatically delete raw document and unconfirmed candidate data within 24 hours of confirmation;
- abandoned, failed, or cancelled uploads expire automatically within 24 hours;
- no raw document retention for future usefulness.

Any persistent document vault would be a separate product capability requiring explicit approval.

## Legal/security holds

A hold must be scoped to the minimum necessary data, record its purpose/owner/review date, restrict ordinary product access, and be released when no longer justified.

## Proposed V1 retention matrix

| Category | Active retention | Post-deletion recommendation | Proposed default |
| --- | --- | --- | --- |
| Account/profile | While account active/purpose continues | Delete/anonymise from live systems | 30 days after confirmed deletion |
| Health records + correction lineage | While account active/purpose continues | Delete from live systems unless lawful hold | 30 days after confirmed deletion |
| Consent/privacy audit | Active + limited post-closure evidence | Minimum compliance record only | 36 months proposed |
| Auth/security events | Security purpose only | Retain independently only if still justified | 12 months proposed |
| Ordinary technical logs | Operational need only | Expire normally | 30 days or less proposed |
| Backups | Operational recovery purpose | Expire; reconcile deletion after restore | 35 days or less proposed |
| Raw uploaded health document | Temporary processing only | Auto-delete | 24 hours or less proposed |
| Unconfirmed extracted candidates | Temporary review only | Auto-delete | 24 hours or less proposed |

## Production gates

Before real health data production:
- Product Owner approval of the retention matrix;
- Nigerian DPO/legal review;
- DPIA;
- privacy-notice alignment;
- provider-specific backup validation;
- restore/deletion reconciliation testing;
- implementation of account-deletion workflow before promising user deletion behavior.

## Recommendation

Adopt the matrix above as HILERA's default V1 policy, subject to Nigerian DPO/legal validation before public launch.

PRD Sync Status: Required only after Product Owner approves the exact retention/deletion policy.