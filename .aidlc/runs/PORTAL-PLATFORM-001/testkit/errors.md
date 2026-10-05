# Rejections pinned to org platform-plane Errors

Symbolic codes are spec identifiers, not invented wire strings; S1 verifies actual envelope/code values from pinned source.
- apperror.ErrCodeValidation: 400, missing contract_ref/reason, invalid type, CORE disable, unpurchased module action.
- apperror.ErrCodeUnauthorized: 401, no/invalid/expired token.
- apperror.ErrCodeForbidden: 403, missing action, wrong scope/tenant.
- apperror.ErrCodeNotFound: 404, unknown company/role/grant or absent platform context.
- apperror.ErrCodeConflict: 409, last admin, duplicate staff, expired/revoked approval, repeated break-glass.
- 503: authorization unavailable; fail closed, exact upstream code only when actually returned.
- 502: existing BFF network failure, fail closed.

Replay: same onboard request/key; stale permission after revoke; expired grant; MAIN A token/context attacking B; no body for approve/revoke. Unsupported method/path rejected by BFF; no upstream request.
