# HILERA Visual Implementation — Design QA

## Comparison target

- Source visual truth: `C:\Users\USER\Projects\Cardiometabolic\docs\design\hilera\brand foundation\figma 17 pages\01_Landing.svg` through `17_Global_Error_Not_Found.svg`, together with the supporting brand-token and locked-logo sheets in the same directory.
- Primary implementation URL: `http://127.0.0.1:3004/` and the eleven additional requested routes.
- Historical desktop implementation capture path: `C:\Users\USER\AppData\Local\Temp\hilera-design-qa-20260901\final-desktop-01-landing.png` through `final-desktop-12-risk-summary.png`.
- Historical mobile implementation capture path: `C:\Users\USER\AppData\Local\Temp\hilera-design-qa-20260901\final-mobile-01-landing.png` through `final-mobile-12-risk-summary.png`.
- Historical combined comparison path: `C:\Users\USER\AppData\Local\Temp\hilera-design-qa-20260901\normalized-comparison-1.png`, `normalized-comparison-2.png`, `normalized-comparison-3.png`, and `final-latest-landing-comparison.png`.
- Current implementation evidence: fresh full-page captures of all 12 desktop routes and representative mobile captures were inspected in the Codex in-app Browser on 2026-09-21. They were deliberately not added to the repository as transient build artifacts.

## Viewport and normalization

- Desktop CSS viewport: 1440 × 1024 at device pixel ratio 1.
- Mobile CSS viewport: 390 × 844 at device pixel ratio 1.
- Source SVGs were rendered at their intrinsic view boxes and normalized beside the implementation captures so that browser chrome, panel padding, and source density did not create false layout findings.
- Comparisons used matching routes and the default synthetic/empty product state. Desktop and mobile captures were reviewed independently.

## States reviewed

- Public: landing, sign up, and sign in.
- Authentication: active email-and-password sign-up and sign-in shells, plus inactive legacy route notices.
- Onboarding: progressive profile, date-of-birth, market-context, and consent presentation.
- Authenticated application: dashboard, generic measurement entry, measurement history, trends empty state, and risk-summary readiness state.
- Supporting states: error, not found, all eight approved product states, and all four approved provenance labels.

## Browser verification

- Confirmed every requested route renders at desktop and mobile widths with no horizontal overflow.
- Confirmed every route has an appropriate footer or compact app legal strip.
- Confirmed landing account creation navigates to `/sign-up`.
- Confirmed sign-up and sign-in expose labeled email and password fields without submitting, persisting, or logging values.
- Confirmed the active public navigation does not link to the legacy `/auth`, identifier, or verification-code routes.
- Confirmed authenticated navigation moves from the dashboard to `/app/trends` and exposes the current route with `aria-current`.
- Confirmed the mobile app navigation reflows without clipped items or horizontal scrolling.
- A fresh browser tab reported no console errors or warnings after the root smooth-scroll declaration was corrected.
- Automated keyboard traversal focused the skip-to-content link first and exposed a solid visible focus outline with an offset. Semantic control order, labels, landmarks, and the remaining `:focus-visible` styling were also inspected in the rendered DOM and source.
- A fresh 2026-09-21 pass confirmed all 12 routes expose the expected heading and footer, have zero horizontal overflow at both target widths, and keep visible mobile controls at approximately 43–44 pixels or taller.

## Full-view comparison evidence

The three normalized route comparison sheets were inspected with source and implementation in the same visual input. The implementation retains the source system’s forest/cream balance, editorial heading hierarchy, quiet card surfaces, restrained borders, generous whitespace, two-column public layouts, compact application shell, and deliberately sparse health-data states. The final landing comparison verifies the corrected headline wrapping and hero proportions.

## Focused-region comparison evidence

- Brand lockup: the exact vector geometry and wordmark from the approved `Locked-Logo > Brand-Lockup` source group were extracted to `public/hilera-lockup.svg`; no substitute or redrawn mark was used.
- Landing hero: heading line breaks, media-panel scale, call-to-action grouping, and cream/mist surface balance were compared after the final adjustment.
- Authentication cards: title scale, credential-field rhythm, notices, and footer placement were reviewed across desktop and mobile.
- Application shell: sidebar/header hierarchy, selected navigation state, compact footer strip, card density, and mobile navigation wrapping were reviewed.
- Health empty/readiness states: history provenance presentation, trends empty canvas, generic measurement shell, and risk-summary structural state were compared without adding prohibited clinical content.

## Required fidelity surfaces

- Fonts and typography: major headings use the approved editorial-serif direction through a robust Georgia-based stack; application UI uses an Inter-style system sans stack. Hierarchy, line height, wrapping, weights, and small-label legibility were checked at both target widths.
- Spacing and layout rhythm: public, auth, onboarding, and app grids follow the reference proportions; card padding and app density were tightened during the first QA iteration. Responsive stacking and footer spacing were checked on all routes.
- Colors and visual tokens: the approved HILERA palette is centralized in semantic CSS variables. Components consume semantic tokens rather than scattering raw brand colors.
- Image quality and asset fidelity: the locked HILERA logo is the supplied vector asset. No stock photography or generated substitutes were introduced. Landing and onboarding use intentional media-ready containers because final imagery is not yet approved.
- Copy and content: visible copy follows the supplied screens where it does not create unapproved medical, authentication, legal, market, or measurement behavior. Restricted details remain neutral or explicitly deferred.

## Findings

No actionable P0, P1, or P2 findings remain.

Accepted, intentional deviations from the SVG references:

- Decorative iconography and illustration details that were not supplied as approved reusable assets were not recreated with CSS art, improvised SVGs, or substitutes.
- Sign-up and sign-in use the newly approved email-and-password model rather than the older method-selection artwork.
- The identifier and verification-code references are represented only by inactive legacy route notices because phone authentication and network-delivered verification codes are deferred.
- The onboarding market selector does not pre-populate the example country shown in the artwork because the approved market inventory is still pending.
- The trend line shown in the visual reference is replaced by a polished insufficient-history state to avoid fabricating a clinical trend.
- Risk-summary score, classification, percentage, interpretation, and escalation content is omitted pending an approved clinical specification.
- Footers may extend the page beyond the fixed source-artboard height because every main route is required to include an appropriate footer.

## Comparison history

### Iteration 1

- Finding: the landing page repeated an information section beneath the hero, creating extra above-the-fold density.
  - Fix: removed the duplicate content and aligned the page to the approved hero structure.
- Finding: landing headline scale and wrapping produced five lines rather than the source’s four-line editorial composition.
  - Fix: adjusted hero grid proportions and typography, then set intentional line grouping for the approved copy.
- Finding: auth, onboarding, and application surfaces were visually oversized relative to the source.
  - Fix: tightened heading sizes, card padding, navigation density, and inter-section spacing.
- Finding: narrow-screen application navigation depended on clipped horizontal scrolling.
  - Fix: replaced the mobile overflow behavior with a touch-friendly, wrapping grid.

### Iteration 2

- Post-fix evidence: `normalized-comparison-1.png`, `normalized-comparison-2.png`, and `normalized-comparison-3.png` show the complete route set after density and responsive corrections.
- Final landing evidence: `final-latest-landing-comparison.png` shows the corrected hero hierarchy and wrapping.
- Result: no remaining P0/P1/P2 mismatch. The deviations listed above are required product-safety or asset-approval constraints, not unfinished visual defects.

### Iteration 3 — current worktree revalidation

- Finding: the sign-up screen repeated an SVG sentence promising that another verified identifier could be added later, but no approved requirement established multi-identifier account behavior.
  - Fix: removed the unsupported multi-identifier promise. The later approved email-and-password decision supersedes this intermediate method-selection shell.
- Finding: the architecture document described narrow-screen application navigation as a horizontal strip even though the implementation intentionally uses a wrapping grid.
  - Fix: corrected the documentation to match the verified responsive behavior.
- Finding: the QA report named a non-existent `17_Error_404.svg` file.
  - Fix: corrected the source reference to `17_Global_Error_Not_Found.svg` and recorded the current in-app Browser revalidation.
- Finding: the current Next.js development console reported that the root element did not declare its intentional smooth-scroll behavior.
  - Fix: added Next.js's `data-scroll-behavior="smooth"` declaration to the root `<html>` element while retaining the existing reduced-motion override.
- Post-fix evidence: all 12 routes were rendered at 1440 × 1024 and 390 × 844 in the Codex in-app Browser. All expected headings and footers were present, horizontal overflow was zero, and representative full-page desktop/mobile captures were visually inspected.

### Iteration 4 — approved MVP authentication update

- Finding: the previous visual implementation still presented phone/email method selection and verification codes as the active authentication journey.
  - Fix: replaced active sign-up and sign-in with labeled, non-submitting email-and-password shells.
- Finding: legacy authentication routes could still present their previous forms when visited directly.
  - Fix: retained the route files but replaced their active controls with clear deferred-route notices and links back to sign-in or sign-up.
- Boundary: no password rules, recovery mechanism, email verification, backend contract, persistence, session, provider, or authentication service was introduced.

## Implementation checklist

- [x] Exact approved HILERA lockup used.
- [x] Approved palette mapped to semantic tokens.
- [x] All 12 requested routes visually implemented.
- [x] Shared public, auth, onboarding, app, and health components used.
- [x] Desktop and mobile layouts checked without horizontal overflow.
- [x] Primary navigation and non-sensitive mock interactions checked.
- [x] Active authentication routes match the approved email-and-password MVP model.
- [x] Console checked for errors and warnings.
- [x] Clinical, authentication-policy, backend, analytics, and persistence inventions excluded.

final result: passed

## MVP Expansion Bundle 1

The 7 November 2026 approval covers chronological History, repeat entry UX,
the dashboard hierarchy, Education-to-action links, and shared app navigation.
History search and filtering (HIL-RD-002) are excluded.

- **History and entry:** History shows ordered sample dates, record identity,
  all four provenance labels, and a keyboard-operable details disclosure.
  Entry explains measurement, date and source context and links to History.
  Save and all measurement controls are disabled. The preview uses no real
  measurements.
- **Dashboard and Education:** Dashboard prioritises sample setup progress and
  one setup action. Recent information and monitoring have separate sections.
  Education connects a product-use explanation to History. Risk Awareness
  Summary links to Education and Trends retains the insufficient-history state.
- **Shared presentation:** All six routes use the existing shell, locked logo,
  brand tokens and legal strip. The mobile navigation wraps to show all six
  destinations. Active navigation is visible and uses `aria-current`.

Chromium QA rendered Dashboard, Add Health Information, History, Trends,
Risk Awareness Summary and Education at 1440 × 1024 and 390 × 844. All 12
renders had one H1, the main landmark, a footer, the locked logo, and no
horizontal overflow. Navigation targets measured 44 px. Keyboard checks
covered the skip link, Dashboard → Education, Entry → History and the History
details disclosure. Browser checks also covered labelled and disabled entry
controls, provenance, readiness states, and the absence of History search and
filter controls. The only console finding was the existing missing favicon
request. Small app section labels now use the approved Deep Green token for
stronger contrast. This was a focused browser review.

AppDeploy hosts a separate static frontend test preview. Its deployment
overlay keeps the locked SVG, labels the public preview for fictional data,
and removes native form field names so an early submission carries no field
values. The application still has no backend, persistence, clinical logic,
approved measurement inventory, or API/database changes.

## Editorial Health Journal visual QA

The approved task specification supplied the design reference for this review.
The journal theme uses a Cream canvas, Ink reading text, editorial serif
headings, Forest state panels and Mist notices. History uses divided rows,
and the narrower application shell uses a native journal navigation disclosure
with the same six destinations as the desktop sidebar. Landing and Onboarding
retain media-ready space for approved photography.

Before and after Chromium captures cover Landing, Sign up, Sign in, Onboarding,
Overview, Add a measurement, Past measurements, Changes over time, Health risk
summary and Health guides at 1440 × 1024 and 390 × 844. The browser matrix
also covers 320 px and 768 px layouts and real Chrome 200% zoom. The narrow
app header retains both Preview and Account indicators. The measurement form
retains its labels and disabled fields, with short placeholders that fit at
320 px. Onboarding fields align within each grid row and Landing's decorative
motif clears the copy and hides at phone widths.

Focused keyboard and browser checks covered skip-to-content, headings and
landmarks, visible focus, form labels, current-page navigation, disclosure
operation, touch target sizing, sampled contrast and preview-only actions.
Browser interactions confirmed that credentials do not submit, setup and guide
links reach their existing destinations, and sample record details still expand.
The production-like console review found the existing missing favicon request.
This was a focused accessibility review. Formal assistive-technology coverage
remains separate.
