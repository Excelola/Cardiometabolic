# HILERA frontend

Next.js frontend foundation for HILERA. The approved product name remains
centrally configurable through `NEXT_PUBLIC_PRODUCT_NAME`, with `HILERA` as the
approved fallback.

## Requirements

- Node.js 20.9 or newer
- pnpm

## Local setup

```bash
pnpm install
Copy-Item .env.example .env.local # optional on PowerShell
pnpm dev
```

Only public, display-safe values may use the `NEXT_PUBLIC_` prefix. Never place
secrets, patient information, or sensitive health data in environment examples,
client logs, analytics, fixtures, or commits.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Product and clinical boundaries

The Google Drive Master PRD is the product source of truth. This repository
contains UI shells only. It does not implement clinical thresholds, risk scores,
diagnosis, treatment, medication, escalation, the final measurement inventory,
or the final questionnaire. All examples are synthetic.

See [the frontend architecture](docs/frontend-architecture.md) for the route,
component, state, token, and dependency decisions.
