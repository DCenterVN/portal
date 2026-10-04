# Known errors / unresolved prerequisites

| Finding | Observed evidence | Treatment |
|---|---|---|
| Missing UI standard | Initial cat: `.../platform-docs/standards/ui-ux.md: No such file or directory`; standards inventory has frontend.md but no ui-ux.md | Record gap; no new standard outside allowed outputs. Recover and read before cook if provided. |
| Brand doc contradicts requested fonts/sidebar | v4 lines 72–74,88,100 choose Noto Serif/Be Vietnam Pro and dark sidebar | Current explicit prompt overrides; documented in plan. No hidden source-document edit. |
| No hero glass exception | v4 lines 86–87 prohibit all glass and gradients | Gate rejects blur/gradient everywhere, including arbitrary CSS syntax. |
| Generated-token drift | Actual uigen check: `ERROR portal/app/tokens.generated.css drift, run uigen.py tokens --write` | Future update JSON then regenerate together; no live generation this turn. |
| Unrelated operations drift | Actual uigen check: `ERROR portal/lib/contracts/operations.generated.ts drift, run uigen.py operations --write` | Separate ownership; no edit/regeneration here. Full integration check cannot be called passing until resolved. |
| Portal startup blocked | Isolated `npm run dev -- --hostname 127.0.0.1 --port 3199`: listen EPERM, errno -1 | Sandbox cannot bind. No HTTP/font/visual/Lighthouse evidence; rerun later outside restricted runtime. |
| Missing local browser runner | node resolve: @playwright/test and playwright MISSING | Use enabled browser tooling/manual protocol later; no install/package edits during planning. |
| Skill's initial stack search empty | nextjs tailwind --stack nextjs: Found 0 results | One retry font optimization returned next/font/layout guidelines. Original empty match retained honestly. |
| No exact requested font pair returned | Quicksand Nunito query and rounded friendly retry returned other pairs | Prompt-selected pair; do not attribute it to a matching skill record. |
| Brand contrast example differs from table | Dark info example #B9D0F2 vs token-table #8DB8E8, v4 line 46 | Table wins; compute #8DB8E8/bg as 8.57:1. |
| Two invalid text/background uses | Computed light primary/bg 4.33:1, primary/tint 3.89:1; info/tint 4.39:1 | Primary-hover text links; ink text on info-tint badges. Retain exact approved source hexes. |
| Chrome source/output mismatch | Source tokens.json has no chrome; shell-generated CSS does | Resolve after shell handoff; preserve any actual new source key, otherwise use existing aliases. Never hand-edit CSS. |
| Harness shape unresolved | hs-run plan next exited 0 but state unresolved: no phases/phase-*.md | Requested file boundary excludes scaffold, graph and receipt files. No claim of completed harness approval. |
| Implementation checks pending | npm test/lint/typecheck/archcheck/build were not run | These are mandatory future slice gates, not current planning passes. |
| Cross-repo token edit unavailable here | platform-docs is outside current writable project roots | Needs authorized writable checkout before implementation; plan-only cannot solve it by modifying sibling repo. |

The full gate is expected to return 1 on the old brand. `baseline-brand-gate.txt` is a probe transcript, not debt allowance. The positive fixture and nine mutants passed; runtime UI acceptance remains pending.

During gate development, the first positive fixture rejected light info/tint at 4.39:1; the final plan prohibits that pairing and checks allowed ink text instead. An early broad glass regex incorrectly matched business break-glass variables. The final gate checks visual string/selector uses and preserves business terminology, with a positive regression fixture. These fixes did not waive old brand or gradient/blur checks.
