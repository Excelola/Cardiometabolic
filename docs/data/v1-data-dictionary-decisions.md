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
- the final production data model cannot be implemented without a governed Data Dictionary.

## Product decisions still required before Phase 2 manual health persistence

### DD-001 — Exact V1 health-information inventory

**Status:** Required / not approved.

We must approve exactly which health readings, body measurements and daily habits HILERA V1 will collect.

The current product description mentions examples such as blood pressure, blood sugar, cholesterol, weight/waist, food, physical activity and sleep, but the Master PRD explicitly states that this wording does **not** approve the exact V1 inventory.

**PRD Sync Status if approved:** Required.

### DD-002 — Supported units and structural context per field

**Status:** Required after DD-001.

Examples include unit choices and any measurement-specific context. These must not be guessed by Engineering.

**Clinical Specification dependency:** Possible, depending on field/context.

### DD-003 — Health-profile questionnaire

**Status:** Required before collecting material health-profile answers.

The existence of the profile is approved; exact questions/answers are not.

**PRD Sync Status if material fields are approved:** Required.

### DD-004 — Retention categories and production retention rules

**Status:** Required before production launch.

Exact periods remain deferred. Architecture must not hard-code indefinite retention.

### DD-005 — Correction model

**Status:** Product/technical design required before health persistence.

PRD requires controlled correction/auditability and distinguishes editing current profile data from correcting historical health information.

Recommendation: preserve correction lineage rather than silently overwriting history.

### DD-006 — Document-assisted provenance

**Status:** Required before document-upload implementation.

Need exact source label/linkage for:
manual entry vs extracted-from-upload, with user confirmation not implying clinical verification.

### DD-007 — Raw uploaded document lifecycle

**Status:** Required before document-upload implementation.

Need approved:
- formats;
- limits;
- storage;
- malware/content checks;
- OCR/extraction provider;
- raw-document retention/deletion;
- candidate-value retention;
- error UX;
- privacy/security controls.

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

## Recommended next approval bundle

For speed, approve the next product decision as one coordinated bundle:

1. exact V1 Health readings;
2. exact V1 Body measurements;
3. exact V1 Daily habits;
4. supported units/context for each;
5. which are required vs optional for manual entry;
6. which are only tracking data vs candidates for future clinically governed interpretation.

Do **not** include thresholds, risk formulas or clinical escalation in the same approval unless a separate Clinical Specification is ready.

**Current PRD Sync Status: Not Required.** No new field inventory has been approved in this register.
