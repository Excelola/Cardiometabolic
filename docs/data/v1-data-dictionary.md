# HILERA V1 Data Dictionary — Approved Foundation

## Status

**Artifact type:** Governed Data Dictionary foundation  
**Source of truth:** HILERA Master PRD, Section 6 — Data Inventory, Field Requirements & Data Governance  
**Status:** Approved-source transcription / implementation gate  
**Scope:** Only material data elements already approved in the Master PRD or already implemented under approved authentication policy  
**Not approved here:** additional health-information fields beyond the approved first persistence batch, exact health-profile questionnaire, structured food fields, clinical thresholds/formulas, retention periods, deletion implementation, admin-role matrix, API schema, final database schema, integrations, AI functionality

This document does **not** create new product requirements. It translates already-approved PRD requirements into a field-level governance view so later technical specifications can map every implemented material field to an approved purpose.

## Classification legend

- **R1** — Required for secure account operation
- **R2** — Required for legal, privacy, consent, or data-rights purposes
- **R3** — Required for a specific approved product capability
- **R4** — Required for an approved clinical capability
- **O** — Optional with a defined user/product benefit
- **D** — Derived by the system from approved inputs
- **S** — System, security, audit, or operational metadata
- **X** — Not approved for collection

Sensitivity:
- **Public**
- **Internal**
- **Personal**
- **Sensitive Health**
- **Security Secret**

## A. Account and authentication

| Conceptual field | User-facing label | Purpose | Type | Class | Source / provenance | Validation | Sensitivity | Edit/correction | Feature dependency | Clinical dependency | Retention | API mapping | DB mapping |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| internal_user_id | None | Stable internal account identity separate from email | Opaque identifier | R1/S | System generated | Unique, non-user-controlled | Personal | Not user editable | Account/auth | None | TBD before production | TBD | Implemented auth schema |
| authentication_email | Email address | MVP sign-up/sign-in identifier | Email string | R1 | User entered | Approved email normalization/format rules; no auto-merge | Personal | Future email change requires separately approved protection | Account/auth | None | TBD before production | Existing auth contract | Implemented auth schema |
| password_verifier | Password | Secure password authentication | Argon2id encoded verifier | R1/S | System generated from user password | Approved password policy; plaintext never stored | Security Secret | Changed only through approved credential flow | Account/auth | None | TBD before production | Never exposed | Implemented credential schema |
| account_status | None | Minimum account lifecycle/security state | Controlled system value | S | System generated | Closed allowed-state set when specified | Personal/Internal | System-controlled | Account/security operations | None | TBD | TBD | Existing/implementation-specific |
| account_created_at | None | Account creation/audit metadata | Timestamp | S | System generated | Server timestamp | Personal/Internal | Not ordinary user-editable | Account/security operations | None | TBD | TBD | Existing/implementation-specific |
| session_metadata | None | Operate approved server-side sessions securely | Structured security metadata | S | System generated | Approved session invariants | Security Secret / Personal as applicable | System-controlled | Account/auth | None | Security policy | Never expose secrets | Implemented auth schema |
| security_event_metadata | None | Minimal authentication/security auditability | Structured allowlisted event | S | System generated | Allowlisted event types only | Internal / Personal as applicable | System-controlled | Security operations | None | TBD | Internal only | Implemented auth schema |

### Explicitly deferred authentication data

- Recovery data — not approved until a recovery mechanism is approved.
- Email-ownership verification state — not approved until a verification mechanism is approved.
- Phone number for authentication — not required for initial MVP.
- OTP credentials — not required for initial MVP.

## B. Approved V1 profile and identity data

| Conceptual field | User-facing label | Purpose | Type | Class | Source | Validation | Sensitivity | Edit/correction | Feature dependency | Clinical dependency | Retention | API mapping | DB mapping |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| preferred_name | Preferred name / Display name | V1 profile and product personalisation | Text | R3 | User entered | Non-empty text; exact length rules TBD | Personal | User editable | Profile/personalisation | None | TBD | TBD | TBD |
| date_of_birth | Date of birth | Required V1 profile; source for age derivation | Date | R3/R4 when clinically used | User entered | Valid calendar date; age-dependent clinical use only with approved Clinical Specification | Personal / Sensitive Health when clinically used | Correctable with appropriate audit where needed | Profile; future approved clinical capabilities | Clinical Specification if used clinically | TBD | TBD | TBD |
| country_market | Country / Market | Nigeria-first product behavior and geographic applicability | Controlled country/market value | R3 | User entered / product context | Approved market values | Personal | User editable where permitted | Localisation/applicability | None unless future clinical rule requires | TBD | TBD | TBD |

### Not approved by default

- full legal name
- residential address
- precise GPS location
- national identification number
- Bank Verification Number
- passport/government identity details
- biological/sex-related fields unless an approved Clinical Specification requires them

## C. Consent and privacy records

Consent/acknowledgement records are historical and auditable; they are not a single mutable boolean.

| Conceptual field | Label | Purpose | Type | Class | Source | Validation | Sensitivity | Edit/correction | Dependency | Retention | API mapping | DB mapping |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| consent_type | Consent / acknowledgement type | Identify what was accepted/acknowledged | Controlled value | R2 | System/user action | Approved notice types only | Personal | Historical record; not silently rewritten | Consent/privacy | TBD | TBD | TBD |
| notice_version | Notice version | Trace accepted Terms/Privacy/health-data notice version | Version identifier | R2/S | System generated | Must reference approved published version | Personal/Internal | Historical | Consent/privacy | TBD | TBD | TBD |
| consent_action_at | Date/time | Record when action occurred | Timestamp | R2/S | System generated | Server timestamp | Personal | Historical | Consent/privacy | TBD | TBD | TBD |
| consent_user_id | None | Associate record to account | Internal user reference | R2/S | System generated | Valid owner reference | Personal | Not ordinary user editable | Consent/privacy | TBD | TBD | TBD |
| consent_status | Current status | Track withdrawal/revocation where applicable | Controlled value | R2 | User/system action | Applies only where withdrawal/revocation is defined | Personal | Historical transitions | Consent/privacy | TBD | TBD | TBD |
| consent_audit_metadata | None | Necessary audit context | Minimal structured metadata | S | System generated | Purpose-limited | Internal/Personal | System-controlled | Consent/privacy/security | TBD | Internal | TBD |

## D. Cardiometabolic health-profile data

**Exact health-profile questions and answer fields are not yet approved.**

The PRD approves only the existence of a cardiometabolic health profile and the field-inclusion governance process.

Potential categories may include relevant:
- personal health history;
- family history;
- known diagnoses where appropriate;
- lifestyle information;
- previous concerning measurements;
- other clinically approved risk-factor inputs.

These categories **must not be translated into production fields** until each field has:
- an approved product/clinical purpose;
- required/optional status;
- exact question/field wording;
- skip/update behavior;
- temporal behavior;
- access rule;
- retention category;
- applicable Clinical Specification where required.

Medication information is **not collected by default**.

## E. Approved health-information record envelope and first V1 persistence inventory

The record envelope below applies to the approved first persistence inventory and any future separately approved health-information type.

| Conceptual field | Label | Purpose | Type | Class | Source / provenance | Validation | Sensitivity | Edit/correction | Feature dependency | Clinical dependency | Retention | API mapping | DB mapping |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| measurement_type | Health reading / measurement type | Identify supported measurement | Controlled reference | R3 | Product-defined | Must reference an approved V1 measurement type | Sensitive Health | Not freely editable after save; correction rules apply | Add Health Information, History, Trends | Clinical Specification if clinically interpreted | TBD | TBD | TBD |
| measurement_value | Value | Store approved numeric/structured result | Numeric or approved structured type | R3/R4 as applicable | User entered / approved source | Structural validation; plausibility only if approved | Sensitive Health | Correctable with audit | Add Health Information, History, Trends | Clinical Specification where meaning/validation requires | TBD | TBD | TBD |
| measurement_unit | Unit | Preserve explicit unit | Controlled unit | R3 | User/product | Must be supported for approved type | Sensitive Health | Correction rules apply | Add Health Information, History, Trends | Clinical Specification if clinically relevant | TBD | TBD | TBD |
| occurred_at | Date/time taken | Distinguish event time from entry time | Date/time or approved temporal context | R3 | User entered / approved source | Valid temporal value; future-date rules TBD | Sensitive Health | Correctable with audit | History/Trends | Measurement-specific if required | TBD | TBD | TBD |
| provenance | Source | Distinguish origin/trust level | Controlled provenance | R3/S | User/system | Approved provenance categories only | Sensitive Health | Limited correction under approved rules | Add Health Information, trust/audit | None by itself | TBD | TBD | TBD |
| measurement_context | Context | Capture only approved measurement-specific context | Type-specific structure | R3/R4 | User/system | Only fields approved for that measurement | Sensitive Health | Per Data Dictionary | Type-specific | Clinical Specification if required | TBD | TBD | TBD |
| entered_at | None | Record when information entered HILERA | Timestamp | S | System generated | Server timestamp | Sensitive Health/Internal | Not ordinary user editable | History/audit | None | TBD | Internal/TBD | TBD |
| owner_user_id | None | Ownership/authorization | Internal user reference | S | System/session | Server-side owner only | Sensitive Health/Personal | Not user editable | All health-data access | None | TBD | Never browser-controlled | TBD |
| correction_audit | None | Preserve amendment/correction history | Structured audit reference | S | System/user action | Controlled correction workflow | Sensitive Health/Internal | Append/control, not silent overwrite | History/data rights | None unless clinical output relies on value | Health information | Internal/TBD | TBD |

### Approved first manual-persistence inventory

All entry types below are optional at the global product level. Once the user chooses a type, the structural fields for that type are required as applicable. No field below authorizes clinical interpretation.

| Field / record type | User-facing label | Approved data | Supported units / values | Class | Provenance | Sensitivity | Product dependency | Clinical dependency | Retention category |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| blood_pressure | Blood pressure | systolic value + diastolic value | mmHg | R3 | User Entered for manual entry | Sensitive Health | Add Health Information, History | None for persistence; Clinical Specification required for interpretation | Health information |
| blood_glucose | Blood glucose | glucose value + descriptive context | mmol/L or mg/dL; context: fasting, before meal, after meal, random/other, not specified | R3 | User Entered for manual entry | Sensitive Health | Add Health Information, History | None for persistence; Clinical Specification required for interpretation | Health information |
| hba1c | HbA1c | HbA1c value | % | R3 | User Entered for manual entry | Sensitive Health | Add Health Information, History | None for persistence; Clinical Specification required for interpretation | Health information |
| lipid_panel | Cholesterol / Lipid panel | one or more of total cholesterol, HDL, LDL, triglycerides | mmol/L or mg/dL | R3 | User Entered for manual entry | Sensitive Health | Add Health Information, History | None for persistence; Clinical Specification required for interpretation | Health information |
| weight | Weight | weight value | kg or lb | R3 | User Entered for manual entry | Sensitive Health | Add Health Information, History | None for persistence; Clinical Specification required for interpretation | Health information |
| waist_circumference | Waist circumference | waist value | cm or in | R3 | User Entered for manual entry | Sensitive Health | Add Health Information, History | None for persistence; Clinical Specification required for interpretation | Health information |
| physical_activity_duration | Physical activity | total activity duration for selected day | minutes | R3 | User Entered for manual entry | Sensitive Health | Add Health Information, History | None for persistence; any target/interpretation requires separate approval | Health information |
| sleep_duration | Sleep | total sleep duration for selected sleep period/day | hours/minutes in UX; implementation may store integer minutes | R3 | User Entered for manual entry | Sensitive Health | Add Health Information, History | None for persistence; any target/interpretation requires separate approval | Health information |

### Structural validation approved for the first batch

- The selected record type must be one of the approved types above.
- The selected unit must be one of the approved units for that type.
- Blood pressure requires both systolic and diastolic values.
- Blood glucose requires one approved descriptive context value.
- A lipid-panel record requires at least one supported lipid component.
- Physical activity stores duration for a selected calendar day.
- Sleep stores duration for a selected sleep period/day.
- Numeric parsing, required-field checks, supported-unit checks, date/time parsing and ownership checks are structural validation.
- **No clinical plausibility range, threshold, category or target is approved by this dictionary.**
- Original entered value/unit must remain traceable if deterministic unit conversion is added later.

## F. Health information presentation categories

Approved user-facing Add Health Information categories:

- **Health readings**
- **Body measurements**
- **Daily habits**

These remain presentation/organisation categories. The specific first-batch fields approved under them are defined in Section E above; additional fields require normal approval and Data Dictionary update.

## G. Provenance

Approved provenance concepts:

| Provenance | Meaning | Approved use |
| --- | --- | --- |
| User Entered | Information manually provided by the user | Approved |
| Imported | Information received from a separately approved external source/integration | Category approved; no integration approved by implication |
| Verified | Information that passed a separately approved verification process | Must never be inferred from user entry/confirmation alone |
| System Derived | Deterministically generated from approved inputs | Allowed only for approved derivations; clinical derivations require Clinical Specification |

### Document-assisted entry

The product must retain enough source metadata to distinguish:
- manual user entry; and
- information extracted from a user-uploaded health document.

User confirmation of extracted information **does not make it clinically Verified**.

The exact document provenance label/source-artifact linkage remains TBD before document-upload implementation.

## H. Derived/system data

Approved conceptual derived information may include:

| Derived concept | Class | Source | Clinical boundary |
| --- | --- | --- | --- |
| profile_completion_status | D | Approved profile state | Non-clinical |
| summary_readiness_status | D | Approved inputs/completeness rules | Clinical dependency if used to gate clinically governed output |
| deterministic_unit_conversion | D | Approved value/unit | Clinical use only under approved specification where relevant |
| descriptive_trend_calculation | D | Approved longitudinal values | Must remain descriptive unless Clinical Specification assigns meaning |
| age | D | Exact date of birth | Clinical use only where approved |
| current_monitoring_state | D | Approved product state | No invented clinical interpretation |
| clinically_governed_output | D/R4 | Approved inputs + Clinical Specification | Must retain version/input traceability |

## I. Clinical output traceability envelope

No clinical output logic is approved by this dictionary. For any future approved Risk Awareness Summary/output, retained traceability must include:

- associated user;
- generation timestamp;
- Clinical Specification / rule version;
- relevant input set/snapshot;
- output category/categories;
- approved next-step guidance where applicable;
- required limitations;
- current/superseded state.

Historical clinically governed outputs must not be silently edited.

## J. Reminder and communication data

Approved conceptual data may include:

| Concept | Class | Sensitivity | Notes |
| --- | --- | --- | --- |
| reminders_enabled | R3/O | Personal | General reminders only |
| reminder_preferences | R3/O | Personal | Exact preference fields/cadence remain TBD |
| communication_preferences | R3/O | Personal | Exact channels/fields remain TBD |
| reminder_delivery_history | S | Personal/Internal | Only where operationally necessary |
| reminder_interaction_history | S | Personal/Internal | Only where operationally necessary |

General reminder preferences are separate from clinically governed safety/escalation behavior.

## K. Analytics and telemetry boundary

Allowed examples:
- feature usage;
- onboarding completion;
- funnel abandonment;
- reminder interaction;
- technical performance;
- error rates;
- non-sensitive engagement events.

Not allowed in general analytics by default:
- raw health measurements;
- diagnosis information;
- sensitive questionnaire responses;
- risk scores;
- clinical classifications;
- clinical summaries.

Ordinary logs must avoid:
- raw health measurements;
- clinical summaries;
- passwords/password-equivalent secrets;
- OTP values;
- access tokens;
- unnecessary sensitive questionnaire responses.

Any exception involving Sensitive Health data requires explicit product, privacy, and security approval.

## L. Data explicitly not approved for V1 collection

Classification: **X**

- national identification numbers;
- Bank Verification Number;
- passport/government identity details;
- financial-account credentials;
- precise continuous location;
- residential address;
- contact/address-book data;
- private social-media data;
- employer or insurer records;
- caregiver data;
- clinician records;
- emergency-contact information;
- comprehensive medication data without a separately approved clinical purpose;
- wearable-device data through an integration;
- connected-device data through an integration;
- laboratory data imported directly from external systems;
- electronic health record data.

## M. Data quality rules

Every implemented field must define applicable:
- required vs optional status;
- format validation;
- allowed values;
- unit rules;
- timing rules;
- plausibility validation **only where approved**;
- unknown handling;
- prefer-not-to-answer behavior where applicable;
- missing-data behavior;
- correction behavior.

**Unknown, not provided, and no are not clinically equivalent unless an approved specification explicitly defines them as equivalent.**

## N. Time and historical context

For longitudinal/clinically relevant information, distinguish where applicable:
- when the event/measurement/health fact occurred;
- when the user entered it;
- when it was corrected/updated;
- when a clinical result was generated.

Exact timestamp-storage implementation remains technical design.

## O. Retention status

Exact retention periods are **not yet approved**.

Before production launch, retention/deletion rules must be defined for:
- account/authentication;
- profile;
- health profile;
- measurements;
- clinical outputs;
- consent/acknowledgements;
- audit;
- analytics;
- operational/security logs.

No product copy or implementation may promise immediate/complete deletion until behavior is confirmed against privacy, legal, security, audit, backup and clinical-governance requirements.

## P. Implementation gate

A production health-data field may be implemented only if:

1. it appears in this Data Dictionary or an approved successor;
2. its approved purpose is clear;
3. its classification is assigned;
4. sensitivity is assigned;
5. source/provenance behavior is defined;
6. validation/missing/correction behavior is defined;
7. owner/access behavior is defined;
8. retention category is defined before production;
9. any required Clinical Specification exists;
10. adding it does not silently expand scope.

## Q. Currently blocked field groups

The following remain **TBD / not approved for implementation**:

- additional health-information fields beyond the approved first persistence batch;
- exact health-profile questionnaire;
- structured food-tracking fields;
- additional measurement-specific context fields beyond the approved blood-glucose context;
- clinical plausibility ranges;
- clinical thresholds/risk categories;
- risk formulas;
- clinical escalation rules;
- medication fields/logic;
- exact document-upload provenance label/linkage;
- raw-document retention/deletion policy;
- exact retention periods;
- exact deletion implementation;
- internal admin role/permission matrix;
- final API schema;
- final database schema.

**PRD Sync Status: Completed.** The Master PRD was updated on 10 November 2026 for the approved first V1 manual health-information persistence inventory; this Data Dictionary now reflects that approved scope.
