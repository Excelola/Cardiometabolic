# Frontend architecture

## Purpose and authority

This document describes implementation decisions for the Next.js frontend
foundation and approved HILERA visual system. The Google Drive Master PRD
remains authoritative for product vision, requirements, journeys, rules,
permissions, scope, and approved decisions. Master PRD sections 1–6 were stated
as approved for this task.

The foundation deliberately does not fill gaps in the product or clinical
specification. A visible shell is not evidence that its backend behavior,
policy, field inventory, or clinical semantics have been approved.

## Runtime architecture

- Next.js with the App Router provides file-system routing, layouts, metadata,
  Server Components, error handling, and production builds.
- TypeScript uses strict mode. Domain strings are modeled as readonly literal
  unions so unapproved values cannot be introduced casually.
- Pages and display components are Server Components by default. The route
  shells and generic measurement form remain Server Components. Two small Client
  Components handle current-route navigation state and prevent preview forms
  from submitting sensitive values; only serializable content crosses those
  boundaries.
- There is no backend, database, authentication provider, session, API route,
  persistence, analytics, or external integration in this foundation.
- The UI does not log identifiers, health data, secrets, or form values.

## Route structure

| Route | Purpose | Current behavior |
| --- | --- | --- |
| `/` | Landing page | HILERA public shell with image-ready hero media |
| `/sign-up` | Sign-up entry | Email-and-password account-creation shell; no persistence |
| `/sign-in` | Sign-in entry | Email-and-password sign-in shell; no session creation |
| `/auth` | Legacy authentication route | Inactive notice with links to the approved sign-in and sign-up routes |
| `/auth/identifier/[channel]` | Legacy identifier route | Retained inactive shell for old `phone` and `email` deep links |
| `/auth/verify` | Legacy verification route | Retained inactive shell; verification codes are not in the MVP journey |
| `/onboarding` | Progressive onboarding | Approved basic profile field shell plus deferred consent and image-ready areas |
| `/app` | Application entry | Redirects to the dashboard shell |
| `/app/dashboard` | Dashboard | Synthetic workflow state, one setup action, recent-information and monitoring sections, and a workflow-state disclosure |
| `/app/measurements/new` | Generic measurement entry | Placeholder measurement, date and source context with a direct link to History. Saving is disabled |
| `/app/measurements/history` | Measurement history | Chronological synthetic records with date, identity, provenance and inline details |
| `/app/trends` | Trend view | Polished insufficient-history shell with no fabricated trend |
| `/app/risk-summary` | Risk Awareness Summary | Structural readiness shell with no score or clinical interpretation |
| `/app/education` | P0 Education shell | Product-use guidance with an action to review History. Medical content awaits approval |

The `/app` prefix is an organizational route in this foundation, not an access
control boundary. Real authentication and authorization must be enforced on the
server once approved session and permission requirements exist.

The active MVP authentication journey begins directly at `/sign-up` or
`/sign-in`. No current navigation links to the legacy `/auth` routes. Those
files remain only until a separate route-cleanup decision is approved.

## Approved MVP Expansion Bundle 1

The 7 November 2026 product decision covers Health History IA (HIL-RD-001),
repeat entry UX (HIL-RD-003), dashboard hierarchy (HIL-RD-004), Education to an
existing action (HIL-RD-005), and shared app navigation and presentation
(HIL-RD-006). The Master PRD was synced externally.

The six app surfaces reuse the AppShell, AppNavigation, PageTitle, cards and
buttons. The history row reuses ProvenanceBadge and reveals available record
context with native HTML disclosure. Entry retains the shared non-submitting
form and generic measurement definition. Education uses static product guidance.
History search and filtering (HIL-RD-002) remain a separate decision.

The preview uses synthetic display metadata. Backend, API, database, migration,
persistence, clinical rules and the production measurement inventory remain
outside Bundle 1.

## Component structure

```text
src/components
├── brand/        exact approved HILERA lockup presentation
├── app/          authenticated shell and product-state presentation
├── auth/         shared authentication cards and email/password fields
├── health/       generic measurement and provenance components
├── onboarding/   progressive-step presentation
├── site/         public header and footer
└── ui/           reusable buttons, cards, fields, badges, notices, media, and empty states
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

`src/app/globals.css` maps the approved HILERA palette to semantic custom
properties. Raw palette values are declared once at the root; components consume
semantic aliases rather than scattering color values:

- `--color-primary`
- `--color-surface`
- `--color-background`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-border`
- `--color-warning`
- `--color-critical`

The approved palette is Forest `#1F3D2E`, Deep Green `#355E46`, Sage `#7FA387`,
Mist `#DCE6D9`, Cream `#F7F4ED`, Warm Sand `#D8A77A`, Ink `#183029`,
Secondary Text `#64736B`, Border `#D9E1DB`, and White `#FFFFFF`. Supporting
tokens cover focus, contrast, spacing, radius, shadow, and content width. Major
headings use the approved Georgia-style editorial serif stack; application UI
uses an Inter-style system stack without a remote font dependency.

The locked logo is extracted without redrawing from the approved
`13_Brand_Tokens_Locked_Logo.svg` `Brand-Lockup` group and is served as
`public/hilera-lockup.svg`. Shared `HileraLogo` and `BrandLockup` components are
the only product UI entry points for that asset.

Accessibility foundations include semantic landmarks, explicit labels,
described-by relationships, keyboard-visible focus, a skip link, sufficient
touch target sizing, reduced-motion handling, responsive navigation, and text
alternatives for placeholder visualizations. Formal accessibility testing and
assistive-technology review remain required.

## Configurable approved product name

`src/config/product.ts` reads the display-safe
`NEXT_PUBLIC_PRODUCT_NAME` environment value and uses
`HILERA` as the approved fallback. UI and metadata consume that shared
configuration; no route embeds an alternate product name.

## Responsive shells, footers, and media readiness

- Public, authentication, and onboarding routes share the HILERA public header
  and footer. The footer exposes Privacy and Terms areas and a concise product
  boundary without inventing legal policy or claims.
- `/app` routes share a responsive application header, current-route navigation,
  sidebar, content frame, and compact legal strip. `/app` remains a frontend
  namespace rather than an authorization boundary.
- Landing and onboarding use the shared `MediaFrame` architecture so future
  approved HILERA imagery can be inserted without restructuring either route.
  No stock imagery or decorative imagery was added to health-data screens.
- Desktop grids collapse deliberately at tablet and mobile breakpoints. Forms,
  state cards, history rows, navigation, and actions stack without horizontal
  page overflow; application navigation becomes a keyboard-accessible wrapping
  grid on narrow viewports.

## Mocked and deferred behavior

All displayed records and current-state values are synthetic. The following are
intentionally absent or non-functional:

- Account creation, authentication, password persistence, sessions, and authorization
- Password complexity, expiry, recovery, lockout, and rate-limit behavior
- Email ownership verification
- Phone authentication and network-delivered verification codes
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

1. Approved production imagery and any final asset-delivery requirements.
2. HILERA backend authentication contracts, password hashing and storage
   implementation, production session infrastructure, and authorization design.
   Plaintext passwords must never be stored by that future implementation.
3. Password policy, session duration, account recovery, email ownership
   verification, account lockout, rate-limit, role/permission, and account
   deletion behavior.
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
