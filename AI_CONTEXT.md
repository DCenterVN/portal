# AI Context — portal

`portal` is the standalone operator UI for the DCenterVN cold-chain logistics platform.

It is a control plane for platform operators, not a customer-facing retail app.

## Ownership

Portal owns:

- operator console UI;
- GitHub organization/team based access control;
- BFF operation registry;
- API Lab guard policy;
- operator audit metadata.

Portal does not own:

- auth credentials, sessions, JWT signing or user security policy;
- org branch membership and final authorization decisions;
- notification delivery;
- integration reference data;
- gateway routes for internal APIs.

## Security model

Browser calls only portal routes. Portal server calls internal APIs using service
JWTs after verifying the GitHub operator.

Internal target URLs must come from server config. Do not accept arbitrary URLs
from the browser. Do not store raw token, cookie, password, private key, or
sensitive payload in audit logs.

Production API Lab rules:

- operation must be in the registry;
- mutation requires reason and double confirmation when UI supports it;
- credential/token-returning operations are blocked;
- all actions are audited.

## Implementation style

- Next.js App Router + TypeScript.
- Capability-first folders under `features/`.
- Keep BFF registry explicit and boring.
- Prefer concrete modules over generic frontend service abstractions.
- OpenAPI snapshots are contract inputs; generated types must be reproducible.
- Package management: strictly use `pnpm` (pinned in `.mise.toml` and `packageManager`). Never run `npm` or `yarn`.
