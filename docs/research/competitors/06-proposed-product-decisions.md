# Proposed product decisions

Research date: 7 November 2026. This is a decision backlog, NOT a requirements document. No new decision is Approved. The Master PRD remains authoritative.

A = APPROVED CAPABILITY, IMPLEMENTATION NOT COMPLETE. B = APPROVED CAPABILITY, UX CAN BE IMPROVED. C = P1 ALREADY APPROVED, NOT CURRENT P0. D = GENUINELY NEW CANDIDATE REQUIRING PRODUCT APPROVAL. A and B can apply together: a polished shell is still not functional delivery.

Approval status below governs the **proposed refinement**, not the already-approved parent capability. “Requires product approval” requests owner review of the chosen bundle or unresolved details, not reapproval of P0 history or education. Clinical/privacy reviews are additional gates. PRD impact is conditional on implementing the bounded proposal; this documentation batch needs no PRD sync.

Sources: [evidence register](evidence/README.md). Full 16-dimension Bundle 1 assessments: [opportunity map](05-hilera-opportunity-map.md#recommended-hilera-mvp-expansion-bundle-1).

## HIL-RD-001: Health History information architecture

| Field | Decision |
| --- | --- |
| Classification | Already P0; B (UX improvement), with A (functional delivery incomplete). History is a synthetic shell. |
| Candidate change | Use a consistent chronological hierarchy, readable record context and links to existing trends and a future approved detail view. Preserve provenance labels without adding trust meaning. |
| Evidence | Guava G03/G09: consolidated records and retrieval; Dario D04: combined logbook. |
| Product-approval boundary | No new capability approval for bounded presentation; owner approval of the proposed UX bundle is still pending. New record semantics or fields require a separate decision. |
| APPROVAL STATUS | Requires product approval |
| PRD SYNC IMPACT | Not Required — chronology and presentation are covered by approved P0 history; new data/ordering semantics would reopen review. |
| Technical boundary | Reuse history rows, page titles, badges and empty states; no framework or service replacement. None for a shell refinement; real authenticated history queries remain separate approved-delivery prerequisites. |
| Dependencies | Owner-approved UX, existing provenance/state model; approved inventory and time semantics before real records. |
| Recommendation | Bundle 1 shared history/entry/dashboard presentation. |

## HIL-RD-002: History search/filter/retrieval

| Field | Decision |
| --- | --- |
| Classification | Already P0 history; B for retrieval affordances. Exact search/filter functionality is not established by capability-level approval. |
| Candidate change | First clarify navigation and record context. Propose date/type filters over approved records for review; exclude full-text indexing, saved searches and query retention. |
| Evidence | Guava G03/G09: searchable record organisation. No measured retrieval speed or live interaction testing. |
| Product-approval boundary | Explicit boundary decision required before adding filters/search. Reordering existing navigation is UX; new query behaviour, stored preferences or a search service is additional functionality. |
| APPROVAL STATUS | Requires product approval |
| PRD SYNC IMPACT | Uncertain — Not Required if owner confirms bounded filters specify existing history; Required if new search behaviour, data, retention or permissions are approved. |
| Technical boundary | Low mock/presentation work; moderate query/pagination/filter work requires later contracts. None now; real filtering scope, pagination and ownership must be specified separately. |
| Dependencies | Owner resolution of UX versus functionality; approved record metadata, query semantics and accessibility criteria. |
| Recommendation | Bundle 1 only for accepted presentation boundary; separate functionality decision for unresolved search. |

## HIL-RD-003: Faster repeat Add Health Information entry

| Field | Decision |
| --- | --- |
| Classification | Already P0; B for entry UX and A for functioning capture. Existing generic form is disabled pending inventory. |
| Candidate change | Reduce navigation and clarify entry context, labels, validation space and the route back to history. Do not prefill prior health values or claim a save occurred. |
| Evidence | Guava G08/G09: manual logging/repeat-entry references; Omada O07: documented manual entry. No timed task evidence. |
| Product-approval boundary | No new capability approval for presentation; approve exact UX before implementation. Defaults, new fields, autosave or duplicated readings need separate decisions. |
| APPROVAL STATUS | Requires product approval |
| PRD SYNC IMPACT | Not Required — bounded presentation refines approved manual entry; new capture/default/persistence rules would require review. |
| Technical boundary | Reuse generic entry components and form primitives; retain strong typing and validation boundaries. None; create/update contracts, validation and error handling remain separate prerequisites. |
| Dependencies | Approved inventory, validation rules and save behaviour before functional data capture. |
| Recommendation | Bundle 1 alongside history, with functional capture explicitly excluded. |

## HIL-RD-004: Dashboard/current-health-picture hierarchy

| Field | Decision |
| --- | --- |
| Classification | Already P0; B for dashboard hierarchy, A for persisted returning-user continuity. Current dashboard is synthetic. |
| Candidate change | Prioritise current product state, incomplete tasks, recent approved information, monitoring activity, trend access and one approved next action. Distinguish workflow state from health status. |
| Evidence | Guava G03: current versus historical organisation; Omada O03/O04: visible activity/progress references. |
| Product-approval boundary | No new capability approval for hierarchy; owner approves layout. New prioritisation rules, state transitions or clinical next actions require explicit approval. |
| APPROVAL STATUS | Requires product approval |
| PRD SYNC IMPACT | Not Required — existing dashboard/continuity/next-step scope; new state semantics or action-selection rules trigger review. |
| Technical boundary | Compose existing status/information cards and navigation; real resume depends on later services. None; state and recent-record reads await approved authenticated services. |
| Dependencies | Existing eight product states; approved next-action mapping and content before functional behaviour. |
| Recommendation | Bundle 1 dashboard/history/entry coherence. |

## HIL-RD-005: Education-to-action interaction

| Field | Decision |
| --- | --- |
| Classification | Already P0 education and next-step guidance; A for delivery, B for presentation. Goals and contextual education/search remain P1 (C). |
| Candidate change | Pair approved short education with a clear link to an already approved task. Offer a navigational continuation; no goal creation, saved reflection, completion tracking or new personalised advice. |
| Evidence | Omada O02/O03/O10: documented learning and action references; transfer is a design hypothesis, not an efficacy claim. |
| Product-approval boundary | No new capability approval for bounded links/presentation; approve content and UX. New reflections, habit tracking, goals or recommendation rules require separate decisions. |
| APPROVAL STATUS | Requires product approval |
| PRD SYNC IMPACT | Not Required — presentation within approved P0 education/next steps; new collection/personalisation or promotion of P1 scope would require sync. |
| Technical boundary | Reusable approved-content card/notice and existing route links; CMS and progress services excluded. None for presentation; content administration contracts are separate. |
| Dependencies | Approved educational copy, content owner/version and approved next-step mapping. |
| Recommendation | Bundle 1 approved-content presentation; P1 goals/search and reminder delivery excluded. |

## HIL-RD-006: Unified cardiometabolic navigation/presentation

| Field | Decision |
| --- | --- |
| Classification | Already P0 dashboard, entry, history, trends, education and conditional summary; B for coherent presentation, A for full delivery. |
| Candidate change | Use common navigation, page anatomy, provenance, history rows and readiness language across existing surfaces. Preserve HILERA branding and generic measurement architecture. |
| Evidence | Dario D01/D04/D06/D07: integrated offering/logbook/reporting references; exact in-app menu structure unverified. |
| Product-approval boundary | No new capability approval for consistent navigation; owner approves the UX bundle. New domains, clinical groupings or inventory require explicit approval. |
| APPROVAL STATUS | Requires product approval |
| PRD SYNC IMPACT | Not Required — shared presentation of approved capabilities; expanded inventory, permissions or clinical aggregation would require sync. |
| Technical boundary | Refine shared AppShell/navigation/cards; keep Next.js App Router and existing component boundaries. None; do not infer a unified clinical aggregation API from shared visual treatment. |
| Dependencies | Owner-approved navigation, current route structure, accessibility and exact approved labels. |
| Recommendation | Bundle 1 common navigation and component refinement across all six candidates. |

## HIL-RD-007: Non-clinical goals

| Field | Detail |
| --- | --- |
| Decision ID | HIL-RD-007 |
| Competitor source | Omada O03; [source register](evidence/README.md) |
| Research finding | Mobile goal-progress/reflection pattern is documented; no web parity assumed. |
| Current HILERA behaviour | No goals. H01 §4.19 classifies simple non-clinical goal support as P1. |
| Proposed HILERA change | Evaluate optional monitoring-consistency goals without clinical targets or copied durations. |
| User benefit | Make repeat product use manageable. |
| MVP value | Moderate |
| Technical impact | MEDIUM persisted goal lifecycle and UI; exact fields/states undecided. |
| Data impact | Goal/progress fields need approval; reflective free text excluded from this proposal. |
| Clinical impact | No treatment targets or medical success labels. |
| Privacy/security impact | Progress is personal information; retention and visibility require review. |
| Operating-cost impact | Application storage/support; reminders add separate dependencies. |
| Dependencies | P1 prioritisation, goal lifecycle rules, data dictionary, core monitoring working. |
| Recommendation | Keep behind P0 delivery; review as a separate P1 bundle. |
| APPROVAL STATUS | Requires product approval |
| Classification | C — Already P1, not current P0 |
| PRD SYNC IMPACT | Uncertain — capability is already P1; resolve lifecycle and data details against the PRD. New fields/rules or moving goals to P0 require sync. |

## HIL-RD-008: Selective user-facing export

| Field | Detail |
| --- | --- |
| Decision ID | HIL-RD-008 |
| Competitor source | Guava G05; Omada O08; Dario D03; [source register](evidence/README.md) |
| Research finding | Appointment/report outputs are documented; permission and platform scope vary. |
| Current HILERA behaviour | No export. H01 §4.20 approves capability at P1, not exact format or sharing architecture. |
| Proposed HILERA change | Propose a previewable dated export with selected approved records, provenance and limitations. |
| User benefit | Prepare useful information for a healthcare conversation. |
| MVP value | Moderate |
| Technical impact | MEDIUM generation/authorization; persistent sharing not included by implication. |
| Data impact | Approved records and selection parameters; no recipient identities required by default. |
| Clinical impact | Only approved interpretations; include relevant input and version context. |
| Privacy/security impact | Sensitive downloads cannot be recalled; prevent cross-user export and accidental inclusion. |
| Operating-cost impact | Generation/support; no paid report provider assumed. |
| Dependencies | P1 priority, format/scope, export threat model, data and clinical specifications. |
| Recommendation | Review bounded download before proposing clinician accounts or share links. |
| APPROVAL STATUS | Requires product approval |
| Classification | C — Already P1, not current P0 |
| PRD SYNC IMPACT | Uncertain — capability is already P1; bounded export may only need technical detail, while recipients, share links or changed permissions require sync. |

## HIL-RD-009: Symptom tracking/logging only

| Field | Detail |
| --- | --- |
| Decision ID | HIL-RD-009 |
| Competitor source | Guava G04; current owner discussion; [source register](evidence/README.md) |
| Research finding | Logging is a documented competitor capability; it does not itself provide assessment. |
| Current HILERA behaviour | No symptom fields or records. No approval for symptom inventory inferred from discussion. |
| Proposed HILERA change | Evaluate whether a bounded journal serves the cardiometabolic purpose before proposing any fields. |
| User benefit | Potentially capture concerns for later review; user value needs research. |
| MVP value | Uncertain |
| Technical impact | MEDIUM new stored sensitive data; not a small text-box-only feature. |
| Data impact | New symptom/free-text data; field inventory, retention and purpose unapproved. |
| Clinical impact | No differential, probability, triage or clinical interpretation. Unexpected urgent disclosures need policy review. |
| Privacy/security impact | Free text can contain identifiers and unrelated sensitive details. |
| Operating-cost impact | Storage/support/privacy review; no assessment API required for logging alone. |
| Dependencies | Explicit product approval, data minimisation, clinical boundary and privacy specification. |
| Recommendation | Keep as research candidate, distinct from guided assessment; do not implement now. |
| APPROVAL STATUS | Research only |
| Classification | D — New candidate; not approved MVP |
| PRD SYNC IMPACT | Required — if adopted, symptom purpose, sensitive fields, retention and user journey expand product scope. |

## HIL-RD-010: Guided symptom assessment / care navigation

| Field | Detail |
| --- | --- |
| Decision ID | HIL-RD-010 |
| Competitor source | Owner's explicit sprint boundary; prior provider discussion; [source register](evidence/README.md) |
| Research finding | This is clinical assessment, not symptom journaling; provider cost/fitness are unresolved. |
| Current HILERA behaviour | Absent; explicitly deferred by the owner. |
| Proposed HILERA change | None for MVP implementation in this sprint. |
| User benefit | Potential future support for acute concerns; outside current release decision. |
| MVP value | Deferred |
| Technical impact | CONTROLLED external clinical integration with major governance requirements. |
| Data impact | Symptoms, provider-required context and third-party transfers, all unapproved. |
| Clinical impact | Would introduce possible-condition/urgency decisions; no diagnosis, differential, probability or escalation logic allowed now. |
| Privacy/security impact | Provider processing, consent, retention and clinical traceability require review. |
| Operating-cost impact | No paid API authorised; no suitable free production option confirmed by this batch. |
| Dependencies | Owner reopening decision, validated provider suitability, clinical specification, legal/privacy and budget review. |
| Recommendation | Keep deferred even if a free trial exists; do not substitute a general chatbot. |
| APPROVAL STATUS | Deferred |
| Classification | Deferred — separate clinical intended use |
| PRD SYNC IMPACT | Required — only if reopened and approved; assessment/provider/clinical behaviour would materially change scope. No sync for keeping it deferred. |

## HIL-RD-011: Device, broad record-import and care-service expansion

| Field | Detail |
| --- | --- |
| Decision ID | HIL-RD-011 |
| Competitor source | Guava G02/G04; Omada O01; Dario D01/D02; [source register](evidence/README.md) |
| Research finding | Competitors offer integrations or human/device services; those are not necessary to copy their presentation. |
| Current HILERA behaviour | Manual-first shell; H01 §§4.1, 4.24 defer integration expansion. |
| Proposed HILERA change | No current implementation; preserve a later review item for approved ecosystem expansion. |
| User benefit | Potential future reduction in entry burden; not demonstrated for launch users. |
| MVP value | Low for initial scope |
| Technical impact | High vendor/service work and operational dependencies. |
| Data impact | External records/device data, consent/source/error metadata if ever approved. |
| Clinical impact | Identity, units, interpretation and device reliability require review. |
| Privacy/security impact | New processors, data transfers, permission and revocation boundaries. |
| Operating-cost impact | Vendor/device/logistics/human service costs; unquoted. |
| Dependencies | Separate scope/budget, vendors, clinical/privacy review and support model. |
| Recommendation | Defer; do not replace manual entry or add a provider SDK. |
| APPROVAL STATUS | Deferred |
| Classification | Deferred — device/record integration expansion |
| PRD SYNC IMPACT | Required — if approved later, integrations, external data, permissions and operating model change. |

## HIL-RD-014: Empty, loading, error and readiness catalogue

| Field | Detail |
| --- | --- |
| Decision ID | HIL-RD-014 |
| Competitor source | Guava evidence gaps; Omada O03; H01 §§5.26–5.27; [source register](evidence/README.md) |
| Research finding | Only a goal-specific empty prompt is documented; comprehensive competitor failure states are unknown. |
| Current HILERA behaviour | Honest trend/readiness shells and global error/not-found; no real service states. |
| Proposed HILERA change | Specify user-facing empty versus insufficient data versus service failure, using existing product states. |
| User benefit | Understand why information is unavailable and what non-clinical action is possible. |
| MVP value | High |
| Technical impact | FAST presentation; MEDIUM wiring when actual APIs exist. |
| Data impact | No new health data; bounded error codes need later API contracts. |
| Clinical impact | Do not imply healthy, safe or low risk when information is missing. |
| Privacy/security impact | Errors must omit records, identifiers and internal diagnostics. |
| Operating-cost impact | Minimal incremental UI cost; support/maintenance remains. |
| Dependencies | Product failure-state acceptance criteria and later error contracts. |
| Recommendation | Review a state catalogue; do not invent competitor screenshots or a new workflow state. |
| APPROVAL STATUS | Requires product approval |
| Classification | B — Already P0 state/readiness presentation |
| PRD SYNC IMPACT | Not Required — bounded presentation of existing states; new state semantics or behaviour would require review. |

## HIL-RD-015: User-controlled non-emergency reminders

| Field | Detail |
| --- | --- |
| Decision ID | HIL-RD-015 |
| Competitor source | Omada O05; Guava G06; [source register](evidence/README.md) |
| Research finding | Notification controls are documented; preference and unsubscribe scope can differ. |
| Current HILERA behaviour | No reminder flow. H01 §§4.15, 5.21 approve purposes, not cadence/channels. |
| Proposed HILERA change | Specify preference visibility, dismissal and generic content before choosing delivery technology. |
| User benefit | Return to an intended task without unwanted or revealing messages. |
| MVP value | High |
| Technical impact | MEDIUM scheduling/preferences/delivery; not just UI. |
| Data impact | Approved preference purpose plus still-to-be-defined channel/time metadata. |
| Clinical impact | No monitoring frequency, clinical alert or escalation rule invented. |
| Privacy/security impact | Review lock-screen/email exposure, consent and withdrawal; minimise message content. |
| Operating-cost impact | Channel/provider costs unresolved; do not assume free delivery. |
| Dependencies | Cadence/channel decisions, consent, scheduler, permission model and operating budget. |
| Recommendation | Research/design only until delivery policy and costs are approved. |
| APPROVAL STATUS | Requires product approval |
| Classification | A — Already P0 basic reminders; delivery details deferred |
| PRD SYNC IMPACT | Required — before approving new cadence, channels, preferences or delivery behaviour; capability itself is already P0. |

## HIL-RD-016: Visible privacy and data controls

| Field | Detail |
| --- | --- |
| Decision ID | HIL-RD-016 |
| Competitor source | Guava G06; Omada O09; Dario D05; [source register](evidence/README.md) |
| Research finding | Vendors publish controls with different service/processing scopes; not security attestations. |
| Current HILERA behaviour | Footer placeholders and consent shell. H01 §§4.5, 4.16, 5.24, 6.18 govern controls. |
| Proposed HILERA change | Explain actual consent, account/data controls and preference effects; avoid unsupported legal promises. |
| User benefit | Understand what is collected and how to exercise available choices. |
| MVP value | High |
| Technical impact | FAST approved copy; MEDIUM consent/deletion/access implementation. |
| Data impact | Consent version/events and authorised requests as defined by future specs. |
| Clinical impact | Deletion/correction effects on dependent outputs need governance. |
| Privacy/security impact | Requires security/privacy review; retention, backups, access and withdrawal must be specified. |
| Operating-cost impact | Legal/privacy review, audit operations and support. |
| Dependencies | Approved policy texts, retention/deletion rules, auth and access design. |
| Recommendation | Treat truthful controls as P0 delivery, not decorative trust badges. |
| APPROVAL STATUS | Requires product approval |
| Classification | A — Already P0 settings/health-data controls |
| PRD SYNC IMPACT | Uncertain — truthful presentation may need no PRD change; new retention/deletion/consent/permission rules require sync. |


## HIL-RD-012: Coaching and care-service expansion

| Field | Decision |
| --- | --- |
| Evidence | Omada O01/O10 and Dario D01/D06 market human support; no evidence that HILERA needs this delivery model. |
| Current capability | Not part of the confirmed P0/P1 baseline; no coaching implementation. |
| Candidate change | No immediate change; separate future business/service-model research. |
| Classification | Deferred |
| APPROVAL STATUS | Deferred |
| PRD SYNC IMPACT | Required — if adopted, service scope, professional roles, permissions and user journeys change. |
| User benefit / value | Potential human support; Nigeria-market value and willingness to pay untested. |
| Technical/data/API impact | New roles, messaging, scheduling and sensitive records may arise; none specified or approved. |
| Clinical/privacy impact | Professional accountability, intended use, sensitive communication and access require separate governance. |
| Cost / complexity | High operational burden; staffing, availability, vendor and liability costs unquoted. |
| Dependencies / recommendation | Explicit scope, budget, clinical/privacy and service-model approval; outside Bundle 1. |

## HIL-RD-013: AI-supported interpretation and clinical summaries

| Field | Decision |
| --- | --- |
| Evidence | Guava G03 and Dario D06 advertise AI-related experiences; no independent validation or transferable clinical rules established. |
| Current capability | No AI implementation; clinical logic requires approved versioned specifications. |
| Candidate change | None now; do not substitute an LLM for approved deterministic logic. |
| Classification | Not permitted / requires separate approval for any future bounded use |
| APPROVAL STATUS | Deferred |
| PRD SYNC IMPACT | Required — if a permitted use is approved later, intended use, outputs, data processing and safety boundaries change. |
| User benefit / value | Potential explanation support, not established safety or efficacy. |
| Technical/data/API impact | New model/provider/processing and evaluation architecture; no API, fields or provider chosen. |
| Clinical/privacy impact | No independent diagnosis or clinical score; output validation, traceability, consent and transfer controls would require review. |
| Cost / complexity | High governance burden; inference, review and evaluation costs unquoted. |
| Dependencies / recommendation | Product and clinical specification, privacy/security and budget approval; exclude AI health interpretation and clinical summaries from Bundle 1. |

## Traceability from the initial draft

The earlier CI IDs were editorial identifiers, not approvals. This mapping preserves continuity while splitting overloaded decisions.

| Earlier ID | Canonical decision |
| --- | --- |
| CI-01 continuity | HIL-RD-004 |
| CI-02 current/history | HIL-RD-001 and HIL-RD-006 |
| CI-03 retrieval/correction/entry | HIL-RD-002 and HIL-RD-003; functional correction remains separate approved-delivery work |
| CI-04 states | HIL-RD-014 |
| CI-05 education | HIL-RD-005 |
| CI-06 reminders | HIL-RD-015 |
| CI-07 goals | HIL-RD-007 |
| CI-08 export | HIL-RD-008 |
| CI-09 privacy controls | HIL-RD-016 |
| CI-10 integrations/services | HIL-RD-011 and HIL-RD-012 |
| CI-11 symptom logging | HIL-RD-009 |
| CI-12 guided assessment | HIL-RD-010 |
| Separate AI decision | HIL-RD-013 |

## Review and PRD handling

Review HIL-RD-001–006 as one bounded UX proposal, resolving HIL-RD-002 first. Record approval date, exact scope and PRD coverage before implementation; do not convert recommendations into historical approval. HIL-RD-014 can supply state acceptance criteria. HIL-RD-015/016 functional delivery is separate. HIL-RD-007/008 remain P1; HIL-RD-009 remains Research only; HIL-RD-010–013 remain Deferred.

PRD Sync Status: Not required for this research batch. Product governance owns any later material update. Potential areas: history/retrieval, entry defaults, dashboard state/action selection, education/reflections, reminders, goals, sharing/permissions, sensitive-data scope, clinical intended use and integrations. Implementation-specific contracts belong in technical documentation.

No application implementation, paid subscription, dependency installation, deployment or instrumentation is authorised by this backlog.
