# Guava product audit

Research date: 7 November 2026. Public-source batch; no signed-in account or usability test. OBSERVED means documented unless explicitly stated otherwise. Unknown does not mean absent.

## 1. Product Overview

OBSERVED: Consumer health-information platform with browser and native apps [G01](evidence/README.md#g01). HILERA RELEVANCE: an accessible reference for organising a person's longitudinal information. It is broader than HILERA's approved cardiometabolic focus.

## 2. Target User

OBSERVED: The product supports people organising personal records and preparing for healthcare conversations [G05](evidence/README.md#g05). INFERENCE: this overlaps with HILERA's Concerned but Unsure persona; demographic or Nigerian fit has not been established.

## 3. Access / Business Model

OBSERVED: Individual signup and a free/Premium model are advertised [G01](evidence/README.md#g01). No employer enrolment is implied by that entry path. HILERA RELEVANCE: study direct access; do not adopt prices, plan gates or payment functionality.

## 4. First-Time Experience

OBSERVED: Public links lead to signup [G07](evidence/README.md#g07). The complete first-run sequence, time to value, mandatory steps and initial empty dashboard were not observed. CANDIDATE IDEA: test how little information HILERA needs before offering its approved limited dashboard.

## 5. Account / Onboarding

OBSERVED: Login/signup endpoints resolved but returned no readable form content [G07](evidence/README.md#g07). Password, verification and recovery rules are unknown. HILERA already specifies email/password, display name, exact date of birth and market context [H01](evidence/README.md#h01); no competitor field becomes approved by analogy.

## 6. Home / Dashboard

OBSERVED: The guide references Home customisation and logging [G03](evidence/README.md#g03). Exact initial card order and responsive layout remain unverified. INFERENCE: a task-centred home could reduce navigation effort. CANDIDATE IDEA: strengthen one next action within HILERA's existing state model, rather than reproduce a broad wellness dashboard.

## 7. Data Entry

OBSERVED: Manual records are supported [G02](evidence/README.md#g02); the guide describes correcting uploaded information [G03](evidence/README.md#g03). HILERA RELEVANCE: entry and correction should form a coherent journey. Do not adopt Guava's record categories, import extraction or units.

## 8. Health Records / History

OBSERVED: Records is a historical timeline with search/filtering; Profile summarises current information [G03](evidence/README.md#g03). INFERENCE: separating present context from events can make retrieval clearer. CANDIDATE IDEA: distinguish latest approved information from chronological history without creating a full medical-record repository.

## 9. Trends / Progress

OBSERVED: Insights presents charts and correlations [G04](evidence/README.md#g04). INFERENCE: visual context can help exploration, but correlation does not establish cause. HILERA should retain descriptive history and an honest insufficient-history state until approved trend semantics exist.

## 10. Education

OBSERVED: The guide links explanations of health data [G03](evidence/README.md#g03). HILERA RELEVANCE: investigate access to approved explanations near difficult terms. Do not reuse medical ranges or produce unsourced explanations.

## 11. Engagement

OBSERVED: Logging reminders are documented in the guide [G03](evidence/README.md#g03). INFERENCE: reminders may support routine, but engagement uplift was not measured. HILERA's reminder purpose is approved; cadence, channels and implementation are not.

## 12. Returning-User Experience

INFERENCE: adding information, reviewing history and preparing a visit can create a return loop; it was not tested over time. Session expiry, incomplete-task restoration and re-entry after long inactivity are unknown. HILERA's approved save/resume remains a backend delivery dependency.

## 13. Summaries / Reports / Sharing

OBSERVED: Visit Prep supports a tailored summary that can be downloaded, sent or printed [G05](evidence/README.md#g05). The FAQ documents selectable sharing and export routes [G02](evidence/README.md#g02). HILERA RELEVANCE: consider a bounded P1 export before proposing persistent recipient access.

## 14. Navigation / Information Architecture

OBSERVED: The guide names Home, Records, Profile and Sources [G03](evidence/README.md#g03). Their exact desktop/mobile arrangement is not verified. Search belongs to the records experience; a marketing-site search is not evidence of in-app search. Settings/export are documented in the FAQ [G02](evidence/README.md#g02).

## 15. Empty / Loading / Error States

Unknown: signed-in empty, loading, failed save, invalid record, expired session, permission-denied and no-results states. No fabricated screenshots or copy are supplied. CANDIDATE IDEA: specify HILERA's state catalogue independently from §§5.26–5.27, then test without simulated clinical values.

## 16. Privacy / Trust Presentation

OBSERVED: The privacy policy describes deletion through settings, data-download requests, notification controls, processing vendors and a distinction between portal tracking and public pages [G06](evidence/README.md#g06). These are policy assertions, not audited guarantees. HILERA should explain real controls and dependencies without copying compliance claims.

## 17. Observable Strengths

OBSERVED strengths in documented coverage: direct access, manual input, searchable history and visit preparation [G01–G05](evidence/README.md#g01). INFERENCE: together these may reduce record fragmentation. No measured usability advantage is claimed.

## 18. Observable Weaknesses

Observed fit limitations: US-specific provider connection scope [G02](evidence/README.md#g02) and a broad feature set. INFERENCE: breadth may distract HILERA users and enlarge sensitive-data collection. No live navigation defect, performance defect or accessibility failure was established.

## 19. Current HILERA Equivalent

OBSERVED in [H02](evidence/README.md#h02): public/auth/onboarding shells; static dashboard; generic disabled entry; synthetic history with four provenance labels; trends empty state; risk-summary readiness. No real records, search, export, settings or cross-session state.

## 20. HILERA Gap

Delivery gaps: approved history/details/correction and continuity are not functioning. Specification gaps: inventory, units, timestamps and correction rules. Candidate expansion: more elaborate current-versus-history organisation, filtering controls and tailored report selection. These are distinct from adding Guava's general health categories.

## 21. Candidate Opportunity

CANDIDATE IDEA: HIL-RD-004 progressive next action; HIL-RD-001 current/history organisation; HIL-RD-002 approved-record retrieval/correction; HIL-RD-014 honest state catalogue; HIL-RD-008 selective P1 export. See feature investigations below. None authorises new collection or clinical interpretation.

## 22. MVP Value

INFERENCE: High for comprehensible history and state handling because they support the approved core loop. Moderate for P1 export; its value depends on users actually needing it for appointments. Broad record aggregation is lower initial fit.

## 23. Development Complexity

INFERENCE: presentation refinement Low–Moderate; working save/correction/search Moderate–High once data contracts exist; secure sharing High. A static mock screen must not be estimated as a completed health-data service.

## 24. Operating-Cost Dependency

No competitor integration is needed to learn these patterns. HILERA still incurs hosting, secure storage, operations and editorial review for working features. Vendor subscriptions, OCR and AI introduce separate costs and are not recommended for this batch.

## 25. Clinical-Safety Impact

Clinical impact rises when history becomes interpretation, correlations imply causes or education becomes personalised advice. Preserve measurement provenance, missing-data honesty and approved rule versions. Do not adopt Guava ranges or diagnosis-related features.

## 26. Privacy/Security Impact

New notes, documents, recipient identities and shared links expand sensitive-data handling. Even correction needs audit rules and appropriate retention. Search terms can themselves disclose health information. Do not log them or use real records in research.

## 27. Recommendation

Study Guava first in an authorised synthetic account in a later walkthrough; prioritise HIL-RD-001–006 against the existing HILERA brand and architecture, using HIL-RD-014 for state acceptance criteria. Retain current visual work. Consider HIL-RD-008 only as a separately reviewed P1 bundle.

## 28. Decision Status

DECISION STATUS: Research only. Proposed refinements: Requires product approval. Sharing: Requires privacy/security review. Guided symptom assessment: Deferred. No new HILERA requirement is approved by this audit.

## 29. Evidence / Sources

Sources: [G01–G07](evidence/README.md#g01), [H01](evidence/README.md#h01), [H02](evidence/README.md#h02). Evidence queue records unverified onboarding, states, mobile parity, accessibility and task success. All benefit and effort judgments are INFERENCE.

## Feature investigation: Current information versus historical retrieval

| Field | Assessment |
| --- | --- |
| Observed behaviour | Documented present-versus-history separation; see audit §§8 and 14 (G03). |
| Why it works | INFERENCE: separates 'what is current?' from 'what happened?' without requiring users to remember dates. |
| Weakness | Unverified live search/error behaviour; broad categories could overwhelm a narrower product. |
| Current HILERA approach | Dashboard navigation and synthetic chronological rows; no record query or current-value service. |
| HILERA gap | Existing approved information cannot yet be stored, retrieved or corrected. |
| Candidate improvement | HIL-RD-001/HIL-RD-002: consistent record detail and bounded date/type retrieval after inventory approval. |
| User value | Find and review the intended record; distinguish latest information from older events. |
| MVP value | High; directly supports monitoring. Filter choice remains a proposal. |
| Development effort | Low–Moderate presentation; Moderate–High functional retrieval/correction. |
| Operating cost | Normal application/storage/audit operations; no competitor API required. |
| New data required | No new medical categories; proposed filters use approved metadata. Audit record detail needs specification. |
| Clinical impact | Avoid silently changing which record feeds a governed summary. |
| Privacy/security impact | Authorised queries only; no health terms in telemetry; correction history controlled. |
| Recommendation | Design with approved fields, validate retrieval tasks, then review as a cohesive history bundle. |

## Feature investigation: Preparing information for an appointment

| Field | Assessment |
| --- | --- |
| Observed behaviour | Documented curated visit output; see §13 (G05). |
| Why it works | INFERENCE: a focused view may reduce information overload during a short consultation. |
| Weakness | No measured consultation benefit or verified recipient-control test in this batch. |
| Current HILERA approach | Summary readiness shell; no export. |
| HILERA gap | Approved P1 export capability is undelivered; exact included data is undecided. |
| Candidate improvement | HIL-RD-008: preview a selected, dated export with provenance and limitations. |
| User value | Prepare for a conversation using recorded information. |
| MVP value | Moderate, P1; do not delay the P0 monitoring loop. |
| Development effort | Moderate–High for an accurate, accessible, permission-checked output. |
| Operating cost | Generation, storage if any, support and security review; no third-party sharing service assumed. |
| New data required | Selection parameters; no recipient account or new medical field by default. |
| Clinical impact | Include only approved output with its context; never imply clinician verification. |
| Privacy/security impact | Downloaded copies cannot be remotely revoked; shared-link lifecycle requires a separate decision. |
| Recommendation | Prefer a bounded export proposal before persistent external access. |

## Deep-dive synthesis: organisation, entry and retrieval

**OBSERVED:** G03 documents record organisation; G09 explains how manual and imported information enters it. G08 documents symptom logging and repeat logging; G05 describes visit preparation. These are public workflows, not a signed-in usability test. The following three-layer model is our analysis, not a claim of an exact three-tab Guava architecture.

| Analytical layer | Question answered | HILERA relevance |
| --- | --- | --- |
| Current picture | What information is currently relevant? | HIL-RD-004: existing dashboard hierarchy; recent is not clinically representative or reassuring |
| History | What was recorded and when? | HIL-RD-001/002: chronological context and retrieval within approved history |
| Trends | What changes across observations? | Existing P0 descriptive trends; insufficient history stays explicit, interpretation needs clinical approval |

**INFERENCE:** separate these questions without separating the user's underlying records. Use a consistent route back to history, preserve provenance, and make missingness visible. That is an information-design proposal, not a new clinical summary or aggregation rule.

### A. Organisation

Guava's documented consolidation provides a useful consumer reference (G03/G09). HILERA's bounded opportunity is shared record context and chronology across existing surfaces. Do not import broad medical-record categories, patient-portal connections or parsing simply because consolidation is useful. Display names, event-time semantics and record availability require HILERA specifications.

### B. Current picture versus history

The distinction above helps avoid a dashboard becoming an undifferentiated record archive. Do not infer “current” from medical stability, hide older records, or define a new clinical validity window. HIL-RD-001 and HIL-RD-004 cover presentation; clinical selection logic remains excluded.

### C. Manual entry and repeat use

G08 describes repeat symptom logging and G09 describes manual additions. The transferable hypothesis is reduced navigation and a clear path to the recorded item, not copying symptom fields. No entry duration, tap-count advantage, save latency or measured friction reduction was established. HIL-RD-003 must use only the eventual approved inventory; no prefilled previous health values, symptom inventory, voice AI or implied successful persistence.

### D. Retrieval

Documented search/filter organisation (G03/G09) supports investigating retrieval, not assuming HILERA has approved a search engine. HIL-RD-002 separates readable navigation from proposed date/type filtering and from full-text indexing, stored queries or new data collection. Evaluate with synthetic find-a-record tasks after owner approval; record success qualitatively before proposing analytics. Detail/correction is separate functional work requiring ownership, validation and audit rules.

### E. Summaries and sharing

G05/G02 document visit-oriented output and sharing choices. For HILERA, this is **C: P1 already approved, not current P0**, HIL-RD-008. Study selection, preview, dated context and limitations; do not imply current exports exist. Download formats, recipient access and links remain undecided. Do not copy AI-generated clinical summaries or add clinician accounts.

### F. Symptom logging is not symptom assessment

G08 describes recording and reviewing symptoms over time. It does not license HILERA to infer causes, urgency or a differential diagnosis. HIL-RD-009 is **Research only**, a D-class candidate involving new sensitive data; HIL-RD-010 is separately **Deferred** clinical assessment. Neither belongs in Bundle 1. Even logging requires purpose, field, retention and unexpected-disclosure policies before approval.

### Recommended research transfer

Retain Guava as the primary workflow reference, not a product to clone. Apply its general information-organisation questions to HILERA's existing core loop. Validate mobile/browser parity, entry friction, keyboard access, empty search and correction behaviour in a separately authorised research account before making live-usability claims. No such account was used in this batch.
