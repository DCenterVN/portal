# Customer activation

## Usecase

An email owner opens `/activate?token=…`, chooses and confirms a new password,
and submits explicitly. Opening a new, resent or still-live legacy link sends no
POST. Only the chosen activation password authenticates after activation. Success
shows a fixed `/login` link; it never creates a session or logs in automatically.

Source contract: `contracts/auth.public.yaml`, auth commit
`86294eecfa9aa8c6513da77f5585d960a557edff`, `api/openapi.public.yaml`.
Upstream behavior belongs to auth: `../auth/docs/specs/activation-security.md`
and `../auth/docs/specs/invite.md`; error vocabulary is documented in
`../platform-docs/docs/api/error-code-usage.md`.

## API

| Method | Path | Request | Responses |
|---|---|---|---|
| POST | /api/auth/activate | ActivateRequest | 200, 400, 403, 429, 503 |
| POST | /auth/activate | ActivateRequest | 200, 400, 503 |
| POST | /api/auth/activate/resend | ResendActivationRequest | 202, 400, 403, 429, 503 |

The public BFF requires same-origin JSON, forwards once to the server-only auth
URL, and returns `Cache-Control: no-store` on all responses with no Set-Cookie.
Only activation upstream 200 with `{code:200,status:"success",message:"OK"}` is
success; `data` is optional. Public success is `{status:"success"}`. Transport,
JSON or envelope failures become 503 `INTERNAL_ERROR`. Valid upstream error
status/code/Retry-After are preserved without secret fields or raw messages in UI.
429 is handled defensively for gateway/admission responses; the pinned auth
activation operation declares only 200, 400, 503 and has no response JSON schema.

## DTO

Request shapes are JSON/OpenAPI schemas, not portal Go structs.

- `ActivateRequest`: exactly `{token: string, password: string}`, both required;
  token must be nonempty. Reject missing/wrong-type fields, token-only requests
  and extra fields (including `confirm`, email, roles, journey and return URL)
  before upstream fetch.
- Password: at least 12 Unicode code points and at most 256 UTF-8 bytes. Do not
  trim or normalize. No uppercase/digit/symbol rule. Schema maxLength counts
  characters, so byte limits require a separate oracle.
- Confirm is client-only, must match password exactly and is never forwarded.
- `ResendActivationRequest`: `{email: string}` only, returning neutral 202; never
  send the activation token in resend.

## DB

None in portal. Auth owns credentials, challenge consumption and account state.
ACTIVE idempotence requires auth-confirmed valid challenge, never changes the
password, and is distinct from consumed-token failure.

## Events

None in portal. No session, credential, membership or authorization event.

## Errors

| Code | HTTP / behavior |
|---|---|
| BAD_REQUEST | 400 malformed input or runtime invalid activation token |
| invalid_token | 400 invalid/expired/consumed/wrong-purpose/ineligible token per auth spec |
| VALIDATION_ERROR | 400 password policy; retain form and focus password |
| FORBIDDEN | 403 invalid origin or content type, no upstream |
| rate_limit_exceeded | 429 preserve retry metadata; manual retry after cooldown |
| service_busy | 503 preserve retry metadata; retain form, manual retry |
| INTERNAL_ERROR | 503 transport or malformed response, generic recovery |

`invalid_token` in upstream documentation and `BAD_REQUEST` in auth runtime
remain an auth-owner alignment gate. Preserve both wire codes and map them to
the same neutral invalid-link feedback, resend and fixed login link. Missing
token sends no POST. Never infer ACTIVE state from a consumed-token response.

## UI and security

Reuse customer shell, password primitive and policy validator. Two independently
localized show/hide toggles, linked labels, `autocomplete=new-password`, paste and
password-manager support, visible keyboard focus and described field errors.
Mismatch focuses confirm; policy error focuses password. Pending disables
submit, announces status and permits only one POST; ignore stale responses when
the link changes. No automatic retry/refresh. Retry-After seconds or HTTP date
takes precedence over valid retry_after_ms; missing metadata yields generic retry.

Missing/invalid tokens have neutral recovery; success clears password/confirm.
Capture token in memory then remove query using history replace; set no-referrer
metadata. No password/token in persistent storage, logs, telemetry, cookies,
cache or evidence. Coordinator verifies ingress query/body redaction before release.
Staff invite stays `/staff/invite/accept` -> `/auth/invite/accept` -> `/staff/login`;
auth owns purpose/eligibility and final org authorization.

## Acceptance

- AC-1: zero POST on mount, exactly token+password after explicit submission,
  valid success and fixed login link.
- AC-2: 11/12 code points, ASCII 256/257 bytes, é×128/129 and emoji×11/12
  reject/accept at the stated boundaries; exact whitespace and Unicode preserved.
- AC-3: missing/invalid/expired/used/purpose/ineligible token is never success;
  neutral resend, password correction and manual cooldown recovery.
- AC-4: only valid 200 succeeds; preserve errors/retry, fail closed, no cookies,
  single pending request and no stale-link completion.
- AC-5: independent staff invite path; no portal credential or role ownership.
- AC-6: vi/en, keyboard, responsive light/dark, alert/status/busy semantics and
  redacted evidence; browser acceptance remains a later slice.

Release requires secure auth first, portal second, then real stack smoke before
activation reopens. No fallback to token-only or insecure auth rollback.
