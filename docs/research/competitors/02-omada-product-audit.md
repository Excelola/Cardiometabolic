# Omada Health product audit

Research date: 7 November 2026. Public-source batch; no signed-in account or usability test. OBSERVED means documented unless explicitly stated otherwise. Unknown does not mean absent.

## 1. Product Overview

OBSERVED: Organised digital programmes covering prevention and chronic cardiometabolic concerns, with coaching and education [O01](evidence/README.md#o01). HILERA RELEVANCE: study sustained participation, not a screen-only tracker.

## 2. Target User

OBSERVED: Access and content depend on eligibility/programme [O01](evidence/README.md#o01). INFERENCE: a member with funded coaching has different incentives and support from HILERA's independent consumer.

## 3. Access / Business Model

OBSERVED: Organisational/benefit eligibility is prominent [O01](evidence/README.md#o01). Nigeria direct-consumer eligibility and pricing were not verified. CANDIDATE IDEA: keep HILERA's direct B2C access rather than import eligibility gates.

## 4. First-Time Experience

OBSERVED: The FAQ describes application/start arrangements [O01](evidence/README.md#o01). Actual first-use sequencing was not exercised. Do not turn programme start dates into HILERA waiting periods.

## 5. Account / Onboarding

Unknown: current account fields, verification edge cases and complete consent sequence. HILERA's approved own-backend email/password model remains unchanged. A funded care programme's questions cannot define HILERA's questionnaire.

## 6. Home / Dashboard

OBSERVED: Mobile goal documentation places active goals and progress on Home [O03](evidence/README.md#o03). INFERENCE: showing the next manageable task may support repeat use. Exact full dashboard composition remains unverified.

## 7. Data Entry

OBSERVED: Manual website entry is documented for members with the relevant programme [O07](evidence/README.md#o07). HILERA RELEVANCE: direct access from overview and history can reduce steps; exact measurement fields and guidelines remain excluded.

## 8. Health Records / History

OBSERVED: Progress includes historical readings with programme-specific content [O04](evidence/README.md#o04). Correction/audit internals were not inspected. HILERA history remains synthetic; secure correction is an approved delivery gap, not evidence for copying Omada storage.

## 9. Trends / Progress

OBSERVED: Web and mobile Progress differ [O04](evidence/README.md#o04). CANDIDATE IDEA: evaluate consistency of HILERA's core tasks across widths, without assuming every native feature exists on a website.

## 10. Education

OBSERVED: Web lessons provide sequential pages and reflection; the help article describes a weekly release and navigation via Lessons/Resources [O02](evidence/README.md#o02). INFERENCE: a short learn-then-act structure could support comprehension. Do not copy release cadence or collect reflections without approval.

## 11. Engagement

OBSERVED: Mobile goals include reminders, progress and reflection [O03](evidence/README.md#o03). Web notification preferences are documented separately [O05](evidence/README.md#o05). CANDIDATE IDEA: distinguish optional engagement from clinical alerts.

## 12. Returning-User Experience

OBSERVED: The inactivity policy describes eventual account closure and advance communication; coverage also affects continued access [O06](evidence/README.md#o06). HILERA RELEVANCE: plan respectful return journeys; do not copy closure periods or retention policy.

## 13. Summaries / Reports / Sharing

OBSERVED: Web report export includes a selectable period and programme restrictions; hypertension-only averages have a mobile-specific limitation [O08](evidence/README.md#o08). HILERA export is P1, with privacy and accuracy dependencies.

## 14. Navigation / Information Architecture

OBSERVED: Help describes Lessons/Resources and Progress navigation [O02](evidence/README.md#o02), [O04](evidence/README.md#o04). Goals are explicitly mobile-only [O03](evidence/README.md#o03). This is a documented parity limit, not an assumed design flaw.

## 15. Empty / Loading / Error States

OBSERVED: Goal help describes a different Home prompt when no goals are active [O03](evidence/README.md#o03). Other empty/loading/error states are unknown. Candidate HILERA states must come from its own approved workflow and test scenarios.

## 16. Privacy / Trust Presentation

OBSERVED: Notification settings do not necessarily constitute full email unsubscribe [O05](evidence/README.md#o05). Privacy policy also discusses device/message settings [O09](evidence/README.md#o09). HILERA should make preference scope explicit; legal adequacy was not assessed.

## 17. Observable Strengths

Observed feature coverage links education, task progress and repeat interaction [O02–O05](evidence/README.md#o02). INFERENCE: this gives a programme a reason to exist between measurements. No claim that a particular UI caused clinical outcomes.

## 18. Observable Weaknesses

Observed fit limitations: benefit eligibility and platform-specific functions. INFERENCE: coaching and devices introduce service obligations beyond HILERA's lean MVP. No verified cost comparison or user-friction measurement.

## 19. Current HILERA Equivalent

[H02](evidence/README.md#h02): a limited static dashboard and education placeholder within summary readiness. No lesson library, goal workflow, reminder delivery/preferences or persisted return state.

## 20. HILERA Gap

[H01](evidence/README.md#h01) §§4.13, 4.15 and 5.19–5.22 already cover education, basic reminders and continuity. Goals are P1 (§4.19). The gap is largely delivery and specification; coaching, reflections and communities would expand scope.

## 21. Candidate Opportunity

CANDIDATE IDEA: HIL-RD-005 a short approved-content presentation; HIL-RD-015 user-controlled non-emergency reminders; HIL-RD-007 optional non-clinical goals after the core journey works. Avoid introducing stored reflection text merely to imitate the programme.

## 22. MVP Value

INFERENCE: High for understandable education and continuity; Moderate for goals. Reminder benefit must be balanced against annoyance and privacy. None of these judgments is a measured engagement result.

## 23. Development Complexity

INFERENCE: content presentation Low–Moderate; reviewed content operations Moderate; secure preferences and scheduling Moderate–High; coaching High and operationally distinct.

## 24. Operating-Cost Dependency

Editorial ownership and review cost persist even without an API. Notification channels, scheduling and support have costs; paid network services are not assumed. Human coaching is not a free UI feature.

## 25. Clinical-Safety Impact

Education needs reviewed sources. Behaviour goals must not become personalised medical targets. Reminder frequency must not imply a clinical monitoring schedule; no clinical escalation design is imported.

## 26. Privacy/Security Impact

Lesson completion, preferences, reflection notes and coach messages are personal data with different purposes. Avoid collecting additional sensitive text; define controls and retention before storing any new progress fields.

## 27. Recommendation

Use the education-to-action pattern as a hypothesis for an approved-content bundle. Keep reminder delivery separate from its presentation. Preserve P1 priority for goals and defer human-coaching/community services.

## 28. Decision Status

Audit status: Research only. HIL-RD-005, HIL-RD-007 and HIL-RD-015: Requires product approval for concrete proposals. Clinical content and preference storage have additional clinical and privacy/security review gates.

## 29. Evidence / Sources

Sources: [O01–O09](evidence/README.md#o01), [H01](evidence/README.md#h01), [H02](evidence/README.md#h02). Help instructions may vary by programme/release; no eligible account or longitudinal participation test was used.

## Feature investigation: Education linked to a manageable action

| Field | Assessment |
| --- | --- |
| Observed behaviour | Lesson and goal interaction is documented; see §§10–11 (O02/O03). |
| Why it works | INFERENCE: connecting learning with a small action may improve comprehension and return value. |
| Weakness | Potential content burden; mobile-specific goals cannot be assumed to work on web. |
| Current HILERA approach | Education placeholder, no content library or completion storage. |
| HILERA gap | P0 education delivery and review pipeline are missing; P1 goals are separate. |
| Candidate improvement | HIL-RD-005 approved short content with a clear next action; consider HIL-RD-007 later. |
| User value | Understand the task without reading a large unrelated library. |
| MVP value | High for P0 education; Moderate for optional goal workflow. |
| Development effort | Low–Moderate display, Moderate content governance, higher if progress is stored. |
| Operating cost | Editorial maintenance and clinical review; no paid coaching required. |
| New data required | Content ID/version/source/review metadata; optional reading history needs a decision. |
| Clinical impact | Content must be reviewed; do not turn general education into personalised treatment. |
| Privacy/security impact | Avoid reflective free text or health-related reading analytics without purpose and approval. |
| Recommendation | Bundle content presentation with editorial operations; keep goals and reminders separately scoped. |

## Engagement-loop mapping

The loop below is a synthesis of lesson support (O02), mobile goals support (O03) and programme description (O10). It is not evidence that every stage is available on the web or that this loop improves HILERA retention. Goals are explicitly mobile-scoped in O03.

| Stage | Evidence boundary | HILERA baseline | Bounded recommendation |
| --- | --- | --- | --- |
| Learn | O02 documents web lessons | A: education Already P0 | Deliver reviewed content; HIL-RD-005 |
| Reflect | O02/O03 describe reflection | Reflection collection not confirmed | An optional non-stored content prompt needs content review; saved reflections are a D-class new data decision, excluded |
| Select a manageable action | O03 connects lessons and goals | P0 approved next steps; C: goals Already P1 | Link to an existing approved task; do not create a goal or treatment instruction |
| Perform action | Real-world completion is not observable from documentation | Existing approved tasks | Keep user choice; do not assume action occurred after a click |
| Record progress | O03 documents goal progress | P1 goal records; P0 measurement capture/history | Use approved health capture only; no new adherence diary, streak or goal field |
| Review progress | O03/O04 document progress views | A/B: P0 history/descriptive trends; P1 goals | Make recorded history findable, without medical success labels |
| Continue | O03/O05/O06 cover reminders/return context | A: P0 continuity and basic reminders | Surface existing incomplete actions; do not copy cadence, channel or account-closure rules |

**Bundle 1 transfer:** education → an existing approved next action → clear navigation back to history/dashboard. A persisted goal/reflection loop is not part of this transfer. HIL-RD-005 stays P0 presentation; HIL-RD-007 stays P1; HIL-RD-015 remains P0 delivery with channel/cadence unresolved.

O10 explains programme support that can include devices, coaches and groups depending on eligibility. Those dependencies are not imported into HILERA's B2C/manual-first model. No coaching, community, employer enrolment, device distribution, treatment programme or clinical adherence tracking is recommended for Bundle 1.
