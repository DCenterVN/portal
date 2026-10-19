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
| backend contracts | contracts/ |

## Work here
- Board first: `.aidlc/planning/board.md` (refresh: `python3 ~/agent_skills/sdlc/engine/sdlc.py board`).
- Stories: `.aidlc/planning/backlog.md` · specs (feature contract, checked by `speccheck.py`): `.aidlc/specs/` · ADRs: `.aidlc/adrs/` · tasks: `.aidlc/runs/<TASK>/plan.md`.
- Pipeline: `discovery > technical > ux > design > build > integration > e2e > release` (`.aidlc/stage-policy.json`). Take one slice card (`sdlc.py next`), load only what it links.
- Standards: `../platform-docs/standards/` (frontend.md; **ui-ux.md before any screen work**). Check: `python3 ~/agent_skills/sdlc/engine/archcheck.py` (debt: `.aidlc/arch-baseline.txt`, fixed by `ARCH-ALIGN-001`).
- Code shape: early return, nesting ≤ 2–3, functions ~40 lines, no boilerplate. Reuse before adding (platform-go first).

## Check
```bash
npm test && npm run lint
```
