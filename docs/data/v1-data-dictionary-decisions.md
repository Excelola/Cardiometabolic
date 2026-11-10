# HILERA V1 Data Dictionary — Decision Register

## Purpose

This register separates what is already approved from what still requires Product Owner, clinical, privacy, security, or technical approval before the final production health-data model can be implemented.

## Cleared from the Master PRD

The following can be treated as approved requirements:

- email is the MVP authentication identifier;
- internal user ID is separate from email;
- plaintext passwords are never stored;
- preferred/display name is required;
- exact date of birth is required;
- country/market context is required;
- consent/acknowledgement records are versioned/historical;
- health information is user-owned/self-access for the V1 consumer journey;
- health measurement records must carry type, value/structured result, explicit unit, occurrence time/context, provenance, entry time, owner and correction/audit information where applicable;
- health information may be organised under Health readings, Body measurements and Daily habits;
- provenance concepts exist: User Entered, Imported, Verified, System Derived;
- user-confirmed document extraction is not clinically Verified;
- general analytics must not receive raw health values/clinical outputs by default;
- engineers must not use real health data for routine development/testing;
- exact retention periods must exist before production launch but are not yet approved;
- the final production data model cannot be implemented without a governed Data Dictionary;
- the first manual-persistence inventory is approved: blood pressure, blood glucose, HbA1c, lipid panel, weight, waist circumference, physical-activity duration and sleep duration;
- approved first-batch units/context are recorded in the Data Dictionary; structured food tracking remains deferred.

## Product decisions still required before Phase 2 manual health persistence

### DD-001 — Exact V1 health-information inventory

**Status:** Resolved / approved 10 November 2026.

Approved first manual-persistence inventory:

- Blood pressure — systolic + diastolic.
- Blood glucose — value + descriptive context.
- HbA1c.
- Lipid panel — one or more of total cholesterol, HDL, LDL and triglycerides.
- Weight.
- Waist circumference.
- Physical-activity duration.
- Sleep duration.

Structured food tracking remains part of HILERA's broader direction but is deferred from the first persistence batch.

**PRD Sync Status:** Completed.

### DD-002 — Supported units and structural context per field

**Status:** Resolved for the approved first persistence batch.

Approved:
- blood pressure: mmHg;
- blood glucose: mmol/L or mg/dL;
- blood-glucose context: fasting, before meal, after meal, random/other, not specified;
- HbA1c: %;
- lipid components: mmol/L or mg/dL;
- weight: kg or lb;
- waist: cm or in;
- physical activity: minutes;
- sleep: hours/minutes in UX, with integer-minute technical storage permitted.

No clinical plausibility ranges or interpretation rules were approved.

**Clinical Specification dependency:** Required only when clinical meaning, thresholds, targets or interpretation are introduced.

### DD-003 — Health-profile questionnaire

**Status:** Required before collecting material health-profile answers.

The existence of the profile is approved; exact questions/answers are not.

**PRD Sync Status if material fields are approved:** Required.

### DD-004 — Retention categories and production retention rules

**Status:** Resolved / approved 10 November 2026.

Approved defaults:
- live account/profile/health deletion within 30 days of confirmed account deletion unless a documented lawful hold applies;
- minimum consent/privacy compliance record for 36 months after closure/deletion;
- authentication/security events for 12 months by default where still necessary;
- ordinary technical logs for 30 days or less;
- routine backups for 35 days or less by default;
- raw uploaded documents and unconfirmed candidates for 24 hours or less after confirmation, cancellation, failure or abandonment.

Nigerian DPO/legal review remains a production-launch gate.

**PRD Sync Status:** Completed.

### DD-005 — Correction model

**Status:** Product/technical design required before health persistence.

PRD requires controlled correction/auditability and distinguishes editing current profile data from correcting historical health information.

Recommendation: preserve correction lineage rather than silently overwriting history.

### DD-006 — Document-assisted provenance

**Status:** Resolved / approved 10 November 2026.

Approved provenance label: **Document Assisted**.

Document Assisted:
- distinguishes extracted-and-user-confirmed values from manual User Entered data;
- is not Verified;
- is not Imported;
- does not imply clinical accuracy.

Provider-specific technical source-artifact linkage remains an implementation detail.

**PRD Sync Status:** Completed.

### DD-007 — Raw uploaded document lifecycle

**Status:** Resolved at product-policy level / approved 10 November 2026.

Approved initial rules:
- PDF, JPEG/JPG, PNG;
- one file per upload;
- maximum 10 MB;
- maximum 15 PDF pages for the initial synchronous flow;
- reject password-protected/encrypted PDFs;
- reject Office documents, archives and unsupported formats;
- raw document temporary only;
- unconfirmed candidate data temporary only;
- both raw documents and unconfirmed candidates deleted within 24 hours of confirmation, cancellation, failure or abandonment;
- no persistent V1 document vault.

Implementation still requires approved private storage and malware-scanning controls.

**PRD Sync Status:** Completed.

### DD-008 — Clinical validation/interpretation

**Status:** Not part of the Data Dictionary alone.

Any:
- plausibility range with clinical meaning;
- threshold;
- risk category;
- risk formula;
- escalation rule;
- diagnosis/treatment interpretation

requires an approved Clinical Specification.

## Technical decisions that can follow product approval

After DD-001/DD-002 are approved:

- typed PostgreSQL schema;
- Drizzle migration;
- Server Actions / server-only reads;
- ownership-scoped DAL;
- API/DTO representation;
- indexes;
- history queries;
- descriptive trend data structures;
- correction/audit implementation;
- backup/restore tests;
- two-user authorization tests;
- logging canary tests.

These technical decisions must map back to the approved Data Dictionary and may not introduce fields by convenience.

## Next unresolved approval areas

The first manual-persistence inventory and the retention/document-upload policy no longer block their respective specifications. Remaining material product/governance decisions include:

1. exact cardiometabolic health-profile questionnaire;
2. structured food-tracking model;
3. exact technical account-deletion implementation/grace behavior;
4. private object-storage provider and malware-scanning implementation;
5. any clinical thresholds, risk formulas, targets or escalation logic through approved Clinical Specifications;
6. external integrations other than the approved initial Google Document AI OCR integration.

**Current PRD Sync Status: Completed for DD-001, DD-002, DD-004, DD-006 and DD-007.**
