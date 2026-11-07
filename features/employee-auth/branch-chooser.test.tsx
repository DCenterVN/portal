import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SWRConfig } from "swr";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { BranchList } from "@/components/patterns/branch-list";
import { entityMatcher, filterEntities } from "@/components/patterns/entity-picker";
import { branchChoices } from "@/lib/branch-choices";
import { branchLabel, branchMeta, type BranchChoice } from "@/lib/branch-label";
import { BranchChooser } from "./branch-chooser";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-/;
const uuid = (n: number) => `0192f3a4-5b6c-7d8e-9f00-${String(n).padStart(12, "0")}`;

function contexts(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    org_id: uuid(0), org_name: "QA Fresh", branch_id: uuid(index + 1),
    branch_name: index === 0 ? "QA Fresh" : `Cửa hàng ${index === 1 ? "Cầu Giấy" : `Số ${index}`}`,
    branch_type: index === 0 ? "CENTRAL_KITCHEN" : "STORE",
    branch_status: index === 2 ? "SUSPENDED" : "ACTIVE",
    roles: index === 0 ? ["ADMIN"] : ["SALES"],
  }));
}

function chooser(count: number, extra: unknown[] = []) {
  const payload = { contexts: [...contexts(count), ...extra], active_context: { branch_id: uuid(1) } };
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={{ employeeAuth: messages.employeeAuth }}>
      <SWRConfig value={{ fallback: { "/api/auth/context": payload } }}><BranchChooser /></SWRConfig>
    </NextIntlClientProvider>,
  );
}

describe("BRANCH-5e chọn chi nhánh bằng tên", () => {
  it("fixture có UUID: markup không in UUID, hiện tên, loại, trạng thái và vai trò bằng tiếng Việt", () => {
    const html = chooser(3);
    expect(html).not.toMatch(UUID);
    expect(html).toContain("QA Fresh · Bếp trung tâm");
    expect(html).toContain("Cửa hàng Cầu Giấy");
    expect(html).toContain("Tạm ngừng · Bán hàng");
    expect(html).not.toContain("Cửa hàng · Tạm ngừng");
    expect(html).not.toMatch(/SUSPENDED|CENTRAL_KITCHEN|ADMIN/);
  });

  it("30 chi nhánh: có ô tìm; 7 chi nhánh: không có", () => {
    expect(chooser(30)).toContain('aria-label="Tìm chi nhánh"');
    expect(chooser(7)).not.toContain('aria-label="Tìm chi nhánh"');
  });

  it("mã chi nhánh từ Org hiện ở dòng phụ và tìm được bằng mã", () => {
    const [kitchen, store] = contexts(2);
    const branches = branchChoices([{ ...kitchen, branch_code: "MAIN" }, { ...store, branch_code: "CAU-GIAY" }]);
    const names = (query: string) => filterEntities(branches, query, entityMatcher<BranchChoice>(branchLabel, (branch) => branchMeta(branch, branch.roles))).map(branchLabel);
    expect(branches.map((branch) => branchMeta(branch))).toEqual(["MAIN · Đang hoạt động", "CAU-GIAY · Đang hoạt động"]);
    expect(names("cau-giay")).toEqual(["QA Fresh · Cửa hàng Cầu Giấy"]);
  });

  it("30 chi nhánh: gõ một phần tên ra đúng mục, không phân biệt dấu", () => {
    const branches = branchChoices(contexts(30));
    expect(branches).toHaveLength(30);
    const names = (query: string) => filterEntities(branches, query, entityMatcher<BranchChoice>(branchLabel, (branch) => branchMeta(branch, branch.roles))).map(branchLabel);
    expect(names("cau giay")).toEqual(["QA Fresh · Cửa hàng Cầu Giấy"]);
    expect(names("so 29")).toEqual(["QA Fresh · Cửa hàng Số 29"]);
    expect(names("khong co")).toEqual([]);
  });

  it("1 chi nhánh: vào thẳng, không hiện danh sách", () => {
    const html = chooser(1);
    expect(html).toContain("Đang vào QA Fresh · Bếp trung tâm");
    expect(html).not.toContain("cmdk-list");
    expect(html).not.toContain('role="option"');
  });

  it("trùng chi nhánh do nhiều vai trò gộp thành một mục; chi nhánh đã đóng không có trong danh sách", () => {
    const base = contexts(2);
    const duplicate = { ...base[1], roles: ["WAREHOUSE"] };
    const closed = { ...base[1], branch_id: uuid(99), branch_name: "Cửa hàng cũ", branch_status: "CLOSED" };
    const merged = branchChoices([...base, duplicate, closed]);
    expect(merged.map(branchLabel)).toEqual(["QA Fresh · Bếp trung tâm", "QA Fresh · Cửa hàng Cầu Giấy"]);
    expect(merged[1].roles).toEqual(["SALES", "WAREHOUSE"]);
  });

  it("danh sách tách theo chi nhánh đang làm việc và đánh dấu mục hiện tại", () => {
    const html = renderToStaticMarkup(<BranchList branches={branchChoices(contexts(3))} currentId={uuid(1)} onPick={() => {}} />);
    expect(html.match(/role="option"/g)).toHaveLength(3);
    expect(html).not.toMatch(UUID);
  });
});
