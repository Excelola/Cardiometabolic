# Cardiometabolic - Codex Engineering Instructions

## 1. Project

This repository contains the Cardiometabolic Early Detection
and Control product.

The product helps users understand, monitor, and improve
cardiometabolic risk factors.

This is a health application. Clinical safety, privacy,
security, traceability, and correctness take priority over
speed of implementation.

---

## 2. Product Source of Truth

The Master PRD stored in Google Drive is the authoritative
source for:

- Product vision
- Functional requirements
- Features
- User journeys
- Business rules
- Permissions
- Product scope
- Approved product decisions

GitHub represents the implemented state of the product.

Do not assume that existing code automatically overrides
the Master PRD.

If implementation conflicts with an approved requirement,
identify the conflict before changing product behaviour.

---

## 3. Brainstorming vs Approved Requirements

Do not treat ideas, alternatives, experiments, TODO comments,
or brainstorming as approved requirements.

Only implement a material product decision when it is:

1. explicitly requested in the current task, or
2. documented as an approved requirement.

When uncertain, preserve the existing behaviour and flag
the ambiguity.

---

## 4. PRD Sync Requirement

Changes affecting any of the following may require a PRD update:

- Features
- Functional requirements
- User journeys
- Business rules
- Authentication behaviour
- Permissions
- Data collected from users
- Data structures visible at product level
- Integrations
- Product scope
- Clinical behaviour

Do not silently modify the Master PRD.

At the end of a task involving a material product change,
report:

PRD SYNC STATUS:
- Required
- Not required
- Uncertain

If required, identify the affected product areas.

ChatGPT/product governance is responsible for updating the
Google Drive Master PRD after product approval.

---

## 5. Technical Documentation

Implementation-specific decisions belong in technical
documentation rather than the Master PRD.

Update relevant technical documentation when changing:

- System architecture
- Database schema
- APIs
- Authentication implementation
- External integrations
- Infrastructure
- Deployment
- Security architecture
- Background jobs
- Caching
- Observability

Do not duplicate unnecessary implementation details in
product documentation.

---

## 6. Clinical Safety

Never invent:

- Medical thresholds
- Diagnostic criteria
- Cardiovascular risk calculations
- Diabetes risk calculations
- Treatment recommendations
- Medication recommendations
- Clinical escalation rules

Only implement clinical logic from explicitly approved and
versioned clinical specifications.

Clinical calculations should be deterministic unless an
approved specification explicitly states otherwise.

AI/LLM functionality must not independently determine a
medical diagnosis or clinical risk score.

AI may explain approved deterministic results when the
product specification allows it.

When clinical logic changes, require tests covering:

- Normal values
- Boundary values
- Abnormal values
- Missing values
- Invalid values
- Units
- Relevant edge cases

---

## 7. Health Data & Privacy

Treat all health and identity information as sensitive.

Follow data minimisation principles.

Do not:

- expose health data in client logs
- log passwords or authentication secrets
- commit API keys or secrets
- use real patient information in tests
- send sensitive data to analytics unnecessarily
- expose internal health records through insecure endpoints

Use synthetic test data.

Validate and sanitise all external input.

Apply least-privilege access.

---

## 8. Database Changes

Database changes must be intentional and reviewable.

For schema changes:

1. identify affected entities
2. identify migration requirements
3. preserve existing data where appropriate
4. update relevant tests
5. update technical documentation
6. flag any user-visible/product behaviour change for PRD review

Do not delete health records or change health-data semantics
without explicit approval.

---

## 9. API Changes

For API changes:

- validate inputs
- enforce authentication where required
- enforce authorisation
- return consistent errors
- avoid exposing unnecessary sensitive fields
- maintain backwards compatibility unless a breaking change
  is explicitly approved

Document material API changes.

---

## 10. Authentication & Authorization

Never weaken authentication or authorization merely to make
a feature easier to implement.

Protected health data must only be accessible to authorised
users.

Any change to:

- sign-up
- sign-in
- account recovery
- session management
- roles
- permissions
- account deletion

must be treated as a potentially material product change.

---

## 11. Testing

Every material feature should include appropriate tests.

Before completing work:

- run relevant unit tests
- run integration tests where applicable
- run type checking
- run linting
- run relevant end-to-end tests where available

Use the commands documented by the repository.

If required testing infrastructure does not yet exist,
report the gap instead of pretending tests passed.

---

## 12. Code Quality

Prefer:

- simple architecture
- small cohesive modules
- explicit behaviour
- reusable components
- strong typing
- clear error handling
- maintainability over cleverness

Avoid unnecessary abstractions.

Do not refactor unrelated areas during a scoped feature task
unless necessary for correctness.

---

## 13. Scope Control

Change only what is necessary for the task.

Do not:

- redesign unrelated screens
- change unrelated business rules
- rename unrelated APIs
- modify unrelated database tables
- replace frameworks or major dependencies without approval

Keep patches focused and reviewable.

---

## 14. Documentation

When implementation changes architecture or technical
behaviour, update the appropriate technical documentation.

Do not rewrite unrelated documentation.

Preserve existing documentation unless the implementation
makes it incorrect.

---

## 15. Task Completion Report

Every material implementation task should end with:

### Implementation Summary
What was built or changed.

### Files Changed
Important files modified.

### Testing
Tests/checks executed and their results.

### Product Behaviour Change
Yes / No

### PRD Sync Status
Required / Not required / Uncertain

### PRD Areas Potentially Affected
List relevant sections or product areas.

### Technical Documentation Status
Updated / Not required / Requires update

### Risks or Follow-up
Any remaining issues or recommendations.
