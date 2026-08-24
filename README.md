# DCenter Portal

Operator console for the DCenterVN resort platform.

V1 focuses on the Resort IAM control plane:

- users, resort onboarding and membership/RBAC visibility;
- Vietnam location lookup;
- guarded API Lab through a server-side BFF;
- audit metadata for operator actions.

The portal is a standalone repository. It is not part of a production monorepo.

## Local development

Node and pnpm versions are pinned via `.mise.toml`. Strictly use `pnpm` (`packageManager` enforced via Corepack). Do NOT run `npm` or `yarn`.

```bash
mise install
pnpm install
pnpm run dev
```

Open `http://localhost:3000`.

Local auth defaults to a dev operator:

```text
PORTAL_AUTH_MODE=dev
PORTAL_DEV_OPERATOR=dawnmorality
PORTAL_GITHUB_TEAM=platform-operators
```

Production must use GitHub Organization SSO and service JWT credentials from
Secrets. Do not expose auth/org internal APIs through Kong.

## Architecture

Next.js App Router is used because API Lab and internal service credentials must
stay server-side. The browser calls only portal BFF operations:

```text
POST /api/operations/{operation_id}
GET  /api/audit
GET  /healthz
GET  /readyz
```

The BFF accepts only registered operation IDs, never arbitrary URLs. Sensitive
operations that return credentials are blocked in production.

## Verification

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm test
```
