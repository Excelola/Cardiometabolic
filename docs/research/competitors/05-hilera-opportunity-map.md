# HILERA opportunity map

Research date: 7 November 2026. Classification is a research recommendation, not product approval.
Evidence: [audits](README.md#read-in-order) and [register](evidence/README.md).
Value, effort, cost and risk are qualitative analyst judgments using the definitions in the README. No numeric score or priority calculation is claimed.

## KEEP

| Finding | User value | MVP value | Effort | Operating cost | Dependency burden | Clinical risk | Privacy/security risk | Decision status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Own-backend email/password direction; no phone/OTP reinstatement (H01 §4.4) | Direct account access | High | High to implement securely | Backend/security operations | Policies/contracts unresolved | No clinical interpretation | High if implemented poorly | Approved |
| Manual-first strategy, generic types and exact four provenance labels (H01 §§4.1, 6.11; H02) | Clear origin and accessible entry | High | No architecture replacement | Normal data operations later | Inventory/data specs | Labels must not imply clinical validity | Sensitive data requires access control | Approved |
| Calm HILERA visual system and exact eight product states (H02; owner-approved milestone) | Familiar, understandable journey | High | Preserve current work | Maintenance | State-transition specification | States are workflow, not medical classifications | No new data for visual preservation | Approved |
| Honest insufficient-history/readiness states (H01 §§5.14, 5.18) | Avoid false reassurance | High | Existing shell; future wiring | Normal operations | Valid data/clinical rules | Prevents invented results | Sensitive errors must be bounded | Approved |

Only the already approved baseline is marked Approved here. No candidate below inherits that status.

## IMPROVE

| Finding | User value | MVP value | Effort | Operating cost | Dependency burden | Clinical risk | Privacy/security risk | Decision status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HIL-RD-004 next action and continuity | Resume useful work | High | Low UI; High backend | Secure storage/support | State/auth/consent contracts | No medical prioritisation | Sensitive drafts | Requires product approval |
| HIL-RD-001 current/history organisation | Find the right context | High | Moderate | Data queries/maintenance | Inventory/time semantics | Latest is not necessarily clinically meaningful | Per-user access | Requires product approval |
| HIL-RD-002 retrieval; functional correction is separate | Find records reliably | High | Low layout; Moderate–High functionality | Queries/support | Retrieval scope and data dictionary | No clinical relevance ranking | No sensitive query logging | Requires product approval |
| HIL-RD-014 state catalogue | Understand absent or failed information | High | Low–Moderate | QA/support | Error contracts later | No healthy/safe inference | No internal data in errors | Requires product approval |
| HIL-RD-005 education presentation | Understand approved information | High | Moderate with governance | Editorial/clinical review | Content approval | Unreviewed copy could mislead | Avoid reading-based sensitive profiling | Requires product approval |
| HIL-RD-015 reminder controls | Return by choice | High | Moderate–High | Channel costs unresolved | Cadence/channel/budget | No clinical schedule implied | Notification exposure | Requires product approval |

These are proposed ways to deliver or refine existing capabilities, not evidence that current implementation is complete.

## ADD CANDIDATE

| Finding | User value | MVP value | Effort | Operating cost | Dependency burden | Clinical risk | Privacy/security risk | Decision status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HIL-RD-007 concrete goal workflow | Support non-clinical consistency | Moderate; P1 | Moderate | Storage/support | Lifecycle/data approval | Must not become treatment targets | Progress retention | Requires product approval |
| HIL-RD-008 selected export design | Prepare a healthcare conversation | Moderate; P1 | Moderate–High | Generation/support | Format, permissions and data completeness | Incorrect context/claims | Download exposure | Requires product approval |
| HIL-RD-009 symptom logging | Possible record of concerns | Uncertain | Moderate; unknown scope | Storage/review/support | New purpose and inventory | Must not imply assessment | Unbounded text may expose identity/health | Research only |

ADD CANDIDATE means a proposed addition to the current implementation; goals/export already exist at P1 capability level in the PRD. Symptom logging is not approved by that fact.

## DEFER

| Finding | User value | MVP value | Effort | Operating cost | Dependency burden | Clinical risk | Privacy/security risk | Decision status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HIL-RD-011 devices, broad uploads/integrations; HIL-RD-012 coaching | Potential future convenience/support | Low initial fit | High | Vendor, logistics or staff | External systems and operations | Units/clinical support | Third-party records/access | Deferred |
| HIL-RD-010 guided assessment/care navigation | Potential acute-concern support | Deferred | High | Provider terms unresolved; paid API prohibited now | Clinical/provider/local deployment approval | Urgency and differential reasoning | External sensitive-data transfers | Deferred |

Logging does not unlock assessment. A free trial does not approve production licensing, clinical suitability or integration.

## REJECT

| Finding | User value | MVP value | Effort | Operating cost | Dependency burden | Clinical risk | Privacy/security risk | Decision status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Copying competitor diagnoses, scores, treatment or escalation rules into V1 | Could create misleading confidence | Incompatible with approved boundary | Not estimated | Not estimated | Explicitly outside current task | Unapproved medical behaviour | Additional sensitive use | Rejected |
| Treating “Verified” provenance or green styling as proof of health/safety | Misleading | Incompatible | No implementation | None | Violates meaning boundary | False reassurance | Misrepresentation of record trust | Rejected |
| Copying sensitive analytics, advertising trackers or private-account data | No approved user purpose | Incompatible | No implementation | None | Violates minimisation/task constraints | Possible secondary harm | Unauthorised exposure/use | Rejected |

Rejected here follows explicit owner/repository prohibitions for current work; it is not an invented permanent decision about all future products.

## CLINICAL REVIEW REQUIRED

| Finding | User value | MVP value | Effort | Operating cost | Dependency burden | Clinical risk | Privacy/security risk | Decision status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Approved clinical education content (HIL-RD-005); interpretation is excluded from Bundle 1 | Potential understanding | P0 education; conditional content approval | Content varies | Ongoing clinical governance | Reviewed content and versioning | High if copied or inferred from competitors | No reading-based profiling | Requires product approval; additional clinical review |
| Guided symptom assessment (HIL-RD-010) | Future only | Deferred | High | No paid service authorised | Reopen owner decision before review | Acute urgency/differential risk | Provider transfer/retention | Deferred |

No numeric risk, clinical threshold, symptom probability, medical questionnaire or algorithm is defined here.

## PRIVACY/SECURITY REVIEW REQUIRED

| Finding | User value | MVP value | Effort | Operating cost | Dependency burden | Clinical risk | Privacy/security risk | Decision status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Export and any future shared links (HIL-RD-008) | User-controlled portability | P1 | Moderate–High | Generation/support | Recipient model, retention, revocation where applicable | Preserve context | Cross-user disclosure and unrecoverable downloads | Requires product approval; additional privacy/security review |
| Real consent/account/data controls (HIL-RD-016) | Trust and agency | High | High across services | Review/audit/support | Policies, auth, deletion semantics | Effects on dependent results | Access, backups, retention | Requires product approval; additional privacy/security review |
| Notification preferences (HIL-RD-015); symptom records HIL-RD-009 remain Research only | Possible convenience | Depends on approval | Moderate–High | Operations/delivery | Purpose, field and retention decisions | Clinical meaning must stay bounded | Text leakage, shared-device exposure | Requires product approval; additional privacy/security review |


## Recommended HILERA MVP Expansion Bundle 1

**Research recommendation only; not approved implementation scope.** “Expansion” means a proposed improvement package, not automatic expansion of P0 capabilities. Candidates 1 and 3–6 primarily refine approved P0 UX. Candidate 2 needs an explicit retrieval-functionality boundary decision. All six await product-owner review of the actual bundle.

The [decision backlog](06-proposed-product-decisions.md) is canonical for approval status; clinical/privacy headings below and above describe additional review gates, not alternative approval statuses.

### Candidate 1: Health History information architecture — HIL-RD-001

| Field | Assessment |
| --- | --- |
| User problem | Accumulated information is hard to follow when chronology and record context compete. |
| Current HILERA capability | Already P0; B (UX improvement), with A (functional delivery incomplete). History is a synthetic shell. |
| Competitor evidence | Guava G03/G09: consolidated records and retrieval; Dario D04: combined logbook. |
| Proposed improvement | Use a consistent chronological hierarchy, readable record context and links to existing trends and a future approved detail view. Preserve provenance labels without adding trust meaning. |
| Whether product approval is actually required | No new capability approval for bounded presentation; owner approval of the proposed UX bundle is still pending. New record semantics or fields require a separate decision. |
| PRD SYNC IMPACT | Not Required — chronology and presentation are covered by approved P0 history; new data/ordering semantics would reopen review. |
| UX impact | High core-loop value; make date, record identity and provenance scannable without copying Guava's layout. |
| Technical impact | Reuse history rows, page titles, badges and empty states; no framework or service replacement. |
| Data-model impact | None for presentation; do not invent timestamp precedence, measurement inventory or correction schema. |
| API impact | None for a shell refinement; real authenticated history queries remain separate approved-delivery prerequisites. |
| Clinical impact | No classification, clinical importance sorting or interpretation. |
| Privacy/security impact | Synthetic review data; eventual per-user access; no search or record logging. |
| Operating cost | Low incremental UI maintenance; no new paid service. Functional storage costs are outside this bundle. |
| Dependencies | Owner-approved UX, existing provenance/state model; approved inventory and time semantics before real records. |
| Implementation complexity | Low presentation; moderate functional history delivery, excluded. |
| Recommended delivery bundle | Bundle 1 shared history/entry/dashboard presentation. |
| APPROVAL STATUS | Requires product approval — proposed bundle/UX not yet approved; capability baseline remains as stated. |

### Candidate 2: History search/filter/retrieval — HIL-RD-002

| Field | Assessment |
| --- | --- |
| User problem | Users may struggle to find a particular historical record as records accumulate. |
| Current HILERA capability | Already P0 history; B for retrieval affordances. Exact search/filter functionality is not established by capability-level approval. |
| Competitor evidence | Guava G03/G09: searchable record organisation. No measured retrieval speed or live interaction testing. |
| Proposed improvement | First clarify navigation and record context. Propose date/type filters over approved records for review; exclude full-text indexing, saved searches and query retention. |
| Whether product approval is actually required | Explicit boundary decision required before adding filters/search. Reordering existing navigation is UX; new query behaviour, stored preferences or a search service is additional functionality. |
| PRD SYNC IMPACT | Uncertain — Not Required if owner confirms bounded filters specify existing history; Required if new search behaviour, data, retention or permissions are approved. |
| UX impact | High potential value; distinguish no history from no matching results and provide accessible reset. |
| Technical impact | Low mock/presentation work; moderate query/pagination/filter work requires later contracts. |
| Data-model impact | No new health fields for bounded filters; stored searches or indexed free text are excluded. |
| API impact | None now; real filtering scope, pagination and ownership must be specified separately. |
| Clinical impact | No clinical relevance ranking, automatic risk sorting or inferred meaning. |
| Privacy/security impact | Do not log query contents or persist sensitive filters in browser storage. |
| Operating cost | No new service in Bundle 1; indexing/operations would require separate budget approval. |
| Dependencies | Owner resolution of UX versus functionality; approved record metadata, query semantics and accessibility criteria. |
| Implementation complexity | Low retrieval layout; moderate functional search, excluded pending decision. |
| Recommended delivery bundle | Bundle 1 only for accepted presentation boundary; separate functionality decision for unresolved search. |
| APPROVAL STATUS | Requires product approval — proposed bundle/UX not yet approved; capability baseline remains as stated. |

### Candidate 3: Faster repeat Add Health Information entry — HIL-RD-003

| Field | Assessment |
| --- | --- |
| User problem | Repeat manual capture can feel cumbersome or disconnected from the resulting history. |
| Current HILERA capability | Already P0; B for entry UX and A for functioning capture. Existing generic form is disabled pending inventory. |
| Competitor evidence | Guava G08/G09: manual logging/repeat-entry references; Omada O07: documented manual entry. No timed task evidence. |
| Proposed improvement | Reduce navigation and clarify entry context, labels, validation space and the route back to history. Do not prefill prior health values or claim a save occurred. |
| Whether product approval is actually required | No new capability approval for presentation; approve exact UX before implementation. Defaults, new fields, autosave or duplicated readings need separate decisions. |
| PRD SYNC IMPACT | Not Required — bounded presentation refines approved manual entry; new capture/default/persistence rules would require review. |
| UX impact | High value hypothesis; speed must be tested with synthetic tasks, not asserted. |
| Technical impact | Reuse generic entry components and form primitives; retain strong typing and validation boundaries. |
| Data-model impact | None now; only eventual approved V1 inventory and units may populate the form. |
| API impact | None; create/update contracts, validation and error handling remain separate prerequisites. |
| Clinical impact | No measurements, ranges, units, conversions or measurement cadence invented. |
| Privacy/security impact | No client logs, sensitive browser persistence or retained drafts added. |
| Operating cost | Low UI maintenance; no vendor. Real storage/validation operations remain separate. |
| Dependencies | Approved inventory, validation rules and save behaviour before functional data capture. |
| Implementation complexity | Low shell UX; moderate functional entry once specified. |
| Recommended delivery bundle | Bundle 1 alongside history, with functional capture explicitly excluded. |
| APPROVAL STATUS | Requires product approval — proposed bundle/UX not yet approved; capability baseline remains as stated. |

### Candidate 4: Dashboard/current-health-picture hierarchy — HIL-RD-004

| Field | Assessment |
| --- | --- |
| User problem | Returning users need to distinguish product readiness, recent information and the next permitted task. |
| Current HILERA capability | Already P0; B for dashboard hierarchy, A for persisted returning-user continuity. Current dashboard is synthetic. |
| Competitor evidence | Guava G03: current versus historical organisation; Omada O03/O04: visible activity/progress references. |
| Proposed improvement | Prioritise current product state, incomplete tasks, recent approved information, monitoring activity, trend access and one approved next action. Distinguish workflow state from health status. |
| Whether product approval is actually required | No new capability approval for hierarchy; owner approves layout. New prioritisation rules, state transitions or clinical next actions require explicit approval. |
| PRD SYNC IMPACT | Not Required — existing dashboard/continuity/next-step scope; new state semantics or action-selection rules trigger review. |
| UX impact | High core-loop value; avoid fake values and avoid equating missing data with reassurance. |
| Technical impact | Compose existing status/information cards and navigation; real resume depends on later services. |
| Data-model impact | None for layout; no new state enum, health score or tracked engagement field. |
| API impact | None; state and recent-record reads await approved authenticated services. |
| Clinical impact | Summary stays readiness-only until approved Clinical Specification; no risk prioritisation. |
| Privacy/security impact | Keep synthetic preview; minimise future sensitive content visible on shared screens. |
| Operating cost | Low presentation maintenance; persistence and operations separate. |
| Dependencies | Existing eight product states; approved next-action mapping and content before functional behaviour. |
| Implementation complexity | Low layout; moderate state/resume integration, excluded. |
| Recommended delivery bundle | Bundle 1 dashboard/history/entry coherence. |
| APPROVAL STATUS | Requires product approval — proposed bundle/UX not yet approved; capability baseline remains as stated. |

### Candidate 5: Education-to-action interaction — HIL-RD-005

| Field | Assessment |
| --- | --- |
| User problem | Users may read information without understanding the existing approved next step. |
| Current HILERA capability | Already P0 education and next-step guidance; A for delivery, B for presentation. Goals and contextual education/search remain P1 (C). |
| Competitor evidence | Omada O02/O03/O10: documented learning and action references; transfer is a design hypothesis, not an efficacy claim. |
| Proposed improvement | Pair approved short education with a clear link to an already approved task. Offer a navigational continuation; no goal creation, saved reflection, completion tracking or new personalised advice. |
| Whether product approval is actually required | No new capability approval for bounded links/presentation; approve content and UX. New reflections, habit tracking, goals or recommendation rules require separate decisions. |
| PRD SYNC IMPACT | Not Required — presentation within approved P0 education/next steps; new collection/personalisation or promotion of P1 scope would require sync. |
| UX impact | High value hypothesis; clear purpose and optional continuation without coercion. |
| Technical impact | Reusable approved-content card/notice and existing route links; CMS and progress services excluded. |
| Data-model impact | No reading history, reflection field or goal record. Content version/source governance remains a delivery dependency. |
| API impact | None for presentation; content administration contracts are separate. |
| Clinical impact | Only reviewed approved content; no treatment, coaching or algorithmic advice. |
| Privacy/security impact | No inference from reading behaviour and no sensitive analytics. |
| Operating cost | UI low; recurring editorial/clinical review is real work, not a free-content assumption. |
| Dependencies | Approved educational copy, content owner/version and approved next-step mapping. |
| Implementation complexity | Low presentation; content governance effort depends on existing material. |
| Recommended delivery bundle | Bundle 1 approved-content presentation; P1 goals/search and reminder delivery excluded. |
| APPROVAL STATUS | Requires product approval — proposed bundle/UX not yet approved; capability baseline remains as stated. |

### Candidate 6: Unified cardiometabolic navigation/presentation — HIL-RD-006

| Field | Assessment |
| --- | --- |
| User problem | Separate health-area experiences could fragment the user's history and monitoring journey. |
| Current HILERA capability | Already P0 dashboard, entry, history, trends, education and conditional summary; B for coherent presentation, A for full delivery. |
| Competitor evidence | Dario D01/D04/D06/D07: integrated offering/logbook/reporting references; exact in-app menu structure unverified. |
| Proposed improvement | Use common navigation, page anatomy, provenance, history rows and readiness language across existing surfaces. Preserve HILERA branding and generic measurement architecture. |
| Whether product approval is actually required | No new capability approval for consistent navigation; owner approves the UX bundle. New domains, clinical groupings or inventory require explicit approval. |
| PRD SYNC IMPACT | Not Required — shared presentation of approved capabilities; expanded inventory, permissions or clinical aggregation would require sync. |
| UX impact | High consistency value; avoid one separate mini-app per future health area. |
| Technical impact | Refine shared AppShell/navigation/cards; keep Next.js App Router and existing component boundaries. |
| Data-model impact | None. Illustrative health-area examples are not V1 inventory approval. |
| API impact | None; do not infer a unified clinical aggregation API from shared visual treatment. |
| Clinical impact | No combined score, domain classification, clinical ordering or inferred relationships. |
| Privacy/security impact | Existing least-privilege requirements unchanged; no wider data exposure. |
| Operating cost | Low shared-component maintenance; no device, coach, integration or paid dependency. |
| Dependencies | Owner-approved navigation, current route structure, accessibility and exact approved labels. |
| Implementation complexity | Low–moderate cross-screen presentation review; no backend architecture replacement. |
| Recommended delivery bundle | Bundle 1 common navigation and component refinement across all six candidates. |
| APPROVAL STATUS | Requires product approval — proposed bundle/UX not yet approved; capability baseline remains as stated. |

## Delivery sequence and speed

Recommend **one cohesive presentation batch** after owner review: shared navigation/component conventions, chronological history, entry context, dashboard hierarchy and approved education-to-action links. Include retrieval affordances only within the boundary accepted for HIL-RD-002. Review desktop/mobile, keyboard use, empty results and incomplete-data states together. Reuse existing frontend architecture and synthetic records.

Acceptance proposal: users can distinguish current state from historical events, locate the path to a record, return from entry to history, understand insufficient history, and identify an already approved next action. Validate through consented usability sessions with synthetic data; no invented success threshold or sensitive analytics.

Keep separate: functional auth/session/authorization; save/resume and data APIs; database or audit-model changes; new sensitive collection; reminder channel/cadence/delivery; new paid dependencies; external services; clinical interpretation or safety behaviour. A missing backend is not permission to fake successful saves. A visual bundle must not quietly become a backend build.

## Explicit exclusions from Bundle 1

Symptom logging; guided symptom assessment; diagnosis; differential diagnosis; triage; medication management; prescribing; treatment recommendations; wearable/device integrations; external lab integrations; coaching; community; employer functionality; insurer functionality; telemedicine; AI health interpretation; AI clinical summaries; custom clinical health scores.

Goals, export/shareable summaries and contextual education/search remain approved P1 capabilities, outside this P0 presentation recommendation. Basic reminders remain P0 but delivery details are deferred. No P2 designation is inferred where the confirmed baseline does not supply one.
