# HILERA Phase 2 — Manual Health Information Persistence Technical Specification

## Status

**Scope:** Approved first V1 manual health-information persistence batch  
**Source of truth:** Master PRD + governed V1 Data Dictionary  
**Clinical behavior:** None  
**Implementation target:** Existing modular Next.js / PostgreSQL / Drizzle monolith

## Objective

Persist the approved first-batch health information securely and make it available to the existing Add Health Information and Health History experiences without adding clinical interpretation.

Approved record types:

- blood pressure;
- blood glucose;
- HbA1c;
- lipid panel;
- weight;
- waist circumference;
- physical-activity duration;
- sleep duration.

Structured food tracking, health-profile questionnaire fields, document upload/extraction persistence, clinical outputs, thresholds and risk logic are excluded.

## Architecture

Keep health persistence as a separate server-only domain module from authentication.

Recommended boundary:

UI / Server Components / Server Actions  
→ health application service  
→ ownership-scoped health repository  
→ PostgreSQL

Authentication supplies the authoritative user identity. Browser-supplied user IDs are never accepted as ownership authority.

## Data model

Use a typed base-record + one-to-one subtype model rather than unrestricted JSON/EAV.

### health_records

Common envelope:

- id: UUID primary key;
- user_id: UUID foreign key to users, required;
- record_type controlled enum:
  - blood_pressure
  - blood_glucose
  - hba1c
  - lipid_panel
  - weight
  - waist_circumference
  - physical_activity_duration
  - sleep_duration
- provenance controlled enum; first implementation accepts only user_entered;
- occurred_at: timestamptz nullable;
- occurred_on: date nullable;
- entered_at: timestamptz server-generated;
- supersedes_record_id: UUID nullable;
- superseded_at: timestamptz nullable;
- superseded_by_record_id: UUID nullable.

Temporal rule:

- reading/body-measurement types use occurred_at;
- daily-habit types use occurred_on;
- enforce the appropriate structural shape for the selected type in application/service tests and, where safe, database constraints.

Correction model:

- never silently overwrite a saved historical value;
- a correction creates a replacement record + subtype row inside one transaction;
- the old record is marked superseded and linked to the new record;
- only the owner may correct;
- correction cannot change ownership;
- history defaults to current records but can retain lineage internally for audit.

Do not expose correction lineage as clinical verification.

### blood_pressure_records

One-to-one with health_records:

- health_record_id;
- systolic_value numeric;
- diastolic_value numeric;
- unit fixed to mmHg by type contract.

No threshold/range checks.

### blood_glucose_records

- health_record_id;
- glucose_value numeric;
- unit: mmol_l or mg_dl;
- context: fasting, before_meal, after_meal, random_other, not_specified.

No interpretation.

### hba1c_records

- health_record_id;
- hba1c_value numeric;
- unit fixed to percent.

### lipid_panel_records

- health_record_id;
- unit: mmol_l or mg_dl;
- total_cholesterol_value nullable numeric;
- hdl_value nullable numeric;
- ldl_value nullable numeric;
- triglycerides_value nullable numeric.

At least one lipid component is required.

Do not calculate ratios or non-HDL values in this batch.

### weight_records

- health_record_id;
- weight_value numeric;
- unit: kg or lb.

### waist_circumference_records

- health_record_id;
- waist_value numeric;
- unit: cm or in.

### physical_activity_records

- health_record_id;
- duration_minutes integer.

No target/goal scoring.

### sleep_records

- health_record_id;
- duration_minutes integer.

UX may accept hours/minutes, converted deterministically to integer minutes before persistence. No sleep-quality score.

## Numeric validation

Structural validation only:

- required field present;
- parses as a finite numeric value;
- approved unit/context;
- lipid panel has at least one component;
- durations parse to whole minutes.

Do **not** introduce medically plausible minimums/maximums, normal ranges, thresholds, target values, diagnoses or warnings.

If a technically necessary storage bound is required, stop and report it rather than inventing a clinically meaningful limit.

## Server actions / reads

### createHealthRecordAction

- authenticated mutation;
- exact trusted-origin protection consistent with existing mutation controls;
- server derives owner from session;
- accepts a discriminated union of approved record types;
- validates structural fields only;
- one transaction for base + subtype insert;
- returns public-safe success/error state;
- never logs raw health values.

### correctHealthRecordAction

- authenticated mutation;
- owner-scoped lookup;
- structural validation;
- creates replacement + supersession links atomically;
- cannot correct a record belonging to another user;
- old historical record remains internally retained.

### Server-only reads

- list current health records for authenticated user, newest first;
- get one current record by owner + record ID;
- correction lineage may be available only for internal/tests, not general UI by default.

No browser-provided user_id.

## UI integration

Use the existing approved Add Health Information presentation.

### Category → fields

Health readings:
- Blood pressure
- Blood glucose
- HbA1c
- Cholesterol / Lipid panel

Body measurements:
- Weight
- Waist circumference

Daily habits:
- Physical activity
- Sleep

Do not add Food in this batch.

Forms should progressively show only the selected type's fields.

History:

- display user-facing type;
- value(s) + original unit;
- occurrence date/time or day;
- source as plain-language "Added by you" for user_entered;
- correction action where existing UX supports it.

No clinical badges such as normal/high/low.

## Trends

This implementation batch may expose only descriptive raw-series data for approved types when values use a consistent unit.

Do not introduce clinical trend interpretation.

Do not implement cross-unit conversion for glucose/lipids/weight/waist unless separately specified and tested. Preserve original values/units.

If the current Trends UI expects data that cannot be safely compared across units, use only same-unit series or leave the existing synthetic display untouched until a separate deterministic conversion specification is approved.

## Security and privacy

- All health rows are Sensitive Health.
- Server-side ownership predicates on every read/write.
- No raw health values in ordinary logs, analytics, URLs or error telemetry.
- No localStorage/sessionStorage health persistence.
- Synthetic data only in tests.
- Database runtime credentials remain least-privilege in production design.
- Backups containing health data are Sensitive Health copies.
- Do not expose DB IDs as authorization decisions.

## Database migration

Create a versioned Drizzle migration.

Before merge:

- manual SQL review;
- empty-database replay;
- upgrade replay from current merged auth schema;
- no destructive auth changes;
- backup/restore drill with synthetic auth + health records;
- verify health-record ownership and correction links after restore.

No schema push as production change control.

## Tests

### Unit

- discriminated input validation;
- unit/context allowlists;
- lipid at-least-one-component rule;
- duration conversion;
- no clinical range validation;
- public-safe error mapping.

### PostgreSQL integration

Use disposable loopback PostgreSQL only.

Test:

- migration replay;
- create every approved record type;
- user A cannot read/correct user B records;
- browser-supplied user ID cannot alter ownership;
- correction retains old row and activates replacement;
- concurrent correction cannot corrupt lineage;
- invalid subtype/type combinations fail;
- lipid empty-component insert fails;
- current-record history query excludes superseded rows;
- backup/destroy/restore preserves records and lineage.

### Logging/privacy

Use synthetic canary health values and verify they do not appear in:

- server logs;
- browser URLs;
- ordinary error responses;
- general analytics hooks.

## Acceptance criteria

1. Existing auth behavior remains unchanged.
2. All eight approved record types persist with typed schema.
3. Ownership is always derived server-side.
4. History uses real PostgreSQL data for the authenticated user.
5. Correction is auditable and non-destructive.
6. Cross-user access tests fail closed.
7. No clinical interpretation is introduced.
8. No food/document-upload/health-profile fields are added.
9. Migration and restore drills pass.
10. Lint, typecheck, unit/integration tests and production build pass.
11. Production dependency audit remains clean of unresolved Critical/High issues.
12. No secrets or health canaries leak into logs/URLs/errors.

## Explicit exclusions

- health-document upload/extraction/OCR;
- structured food tracking;
- health-profile questionnaire;
- clinical Risk Awareness Summary;
- thresholds/risk categories;
- diagnosis/treatment;
- medication data;
- reminders;
- clinician/caregiver/admin health access;
- external integrations;
- cross-unit medical conversions;
- deletion implementation;
- production retention-period implementation.

## PRD Sync Status

**Completed before implementation.** Master PRD Section 6 and relevant deferred-decision references were updated on 10 November 2026 for the approved first persistence inventory.
