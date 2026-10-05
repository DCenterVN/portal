# Anti test: PORTAL-REBRAND-001 — S9 / TC-6 / TC-9

Người chạy: **Anti (Antigravity browser agent)**. Trình duyệt: **Brave**. Người chấm: `anti_check.py`; lời kết luận của Anti không thay thế máy chấm. Bạn chỉ chạy, đo và ghi bằng chứng thật.

## Dữ kiện đã hoàn tất bởi coordinator

Full brand gate **0 errors**; brand gate self-test đã đạt; `npm test` **350/350**; lint và typecheck đã đạt; archcheck **0 new**. TC-8 token drift **none**. `operations.generated.ts` drift ngoài phạm vi: không regenerate. Đây là dữ kiện bàn giao, không phải các phép chạy mới của Anti. Browser acceptance và production Lighthouse vẫn cần bằng chứng.

## Luật cứng

1. Không sửa/tạo/xoá bất kỳ repo file nào ngoài `.aidlc/runs/PORTAL-REBRAND-001/anti/out/**`. Không sửa kit, plan, testkit, app, components, features, lib, tokens, package/lock, `.env.local`, baseline, receipts. Không commit/push/checkout/stash. Lệnh build/start được chỉ định có thể sinh cache `.next` của công cụ; runner được copy `.next/static` → `.next/standalone/.next/static` và `public` → `.next/standalone/public` (chỉ build outputs); không chỉnh tay cache hoặc tracked file. Runner so tracked diff trước/sau; khác nhau là FAIL, không tự sửa để che lỗi.
2. Không chạy lại đến khi xanh; chỉ một run: một lần `start`, một lần `lighthouse`, một lần `stop`, một lần grader. Không xoá/ghi đè `run.json`, ảnh, Lighthouse hay build log cũ. Runner có run cũ thì dừng, báo coordinator. Không sửa grader/threshold/evidence để qua gate.
3. Không bịa số, chép ratio trong bảng làm kết quả đo, tạo JSON Lighthouse giả, ảnh fixture hay account giả. Không seed thêm account/product/code, mock backend, inject DOM/CSS, dùng screenshot của lần khác, chuyển môi trường hoặc route để né lỗi. Fixture self-test của coordinator là tổng hợp, tuyệt đối không dùng làm bằng chứng UI.
4. Không dùng `npm test -- path`, `pnpm`, regenerate operations, install package vào repo, dev server thay production build hoặc tự chạy các gate coordinator đã hoàn tất. `npx --yes lighthouse` trong runner là lệnh audit được cho phép và cần network.
5. Không restart/down Docker, reset rate-limit hay kill process khác. Trap chỉ dừng server/Brave do runner tạo. Không in password, cookie, token vào report.
6. Account phải là **real seeded role accounts từ `anti/accounts.local.md` do Dawn tạo**. Portal `.env.local` trỏ BFF đến Kong **:8000**. Dùng đúng account/role và seeded product/code được operator cung cấp; không tự đoán credential. Thiếu backend, account, quyền hoặc seeded resource cần thiết: cell/case phụ thuộc ghi `BLOCKED` với lý do thật, không substitute. Vi phạm oracle có thể quan sát được là `FAIL`, không đổi thành BLOCKED.

## Bước 0 — chuẩn bị

Đọc `../plan.md` (AC-3..10, TC-6, TC-9, S9), `../testkit/ui-cases.md`, `../testkit/errors.md`, `../testkit/contrast-table.md`. Các lỗi trong errors.md là lịch sử/prerequisite; giữ nguyên, không tự đánh dấu đã giải quyết. Đọc riêng `anti/accounts.local.md` do Dawn tạo; file được `anti/.gitignore` bỏ qua. Không source file, cat/tee ra terminal hoặc đưa secrets vào evidence. Thiếu file hoặc mục cần thiết: ghi BLOCKED theo dependency; không tự đoán. Không tự dựng backend.


### Prerequisites Dawn cung cấp trước run

Environment truth: hiện chỉ **auth/org/customer/integration/notification** chạy locally; **sales/inventory/production chưa chạy**, chỉ có operator **VT-21**. Đây là prerequisite thiếu hợp lệ, không phải lỗi của Anti. Dawn chuẩn bị Kong :8000 và portal BFF connectivity tới auth, org, customer, integration, notification, **sales, inventory, production**, cùng dependencies DB/Redis/Kafka/storage theo service. Anti không start/seed/sửa backend.

Dawn tạo `anti/accounts.local.md` (gitignored) chứa real seeded **customer**, **branch employee** (active branch + quyền console/inventory/production), **platform admin**, **company owner** (company scope) và thông tin login riêng cho từng role. Cung cấp seeded **product id**, **trace code**, company/branch context, reset-password token hợp lệ nếu case cần, cùng dữ liệu/quyền để quan sát dialogs và data states. Ghi service readiness trong file. Anti đọc privately, chỉ ghi role/prerequisite thiếu, không ghi credential/token/cookie. Customer/sales resources thiếu → UI-4 và UI-7 phụ thuộc BLOCKED; inventory thiếu → UI-3/UI-7 phụ thuộc BLOCKED; production/trace code thiếu → UI-4/5/7 phụ thuộc BLOCKED; platform admin/company owner thiếu → UI-6 BLOCKED. Nếu quan sát được lỗi thật, giữ FAIL và ghi cả blocker.

Từ portal, chạy phase `start` đúng một lần; tất cả phases hỗ trợ stdin EOF, không có prompt. Network phải hoạt động để tải fonts và Lighthouse:

```bash
cd /mnt/win_d/feature/ticket/portal
bash .aidlc/runs/PORTAL-REBRAND-001/anti/anti.sh start </dev/null
```

Runner dùng `NPM_CONFIG_CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/portal-anti-npm"` ngoài repo trên executable filesystem (không NTFS); Brave profile riêng dưới `/tmp`, không nằm trong cây Tailwind scan. `start` kiểm tra TCP ports 3000/9222 trước build, build production và ghi `out/build.log`, copy static/public vào standalone. Node 22 `--env-file=<portal>/.env.local` nạp env vào server process, không copy/sửa/in `.env.local`. Server chạy ở `127.0.0.1:3000`; sau `/login` **200**, runner POST `/api/auth/login` với customer.s9, body `{email,password}` từ accounts.local.md qua file 0600 trong `/tmp`. Không 200 → `BLOCKED login BFF <code>`, exit 2, tự dừng server và finalize run. Chỉ khi check đạt mới mở Brave debug port 9222. `start` exit 0, **để server/Brave chạy**; `run.json` end/exit_code còn null tới `stop`.

Runner ghi pidfiles và Linux process start times; cleanup chỉ kill process groups khớp identity, không kill listener/profile khác. Port đang dùng, build/network lỗi, Brave/account/env thiếu hoặc readiness không 200: giữ output thật, không sửa/cài/chạy lại. Nếu `start` thất bại, nó tự cleanup/finalize; ghi cell phụ thuộc BLOCKED và report. Nếu phase sau thất bại vẫn phải chạy `stop` để cleanup; không chạy lại phase audit. Chỉ ghi browser evidence trong `out/`.
## Bước 1 — browser matrix

**Login trước authenticated cell** (UI-3/4/5/6/7): dùng seeded role đúng từ accounts.local.md; trước **mỗi cell**, verify console page đã load bằng URL `/console` và heading console thật. Ghi URL + heading observed trong observations.md. Với platform/company, sau console check chuyển sang role tương ứng và verify URL + heading của plane đó. Trước mỗi route và trước screenshot, kiểm tra final URL + heading route; redirect `/login` thì re-login đúng account trong cùng runner run và verify lại. Không lấy login form làm ảnh authenticated; không có session/quyền thì BLOCKED, ảnh authenticated chụp ở `/login` là FAIL `unauthenticated`. Không restart runner để re-login.

Thực hiện **UI-1..UI-7 × light/dark × 375/768/1024/1440 CSS px = 56 cell**. Set viewport bằng device emulation, DPR=1; mỗi ảnh PNG có width bằng viewport. Chạy mỗi cell một lần. Trên từng route/state trong cell: xóa bộ đếm inspector cho cell mới, giữ log xuyên các route của cell, đo trước khi kết luận. Mỗi cell lưu ít nhất một ảnh đại diện `out/shots/<case>-<theme>-<vw>.png`; các ảnh phụ cho route/state có thể lưu tên khác nhưng không thay ảnh bắt buộc. PASS/FAIL có ảnh, BLOCKED không cần giả ảnh. Mọi ảnh bắt buộc >20 KiB, SHA256 khác nhau; nếu UI thực sự giống nhau ở hai cell, giữ ảnh thật và ghi FAIL, không thêm watermark/đổi pixels để né duplicate.

| Case | Routes cần chạy (không chọn một route thay cả nhóm) | Oracle |
|---|---|---|
| UI-1 | `/` | Solid warm surfaces; tomato CTA; không glass/gradient/decorative green; Quicksand heading, Nunito body với dấu tiếng Việt |
| UI-2 | `/login`, `/register`, `/forgot-password`, `/reset-password` | Text/password/select editable cao 44–48px, border 1.5px, radius 12px; label hiện và liên kết; focus rõ; toggle password độc lập, names/autocomplete/disabled giữ nguyên. Reset token thật nếu cần; thiếu thì BLOCKED |
| UI-3 | `/console`, `/branches`, `/memberships`, `/roles`, `/inventory/shelves` | Sidebar surface/ink/muted theo theme; active tint/ink, tomato indicator, aria-current page; collapse/navigation/role access giữ nguyên |
| UI-4 | `/products`, `/products/<seeded-id>`, `/cart`, `/orders`, `/me`, `/production/targets`, `/production/orders`, `/production/qc` | Một tomato CTA; success leaf chỉ indicator + label/icon + ink text; loading/empty/error/success phân biệt trên data view thay đổi; totals/submission giữ hành vi. Không tạo fixtures để ép state; state không thể quan sát bằng dữ liệu thật ghi BLOCKED |
| UI-5 | `/traceability/<seeded-code>`; product-create/QC/session-timeout dialogs được account truy cập | Không gradient banner; solid scrim/surface; focus trap, Esc/dismissal policy, return focus giữ nguyên; status/loading/error dễ đọc. Không sửa timeout/config để giả trạng thái |
| UI-6 | `/platform`, `/company` bằng account có quyền tương ứng | Shared sidebar/fonts theo theme; role visibility/navigation giữ nguyên; business break-glass terminology/actions không bị đổi |
| UI-7 | `/`, `/console` và mọi data route của UI-3/4/5 (login coverage ở UI-2 và Lighthouse) | Console error=0, HTTP ≥500=0, không horizontal viewport overflow; sáu production Lighthouse từ runner; a11y ≥0.90, mobile LCP ≤2500ms; Lighthouse `resource-summary` script `transferSize` ≤200 kB (200000 bytes) mỗi audited route/form; ghi cả `total-byte-weight` |

Không bỏ route/state vì ảnh đại diện đã đẹp. Ghi chi tiết từng route/role/state và expected/observed vào `out/observations.md`. Nếu chỉ một route phụ thuộc không chạy được, cả cell là BLOCKED; nếu có lỗi thật đồng thời, cả cell là FAIL và lý do ghi cả blocker.

Trong **mọi cell** thử Tab, Shift+Tab, Esc, focus visible. Với dialog thử focus trap và return focus; Esc trên route không dialog ghi hành vi quan sát, không khai có dialog. Set `prefers-reduced-motion: reduce`, thử lại interaction, ghi computed animation/transition và hành vi; không sửa CSS. Kiểm tra không hidden focus, không overflow bằng `document.documentElement.scrollWidth > document.documentElement.clientWidth`. DevTools Console/Network ghi lỗi thật, không loại lỗi ngoài ý muốn; tổng counter qua tất cả routes của cell phải bằng 0 cho PASS.

Contrast: đọc `getComputedStyle` cho **từng foreground và adjacent background thực tế** (text, placeholder, badge, link/hover, destructive; input boundary/focus). Composite alpha qua tất cả ancestor tới nền opaque, bao gồm opacity của element/ancestor; không dùng token nguồn thay màu computed. Ghi opaque `#RRGGBB`, role và ratio unrounded. sRGB: c/12.92 nếu c≤0.04045, còn lại ((c+.055)/1.055)^2.4; L=.2126R+.7152G+.0722B; ratio=(Lmax+.05)/(Lmin+.05). Text ≥4.5, UI border/focus ≥3; pair phải trong contrast-table oracle đúng theme. Light primary/bg và info/tint fail; light link dùng primary-hover; leaf chỉ indicator kèm ink label. `line` không dùng thay input-border/focus. Ghi đủ tất cả pairs dùng trên routes/states, tối thiểu text và UI; không chỉ chọn pair đạt.

Fonts: chờ `await document.fonts.ready`; dùng chính sample **`Bữa ăn tươi ngon: Nguyễn, tiếng Việt, ă â ê ô ơ ư đ á ề ỗ ự`**. Lấy computed `fontFamily`, `fontSize` của heading/body, kể cả internal next/font alias. `document.fonts.load`/`check` với computed font shorthand + sample; đọc FontFaceSet và inspector Rendered Fonts để xác nhận face thật Quicksand heading 600/700, Nunito body 400/500/600/700/800, loaded và glyph tiếng Việt. Family alias phải được đối chiếu với face/Rendered Fonts, ghi tên Quicksand/Nunito đã xác nhận trong `family`, raw computed value trong `computed_family`; không chỉ chép CSS variable. Không có face/glyph evidence thì FAIL, không khai true theo class name.

## Schema bắt buộc — `out/cases.json`

Top level `{"schema":"portal-s9/1","cells":[...]}`. Mỗi key `(case, theme, viewport)` xuất hiện đúng một lần, đủ 56 key. `captured_at` là ISO-8601 timezone-aware trong run window. `status` chỉ PASS/FAIL/BLOCKED; FAIL/BLOCKED có `reason` không rỗng. BLOCKED có thể thiếu measurements/ảnh; vẫn phải có cell, timestamp và lý do prerequisite cụ thể. Không biến dữ liệu không đo được thành 0.

Mọi **non-BLOCKED** cell bắt buộc có `final_urls` (list URL thực sau navigation, đủ routes case), và `screenshot_url` (URL tại thời điểm ảnh đại diện, phải nằm trong final_urls). Origin `http://127.0.0.1:3000`, paths khớp routes case; `/products/<id>` và `/traceability/<code>` dùng seeded values thật. Không `/login` ngoài UI-2, kể cả UI-7; login measurement của UI-7 dùng audit/UI-2 evidence, không đưa login screenshot vào cell này. Dialogs ghi URL host và heading/state trong observations. URLs chỉ chứa thông tin cần xác minh; redact secret query values (reset token) trước khi ghi, giữ path thật. Thiếu route vì prerequisite thì BLOCKED toàn cell. Grader kiểm URL lời khai, coordinator vẫn phải xem ảnh/heading để xác nhận.

PASS bắt buộc có `measurements`: integer `console_errors`, integer `http_5xx`, boolean `horizontal_overflow`; `interaction` có boolean `Tab`, `Shift+Tab`, `Esc`, `focus_visible`, `reduced_motion`; `fonts` và `contrasts` như dưới. Numeric không được là string/null/boolean/NaN. Mảng contrasts bao gồm toàn bộ pair đã dùng, không chỉ ví dụ. Thêm `routes`/`states`, dimensions, input/label/toggle/focus/scrim observations vào measurements và observations.md để coordinator review; máy chấm không thể xác nhận một hành vi browser từ lời khai boolean.

Ví dụ **cấu trúc**, không được copy làm bằng chứng; thay mọi giá trị bằng phép đo thật:

```json
{
  "case": "UI-1", "theme": "light", "viewport": 375,
  "status": "PASS", "captured_at": "<ISO timestamp thực>",
  "final_urls": ["http://127.0.0.1:3000/"],
  "screenshot_url": "http://127.0.0.1:3000/",
  "measurements": {
    "console_errors": 0, "http_5xx": 0, "horizontal_overflow": false,
    "interaction": {"Tab": true, "Shift+Tab": true, "Esc": true, "focus_visible": true, "reduced_motion": true},
    "fonts": {
      "sample": "Bữa ăn tươi ngon: Nguyễn, tiếng Việt, ă â ê ô ơ ư đ á ề ỗ ự", "ready": true,
      "heading": {"family": "Quicksand", "computed_family": "<raw computed>", "size_px": 24, "check": true, "loaded_faces": [{"family": "Quicksand", "status": "loaded"}]},
      "body": {"family": "Nunito", "computed_family": "<raw computed>", "size_px": 16, "check": true, "loaded_faces": [{"family": "Nunito", "status": "loaded"}]}
    },
    "contrasts": [
      {"kind": "text", "fg_role": "ink", "bg_role": "surface", "foreground": "#2A1D17", "background": "#FFFFFF", "ratio": 16.3224},
      {"kind": "ui", "fg_role": "focus", "bg_role": "surface", "foreground": "#B93623", "background": "#FFFFFF", "ratio": 5.8118}
    ]
  }
}
```

## Bước 2 — production Lighthouse

Khi đã ghi xong UI-1..UI-7, **sign out** trong Brave do runner mở, rồi chạy phase audit (không nhập RECORDED/AUTHENTICATED):

```bash
bash .aidlc/runs/PORTAL-REBRAND-001/anti/anti.sh lighthouse </dev/null
```

Runner audit `/`, `/login`, `/console`, mỗi route mobile + desktop, qua Brave port 9222. Home/login không dùng auth headers; Lighthouse reset storage mặc định. Với console, runner login employee.s9 qua BFF thật, lấy `access_token` từ Set-Cookie và truyền `--extra-headers` bằng file JSON 0600 trong `/tmp`. Không password/cookie/token trong argv hoặc out; raw log/JSON tạm giữ private, cookie values và configSettings.extraHeaders bị redact trước khi lưu audit JSON, các measurement giữ nguyên. File tạm bị xoá khi phase kết thúc; `stop` cũng cleanup thư mục tạm được ghi nhận. Console finalUrl `/login` → BLOCKED exit 2 ngay, không dùng login audit làm console evidence. Thiếu session cookie/account/backend → BLOCKED. Không sửa scores/fetchTime/finalUrl. Không chạy lại audit; runner giữ phase failure để `stop` không nâng thành exit 0.
Tệp bắt buộc: `lh-home-mobile.json`, `lh-home-desktop.json`, `lh-login-mobile.json`, `lh-login-desktop.json`, `lh-console-mobile.json`, `lh-console-desktop.json`. `fetchTime` phải trong start/end run; finalUrl đúng exact route tại `http://127.0.0.1:3000`, không query/redirect. Run window 120..86400 giây là sanity gate, không sleep để làm giả thời gian. Turbopack 16.3 không có First Load JS column. Nguồn bundle là raw Lighthouse `audits.resource-summary.details.items` entry `resourceType="script"` → `transferSize`, ≤200000 bytes cho cả 6 route/form audits; ghi `audits.total-byte-weight.numericValue` (bytes) cùng report, không dùng total thay script. `build.log` vẫn phải chứa `Compiled successfully`, `Route (app)` và routes `/`, `/login`, `/console` để chứng minh build đã chạy; không tự viết table/sizes. Không đọc archived evidence; chỉ dùng `anti/out/` của run mới.

## Bước 3 — report và grader

Sau Lighthouse (kể cả BLOCKED/FAIL), chạy `stop` đúng một lần:

```bash
bash .aidlc/runs/PORTAL-REBRAND-001/anti/anti.sh stop </dev/null
```

`stop` dừng server/Brave groups có identity khớp, xoá profile/cookie files trong `/tmp`, so tracked diff trước/sau. Khác nhau → FAIL exit 1; không tự sửa để che lỗi. Ghi end timestamp và exit_code cuối cùng, giữ failure của Lighthouse. Ghi nguyên exit codes của từng phase vào report. Không gọi grader trong lúc end còn null. Viết `out/report.md` đúng mẫu dưới, rồi chạy grader đúng một lần:

```bash
python3 -B .aidlc/runs/PORTAL-REBRAND-001/anti/anti_check.py 2>&1 | tee .aidlc/runs/PORTAL-REBRAND-001/anti/out/check.txt
```

Exit 0=PASS; exit 1=FAIL; exit 2=BLOCKED khi evidence gates còn lại đạt. Có failure đồng thời blocker: exit 1, blocked count vẫn in riêng. Pipeline `tee` không thay verdict máy chấm. Không tự khai PASS khi thiếu audit do backend/account blocked. Dán nguyên văn check output và runner exit, không chỉ tail.

```text
# Report PORTAL-REBRAND-001 S9
Worker: Anti / Antigravity
Browser: Brave <version từ browser>
Run: <start> → <end>; runner exit=<thật>
Operator env: <nguồn account/roles, Kong :8000, không secrets>
| Case | Theme | Viewport | PASS/FAIL/BLOCKED | Expected / observed | Evidence / blocker |
|---|---|---:|---|---|---|
<đủ 56 dòng>
PASS cells: <đếm từ cases.json>/56
FAIL cells: <đếm từ cases.json>/56
BLOCKED cells: <đếm từ cases.json>/56
Build proof: <Compiled successfully + route table từ build.log hoặc KHÔNG CÓ>
Max Lighthouse script transferSize: <bytes / 1000 = kB hoặc KHÔNG CÓ>
| Route | Form | a11y | LCP ms | Script transfer bytes | Total-byte-weight bytes | fetchTime | finalUrl | Raw JSON |
|---|---|---:|---:|---:|---:|---|---|---|
<6 dòng, thiếu ghi KHÔNG CÓ + lý do>
Prerequisites missing: <liệt kê hoặc none>
Rule violations / extra commands / reruns: <liệt kê hoặc none>
Grader output (verbatim):
<toàn output>
Kết luận: <verdict của máy; không nâng BLOCKED thành PASS>
```

## Dấu hiệu fake-run

56 PASS nhưng không có 56 cell/ảnh; ảnh cùng hash/width sai/≤20 KiB; tất cả số là string hoặc ratio chép oracle mà không computed colours; fonts chỉ CSS classes, thiếu FontFaceSet/glyph tiếng Việt; không có evidence route/state/account; console report dùng guest redirect; Lighthouse fetchTime ngoài window/sai form hoặc finalUrl; build log không route table/Compiled successfully; thiếu script transferSize/total-byte-weight; timestamp null/naive hoặc duration phi lý; report nói green khi grader đỏ/blocked; thiếu raw artifacts nhưng có số đẹp. Những dấu hiệu này cần báo đúng, không sửa artifacts hay chạy lại.
