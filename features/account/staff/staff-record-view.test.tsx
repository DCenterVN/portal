import * as React from "react";
import { beforeEach, expect, it, vi } from "vitest";
import useSWR from "swr";
import { StaffAccount } from "./staff-account";
import { recordRender } from "@/tests/record-render";
import type { UserProfile } from "@/lib/auth/client";

const state = vi.hoisted(() => ({ tab: "info" }));
vi.mock("swr", () => ({ default: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/account", useSearchParams: () => new URLSearchParams(`tab=${state.tab}`), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ scope: { branchId: "branch", branchName: "Cầu Giấy" } }) }));
const profile: UserProfile = {
  id: "user", display_name: "Nguyễn Minh An", email: "an@example.test", phone: "0901234567", status: "ACTIVE", created_at: "2026-09-29T10:00:00Z",
  memberships: [{ org_id: "org", org_name: "Bếp Hà Nội", branch_id: "branch", branch_name: "Cầu Giấy", roles: ["SALES"] }, { org_id: "org", org_name: "Bếp Hà Nội", branch_id: "central", branch_name: "Bếp trung tâm", roles: ["WAREHOUSE"] }],
};
beforeEach(() => {
  state.tab = "info";
  vi.mocked(useSWR).mockImplementation(((key: readonly string[]) => ({ data: key[0] === "/api/auth/me" ? profile : { items: [], pagination: { total_pages: 1 } }, isLoading: false, mutate: vi.fn() })) as never);
});
it("staff information uses the record header, editable name and phone, and managed email", () => {
  const html = recordRender(<StaffAccount />, "account-info");
  expect(html).toContain("Nguyễn Minh An");
  expect(html).toContain("Tham gia 29/09/2026");
  expect(html).toContain("Cầu Giấy");
  expect(html).toContain('id="display_name-field"');
  expect(html).toContain('id="phone-field"');
  expect(html).toMatch(/<input[^>]*readOnly=""[^>]*value="an@example.test"/i);
  expect(html).toContain("Email do quản trị viên đổi.");
  expect(html).toContain("Đổi ảnh");
});
it("account has a topbar title and a semantic page breadcrumb", () => {
  const html = recordRender(<StaffAccount />);
  const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
  expect(header).toContain("Tài khoản của tôi");
  const main = html.slice(html.indexOf("<main"));
  expect(main).toMatch(/aria-label="breadcrumb"[\s\S]*?aria-current="page"[^>]*>Tài khoản của tôi/);
});
it("account omits unknown update time and shows roles only once in the header", () => {
  const html = recordRender(<StaffAccount />);
  expect(html).not.toContain("Cập nhật lần cuối");
  expect(html.match(/Bán hàng/g)).toHaveLength(1);
  expect(html.match(/>Kho</g)).toHaveLength(1);
});
it("account uses FieldLabel for every contact field and disables the managed email", () => {
  const html = recordRender(<StaffAccount />);
  for (const label of ["Email", "Số điện thoại", "Tên hiển thị"]) {
    expect(html).toMatch(new RegExp(`<label[^>]*data-slot="field-label"[^>]*>${label}</label>`));
  }
  expect(html).toMatch(/<input[^>]*disabled=""[^>]*value="an@example.test"/);
});
it("staff roles tab shows branch roles and the existing branch switch", () => {
  state.tab = "roles";
  const html = recordRender(<StaffAccount />, "account-roles");
  expect(html).toContain("Bếp trung tâm");
  expect(html).toContain("Bán hàng");
  expect(html).toContain("Kho");
  expect(html).toContain('href="/staff/switch-branch"');
});
it("staff security tab reuses password and sessions controls", () => {
  state.tab = "security";
  const html = recordRender(<StaffAccount />, "account-security");
  expect(html).toContain("Mật khẩu");
  expect(html).toContain("Phiên đăng nhập");
  expect(html).toContain("Đổi mật khẩu");
  expect(html).toContain("Đăng xuất mọi thiết bị");
});
