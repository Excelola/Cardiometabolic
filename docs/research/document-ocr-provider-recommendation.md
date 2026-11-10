# HILERA Document OCR Provider Research

## Status

Artifact type: Research / recommendation
Status: Not approved for integration
Purpose: Recommend the privacy-first OCR candidate for the approved health-document upload flow

## Recommendation

Preferred candidate for the first provider-backed prototype: Google Cloud Document AI Enterprise Document OCR in an EU processing location.

Use it only as an OCR/text-layout provider. HILERA must retain its own allowlist mapping, structural validation, candidate review, and canonical save logic.

## Why this is the preferred candidate

### 1. Stronger default data-use posture

Google Cloud states that Document AI customer documents and predictions are not used to train Document AI models. For synchronous operations, document data is processed in memory and is not persisted to disk; request metadata may still be logged.

Official source:
https://docs.cloud.google.com/document-ai/docs/security

### 2. EU processing location available

Document AI supports EU multi-region processing, and its setup documentation states that when the EU location is selected, data and processing remain in the EU location for that service.

Official sources:
https://docs.cloud.google.com/document-ai/docs/regions
https://docs.cloud.google.com/document-ai/docs/setup

This is still a cross-border transfer from Nigeria and therefore requires Nigerian privacy/DPO review and appropriate transfer safeguards before production.

### 3. Low OCR cost for a confirmation-based workflow

Current published Enterprise Document OCR pricing is approximately USD 1.50 per 1,000 processed pages for the first 5 million pages per month.

Official source:
https://cloud.google.com/document-ai

This means a small MVP can test extraction accuracy at low per-page cost before considering more expensive structured processors.

### 4. Suitable document capability

Enterprise Document OCR supports PDFs and common image formats and returns text/layout information suitable for HILERA's own allowlist mapper.

Official source:
https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr

## Alternatives reviewed

### Azure Document Intelligence

Strengths:
- same-region temporary storage;
- delete-analyze-result API;
- strong document-processing feature set;
- free tier for testing.

Privacy trade-off:
- Microsoft documents that submitted data and analysis results are stored temporarily for 24 hours after analysis completion unless deleted earlier.

Official source:
https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/document-intelligence/data-privacy-security

Assessment: viable second choice, especially if HILERA later standardizes on Azure, but Google has a cleaner synchronous non-persistence posture for the first privacy-sensitive health-document prototype.

### Amazon Textract

Strengths:
- mature OCR/forms/tables/queries;
- low OCR cost;
- broad regional availability;
- HIPAA eligible.

Privacy concern:
- AWS states in the Textract FAQ that document/image inputs may be stored and used to provide, maintain, improve and develop Textract and related ML/AI technologies.

Official source:
https://aws.amazon.com/textract/faqs/

Assessment: do not prefer for HILERA's first health-document pipeline unless contractual/service controls establish a data-use posture acceptable to HILERA's privacy review.

## Recommended V1 extraction approach

Phase 1:
- Google Enterprise Document OCR;
- EU processor location;
- synchronous processing where document/page limits permit;
- HILERA-owned deterministic allowlist mapper;
- supported targets only: blood pressure, blood glucose, HbA1c, lipid components, weight, waist circumference;
- all output remains candidate data until explicit user confirmation.

If OCR + deterministic mapping accuracy is insufficient:
- evaluate Google Form Parser or a custom extractor;
- do not move to generative extraction or LLM interpretation by implication;
- require a new privacy/cost/accuracy review before changing processor type.

## Limits and product constraints

Google currently documents Enterprise Document OCR synchronous limits lower than HILERA's proposed 25-page upload maximum in some modes.

Therefore the implementation should either:
- cap synchronous first-version PDFs to the provider-supported limit; or
- route longer allowed PDFs through a reviewed asynchronous flow.

Recommendation for fastest first implementation: align the initial PDF maximum to 15 pages for the synchronous prototype, then expand only after the async workflow is implemented and tested.

This differs from the earlier architecture draft recommendation of 25 pages and therefore requires Product Owner approval before implementation.

## Required commercial/privacy gates

Before integration:
- Product Owner approves Google Document AI as the provider;
- budget approval;
- Google Cloud account/project and billing established;
- EU processor location configured;
- DPA/subprocessor/cross-border review;
- DPIA updated;
- service account permissions minimized;
- secret/key handling defined;
- no production credentials on developer machines;
- provider calls verified not to expose health content in logs;
- deletion/temporary-storage behavior tested.

## PRD Sync Status

Not Required for this research recommendation.

Provider approval and any user-visible file/page constraints may require PRD/Data Dictionary/technical-spec sync before implementation.