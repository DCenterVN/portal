# Contract Snapshots

## Role templates snapshot

- Source: DCenterVN/org, commit `80f6e2c320e6f0a807e47f65fe60d8af69f3398c`, `/home/dawn/work/ticket/org/api/role-templates.yaml`.
- Captured: 2026-11-08; `org.role-templates.yaml` is byte-for-byte `api/role-templates.yaml` from that commit.
- SHA256: `c6ced2dfa2622ac5b7f3c46dfc4160daf7c6208ff54d9aa3488fd1d81a1dd12e`.
- Used by `lib/permission-labels.test.ts` to check permission labels without a local org checkout.

## Snapshot inventory cho SUPPLIER-CONTRACT-001

Nguồn `.cache/worktrees/price-a/inventory/api/openapi.public.yaml`, HEAD `abd623767cb2fbc38bcdbf7ac9680c6f81e8749e` với working tree PRICE và delta S2. Chụp ngày 25/10/2026, SHA256 `147ece1db88eef7302cb703741be8ca3e03e663908048bd1dadac49946d49706`. Đã đồng bộ S2 sau chỉ đạo gỡ vòng chờ PRICE; snapshot không phải bằng chứng runtime document đã triển khai.

Operations sinh bằng `uigen.py operations --write` trong workspace liên kết đủ service, ưu tiên candidate price-a cho service đã có worktree. S13 tiếp2 sinh lại operations/token CSS bằng generator, kiểm delta khung chỉ token CSS trước khi sinh frame.lock.json. Runtime kiểm riêng qua E2E, không suy ra từ snapshot.

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

Nguồn token của lượt tiếp2 là `ticket/platform-docs/ui/tokens.json`, SHA256 `4cbc18ee242e11b565e56541d29058b182f00611319c2f8373ac220fc29edf1b`. PRICE worktree còn nguồn xanh cũ; workspace `.cache/tmp/supplier-tiep2/ui-gen` liên kết riêng `platform-docs/ui` đến nguồn main đã duyệt, scripts/contracts vẫn dùng candidate. Không sửa token JSON hoặc CSS/lock bằng tay.

## Customer activation snapshot

- Source: DCenterVN/auth, `sec-fix-auth-001`, commit `86294eecfa9aa8c6513da77f5585d960a557edff`.
- Captured: 2026-10-06; `auth.public.yaml` is byte-for-byte `api/openapi.public.yaml` from that commit.
- Activation uses POST `/auth/activate` with `ActivateRequest`: exactly `token` and `password`.
- OpenAPI 3.1 character limits do not express auth's 256-byte UTF-8 ceiling; the contract oracle checks bytes separately.
- Activation responses have descriptions, no JSON response schema; wire-envelope checks are independent.
- This is the secure auth worktree snapshot, not evidence of production deployment; re-pin and verify the release SHA before merge.
