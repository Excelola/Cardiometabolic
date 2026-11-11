# Health-document upload: controlled development implementation

## Authority and status

This implements the approved V1 upload, extraction candidate, review, confirmation and Document Assisted provenance flow. The Master PRD and governed Data Dictionary remain product authority. This code is for controlled development and synthetic testing. Real-user production upload remains **disabled** until the production gates below are resolved.

## Flow

`/app/measurements/new` links to `/app/documents/upload`. A dedicated Node upload Route Handler requires an authenticated session, trusted origin and session-bound CSRF header. It bounds the whole multipart request to 10 MiB plus 64 KiB framing allowance without changing other Server Action limits. It accepts exactly one PDF, JPEG or PNG. File size is limited to 10 MiB; PDFs are parsed with PDF.js and limited to 15 pages; encrypted or unreadable PDFs are rejected. Images undergo signature, structural and bounded decode checks with Sharp (25 million input pixels maximum). The original filename is neither stored nor used as a key.

The synchronous path holds the file bytes in process memory. It validates and scans before OCR, then zeroes the buffer in a `finally` block. No raw bytes or unrestricted OCR text are written to PostgreSQL, disk, URLs, analytics or application logs. For development, `HILERA_DOCUMENT_DEV_FAKE_OCR=ready` or `empty` selects deterministic synthetic scanner and OCR adapters only when `NODE_ENV` is not `production`; `empty` exercises the no-supported-data state. The production path has no approved scanner implementation and fails closed before processing. The `MalwareScanner`, `TemporaryDocumentStore`, and `DocumentOcrProvider` interfaces isolate the future production decisions.

The Google Cloud Document AI adapter uses the official Node client and the EU endpoint, and accepts only an EU processor resource. It returns normalized page text. It is not selected by the current production upload configuration. The deterministic mapper recognizes only label-anchored supported fields: blood pressure, blood glucose, HbA1c, lipid components, weight and waist. Unsupported text is discarded in memory. The mapper does not infer medical meaning or save a canonical record.

The review route is owner-scoped. Candidates are temporary and display as possible information. A user must explicitly choose Include or Remove for each candidate, can edit included items' approved structural fields, and must enter the date and time taken. The browser converts the local datetime to UTC as in manual health entry. The confirmation Server Action repeats authentication, origin and CSRF checks. A database transaction locks the owned upload, rejects expiry or finalization, rebuilds each selected record using the same `parseHealthForm` structural validator as manual entry, inserts through the existing health repository, marks the upload confirmed and deletes its candidate rows. The row lock prevents duplicate canonical records on concurrent confirmation. Removed candidates are discarded. Confirmation never means clinically Verified.

## Schema and lifecycle

Migration `0002_health_document_upload.sql` adds the `document_assisted` provenance enum value and two temporary tables. `health_document_uploads` contains owner, status, verified MIME, byte count, page count, creation/expiry/finalization times and a bounded error category. `health_document_candidates` holds only typed approved candidate components, units/context and optional source page/confidence. Provider confidence, if present, is extraction confidence only. The raw file and OCR free text are absent from both tables.

The upload expires no later than 24 hours after creation. Confirmation and cancellation delete candidate rows immediately. `cleanupExpiredDocumentUploads` deletes expired upload rows and their candidates in an idempotent transaction with `SKIP LOCKED`; it can be invoked by a future reviewed scheduler. No scheduler or queue provider is inferred here. Because no durable raw-file store is used in this controlled flow, no raw-file deletion job is needed. A production storage adapter would require its own retryable deletion and audit plan before activation.

## Security and operational boundaries

- All reads and mutations derive ownership from the server session; browser IDs are lookup keys only.
- Upload and confirmation reject foreign origins and invalid CSRF proof using the existing auth protection.
- Scanner infected/unavailable results stop processing before OCR. There is no production no-op scanner.
- Errors shown to users are bounded categories. Provider responses, credentials, full OCR text, filenames, health values and SQL details are never surfaced.
- No raw document or candidate value is included in normal observability. Aggregate counts/categories may be introduced through a separately reviewed observability path.
- The upload route reads a bounded multipart body; the actual file cap remains 10 MiB. Other Server Actions retain their default transport limit.

## Production-launch gates

An approved malware scanner, raw-file handling/storage strategy, Google project and billing, EU processor configuration, DPA/subprocessor review, Nigerian DPO/legal review, DPIA, cross-border safeguards, secret management, provider cost monitoring, operational cleanup scheduling, and full retention/deletion controls are still required. Do not activate real-user document processing or claim production readiness before those gates are satisfied.

## PRD Sync Status

Completed before implementation for the approved V1 document flow, limits, provenance, lifecycle and OCR provider. This document records technical implementation only.
