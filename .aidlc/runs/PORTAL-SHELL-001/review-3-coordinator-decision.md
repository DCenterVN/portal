# Quyết định coordinator — review-3 (2026-10-04)

Review-3 (codex sol, BLOCKED) xác nhận #1 và #2 đã sửa; M-g, M-h KILLED 2/2; 253/253 test PASS.

Finding còn lại (MEDIUM): 15 override Button trong `components/` (login-form + 7 modal), gate chỉ quét `app/`, `features/`.

Quyết định ban đầu PASS_WITH_RISK bị `gate pr` từ chối (cần PASS). Sửa: bổ sung S15/S16 vào plan Shell để dọn 15 override và mở rộng gate sang `components/`; sau đó review lại.

Lập luận cũ (giữ để truy vết):
- AC-6 (`plan.md:109`) giới hạn phạm vi "trong `app/`, `features/`" — đã đạt 0 override ở đó, có gate AST + mutation M-h/M-i.
- 15 override ở `components/` là code có sẵn, Shell không sửa. Chuyển sang PORTAL-REBRAND-001:
  - S2 (button.tsx), S3 (dialog), S4 (confirm-qc-decision-modal, session-timeout-modal), S5 (login-form) đã có trong plan.
  - 5 modal còn lại (allergen-warning, cold-chain-violation, invite-member, quantity-variance, supplier-suspension) và việc mở rộng gate sang `components/` phải bổ sung plan REBRAND (cần Dawn duyệt lại) trước S9.
