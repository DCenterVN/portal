# Kết quả verify L17

| Lệnh | Exit | Số liệu chính | Thời gian |
|---|---:|---|---:|
| `pnpm vitest run components app features lib --exclude lib/api/supplier-contract-bff.test.ts` | 1 | 81 file pass, 1 fail; 1457 test pass, 1 fail (1458 tổng) | 4.34s |
| `pnpm lint` | 0 | ESLint hoàn tất, không báo lỗi | 3.01s |
| `pnpm tsc --noEmit` | 0 | Không báo lỗi TypeScript | 1.40s |
| `node scripts/check-structure.mjs --strict` | 0 | 14 violations, 14 baselined, 0 new | 0.01s |
| `pnpm next build --webpack` | 0 | Compile, TypeScript, prerender 75 trang và build hoàn tất | 24.76s |
| `python3 /tmp/claude-1000/-home-dawn-work-ticket/4d585fde-b0e6-4ac6-be43-f549f05cbebf/scratchpad/archcheck.py` | 1 | 21 violations, 21 baselined, 0 NEW, 4 stale | 0.37s |

## Archcheck NEW

Không có mục NEW.

## Lỗi đầu của lệnh thất bại

```text
FAIL  app/frame-lock.test.ts > FR-13 frame lock > frame files match frame.lock.json
AssertionError: Khung lệch khỏi frame.lock.json, đổi khung phải qua slice khung của Claude:
đổi: app/globals.css
đổi: components/layout/console-header.tsx: expected [ 'đổi: app/globals.css', …(1) ] to deeply equal []
- Expected
+ Received
+ Array [
+   "đổi: app/globals.css",
+   "đổi: components/layout/console-header.tsx",
+ ]
❯ app/frame-lock.test.ts:11:119
```

Archcheck stale:
- `FE-14 features/console/live-console.tsx missing loading,empty`
- `FE-14 features/inventory/shelves-view.tsx missing loading,empty`
- `FE-14 features/production/orders-view.tsx missing loading,empty`
- `FE-14 features/production/qc-view.tsx missing loading,empty`
