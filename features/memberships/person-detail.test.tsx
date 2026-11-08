import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, expect, it, vi } from "vitest";
import useSWR from "swr";
import messages from "@/messages/vi.json";
import { PersonDetail } from "./person-detail";
import { recordRender } from "@/tests/record-render";

const state = vi.hoisted(() => ({ tab: "assignments", loading: false, error: false, empty: false }));
vi.mock("swr", () => ({ default: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/memberships/person", useSearchParams: () => new URLSearchParams(`tab=${state.tab}`), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => true, scope: { userId: "viewer", roles: ["ADMIN"] } }), RequireAction: ({ children }: { children: React.ReactNode }) => children }));
const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
const member = { id: "membership", user_id: uuid, branch_id: "branch", role_codes: ["SALES"], status: "ACTIVE", display_name: "An", email: "an@x.test", branch_name: "Cầu Giấy", all_branches: true };
beforeEach(() => {
  Object.assign(state, { tab: "assignments", loading: false, error: false, empty: false });
  vi.mocked(useSWR).mockImplementation(((key: string | readonly string[]) => ({ data: Array.isArray(key) ? undefined : state.empty ? [] : key === "role-holders" ? [member, { ...member, user_id: "other", display_name: "Bình", email: "binh@x.test", branch_name: "Chi nhánh khác" }] : key === "role-catalog" ? [{ code: "SALES", name: "Bán hàng", branch_types: ["STORE"] }] : [], error: state.error ? Error("unavailable") : undefined, isLoading: state.loading, mutate: vi.fn() })) as never);
});
function render() { return renderToStaticMarkup(<NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={messages}><PersonDetail userId={uuid} /></NextIntlClientProvider>); }
it("detail renders only the requested person's assignments without visible UUID", () => {
  const html = render();
  const text = html.replace(/<[^>]*>/g, " ");
  expect(text).toContain("An");
  expect(text).toContain("Cầu Giấy");
  expect(text).toContain("Bán hàng");
  expect(text).toContain("Mọi chi nhánh");
  expect(text).not.toContain("Bình");
  expect(text).not.toContain("Chi nhánh khác");
  expect(text).not.toContain(uuid);
  recordRender(<PersonDetail userId={uuid} />, "employee-assignments");
});
it("detail information tab is read only", () => {
  state.tab = "info";
  const html = render();
  expect(html).toContain("nhân viên tự sửa ở Tài khoản");
  expect(html).toMatch(/readOnly=""/i);
  recordRender(<PersonDetail userId={uuid} />, "employee-info");
});
it("detail omits unknown update time and uses FieldLabel for read only fields", () => {
  state.tab = "info";
  const html = render();
  expect(html).not.toContain("Cập nhật lần cuối");
  for (const label of ["Tên hiển thị", "Email"]) {
    expect(html).toMatch(new RegExp(`<label[^>]*data-slot="field-label"[^>]*>${label}</label>`));
  }
});
it.each(["loading", "error", "empty"] as const)("detail handles %s", (kind) => {
  state[kind] = true;
  const html = render();
  expect(html).toContain(kind === "loading" ? "skeleton" : kind === "error" ? "Không tải được" : "Không tìm thấy nhân viên");
});
