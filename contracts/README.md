# Contract Snapshots

Commit OpenAPI snapshots from upstream services here before generating portal
operation types.

Expected inputs:

- `auth.public.yaml`
- `auth.internal.yaml`
- `org.public.yaml`
- `org.internal.yaml`
- `integration.public.yaml`
- `notification.internal.yaml`

Each snapshot should record the source repository and commit SHA in the PR.

## Platform plane snapshot

- Source: DCenterVN/org, `platform-plane-001`, commit `6c1c0132f2b246726231547e99d30c61ee31eceb`.
- Captured: 2026-09-28; `org.public.yaml` is byte-for-byte `api/openapi.public.yaml`.
- D-078: public org contract captured. OpenAPI currently describes routes/actions but lacks complete DTO schemas.
- Runtime schemas in `lib/api/platform-contract.ts` are manually maintained against source, not generated types. Source: `internal/service/platform.go`, `internal/service/branch.go`, `internal/transport/http/platform.go`, `operator.go`, `permissions_me.go` at the same commit.
- Platform endpoints use platform-go response.Success/Created envelopes; permissions/me returns bare action_keys. Empty Go slices can serialize as null.
