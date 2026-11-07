# DarioHealth product audit

Research date: 7 November 2026. Public-source batch; no signed-in account or usability test. OBSERVED means documented unless explicitly stated otherwise. Unknown does not mean absent.

## 1. Product Overview

OBSERVED: Cardiometabolic offering spans diabetes, prediabetes/weight and hypertension [D01](evidence/README.md#d01). HILERA RELEVANCE: examine coherence across related domains while retaining a prevention-oriented role.

## 2. Target User

OBSERVED: Materials address people managing chronic conditions [D01](evidence/README.md#d01). INFERENCE: treatment-focused users may need much more intensive support than HILERA's primary audience.

## 3. Access / Business Model

OBSERVED: Consumer store and membership pages exist alongside organisational offerings [D02](evidence/README.md#d02), [D03](evidence/README.md#d03). Dario is not exclusively employer-based. Exact regional access and current contract pricing were not established.

## 4. First-Time Experience

OBSERVED: Consumer marketing strongly features devices [D02](evidence/README.md#d02). Actual health-app onboarding was not inspected. Store checkout is not evidence of patient onboarding.

## 5. Account / Onboarding

Unknown: complete sign-in, device setup, consent and clinical-profile sequence. HILERA must not adopt Dario eligibility questions or authentication mechanisms without an approved decision.

## 6. Home / Dashboard

Unknown: full live dashboard layout and per-condition switching. INFERENCE: shared tracking suggests an opportunity for a consistent overview, but no exact cards or menu ordering are claimed.

## 7. Data Entry

OBSERVED: Publisher listing describes device-connected measurement recording [D04](evidence/README.md#d04). Whether all domains support manual browser entry is unverified. HILERA's manual-first strategy remains preferable for initial dependency control.

## 8. Health Records / History

OBSERVED: Publisher describes pressure and glucose records in a shared logbook [D04](evidence/README.md#d04). HILERA RELEVANCE: consistent history presentation across approved types; no expansion of its measurement inventory.

## 9. Trends / Progress

OBSERVED: Progress reporting is advertised [D01](evidence/README.md#d01), [D03](evidence/README.md#d03). Report calculations, chart options and missing-data behaviour were not validated. No clinical targets or outcome claims are copied.

## 10. Education

OBSERVED: Educational support is part of the offering [D01](evidence/README.md#d01). Specific lessons, sources and completion states remain unknown. HILERA needs its own content-governance workflow.

## 11. Engagement

OBSERVED: Coaching is advertised [D01](evidence/README.md#d01). INFERENCE: measurement/support repetition may encourage engagement. Reminder timings, task routing and retention effects are not established.

## 12. Returning-User Experience

INFERENCE: ongoing tracking and reports imply repeat use, but session restoration, interrupted entry and inactive-return screens are unknown. Do not present a reconstructed flow as observed behaviour.

## 13. Summaries / Reports / Sharing

OBSERVED: On-demand sharing is advertised in the consumer store [D02](evidence/README.md#d02); membership mentions reports and a web portal [D03](evidence/README.md#d03). Export formats, recipient controls and web editing parity require confirmation.

## 14. Navigation / Information Architecture

OBSERVED: Shared logbook supports a unified data experience [D04](evidence/README.md#d04). Specific navigation across cardiometabolic areas is unknown. Marketing solution categories do not prove equivalent in-app tabs.

## 15. Empty / Loading / Error States

Unknown: empty history, disconnected device, unsupported record, loading and clinical-output errors. CANDIDATE IDEA: keep HILERA health screens useful with no devices or connected sources; do not fabricate Dario failure states.

## 16. Privacy / Trust Presentation

OBSERVED: Dario's privacy policy distinguishes some sponsored-use arrangements and discusses broader service data practices [D05](evidence/README.md#d05). Do not infer every listed practice occurs on each health screen or copy US-centred compliance claims into HILERA.

## 17. Observable Strengths

Observed strength: documented combined tracking rather than entirely separate logbooks [D04](evidence/README.md#d04). INFERENCE: a common component model could reduce inconsistency for HILERA. Competitor internal architecture remains unknown.

## 18. Observable Weaknesses

Observed fit limitation: substantial device/service emphasis [D01–D03](evidence/README.md#d01). INFERENCE: equipment, supply logistics and coaching increase dependency burden. No live usability defects or Nigeria cost estimates were demonstrated.

## 19. Current HILERA Equivalent

[H02](evidence/README.md#h02): shared app navigation, generic measurement definition/history types, reusable row and provenance components. The foundation already supports architectural reuse; it has no real condition-specific data.

## 20. HILERA Gap

Functional multi-measurement history awaits approved inventory and services. Exact grouping/navigation could be refined after data approval. There is no justification to replace the framework or add a condition taxonomy solely from Dario marketing.

## 21. Candidate Opportunity

CANDIDATE IDEA: HIL-RD-001 coherent latest/history views and HIL-RD-011 deliberate deferral of device/service expansion. Keep generic components; validate labels and grouping with representative approved content later.

## 22. MVP Value

INFERENCE: High for consistency across approved types, Low for device ecosystem expansion at launch. Broad disease management would change HILERA's role.

## 23. Development Complexity

INFERENCE: shared presentation Low–Moderate; functioning data flows High until backend/specifications exist; devices and clinical services High with external dependencies.

## 24. Operating-Cost Dependency

Learning from the interface requires no integration. Implementing connected devices, supply fulfilment or coaching would add vendor, support and service costs. No exact operating price is inferred.

## 25. Clinical-Safety Impact

Do not import clinical classifications, treatment goals, emergency alerts or medication support. A reusable data component is not permission to calculate risk across conditions.

## 26. Privacy/Security Impact

Connected data, shared reports and organisational access would require explicit consent, identity/permission boundaries and review. HILERA's four provenance labels must not be interpreted as vendor certification.

## 27. Recommendation

Retain the existing component architecture. Investigate domain-neutral grouping and detail consistency using only an approved inventory. Obtain a legitimate product demo before asserting exact Dario navigation or web/mobile parity.

## 28. Decision Status

DECISION STATUS: Research only. New grouping: Requires product approval. Device and service expansion: Deferred as an implementation recommendation consistent with current MVP exclusions.

## 29. Evidence / Sources

Sources: [D01–D05](evidence/README.md#d01), [H01](evidence/README.md#h01), [H02](evidence/README.md#h02). Consumer store, enterprise marketing and app listing are distinct surfaces; their capabilities must not be combined into an invented single tested flow.

## Feature investigation: Consistent tracking across approved areas

| Field | Assessment |
| --- | --- |
| Observed behaviour | Shared logbook described in publisher listing; see §8 (D04). |
| Why it works | INFERENCE: consistent data presentation may lower relearning between health areas. |
| Weakness | Exact menus, empty states and portal parity are unknown. |
| Current HILERA approach | Generic typed definitions and reusable history/provenance components. |
| HILERA gap | Working records and inventory are absent; architecture itself need not be replaced. |
| Candidate improvement | HIL-RD-001: consistent overview-to-detail patterns for approved measurement types. |
| User value | Review different approved records with familiar interactions. |
| MVP value | High for consistency, Low for a broad multi-disease expansion. |
| Development effort | Low–Moderate presentation; services remain a separate prerequisite. |
| Operating cost | Ordinary secure application operations; no device integration. |
| New data required | Only approved measurement definitions and metadata; no inferred diagnosis taxonomy. |
| Clinical impact | No cross-condition scoring or medical categorisation. |
| Privacy/security impact | Preserve per-user access and traceable provenance. |
| Recommendation | Keep reusable architecture and validate navigation with approved sample definitions later. |

## Unified-experience mapping to HILERA

D01/D06 describe an integrated cardiometabolic offering; D04/D07 provide logbook/reporting references. These sources support learning from shared presentation. They do not verify the signed-in navigation, exact menu labels, web/mobile parity or Nigeria availability. Proposed reusable patterns below are **INFERENCE**, not descriptions of Dario's component code.

| Existing HILERA surface | Proposed common pattern | Approval and safety boundary |
| --- | --- | --- |
| Dashboard | Shared hierarchy for state, recent context and next action | HIL-RD-004, B/A; no combined health score |
| Measurement entry | One generic form architecture and return path | HIL-RD-003, B/A; inventory and units still require approval |
| History | Common chronological rows and exact provenance labels | HIL-RD-001, B/A; no clinical trust ranking |
| Trends | Consistent date/context/readiness presentation | Already P0; descriptive only, no fabricated trajectory |
| Education | Common reviewed-content structure and permitted task link | HIL-RD-005, A/B; goals/search remain P1 |
| Risk Awareness Summary | Common readiness/limitation treatment | Already P0 conditional on Clinical Specification; no interpretation now |

HIL-RD-006 proposes shared navigation across these six surfaces rather than separate condition-specific mini-apps. A shared UI does not require a combined clinical data model, a shared risk calculation or new APIs. Preserve HILERA's App Router, tokens, components and brand; decide clinical grouping only through approved specifications.

Do not infer the V1 measurement inventory from Dario's marketed conditions or from illustrative future areas. Medication management, device-specific clinical behaviour, coaching, employer/payer functions, GLP-1 support, treatment programmes, proprietary algorithms and outcome claims stay outside Bundle 1. Marketing outcomes are not independently validated clinical evidence in this audit.
