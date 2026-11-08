import { afterEach, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MembershipsView } from "./memberships-view";
import * as swr from "swr";

vi.mock("swr", () => ({ default: vi.fn() }));
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => true, scope: { userId: "x", roles: ["ADMIN"] } }), RequireAction: ({ children }: { children: React.ReactNode }) => children }));
afterEach(() => vi.clearAllMocks());

const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";

it("memberships_group_by_person_no_uuid", () => {
  const members = [
    { id: uuid, user_id: uuid, branch_id: uuid, role_codes: ["WAREHOUSE"], status: "ACTIVE", display_name: "An", email: "an@x.test", branch_name: "Bếp trung tâm", all_branches: false },
    { id: "b", user_id: uuid, branch_id: "c", role_codes: ["SALES"], status: "ACTIVE", display_name: "An", email: "an@x.test", branch_name: "Cầu Giấy", all_branches: false },
  ];
  vi.mocked(swr.default).mockImplementation(((key: string) => ({ data: key === "role-holders" ? members : [], error: undefined, isLoading: false, mutate: vi.fn() })) as never);
  const html = renderToStaticMarkup(<MembershipsView />);
  expect(html.match(/<tr/g)).toHaveLength(2);
  expect(html).toContain("Bếp trung tâm · Kho");
  expect(html).toContain("Cầu Giấy · Bán hàng");
  expect(html).toContain(`href="/memberships/${uuid}"`);
  expect(html.replace(/<[^>]*>/g, " ")).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
