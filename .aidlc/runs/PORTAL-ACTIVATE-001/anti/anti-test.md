# PORTAL-ACTIVATE-001 — Anti Browser Acceptance Kit

Tester: **Anti**, human-driven browser agent. Claude/Codex does not run browser acceptance.
Scope: Customer activation journey (`/activate`) independent verification kit for task `PORTAL-ACTIVATE-001` (D-147 / SEC-FIX-AUTH-001).

## Acceptance Rules & Mandates

1. **Zero POST on mount**: Opening `/activate?token=...` must NOT trigger any network POST or automatic token redemption. Form remains idle awaiting explicit user action.
2. **URL query cleanup**: Immediately after capturing the activation token into memory, `window.location.search` MUST be empty (`""`) via `window.history.replaceState`. Unit tests cannot inspect this browser behavior; browser acceptance strictly enforces it (`locationSearchEmpty=1`).
3. **No-referrer metadata**: The page MUST include `<meta name="referrer" content="no-referrer">` (`noReferrerMeta=1`) to prevent token leakage via referrer headers.
4. **Touch targets & UI standards**: All interactive controls (password inputs, visibility toggles, submit CTA) must meet or exceed 44px (`minTargetPx >= 44`) per `standards/ui-ux.md` (UX-02).
5. **Accessibility & contrast**: Normal-text color contrast must be ≥ 4.5:1 (`minContrast >= 4.5`), axe-core critical and serious violations must be 0 (`axeSerious=0`, `axeCritical=0`), and keyboard accessibility (Tab, Shift+Tab, Enter, visible focus, unobscured ring, reduced motion) must satisfy 7 checks (`keyboardChecks=7`).
6. **Pace enforcement**: `fetchTime` of each cell must be **≥ 20 seconds** after the previous cell (`MIN_GAP_S = 20`). Automated rapid submission is rejected as forged evidence.
7. **Kong gateway verification**: The grader inspects gateway logs directly from the running container (`dcentervn-local-api-gateway-1`). Each backend cell is strictly correlated with Kong access lines in that cell's time window:
   - **Path & status matching**: Every backend cell must have Kong lines matching the expected route and measured status (`/auth/activate` with 200, 400; `/auth/activate/resend` with 202; `/auth/web/login` with 401 for attacker and 200 for owner). For cells where the live upstream stack cannot produce the nominal status (`RATE-LIMIT-desktop` where auth lacks rate-limiting middleware on `/auth/activate`, and `SERVICE-BUSY-desktop` where stopping Redis yields 400 instead of 503), real traffic is attempted against Kong, but the verdict is recorded as `BLOCKED` with an explanation, per the S8b acceptance mandate (never fake PASS).
   - **CSRF boundary**: Cross-origin activation attempts (`CSRF-CROSS-ORIGIN`) must be blocked at BFF and result in **0 upstream requests** reaching Kong.
   - **Staff workflow isolation**: Staff invitation verification (`STAFF-INVITE-INDEPENDENT`) must exercise `/auth/invite/accept`, not customer activation endpoints.
   - **Activation request count**: For activation attempts measuring `postsSent` (e.g. `JOURNEY-SUCCESS`), `postsSent` must exactly equal the number of `/auth/activate` lines in Kong inside the cell window.
   - **Concurrent submit gate**: `CONCURRENT-SUBMIT` must send exactly 1 upstream request to `/auth/activate` without concurrent duplicates.
   - **Client provenance**: Only browser and BFF traffic (`node`, `portal-bff`, `Mozilla/*`) are permitted; scripted automation clients (e.g. `Python-urllib`) fail the entire run.
8. **Sanitization & secrecy**: Never output real passwords, raw token strings, session cookies, or full email challenge links in screenshots, JSON records, logs, or git diffs. Evidence records must contain numeric observations only. Screenshots must mask secret input fields.
9. **No scripted fake screenshots**: Self-test positive fixtures verify grader integrity only; synthetic fixtures NEVER constitute an application acceptance PASS. Real live runs require human/agent browser verification.

## Procedure

1. Ensure prerequisites are running (Kong on port 8000, Kong admin on 8001, isolated backend services).
2. Phase RED (Previous Release Verification):
   - Standalone portal from previous release (`origin/main` / `portal:client-ip`) is tested against current insecure auth (`dcentervn/auth:local`).
   - Start runner:
     ```bash
     ANTI_OUT=.aidlc/runs/PORTAL-ACTIVATE-001/anti/out-red \
     PORTAL_STANDALONE=/tmp/portal-origin-main \
     PORTAL_STATIC=/tmp/portal-origin-main/.next/static \
     PORTAL_PUBLIC=/tmp/portal-origin-main/public \
     bash .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh start </dev/null
     ```
   - Execute checklist in browser, verify failure modes (no password fields, POST on mount, token-only acceptance, location search not cleaned).
   - Stop runner:
     ```bash
     ANTI_OUT=.aidlc/runs/PORTAL-ACTIVATE-001/anti/out-red bash .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh stop </dev/null
     ```
   - Grade: `python3 .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py .aidlc/runs/PORTAL-ACTIVATE-001/anti/out-red` -> VERDICT: FAIL.
3. Phase GREEN (Secure Release Verification — S8b):
   - Ensure current worktree standalone portal is built:
     ```bash
     npm run build
     ```
   - Confirm auth container is running secure auth image `dcentervn/auth:secfix-86294ee`.
   - Start runner:
     ```bash
     bash .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh start </dev/null
     ```
   - Execute checklist in browser with human/CDP pacing (>=20s per cell), capture sanitized evidence to `out/shots/<id>.png` and `out/<id>.json`.
   - Attempt real 429 and 503 traffic against Kong. If the live backend cannot produce nominal 429/503 statuses, record `BLOCKED` with detailed rationale and empty measurements.
   - Stop runner:
     ```bash
     bash .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh stop </dev/null
     ```
   - Grade: `python3 .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py` -> 0 FAIL (15 PASS, 2 BLOCKED).

## Record Format

Each cell produces `out/<id>.json`:
```json
{
  "id": "UI-OPEN-desktop",
  "runId": "uuid-from-run-json",
  "route": "/activate",
  "viewport": "desktop",
  "fetchTime": "2026-10-06T08:30:00Z",
  "verdict": "PASS",
  "reason": "",
  "screenshot": "shots/UI-OPEN-desktop.png",
  "screenshotSha256": "sha256-hex-of-png",
  "measurements": {
    "zeroPostOnMount": 1,
    "locationSearchEmpty": 1,
    "noReferrerMeta": 1,
    "passwordFieldVisible": 1,
    "confirmFieldVisible": 1,
    "submitButtonVisible": 1,
    "minTargetPx": 44,
    "keyboardChecks": 7,
    "axeSerious": 0,
    "axeCritical": 0,
    "minContrast": 4.6,
    "horizontalOverflow": 0
  }
}
```

## Checklist

| ID | Route | Viewport | Steps | Numeric pass criteria | Evidence |
|---|---|---|---|---|---|
| UI-OPEN-desktop | /activate | desktop 1440×900 | Open `/activate?token=valid_token`. Verify: 0 POST requests sent on mount; `location.search` is empty string after mount via `history.replaceState`; `<meta name="referrer" content="no-referrer">` present; password, confirm and submit controls visible and ≥ 44px; keyboard accessibility passes 7 checks; axe serious=0, critical=0; text contrast ≥ 4.5:1. | zeroPostOnMount=1, locationSearchEmpty=1, noReferrerMeta=1, passwordFieldVisible=1, confirmFieldVisible=1, submitButtonVisible=1, minTargetPx ≥ 44, keyboardChecks=7, axeSerious=0, axeCritical=0, minContrast ≥ 4.5, horizontalOverflow=0; expected PASS | UI-OPEN-desktop.json + shots/UI-OPEN-desktop.png |
| UI-OPEN-mobile | /activate | mobile 390×844 | Open `/activate?token=valid_token` on mobile viewport. Verify same mount behavior: zero POST, `location.search` cleared, no-referrer meta, controls ≥ 44px, no horizontal overflow. | zeroPostOnMount=1, locationSearchEmpty=1, noReferrerMeta=1, passwordFieldVisible=1, confirmFieldVisible=1, submitButtonVisible=1, minTargetPx ≥ 44, keyboardChecks=7, axeSerious=0, axeCritical=0, minContrast ≥ 4.5, horizontalOverflow=0; expected PASS | UI-OPEN-mobile.json + shots/UI-OPEN-mobile.png |
| UI-TOGGLE-desktop | /activate | desktop 1440×900 | Toggle password visibility and confirm visibility independently. Verify buttons have accessible names, toggles do not submit the form, and inputs switch between password and text types. | passwordToggleOperable=1, confirmToggleOperable=1, toggleSubmitsForm=0, toggleHasAccessibleName=1, zeroPost=1; expected PASS | UI-TOGGLE-desktop.json + shots/UI-TOGGLE-desktop.png |
| VAL-SHORT-desktop | /activate | desktop 1440×900 | Enter password with 11 code points (policy requires ≥ 12). Submit form. Verify client validation catches error, no POST sent, password field focused with error message displayed. | clientRejected=1, zeroPost=1, passwordFocused=1, errorMessageVisible=1; expected PASS | VAL-SHORT-desktop.json + shots/VAL-SHORT-desktop.png |
| VAL-MISMATCH-desktop | /activate | desktop 1440×900 | Enter valid password (≥ 12 code points) and differing confirm password. Submit. Verify client catches mismatch, no POST sent, confirm field focused with mismatch message. | clientRejected=1, zeroPost=1, confirmFocused=1, mismatchMessageVisible=1; expected PASS | VAL-MISMATCH-desktop.json + shots/VAL-MISMATCH-desktop.png |
| VAL-TOOLONG-desktop | /activate | desktop 1440×900 | Enter password exceeding 256 UTF-8 bytes (e.g. 257 ASCII chars or 129 multi-byte characters). Submit. Verify client/BFF validation rejects, no upstream mutation, password field focused. | policyRejected=1, zeroPost=1, passwordFocused=1; expected PASS | VAL-TOOLONG-desktop.json + shots/VAL-TOOLONG-desktop.png |
| JOURNEY-SUCCESS-desktop | /activate | desktop 1440×900 | Open valid activation link. Enter valid owner password C (matching confirm). Submit. Verify: exactly 1 POST with `{token, password}` (no confirm in body); response 200 `{status: "success"}`; form cleared; success message and fixed link to `/login` shown; zero session cookies set. | httpStatus=200, postsSent=1, successMessageVisible=1, loginLinkVisible=1, newCookies=0, tokenClearedFromMemory=1; expected PASS | JOURNEY-SUCCESS-desktop.json + shots/JOURNEY-SUCCESS-desktop.png |
| JOURNEY-LOGIN-OWNER-desktop | /login | desktop 1440×900 | Attempt login with pre-activation password A -> 401 Unauthorized. Login with owner-chosen password C -> 200 OK, lands on store home. | attackerLoginStatus=401, ownerLoginStatus=200, storeLanding=1; expected PASS | JOURNEY-LOGIN-OWNER-desktop.json + shots/JOURNEY-LOGIN-OWNER-desktop.png |
| CONCURRENT-SUBMIT-desktop | /activate | desktop 1440×900 | Fill valid form. Rapidly double-click submit / press Enter while pending. Verify exactly 1 network POST sent, button disabled with `aria-busy="true"`. | maxConcurrentRequests ≤ 1, ariaBusyAnnounced=1, submitDisabledWhilePending=1; expected PASS | CONCURRENT-SUBMIT-desktop.json + shots/CONCURRENT-SUBMIT-desktop.png |
| TOKEN-CONSUMED-desktop | /activate | desktop 1440×900 | Submit with already consumed/activated token. Upstream returns 400. Verify neutral "Liên kết không hợp lệ hoặc đã hết hạn" feedback, resend option, fixed `/login` link, no cookies. | httpStatus=400, invalidTokenMessage=1, resendAvailable=1, fixedLoginLink=1, newCookies=0; expected PASS | TOKEN-CONSUMED-desktop.json + shots/TOKEN-CONSUMED-desktop.png |
| TOKEN-EXPIRED-desktop | /activate | desktop 1440×900 | Submit with genuinely expired token. Verify 400 rejection, neutral invalid link feedback, resend option, fixed `/login` link. | httpStatus=400, invalidTokenMessage=1, resendAvailable=1, fixedLoginLink=1, newCookies=0; expected PASS | TOKEN-EXPIRED-desktop.json + shots/TOKEN-EXPIRED-desktop.png |
| TOKEN-WRONG-desktop | /activate | desktop 1440×900 | Submit with random or wrong-purpose token (e.g. staff invite token). Verify 400 rejection, neutral feedback, no account state mutation. | httpStatus=400, invalidTokenMessage=1, resendAvailable=1, fixedLoginLink=1, newCookies=0; expected PASS | TOKEN-WRONG-desktop.json + shots/TOKEN-WRONG-desktop.png |
| RESEND-REQUEST-desktop | /api/auth/activate/resend | desktop 1440×900 | On invalid token state, enter email and request resend. Verify POST contains `{email}` only (no token), returns 202 Accepted, neutral confirmation shown. | httpStatus=202, neutralAcceptedMessage=1, tokenExcludedFromBody=1; expected PASS | RESEND-REQUEST-desktop.json + shots/RESEND-REQUEST-desktop.png |
| RATE-LIMIT-desktop | /activate | desktop 1440×900 | Attempt live rate-limit on activate. Since `/auth/activate` lacks rate-limiting middleware in auth, attempts return 400 without 429; cell records live traffic attempt and verdict BLOCKED with reason. | Real traffic attempted; upstream 400 without 429; verdict BLOCKED with reason; expected BLOCKED | RATE-LIMIT-desktop.json + shots/RATE-LIMIT-desktop.png |
| SERVICE-BUSY-desktop | /activate | desktop 1440×900 | Stop Redis container and attempt live activation. Auth maps redis error to ErrInvalidActivation (400) instead of 503; restart Redis healthy; cell records live traffic attempt and verdict BLOCKED with reason. | Redis stopped and restarted; upstream 400 without 503; verdict BLOCKED with reason; expected BLOCKED | SERVICE-BUSY-desktop.json + shots/SERVICE-BUSY-desktop.png |
| CSRF-CROSS-ORIGIN-desktop | /api/auth/activate | desktop 1440×900 | From attacker page on `http://127.0.0.1:3001`, send cross-origin request to `http://127.0.0.1:3000/api/auth/activate`. Verify rejection with 403 FORBIDDEN, message "Yêu cầu không hợp lệ", zero Set-Cookie. | httpStatus=403, forbiddenCode=1, invalidRequestMessage=1, newCookies=0; expected PASS | CSRF-CROSS-ORIGIN-desktop.json + shots/CSRF-CROSS-ORIGIN-desktop.png |
| STAFF-INVITE-INDEPENDENT-desktop | /staff/invite/accept | desktop 1440×900 | Verify staff invite workflow operates exclusively at `/staff/invite/accept` -> `/staff/login`, and customer activation does not grant employee/platform roles. | staffInviteRoute=1, customerRolesOnly=1, zeroCrossGrant=1; expected PASS | STAFF-INVITE-INDEPENDENT-desktop.json + shots/STAFF-INVITE-INDEPENDENT-desktop.png |
