VERDICT: PASS

| ID | File:line | Finding / reproduced behavior | Severity / disposition |
| --- | --- | --- | --- |
| R2-1 | `lib/api/auth-journey-bff.ts:49–53` | Real Next adapter constructs `https://localhost:3000/api/auth/login`; public `Origin: https://portal.test` plus `Sec-Fetch-Site: same-origin` now passes for customer and employee login, with either public or internal Host. Foreign Origin with `cross-site`, `same-site`, or absent Fetch Metadata returns **403, zero upstream calls, no Set-Cookie**. | Closed; no blocking regression found. |
| R2-2 | `lib/api/auth-journey-bff.ts:12–22`, `:71–74` | Both Round 2 malformed error bodies and additional malformed/scalar/array bodies publish no injected token. Recognized errors use an explicit public projection; unrecognized bodies become sanitized 503 errors. Upstream cookies are omitted. | Closed; no blocking regression found. |
| R3-I1 | `lib/api/auth-journey-bff.ts:25–30`, `:52` | Production without `NEXT_PUBLIC_SITE_URL` rejects requests lacking Fetch Metadata, even if their Origin is the public portal origin. Requests carrying `same-origin` metadata still pass. | Informational; acceptable fail-closed behavior for this browser BFF. Configure the public origin for clients that omit Fetch Metadata. |
| R3-I2 | `lib/api/auth-journey-bff.ts:49–53` | With neither Origin nor Sec-Fetch-Site, a request returns **403, zero upstream calls, no cookie**, including a request whose URL matches the configured public origin. Absent Origin with `same-origin` metadata passes; `none` is rejected. | Informational; acceptable provenance requirement, not a new defect. |

Independent in-place review (`in-place:true`) of branch `portal-auth-split`, uncommitted tree versus HEAD `77039a5152db31777036bdecf0241ef74024d96a`. Scope is exclusively R2-1, R2-2, and defects introduced by those fixes. No style findings or broader auth-split approval. Only this repository report was written; implementation, tests, plans, baselines, and existing reports were untouched.

## Verification

Fresh focused run, exit 0: **4 files, 167 tests passed** (`lib/api/auth-review-fix.test.ts`, `lib/api/auth-journey-bff.test.ts`, `app/api/auth/bff.test.ts`, `app/api/auth/staff/bff.test.ts`). Command: `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5 node node_modules/vitest/vitest.mjs run` followed by those four paths.

Separate executable probe: `/tmp/portal-auth-round3.cjs`; output `/tmp/portal-auth-round3.log`; **144 asserted checks passed**, exit 0. It transpiles the current source in memory, substitutes only `server-only` and upstream fetch, and invokes the installed Next implementation's `NextNodeServer.prototype.attachRequestMeta` and `NextRequestAdapter.fromNodeNextRequest`. Every adapted request is asserted to have the internal HTTPS listener URL. The login route exports directly delegate to the reviewed `loginJourney` implementation.

| Adapter scenario | Coverage | Result |
| --- | --- | --- |
| Public Origin + same-origin metadata | Both journeys × public/internal Host | 200; customer 2 upstream calls, employee 4; accepted session cookies present. |
| Foreign Origin + cross-site / same-site / missing metadata | Both journeys × both Hosts × 3 cases | All 12 return 403, 0 upstream calls, no cookies. |
| Matching public Origin + cross-site / same-site | Both journeys × both Hosts | 403, 0 upstream calls, no cookies. |
| Matching public Origin, missing metadata | Both journeys × both Hosts, configured public origin | 200. Listener/Host do not determine the decision. |
| Missing Origin + same-origin metadata | Both journeys × both Hosts | 200. |
| Missing both headers; missing Origin + none metadata | Both journeys × both Hosts | 403, 0 upstream calls, no cookies. |
| Production, site URL unset | Public/absent Origin × present/absent same-origin metadata | Same-origin metadata: 200. Missing metadata: 403, 0 upstream calls, no cookies. |

Error reproduction covers **10 malformed bodies × 10 real error boundaries = 100 checks**: initial login, customer mutation, invite acceptance, context listing, context authorization lookup, explicit context switch, profile lookup, platform lookup, staff context lookup, and automatic staff context switch. Bodies include both R2-2 reproductions, credential-bearing nested data/validation extras, absent or invalid error codes, unknown objects, null, arrays, strings, and numbers. All responses are token-free and cookie-free. Recognized legacy codes remain projected; unrecognized bodies become `INTERNAL_ERROR`. Existing focused tests also verify validation field names/messages, retry metadata, and Retry-After preservation. Staff login failures after temporary session creation still attempt upstream logout; those additional calls were included in the assertions.

## Decisions and limits

The metadata-first gate deliberately does not compare Origin when `Sec-Fetch-Site: same-origin` is present. This resolves the listener/public-origin mismatch and relies on trustworthy browser Fetch Metadata reaching the BFF. Client-supplied Host and forwarding headers do not grant access. Non-browser clients are not universally blocked: with configuration, a matching Origin and no Fetch Metadata passes; they can also supply same-origin metadata. These headers establish browser request provenance, not user identity or authorization.

Requests with no provenance headers cannot establish same-origin status from the listener URL, so rejecting them is acceptable. Production without public-origin configuration is likewise acceptable fail-closed behavior, with a compatibility cost for browsers/clients omitting Fetch Metadata. This does not block current same-origin browser traffic carrying the header.

The error guarantee is explicit projection of public error fields and exclusion of credential-bearing payload fields. It is not arbitrary secret detection inside an upstream public message string. No introduced defect requiring that broader guarantee was established.

No live TLS listener, reverse proxy, backend, or browser journey was started. Next request construction is real; upstream behavior is mocked. No source mutations, full-suite rerun, lint, typecheck, or deployment claim was needed for this read-only scope.

Graph project listing succeeded; graph search and coverage were rejected by automatic approval review under the never-approval policy. Bounded direct source reads supplied the evidence. `hs-run review next --effort low` ran with harness data/state redirected to `/tmp`; exit 10 reported the broader tree's structural/high-risk scope. That preflight is guidance, not a ship receipt; the user-authorized two-fix scope was retained.

## Handoff

Where it started: Round 2 blocked on R2-1 and R2-2. Decisions locked: both fixes reproduced successfully; no new defect found within scope. Key files: `lib/api/auth-journey-bff.ts`, `lib/api/auth-review-fix.test.ts`, and this report. Running state: none. Deferred questions: none blocking; configuration/provenance compatibility limits are documented above. Pick up here: coordinator may consume this scoped PASS; no commit, push, or ship was performed.
