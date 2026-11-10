# HILERA Health Information Persistence Architecture — Draft

## Status

**Type:** Technical architecture proposal  
**Status:** Draft for Product Owner / data / privacy / clinical governance review  
**Implementation authorization:** None  
**PRD authority:** The Master PRD is authoritative. This document must not introduce fields, clinical rules or permissions by implication.

The Master PRD currently approves:
- Add Health Information as the umbrella experience;
- user-facing categories: Health readings, Body measurements, Daily habits;
- manual entry;
- approved health-document upload with candidate extraction, user review/correction and explicit confirmation before save;
- history and longitudinal views for supported information;
- controlled correction of erroneous user-entered information subject to audit requirements;
- approved provenance concepts;
- health information as Sensitive Health data;
- purpose limitation, minimization, least privilege and a governed V1 Data Dictionary before the final production data model.

The PRD does **not** yet approve the exact V1 health-information inventory, exact retention periods, exact deletion implementation, final database schema/API schema, raw-document retention architecture, or clinical thresholds/formulas.

## Architectural recommendation

Build health persistence in a separate domain module inside the existing modular Next.js/PostgreSQL monolith.

Do not mix health-domain queries into authentication repositories.

Recommended logical boundaries:

Browser / Server Components / approved Server Actions
→ health application service
→ ownership-scoped health repository
→ PostgreSQL

Clinical interpretation remains a separate service/specification boundary and must not be inferred inside persistence code.

## Delivery sequence

### Phase 2A — Data Dictionary gate

Before production health tables are finalized, establish the governed V1 Data Dictionary required by PRD Section 6.

For every material field, confirm:
- approved purpose;
- user-facing label;
- data type;
- allowed values;
- required/optional/derived/prohibited classification;
- source/provenance;
- validation;
- sensitivity;
- edit/correction behavior;
- feature dependency;
- Clinical Specification dependency;
- retention category;
- API/database mapping.

**No exact measurement/habit field should be invented by Engineering.**

### Phase 2B — Manual health-information persistence

Implement only the approved fields from the Data Dictionary for:
- Health readings;
- Body measurements;
- Daily habits.

This phase should support the approved manual-entry, history and trends foundations without adding clinical interpretation.

### Phase 2C — Controlled correction/history

Implement the approved correction behavior with auditability.

Recommendation: avoid silent destructive overwrite of clinically relevant historical information. Use a version/correction model or equivalent audited approach so the product can distinguish the originally recorded fact from an approved correction without exposing an unnecessarily complex UI.

Exact correction/deletion implementation requires privacy/product review.

### Phase 2D — Document-upload capture

Treat document upload as a separate controlled subsystem:
upload → temporary/approved storage → extraction candidate staging → user review/correction → explicit confirmation → persist only approved HILERA fields.

Do not persist unrelated document findings merely because extraction can detect them.

Raw document storage/retention must not be implemented until formats, limits, provider, storage, retention/deletion, malware/content handling, confidence behavior and error UX are separately specified.

## Recommended data-model shape

The exact schema is not approved. The following is an architectural shape for later technical specification.

### 1. Health record envelope

Use a stable internal record identity and ownership link for each persisted health-information item.

Conceptual attributes:
- internal record ID;
- owning user ID;
- approved category/type reference;
- event/measurement temporal context where applicable;
- entry/creation timestamp;
- correction/update metadata where applicable;
- provenance reference;
- current lifecycle state only if required by approved correction/deletion policy.

Do not expose internal IDs as authorization credentials.

### 2. Typed category-specific values

Recommendation: prefer typed, reviewed structures over an unrestricted generic JSON/EAV store for clinical/health fields.

Reasons:
- stronger validation;
- clearer migrations;
- easier Data Dictionary traceability;
- easier query/index review;
- reduced risk of silently adding unapproved fields;
- safer trend queries and unit handling.

The exact table/column design must follow the approved Data Dictionary.

### 3. Provenance

The PRD previously approved provenance concepts including User Entered, Imported, Verified and System Derived, with important governance boundaries.

Rules:
- provenance is metadata about origin/process, not a clinical truth label;
- "Verified" requires an actual approved verification process;
- document-extracted-and-user-confirmed information must not automatically become "Verified";
- direct integrations are not approved merely because an "Imported" concept exists;
- exact mapping of the newly approved document-upload flow to provenance labels remains a separate specification decision.

### 4. Correction/audit relationship

A controlled correction should preserve enough lineage to answer:
- what information was recorded;
- when it applied/occurred;
- when it was entered;
- when it was corrected;
- what the current user-visible value is;
- which prior version was superseded, if applicable;
- who/what performed the correction at an approved level of detail.

Do not put health values into generic operational logs to achieve auditability.

### 5. Clinical outputs

Clinically governed outputs must not be stored in the same way as ordinary raw user-entered health information without traceability.

Any future persisted Risk Awareness Summary should be able to reference:
- approved Clinical Specification/version;
- relevant input snapshot/version;
- generation timestamp;
- status/failure reason at a safe level;
- output only as permitted by the Clinical Specification.

No clinical output persistence should be implemented until the corresponding clinical specification exists.

## Authorization

Every health read/write must:
1. derive the user from the validated server-side session;
2. scope the database query by owner;
3. never trust a browser-provided user ID;
4. fail closed if authorization/session cannot be established;
5. prevent cross-user existence disclosure where applicable.

The consumer permission model is self-only for the approved V1 journey.

Clinician, caregiver, employer, insurer, shared-account and admin health-data permissions are not approved.

## Data protection

Health records are Sensitive Health data.

Required baseline:
- TLS for database connections outside trusted local development;
- encryption at rest through the selected production database/storage architecture;
- server-side-only database access;
- least-privilege runtime role;
- no raw health information in general analytics/logs by default;
- no sensitive health values in URLs;
- no routine browser localStorage/sessionStorage persistence of health records;
- backups treated as sensitive health-data copies;
- production backup/restore access tightly controlled.

Exact encryption/key-management architecture is separately governed.

## Validation

Validation occurs in layers:

### Product/data validation

From the Data Dictionary:
- field type;
- allowed values;
- required/optional state;
- unit requirements;
- date/time requirements;
- source/provenance requirements.

### Clinical validation

Only when defined by an approved Clinical Specification:
- plausible ranges with clinical meaning;
- measurement eligibility;
- interpretation-specific constraints;
- risk model requirements.

Engineering must not invent clinical "reasonable" ranges.

### Database validation

Use constraints where they can safely enforce approved structural invariants, such as:
- non-null ownership;
- valid foreign keys;
- controlled enums/reference tables;
- timestamp ordering where approved;
- uniqueness where required.

Do not encode unapproved clinical thresholds as database checks.

## Time model

The PRD requires the system to distinguish, where applicable:
- when a measurement/event/health fact occurred;
- when the user entered it;
- when it was corrected/updated;
- when a clinically governed result was generated.

Recommendation: store timestamps in an unambiguous server format, preserve user-entered temporal context as defined by the Data Dictionary, and render in the appropriate user context.

Exact timezone UX remains a design/data-specification concern.

## History and trends

History queries should be ownership-scoped and chronological.

Trend architecture should:
- read only approved supported measurement types;
- preserve units/approved normalization rules;
- return descriptive longitudinal data;
- not assign clinical meaning without a Clinical Specification;
- handle insufficient history explicitly rather than fabricating a trend.

Do not implement HIL-RD-002 full-text history search/filter by implication; it remains outside the approved Bundle 1.

## Document upload boundary

Uploaded health documents are Sensitive Health data and may contain unrelated medical information.

Therefore:
- the raw document is not the health-record database;
- extraction output is candidate data until explicit user confirmation;
- extraction must map only to approved HILERA fields;
- unsupported/unapproved extracted information must not silently enter persistence;
- confidence scores are not clinical verification;
- user confirmation is not clinical verification;
- provider/API selection must undergo privacy/security review;
- raw file retention/deletion remains unresolved and blocks production implementation of the upload subsystem.

## Deletion and retention

The PRD approves a user mechanism to request/initiate account deletion but defers exact retention/deletion behavior.

Architecture must therefore:
- avoid hard-coding indefinite retention;
- support future policy-driven deletion/retention;
- distinguish correction from deletion;
- consider backup expiry separately from live-row deletion;
- preserve only the audit history that is approved/legal/necessary;
- not implement irreversible deletion semantics until the retention/deletion specification is approved.

## Observability

Allowed by default:
- aggregate request success/failure;
- database latency;
- write/read error counts;
- queue/processing status where relevant;
- sanitized internal correlation IDs.

Not allowed in general telemetry by default:
- raw measurement values;
- raw health profile answers;
- raw uploaded documents;
- clinical summary details;
- passwords/tokens/secrets.

Use synthetic canaries to verify telemetry boundaries.

## Migration strategy

When the Data Dictionary is approved:

1. Write the technical data model.
2. Map every column/field to the Data Dictionary.
3. Generate versioned Drizzle migration.
4. Review SQL manually.
5. Test empty-database replay.
6. Test migration against representative synthetic prior state.
7. Take/verify recovery checkpoint for risky production migration.
8. Run two-user ownership/isolation integration tests.
9. Run backup/restore drill with synthetic health records.
10. Verify logs do not expose test health canaries.

Never use schema push as production change control.

## Acceptance criteria for Phase 2 implementation

Before health persistence can merge:
- approved Data Dictionary exists for every implemented field;
- no field exists only because it was convenient for Engineering;
- all records are owner-scoped server-side;
- cross-user reads/writes are tested;
- validation follows Data Dictionary/Clinical Specification boundaries;
- history reflects approved temporal/provenance fields;
- corrections are controlled/auditable;
- no raw health values leak to logs/analytics;
- migration replay succeeds;
- backup/restore succeeds with synthetic data;
- no clinical thresholds/formulas/diagnosis/treatment behavior are introduced;
- document-upload storage/extraction is not silently implemented inside the manual-persistence batch.

## Key risks

### Schema too generic

A generic JSON/EAV health bucket makes it easy to add unapproved fields and weakens validation/traceability.

**Mitigation:** Data Dictionary-driven typed persistence.

### Health data in logs

Health values can leak through debug/error instrumentation.

**Mitigation:** explicit safe DTOs, sanitized errors, canary testing and observability policy.

### Cross-user access

A valid session does not authorize every row.

**Mitigation:** ownership predicate in every health DAL query and two-user tests.

### Clinical logic creeping into validation

Developers may add "reasonable ranges."

**Mitigation:** separate structural/data validation from clinically governed validation.

### Document overcollection

OCR can extract information HILERA never approved.

**Mitigation:** candidate staging + allowlisted approved fields + explicit user confirmation + raw-document policy.

## Recommendation

Proceed from the merged authentication foundation with a **Data Dictionary + manual health-persistence specification** as the next controlled backend package.

Do not start with document upload, AI/OCR, trends interpretation or Risk Awareness logic. Establish secure owner-scoped persistence first.

## PRD Sync Status

**Not Required for this draft architecture.**

When the Product Owner approves an exact field inventory, retention/deletion behavior, new permissions, or any other material product-visible data rule, PRD Sync may be Required according to the normal governance process.
