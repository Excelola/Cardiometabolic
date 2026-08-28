# Frontend architecture

## Purpose and authority

This document describes implementation decisions for the initial Next.js
frontend foundation. The Google Drive Master PRD remains authoritative for
product vision, requirements, journeys, rules, permissions, scope, and approved
decisions. Master PRD sections 1–6 were stated as approved for this task.

The foundation deliberately does not fill gaps in the product or clinical
specification. A visible shell is not evidence that its backend behavior,
policy, field inventory, or clinical semantics have been approved.

## Runtime architecture

- Next.js with the App Router provides file-system routing, layouts, metadata,
  Server Components, error handling, and production builds.
- TypeScript uses strict mode. Domain strings are modeled as readonly literal
  unions so unapproved values cannot be introduced casually.
- Pages and display components are Server Components by default. The generic
  measurement form is a small Client Component because it owns browser event
  handling; only JSON-serializable definitions cross that boundary.
- There is no backend, database, authentication provider, session, API route,
  persistence, analytics, or external integration in this foundation.
- The UI does not log identifiers, health data, secrets, or form values.

## Route structure

| Route | Purpose | Current behavior |
| --- | --- | --- |
| `/` | Landing page | Public informational shell |
| `/sign-up` | Sign-up entry | Select phone or email; no account creation |
| `/sign-in` | Sign-in entry | Select phone or email; no session creation |
| `/auth` | Authentication choice | Shared method-selection shell |
| `/auth/identifier/[channel]` | Identifier entry | Accepts `phone` or `email`; no submission or storage |
| `/auth/verify` | Verification code | OTP UI shell; no delivery or verification |
| `/onboarding` | Progressive onboarding | Approved field categories shown as one non-persistent preview |
| `/app` | Application entry | Redirects to the dashboard shell |
| `/app/dashboard` | Limited dashboard | Synthetic cards and approved product-state list |
| `/app/measurements/new` | Generic measurement entry | Placeholder definition; saving disabled |
| `/app/measurements/history` | Measurement history | Synthetic records and provenance labels |
| `/app/trends` | Trend view | Empty visualization shell |
| `/app/risk-summary` | Risk Awareness Summary | Empty inputs, summary, and provenance shells |

The `/app` prefix is an organizational route in this foundation, not an access
control boundary. Real authentication and authorization must be enforced on the
server once approved session and permission requirements exist.

## Component structure

```text
src/components
├── app/          authenticated shell and product-state presentation
├── auth/         shared authentication cards and method selection
├── health/       generic measurement and provenance components
├── onboarding/   progressive-step presentation
├── site/         public header and footer
└── ui/           reusable link, card, field, and status primitives
```

Domain types live in `src/domain`; runtime-safe public configuration lives in
`src/config`. Route files compose those modules without embedding clinical
rules or provider policy.

## State model

The only product workflow states represented are the explicitly approved set:

1. Account Created
2. Consent Required
3. Setup Not Started
4. Setup In Progress
5. Baseline Data Needed
6. Summary Pending Inputs
7. Summary Available
8. Active Monitoring

`ProductState` is derived from a readonly tuple. The selected state on the
dashboard is synthetic and clearly labeled. These values describe product
workflow only and must not be interpreted as medical status.

There is no global client state library. Static mock values are rendered on the
server. State persistence, server state, form state, session state, and product
state transitions will be designed when their APIs and business rules are
approved.

## Design-token strategy

`src/app/globals.css` defines semantic custom properties rather than final brand
names or palette scales:

- `--color-primary`
- `--color-surface`
- `--color-background`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-border`
- `--color-warning`
- `--color-critical`

The assigned values are provisional, restrained, and brand-neutral. Components
consume semantic aliases only. A later approved brand layer can change token
values without rewriting component intent. Supporting tokens cover focus,
contrast, spacing, radius, shadow, and content width.

Accessibility foundations include semantic landmarks, explicit labels,
described-by relationships, keyboard-visible focus, a skip link, sufficient
touch target sizing, reduced-motion handling, responsive navigation, and text
alternatives for placeholder visualizations. Formal accessibility testing and
assistive-technology review remain required.

## Configurable product name

`src/config/product.ts` reads the display-safe
`NEXT_PUBLIC_PRODUCT_NAME` environment value and uses
`Cardiometabolic Early Detection & Control` as a provisional fallback. UI and
metadata consume that shared configuration. The final brand name is not treated
as approved by this implementation.

## Mocked and deferred behavior

All displayed records and current-state values are synthetic. The following are
intentionally absent or non-functional:

- Account creation, authentication, sessions, and authorization
- OTP delivery and verification
- OTP expiry, resend timing, attempt limits, rate limits, provider, and fallback
  recovery behavior
- Data persistence, APIs, imports, verification, and derivation
- Consent document text, versioning, jurisdiction rules, recording, and withdrawal
- Approved country/market inventory and market-specific behavior
- Exact measurement types, fields, units, validation, and history semantics
- Exact cardiometabolic questionnaire and questionnaire fields
- Clinical thresholds, formulas, scores, diagnoses, or interpretations
- Treatment, medication, recommendation, or escalation behavior
- Real trends, summaries, and clinical explanations
- Analytics, telemetry, and production observability

## Data provenance

The presentation layer supports exactly four approved labels:

- User Entered
- Imported
- Verified
- System Derived

The labels do not implement or imply verification standards, import trust,
derivation logic, or clinical validity. Those semantics require approved rules
and traceable backend implementation.

## Known product and technical dependencies

Implementation beyond the shells depends on approval or provision of:

1. Final brand name and brand token values.
2. Authentication journeys, session rules, role/permission model, account
   recovery, and account deletion behavior.
3. OTP policy, security controls, provider, fallback, and abuse-prevention rules.
4. Consent content, versioning, jurisdiction mapping, audit requirements, and
   withdrawal behavior.
5. Supported country/market inventory and localization requirements.
6. Approved, versioned measurement inventory and validation specifications.
7. Approved, versioned questionnaire specification.
8. Approved, deterministic clinical calculation and explanation specifications.
9. Backend API contracts, persistence model, migrations, and health-data access
   control design.
10. Privacy, security, audit, retention, deletion, analytics, and observability
    requirements.
11. Accessibility acceptance criteria and supported browser/device matrix.

Any material product decision must be reconciled with the Master PRD before
implementation. Clinical behavior additionally requires an explicitly approved
and versioned clinical specification with boundary, missing, invalid, unit, and
edge-case tests.
