# HILERA Health Document Upload & Extraction Architecture — Approved Baseline

## Status

Artifact type: Technical/privacy/security architecture
Status: Approved implementation baseline on 10 November 2026
Product feature: Manual health-document upload and the material V1 constraints in this document are approved in the Master PRD.

This document approves the product-level upload limits, temporary lifecycle, Document Assisted provenance, and Google Cloud Document AI Enterprise Document OCR in EU processing as the initial OCR provider. Private object-storage and malware-scanning implementation remain controlled technical/provider decisions.

## Objective

Implement the approved flow:

Upload health document → extract candidate supported HILERA health information → user reviews/corrects → explicitly confirms → save

Only already-approved HILERA fields may become confirmed health records.

## Approved extraction targets

Candidate extraction may map only to:
- blood pressure;
- blood glucose;
- HbA1c;
- lipid panel components: total cholesterol, HDL, LDL, triglycerides;
- weight;
- waist circumference.

For the first upload implementation, recommendation is to limit extraction to health readings and body measurements commonly present on reports.

No food, medication, diagnosis, symptom, narrative medical-history, or unapproved field extraction may be persisted.

## Core safety rule

OCR/extraction output is candidate data, not confirmed health data.

Candidate values:
- are not saved into canonical health-record tables;
- are not clinically interpreted;
- are not labelled Verified;
- may be wrong;
- must be reviewed by the user.

Only explicit user confirmation writes supported structured values through the existing health-record service.

## Approved architecture direction

Browser → short-lived authenticated upload authorization → private temporary object storage → extraction job record in PostgreSQL → provider adapter/extractor → allowlist mapper → temporary candidate table → authenticated review screen → explicit confirmation → existing health-record creation service → cleanup.

Avoid a new microservice for V1. If extraction cannot complete within a normal web-request lifetime, use a small database-backed job worker in the existing deployment.

## Approved first-version upload constraints
- PDF, JPEG/JPG, PNG only;
- one file per upload;
- maximum file size: 10 MB;
- maximum PDF length: 15 pages for the initial synchronous flow;
- reject password-protected/encrypted PDFs in V1;
- reject archives and Office documents in V1;
- verify MIME type server-side;
- use a random object key, never the user filename as storage path.

## Malware/content safety

Before extraction:
- validate size and MIME;
- scan with an approved malware control;
- reject malformed files safely;
- resource-bound PDF/image parsing;
- guard against decompression/resource exhaustion;
- never execute macros/scripts;
- never expose uploaded files through public URLs.

## Temporary storage

Raw documents are Sensitive Health data.

Required baseline:
- encrypted private object storage;
- server-side access only;
- short-lived signed access where necessary;
- no public bucket/object ACL;
- no browser localStorage/sessionStorage persistence;
- no file content in logs or analytics.

Approved lifecycle:
- delete raw document within 24 hours of confirmation, cancel, or failure;
- delete abandoned uploads automatically;
- no permanent raw-document library in V1.

## Extraction provider boundary

Create an internal provider adapter so the domain layer does not depend directly on one vendor's API schema.

Provider selection is controlled because it affects Sensitive Health data transfer, cross-border processing, data residency, subprocessors, retention/training policy, security, cost, latency, and availability.

Approved initial OCR provider: Google Cloud Document AI Enterprise Document OCR using EU processing. Integration may proceed for controlled development/testing, but real-user production credentials/use remain gated by privacy/security/DPO/DPIA/cross-border/contractual review.

## Cross-border/privacy review

Before an external OCR/document-AI provider receives a health document:
- identify processor/subprocessor locations;
- determine transfer safeguards under Nigerian data-protection requirements;
- verify whether provider uses customer content for model training;
- verify provider retention/deletion behavior;
- execute DPA/contract review;
- complete/update DPIA;
- restrict data sent to the minimum necessary.

## Candidate data model

Use separate temporary entities, not canonical health tables.

Recommended conceptual entities:

health_document_uploads:
- id;
- owner_user_id;
- status;
- private object key/reference;
- original filename metadata if retained;
- verified MIME type;
- byte size;
- page count where known;
- created_at;
- expires_at;
- provider request reference;
- processing/error state.

health_document_candidates:
- upload_id;
- candidate id;
- mapped approved HILERA field/type;
- candidate value;
- candidate unit;
- candidate context;
- candidate source page/region where available;
- provider confidence metadata where available;
- user review state.

Provider confidence is not clinical confidence and must not be presented as medical accuracy.

## Allowlist mapper

Only approved Data Dictionary fields may pass into candidate persistence.

Unsupported content must not be automatically added to schema, trigger product behavior, or enter analytics.

Examples that must not be silently persisted:
- diagnoses;
- medications;
- clinician names;
- addresses;
- patient identifiers beyond approved HILERA fields;
- narrative medical history;
- unrelated laboratory results.

## User review UX

Review screen must state that possible health information was found and that every item must be checked before saving.

For each candidate:
- show source page/context where safely useful;
- allow edit;
- allow remove;
- require explicit inclusion/confirmation.

Confirmation means the user says the value looks correct; it does not create clinical verification.

## Confirmation transaction

On confirmation:
1. authenticate the user;
2. verify upload/candidates belong to that user;
3. validate candidate is an approved HILERA type;
4. run the same structural validation as manual entry;
5. create canonical health records through the existing service;
6. record approved document-assisted provenance/source metadata;
7. mark candidates confirmed;
8. schedule raw-document and temporary-candidate cleanup.

Do not create a second canonical health validation path.

## Approved provenance

Canonical provenance: `document_assisted` / user-facing **Document Assisted**.

Do not label this data Verified. Do not label it Imported. User confirmation means only that the candidate looks correct to the user; it does not establish clinical verification.

## Error behavior

Safe public categories:
- unsupported file;
- file too large;
- unreadable/corrupt;
- extraction unavailable;
- no supported HILERA information found;
- review session expired;
- temporary service problem.

Do not return raw provider errors, stack traces, object-storage keys, provider credentials, or full extracted document text.

## Observability

Allowed examples:
- upload count;
- byte-size bucket;
- processing time;
- success/failure category;
- candidate-count aggregate;
- provider latency/error category;
- cleanup success/failure.

Forbidden by default:
- raw document;
- extracted free text;
- health values;
- diagnosis/medication text;
- signed storage URLs;
- provider secrets.

## Testing

Use synthetic documents only.

Required tests include valid supported files, MIME mismatch, oversized/corrupt file, ownership isolation, direct object-access rejection, expired upload, provider timeout/failure, unsupported extracted-field rejection, approved candidate mapping, edit/remove/confirm, idempotent confirmation, cleanup, and health-canary log checks.

## Production gates

Before provider-backed coding:
- approved retention/deletion matrix — completed;
- approved file constraints and Document Assisted provenance — completed;
- Google Document AI OCR provider selection — completed for controlled implementation; private object-storage provider remains to be selected;
- complete DPA/subprocessor/cross-border review;
- update DPIA;
- approve malware-scanning approach;
- approve cost budget;
- design cleanup/failure monitoring.

## PRD Sync Status

Completed on 10 November 2026 for upload limits, Document Assisted provenance, raw-document/candidate lifecycle, retention policy, and Google Document AI OCR provider selection.