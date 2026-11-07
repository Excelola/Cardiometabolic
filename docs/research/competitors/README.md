# HILERA competitor intelligence

Research date: 7 November 2026 (Africa/Lagos). Status: Research only.
Baseline: merged frontend commit `9f7e3f4ab0789dd77e95387d99a61721ea7e2356`; approved implementation `99005b9f344a836cbc105685c85e6bb960c26292`.
Branch: `research/competitor-intelligence`.

## Purpose and selection

This is a fast public-source research batch, not a product implementation or a completed authenticated usability audit. It identifies patterns worth investigating and separates existing approved delivery gaps from new scope.

| Product | Selection rationale | Intended learning |
| --- | --- | --- |
| Guava | Direct consumer access and documented web experience | Primary deep dive: entry, current information versus history, records, search, trends, summaries and user controls |
| Omada | Structured longitudinal cardiometabolic programmes | Education, goals, reminders, engagement and return journeys |
| Dario | Multiple cardiometabolic areas in one offering | Unified organisation, tracking and reporting |

These are contextual reference choices, not a ranked global market census or a measured 90–100% feature match. No commercial viability, clinical efficacy, or Nigeria-market success is inferred from feature availability.

## Read in order

1. [Evidence register and limitations](evidence/README.md)
2. [Guava audit](01-guava-product-audit.md)
3. [Omada audit](02-omada-product-audit.md)
4. [Dario audit](03-dario-product-audit.md)
5. [Feature matrix](04-competitor-feature-matrix.md)
6. [Opportunity map](05-hilera-opportunity-map.md)
7. [Decision backlog](06-proposed-product-decisions.md)

## Authority and current implementation

The [Google Drive Master PRD](https://docs.google.com/document/d/184mETZUCAla2V8LaEwkMAfm4AkicImZ-OFmVoZNS22A/edit) is authoritative. It was read through the Drive connector on the research date; provider metadata reports last modification on 21 September 2026. Sections 1–6 identify themselves as approved. Only bounded product references are recorded here; the full PRD is not duplicated.

The [frontend architecture](../../frontend-architecture.md), [design QA](../../../design-qa.md), and inspected source describe implemented state. GitHub/code does not supersede the PRD. The current application is a synthetic frontend foundation: no functioning authentication, persistence, health APIs, clinical calculations or production monitoring.

| PRD baseline | Delivery distinction |
| --- | --- |
| §§4.4–4.8: email/password through HILERA backend, consent, profile, baseline manual capture | Shells exist; backend/security contracts, consent detail and approved measurement inventory remain dependencies |
| §§4.10–4.17: dashboard, history, trends, education, next steps, reminders, settings, minimum administration | Approved at capability level; many are absent or static in current code |
| §§4.18–4.22: progress summaries, non-clinical goals, export, contextual education/search, dedicated admin UI | P1; not automatically first-release commitments |
| §§5.3–5.4, 5.22: progressive setup, save/resume, returning-user continuity | Approved behaviour is not yet implemented by the static Continue/Save for later links |
| §§6.9–6.23: measurement governance, provenance, access, corrections and historical context | Detailed data dictionary, security and clinical specifications remain necessary |

Competitor-driven refinements to an approved capability still require review when they introduce fields, states, permissions, interpretation or business rules.

## Evidence rules

- **OBSERVED** means directly retrieved public documentation or inspected repository behaviour. Every competitor claim carries a source ID. Vendor claims are attributed, not independently certified.
- **INFERENCE** is an explicitly labelled hypothesis about usefulness, friction, retention or architecture. It is not a tested outcome.
- **HILERA RELEVANCE** explains the connection to this product and its approved core loop.
- **CANDIDATE IDEA** describes an unapproved refinement or expansion.
- **DECISION STATUS** uses the vocabulary below. Approval status and evidence confidence are different.
- Unknown means unverified, not absent. Documented does not mean tested in a signed-in account.
- Browser and native-app behaviour are not interchangeable. Older help screenshots may not match a current release.
- No private account, purchase, patient data, authenticated session, or clinical case was used. No competitor source code was extracted.
- Sources are linked with access date and scope. No screenshots were captured in this batch; the evidence directory contains a source register and verification queue.
- Do not transplant clinical thresholds, medical fields, labels, scores or recommendations from competitor material. Do not copy proprietary prose, assets or layouts wholesale.

## Decision-status vocabulary

Only: Research only; Candidate; Requires product approval; Requires clinical review; Requires privacy/security review; Deferred; Rejected; Approved.

Approved requires explicit product-owner approval or an exact approved PRD reference. No new backlog proposal is marked Approved. A recommended rejection or deferral is distinguished from a recorded owner decision. The user explicitly deferred guided assessment and prohibited paid assessment integrations for this sprint.

## Clinical and privacy boundaries

No diagnosis, differential diagnosis, symptom probability, medical thresholds, triage, escalation, treatment or medication rules are authored here. Clinical changes require an approved versioned Clinical Specification, responsible review and relevant safety tests. LLMs cannot independently determine diagnoses or risk scores.

Identity and health information are sensitive. No real records, credentials, screenshots of private data, analytics payloads or secrets belong in these notes. Future collection, export, sharing, retention and notifications require purpose limitation, consent where appropriate, least privilege and technical review. Competitor privacy claims do not prove security or establish HILERA compliance.

**Symptom logging and guided assessment are separate.** Logging would create a new sensitive-data capability and remains an unapproved candidate. Guided assessment/care navigation is Deferred; no diagnosis-related workflow or external assessment integration is proposed for current implementation.

## Batch implementation strategy

Research
→ Analyse
→ Compare with HILERA
→ Identify candidate opportunities
→ Bundle related opportunities
→ Product-owner approval
→ PRD sync
→ Technical specification
→ Codex implementation
→ Testing
→ Pull Request
→ Deployment
→ Measurement

PRD sync is an explicit gate: update material approved changes through product governance, or document why existing requirements already cover the bundle. Do not silently edit the Master PRD.

| Bundle | Appropriate contents | Boundary |
| --- | --- | --- |
| FAST | UI, navigation, layouts, history presentation, empty states, education presentation, information architecture, existing approved workflows | Only presentation using approved information. Functional save/resume or new stored preferences are not FAST merely because the screen is simple |
| MEDIUM | Database changes, APIs, authentication, new stored user data, new product states | Review contracts, permissions, migrations, retention and tests before implementation |
| CONTROLLED | Clinical calculations, risk interpretation, symptom assessment, escalation, diagnosis-related or treatment-related behaviour | Separate clinical specification and approval; prohibited V1 behaviours remain prohibited |

Prefer cohesive change bundles and one reviewable release per related outcome. Never combine unrelated high-risk clinical changes for speed. Start with a presentation proposal around the existing journey; do not begin implementation from this document.

Effort/value/cost labels are qualitative research judgments, not scores or quotes: High value = directly supports core-loop completion or trust; Moderate = supports a secondary task; Low = weak initial fit. Low effort = bounded presentation; Moderate = cross-screen state/content work; High = services, permissions or clinical dependencies. Operating costs are described as infrastructure, editorial, provider or human-service obligations; no vendor budget is invented.

## Research outcome and limitations

Best initial direction: retain manual entry, email/password, the approved HILERA brand, honest empty states and exact workflow/provenance labels. Investigate a coherent history/detail experience, progressive next actions and approved education. Treat goals/export as P1 delivery choices. Keep devices, broad records ingestion, AI interpretation and guided assessment outside the current implementation batch.

This batch does not establish task success, retention gains, complete accessibility, backend design or clinical validity. See the evidence queue before making those claims.

PRD Sync Status: Not required for this research-only change. Approval of a material candidate may require sync in the areas recorded in the backlog.
Technical Documentation Status: Research documentation added; implementation architecture unchanged.

## Confirmed classification and decision package

The owner-confirmed baseline for this continuation is authoritative: Discover → Join → Set Up → Establish Baseline → Understand → Monitor → Continue. Returning users resume the relevant product state, retain history, add information, review history/trends/current approved summary, and see incomplete actions/reminders. Actual persistence is not yet implemented.

| Classification | Meaning | Examples in this package |
| --- | --- | --- |
| A | APPROVED CAPABILITY, IMPLEMENTATION NOT COMPLETE | Real capture/history, education, reminders, continuity, settings and own-backend email/password |
| B | APPROVED CAPABILITY, UX CAN BE IMPROVED | History hierarchy, repeat-entry presentation, dashboard hierarchy, consistent navigation |
| C | P1 ALREADY APPROVED, NOT CURRENT P0 | Simple goals, user-facing export/shareable summary, contextual education/search |
| D | GENUINELY NEW CANDIDATE REQUIRING PRODUCT APPROVAL | Symptom logging; new search collection or functionality beyond approved history |

A and B may coexist. Clinical Risk Awareness Summary remains conditional on an approved Clinical Specification. Descriptive charts/lists/comparisons are distinct from clinical interpretation. Reminder cadence/channel remain deferred. No unconfirmed P2 classification is invented.

[Bundle 1](05-hilera-opportunity-map.md#recommended-hilera-mvp-expansion-bundle-1) contains HIL-RD-001 history IA, 002 retrieval, 003 repeat entry, 004 dashboard hierarchy, 005 education-to-action and 006 shared navigation. These are proposed refinements, not new approvals. Candidates 1 and 3–6 can stay within P0 presentation. Candidate 2 requires a scope decision before functionality is added. Full approval statuses and conditional PRD impacts are canonical in the [backlog](06-proposed-product-decisions.md).

## Independent implementation

HILERA may learn from observable workflows and general product patterns. Do not copy competitor source code, proprietary artwork, trademarks, proprietary written content, proprietary clinical rules, algorithms or scoring systems. Any future implementation must be independently designed and built with HILERA's identity. Source descriptions here are evidence, not licensed implementation assets.
