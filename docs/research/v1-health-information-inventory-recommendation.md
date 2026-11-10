# HILERA V1 Health Information Inventory — Recommendation for Product Approval

## Status

**Artifact type:** Research / product recommendation  
**Status:** Not approved for implementation  
**Purpose:** Resolve Data Dictionary decision DD-001 with the smallest useful V1 inventory  
**Clinical behavior:** None. This recommendation defines candidate data fields only. It does not define thresholds, risk categories, diagnosis, treatment, medication advice or escalation.

## Evidence basis

The recommendation is intentionally small and aligns with HILERA's approved cardiometabolic positioning.

Authoritative reference patterns:
- American Heart Association Life's Essential 8 groups cardiovascular health around blood pressure, blood lipids, blood sugar, weight, diet, physical activity and sleep (plus nicotine exposure).
- WHO STEPS identifies key biological/metabolic NCD risk factors including raised blood pressure, raised blood glucose, abnormal blood lipids and overweight/obesity, alongside behavioral factors such as unhealthy diet and physical inactivity.
- WHO NCD guidance similarly identifies raised blood pressure, blood glucose, blood lipids and overweight/obesity as major metabolic risk factors.
- Current ADA 2026 cardiovascular-risk guidance continues to emphasize blood pressure, lipids, glucose/diabetes-related measures, weight and lifestyle behavior.

References:
- https://www.heart.org/en/healthy-living/healthy-lifestyle/lifes-essential-8
- https://www.who.int/teams/noncommunicable-diseases/surveillance/systems-tools/steps/
- https://www.who.int/news-room/fact-sheets/detail/noncommunicable-diseases
- https://diabetesjournals.org/care/article/49/Supplement_1/S216/163933/10-Cardiovascular-Disease-and-Risk-Management

These references inform field relevance only. HILERA must not copy external scoring systems, thresholds or treatment rules by implication.

## Recommendation: Fast V1 inventory

### A. Health readings

#### HR-001 Blood pressure

Store as one reading event with:
- systolic pressure;
- diastolic pressure;
- unit: mmHg;
- occurred_at;
- provenance;
- entered_at;
- owner;
- correction/audit metadata.

Optional measurement context should remain minimal until separately approved. No hypertension classification or threshold behavior is approved by this field.

**Recommendation:** Include in V1.

#### HR-002 Blood glucose

Store:
- glucose value;
- unit: mmol/L or mg/dL;
- user-selected measurement context:
  - fasting;
  - before meal;
  - after meal;
  - random/other;
  - not specified;
- occurred_at;
- provenance;
- entered_at;
- owner;
- correction/audit metadata.

The context labels are descriptive capture metadata. They do not by themselves create interpretation rules.

**Recommendation:** Include in V1.

#### HR-003 HbA1c

Store:
- HbA1c value;
- unit: %;
- occurred_at;
- provenance;
- entered_at;
- owner;
- correction/audit metadata.

No target/risk interpretation is approved.

**Recommendation:** Include in V1 because it provides a distinct longer-term glycaemic measure and commonly appears in laboratory results.

#### HR-004 Lipid panel

Support an entry containing one or more of:
- total cholesterol;
- HDL cholesterol;
- LDL cholesterol;
- triglycerides;
- unit: mmol/L or mg/dL for each applicable value;
- occurred_at;
- provenance;
- entered_at;
- owner;
- correction/audit metadata.

At least one supported lipid component must be present for the entry to be valid.

Do not derive or interpret non-HDL/ratios until separately approved.

**Recommendation:** Include in V1.

### B. Body measurements

#### BM-001 Weight

Store:
- weight value;
- input unit: kg or lb;
- occurred_at;
- provenance;
- entered_at;
- owner;
- correction/audit metadata.

Canonical internal unit/conversion may be defined technically using an approved deterministic conversion.

No weight-status/BMI interpretation is approved.

**Recommendation:** Include in V1.

#### BM-002 Waist circumference

Store:
- waist value;
- input unit: cm or in;
- occurred_at;
- provenance;
- entered_at;
- owner;
- correction/audit metadata.

No waist-risk threshold or interpretation is approved.

**Recommendation:** Include in V1.

### C. Daily habits

#### DH-001 Physical activity duration

Store:
- total activity minutes for the selected day;
- date;
- provenance;
- entered_at;
- owner;
- correction/audit metadata.

Do not score the activity against a recommended target in persistence.

**Recommendation:** Include in V1.

#### DH-002 Sleep duration

Store:
- total sleep duration in hours/minutes for the selected sleep period/day;
- date;
- provenance;
- entered_at;
- owner;
- correction/audit metadata.

No sleep-quality or clinical interpretation is approved.

**Recommendation:** Include in V1.

#### DH-003 Food tracking

**Recommendation: Defer structured food fields from the first persistence batch.**

Reason:
- "food" is part of HILERA's approved product description, but a useful structured food model can quickly create large data collection, cultural-localisation and interpretation complexity.
- A free-text food diary would create broad Sensitive Health/personal data with weak trendability and overcollection risk.
- A simplistic "healthy/unhealthy" field would create implicit interpretation without an approved nutrition model.

For speed and data minimisation, first implement the measurable daily habits above (activity and sleep), then approve a Nigeria-relevant structured food check-in separately.

This is a sequencing recommendation, not removal of food from HILERA's broader V1 direction.

## Explicitly not recommended for the first manual-persistence batch

Do not add by implication:
- heart rate;
- oxygen saturation;
- body temperature;
- body-fat percentage;
- height;
- BMI as a stored user-entered measurement;
- medication tracking;
- smoking/nicotine tracking;
- alcohol tracking;
- symptom tracking;
- diagnoses;
- emergency information;
- detailed calorie/macronutrient logging;
- wearable data;
- direct laboratory integration.

Some may become useful later, but each requires a separate approved purpose and Data Dictionary entry.

## Required vs optional

For **Add Health Information**, none of the health readings/body measurements/daily-habit entries above should be globally required for every user.

Recommendation:
- each entry type is optional to the user;
- once a user chooses an entry type, its structural fields are required as defined above;
- onboarding/Risk Awareness Summary readiness requirements remain a separate product/Clinical Specification decision.

This avoids turning the inventory into an unapproved clinical eligibility rule.

## Units recommendation

For user convenience:
- blood pressure: mmHg only;
- glucose: mmol/L and mg/dL;
- HbA1c: %;
- lipids: mmol/L and mg/dL;
- weight: kg and lb;
- waist: cm and in;
- physical activity: minutes;
- sleep: hours/minutes.

Technical storage may canonicalize units using deterministic conversions, but the original entered unit/value should remain traceable where needed.

## Provenance

For this first manual-persistence batch:
- manual entry -> User Entered;
- document-assisted candidate entry -> separate document-assisted source metadata once its exact mapping is approved;
- user confirmation of an extracted value does not make it Verified;
- Imported remains reserved for separately approved integrations;
- Verified requires a separately approved verification process.

## Clinical boundary

This inventory approval must **not** be interpreted as approval for:
- normal/abnormal ranges;
- hypertension/diabetes/dyslipidaemia classification;
- BMI or waist-risk categories;
- risk scores;
- diagnosis;
- treatment;
- medication advice;
- escalation;
- recommended targets.

Those require approved Clinical Specifications.

## Proposed Phase 2 implementation batch

If the Product Owner approves this inventory:

1. PRD sync the exact V1 field inventory.
2. Update the governed V1 Data Dictionary with exact fields/units/context.
3. Define typed PostgreSQL schema and migration.
4. Implement manual entry only.
5. Implement history reads and controlled correction.
6. Add descriptive trend data structures only where enough approved data exists.
7. Run two-user authorization, migration, backup/restore, privacy/logging and security tests.
8. Keep document upload/extraction as the next separate controlled package.

## Approval decision requested

Approve as one bundle:

**Health readings**
- Blood pressure
- Blood glucose
- HbA1c
- Lipid panel: total cholesterol, HDL, LDL, triglycerides

**Body measurements**
- Weight
- Waist circumference

**Daily habits — first persistence batch**
- Physical activity duration
- Sleep duration

**Deferred from first persistence batch**
- Structured food tracking, pending a Nigeria-relevant field model

If approved, this becomes a material product/data decision and requires Master PRD sync before implementation.

**Current PRD Sync Status: Not Required — recommendation only.**
