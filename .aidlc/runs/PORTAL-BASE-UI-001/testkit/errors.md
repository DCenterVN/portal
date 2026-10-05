# Allowed rejection codes

Copied exactly from the supplied BE contract §§1/3. For deliberate negative-state tests only; the happy path accepts no rejection. No HTTP status is promoted to a made-up error code.

- VALIDATION_ERROR
- VALIDATION_FAILED
- rate_limit_exceeded
- CUSTOMER_NOT_FOUND
- ADDRESS_LIMIT
- CUSTOMER_LOCKED
- UNAVAILABLE

`CUSTOMER_NOT_FOUND` is transient only inside the bounded activation window. 429 never auto-retries. Invite `invalid_token` is in the handoff rather than the BE contract; resolve the contract gap in plan Open decisions. Unnamed permission/address/integration failures must not silently pass as an allowed code.
