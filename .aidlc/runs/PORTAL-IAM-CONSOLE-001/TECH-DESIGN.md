# Tech Design — PORTAL-IAM-CONSOLE-001

Use Next.js App Router because internal API calls require a server-side BFF.

Core modules:

- `features/console`: operator UI.
- `lib/api/operations`: explicit operation registry.
- `lib/auth`: GitHub team auth contract, dev-mode fallback.
- `lib/audit`: audit metadata store boundary.

The first implementation uses mock operation responses so UI can be tested
before auth/org operator handlers are implemented.
