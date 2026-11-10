# PR #6 development dependency audit

The baseline at e447edc8ced7843a467034198fad30dc2c045ad5 had 6 High, 10 Moderate and 1 Low audit entries. The six High entries represent four distinct advisories. The two brace-expansion advisories each affected two installed version lines.

| Advisory | Installed version | Patched range reported by pnpm | Exact paths below | Exposure |
| --- | --- | --- | --- | --- |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) / CVE-2026-102278 | brace-expansion 1.1.18 | >=1.1.20 | A, 85 paths | Lint |
| GHSA-qhr7-859c-m2p7 / CVE-2026-102278 | brace-expansion 5.0.9 | >=5.0.11 | B, 11 paths | Lint |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) / CVE-2026-102276 | brace-expansion 1.1.18 | >=1.1.19 | A, same 85 paths | Lint |
| GHSA-6j4f-fj2g-mc7p / CVE-2026-102276 | brace-expansion 5.0.9 | >=5.0.10 | B, same 11 paths | Lint |
| [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) / CVE-2026-112942 | Vite 8.2.2 | >=8.2.4 | C, 2 paths | Vitest tooling |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) / CVE-2023-54404 | Zod 4.4.3 | >=4.6.6 | D, 2 paths | Lint |

## Remediation

- Normal pnpm resolution moved brace-expansion 1.1.18 to 1.1.21 and Zod 4.4.3 to 4.6.7. The React Hooks plugin accepts Zod 4, including through its validation helper's peer dependency.
- Vitest and its coordinated packages moved from 4.1.11 to 4.1.12, including the fixes for both Moderate mocker advisories. Normal pnpm updates retained Vite 8.2.2 and brace-expansion 5.0.9. pnpm also rejected explicit version selectors for those indirect dependencies.
- Two parent-scoped overrides set Vite 8.2.4 for Vitest 4.1.12 and brace-expansion 5.0.12 for minimatch 10.2.6. Both fit the published parent ranges (^6.0.0 || ^7.0.0 || ^8.0.0 and ^5.0.8, respectively). Remove the overrides when normal resolution selects patched versions. Next.js and eslint-config-next remain at 16.4.6.
- The production audit reports zero findings. The full audit reports zero Critical or High and two Moderate.

## Remaining development-tooling risk

- esbuild 0.18.20 via drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils > esbuild. Core utils 3.3.2 declares esbuild ~0.18.20, outside the fixed range >=0.25.0. Exploitation requires a vulnerable esbuild development server reachable from a malicious web page. HILERA uses this chain for migration tooling and uses Next.js for serving. Keep the loader out of serving workflows and follow Drizzle's loader migration. [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- minimatch 10.2.6 via all 11 paths in B with the final brace-expansion hop removed. @typescript-eslint/typescript-estree 8.68.0 declares minimatch ^10.2.2. The fix starts at 11.0.1, outside that range. Exploitation requires a crafted glob pattern reaching minimatch with optimization level 2 or higher. HILERA's lint command uses the checked-in configuration and a fixed target. Keep attacker-supplied patterns out of lint automation and follow a compatible typescript-eslint update. [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)

Both findings are outside the production graph. Track them as development-tooling follow-ups without an incompatible override. This record does not grant risk acceptance on behalf of the Product Owner.

## Verification

Frozen install, lint, typecheck, production build and Drizzle metadata validation passed. The standard test run passed 36 unit tests with the three PostgreSQL cases skipped. On disposable loopback PostgreSQL 18.6, the dedicated integration run passed 3 of 3 cases, including the restore drill, and the full suite passed 39 of 39 tests with no skips.

## Exact baseline dependency paths

Paths start at the HILERA direct dependency and omit pnpm's root marker. Expand NEXT to eslint-config-next. In A, append all three displayed suffixes to each ESLint prefix to recover all 85 paths, including the separate direct minimatch paths.

### A. brace-expansion 1.1.18

Suffixes

```text
> minimatch > brace-expansion
> @eslint/config-array > minimatch > brace-expansion
> @eslint/eslintrc > minimatch > brace-expansion
```

ESLint prefixes

```text
eslint
NEXT > @next/eslint-plugin-next > @eslint-community/eslint-utils > eslint
NEXT > eslint
NEXT > eslint-import-resolver-typescript > eslint
NEXT > eslint-import-resolver-typescript > eslint-plugin-import > eslint
NEXT > eslint-import-resolver-typescript > eslint-plugin-import > eslint-module-utils > @typescript-eslint/parser > eslint
NEXT > eslint-import-resolver-typescript > eslint-plugin-import > eslint-module-utils > eslint
NEXT > eslint-import-resolver-typescript > eslint-plugin-import > @typescript-eslint/parser > eslint
NEXT > eslint-plugin-import > eslint
NEXT > eslint-plugin-import > eslint-module-utils > @typescript-eslint/parser > eslint
NEXT > eslint-plugin-import > eslint-module-utils > eslint
NEXT > eslint-plugin-import > eslint-module-utils > eslint-import-resolver-typescript > eslint
NEXT > eslint-plugin-import > @typescript-eslint/parser > eslint
NEXT > eslint-plugin-jsx-a11y > eslint
NEXT > eslint-plugin-react > eslint
NEXT > eslint-plugin-react-hooks > eslint
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/parser > eslint
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/type-utils > @typescript-eslint/utils > @eslint-community/eslint-utils > eslint
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/type-utils > @typescript-eslint/utils > eslint
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/type-utils > eslint
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/utils > @eslint-community/eslint-utils > eslint
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/utils > eslint
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > eslint
NEXT > typescript-eslint > @typescript-eslint/parser > eslint
NEXT > typescript-eslint > @typescript-eslint/utils > @eslint-community/eslint-utils > eslint
NEXT > typescript-eslint > @typescript-eslint/utils > eslint
NEXT > typescript-eslint > eslint
```

Direct minimatch paths

```text
NEXT > eslint-import-resolver-typescript > eslint-plugin-import > minimatch > brace-expansion
NEXT > eslint-plugin-import > minimatch > brace-expansion
NEXT > eslint-plugin-jsx-a11y > minimatch > brace-expansion
NEXT > eslint-plugin-react > minimatch > brace-expansion
```

### B. brace-expansion 5.0.9

```text
NEXT > eslint-import-resolver-typescript > eslint-plugin-import > eslint-module-utils > @typescript-eslint/parser > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > eslint-import-resolver-typescript > eslint-plugin-import > @typescript-eslint/parser > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > eslint-plugin-import > eslint-module-utils > @typescript-eslint/parser > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > eslint-plugin-import > @typescript-eslint/parser > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/parser > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/type-utils > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/type-utils > @typescript-eslint/utils > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > typescript-eslint > @typescript-eslint/eslint-plugin > @typescript-eslint/utils > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > typescript-eslint > @typescript-eslint/parser > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > typescript-eslint > @typescript-eslint/typescript-estree > minimatch > brace-expansion
NEXT > typescript-eslint > @typescript-eslint/utils > @typescript-eslint/typescript-estree > minimatch > brace-expansion
```

### C. Vite 8.2.2

```text
vitest > @vitest/mocker > vite
vitest > vite
```

### D. Zod 4.4.3

```text
NEXT > eslint-plugin-react-hooks > zod
NEXT > eslint-plugin-react-hooks > zod-validation-error > zod
```
