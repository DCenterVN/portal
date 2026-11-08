# AGENTS.md — portal

Operator console UI (Next.js) + BFF for all services.
Does **not** own: credentials/sessions (→ `auth`), final authorization (→ `org`).
Boundary/domain rules: [AI_CONTEXT.md](AI_CONTEXT.md). Workspace map + workflow: [../AGENTS.md](../AGENTS.md).

## Where things live
| Looking for | Path |
|---|---|
| pages / routes | app/<route>/ (login, register, branches, memberships, roles, products, sales, orders, inventory, production, traceability…) |
| feature modules per domain | features/<domain>/ (branches, console, inventory, memberships, production, products, roles, sales, traceability) |
| shared UI components | components/ |
| API clients, BFF helpers | lib/ · app/api/ |
| request proxy / auth guard | proxy.ts |
| i18n messages | messages/ |
| design tokens | app/tokens.generated.css · platform-docs/docs/11-ui-component-standard.md |
| backend contracts | lib/contracts/ |

## Work here
- Specs (feature contract): `docs/specs/` · ADRs: `docs/adr/` · tasks: `docs/tasks/<MÃ>.md`.
- Standards: `../platform-docs/standards/` (frontend.md; **ui-ux.md before any screen work**).
- Code shape: early return, nesting ≤ 2–3, functions ~40 lines, no boilerplate. Reuse before adding (platform-go first).

## Check
```bash
npm test && npm run lint
```
