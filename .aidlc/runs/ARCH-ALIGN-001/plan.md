# Plan: Align portal to platform-docs/standards

- **Task ID**: `ARCH-ALIGN-001`
- **Mode**: `hard`
- **Story**: US-ARCH-001
- **Sprint**: 01

## Scope
- Outcome:
- Decision: REUSE | EXTEND | CREATE | REMOVE
- Impact (codebase-memory trace_path / serena find_referencing_symbols):

## Requirements
<!-- FR-1: ... / AC-1: Given ... When ... Then ... (every FR has >=1 AC; out of scope listed). Link small spec/ADR files (`.aidlc/specs/x.md`), don't paste them. -->
- FR-1: portal follows [backend-go.md](../../../../platform-docs/standards/backend-go.md), [platform-go.md](../../../../platform-docs/standards/platform-go.md), [frontend.md](../../../../platform-docs/standards/frontend.md).
- AC-1: Given the aligned code When `archcheck.py` runs Then 0 violations and `.aidlc/arch-baseline.txt` has no entries.
- AC-2: Given the refactor When the existing tests and contract tests run Then all green; moves/renames only, no behavior change.

## Technical definition
<!-- ADR link or decision · NFR: security / performance / availability · engineering constraints. Link small spec/ADR files (`.aidlc/specs/x.md`), don't paste them. -->
- [constitution.md](../../../../platform-docs/standards/constitution.md) · [coding-standards.md](../../../../platform-docs/standards/coding-standards.md)
- NFR: no API/DB/event change; one slice per session; every slice leaves build + tests green.

## UX
<!-- flow · design tokens used · wireframe/mockup link · UX requirements per screen. Link small spec/ADR files (`.aidlc/specs/x.md`), don't paste them. -->
- No UX change: data calls move from features/ to lib/api, sample data moves to tests.

## Design
<!-- modules/components · API contract (method path req/resp/errors) · DB schema/migration · state + error handling · external integration. Link small spec/ADR files (`.aidlc/specs/x.md`), don't paste them. -->
- Debt list: `.aidlc/arch-baseline.txt`; old->new mapping: backend-go.md § Mapping.
- A package move rewrites import paths in its importers: that is why whole `internal/` + `cmd/` are planned.
- After each slice: delete its lines from the baseline (`archcheck.py --write-baseline` only shrinks).

## Files planned
<!-- one path per line, `- path`. A trailing / approves the whole directory. -->
- app/
- features/
- components/
- lib/

## Tests planned
<!-- TC-id | AC | layer | command -->
- TC-1 | AC-1 | arch | `python3 ~/agent_skills/sdlc/engine/archcheck.py`
- TC-2 | AC-2 | unit | `npm test`

## Slices
<!-- one per worker session, small: `- [ ] S1: outcome (files: a.go, b_test.go; test: go test ./x -run TestY)`.
     files = its input (subset of Files planned), test = its output check. `sdlc.py next` prints the card. -->
- [ ] S1: FE-03 features/inventory/shelves-view.tsx (files: features/inventory/shelves-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
- [ ] S2: FE-03 features/production/food-plans-view.tsx (files: features/production/food-plans-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
- [ ] S3: FE-03 features/production/orders-view.tsx (files: features/production/orders-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
- [ ] S4: FE-03 features/production/targets-view.tsx (files: features/production/targets-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
- [ ] S5: FE-03 features/sales/pricing-floor-view.tsx (files: features/sales/pricing-floor-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
- [ ] S6: FE-05 components/navbar.tsx (files: components/navbar.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)

## Risks / rollback

## Open decisions
<!-- tag every claim without file:line as ASSUMED, in square brackets, until resolved -->
