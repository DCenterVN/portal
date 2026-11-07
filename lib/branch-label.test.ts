import { expect, it } from "vitest";
import { branchLabel, branchMeta, branchTypeLabel } from "./branch-label";

it("bếp trung tâm mang tên công ty thì ghi thêm loại", () => {
  expect(branchLabel({ name: "QA Fresh", type: "CENTRAL_KITCHEN" })).toBe("QA Fresh · Bếp trung tâm");
});

it("tên đã nói loại rồi thì giữ nguyên, không lặp", () => {
  expect(branchLabel({ name: "Bếp trung tâm", type: "CENTRAL_KITCHEN" })).toBe("Bếp trung tâm");
  expect(branchLabel({ name: "Bếp Trung Tâm Hà Nội", type: "CENTRAL_KITCHEN" })).toBe("Bếp Trung Tâm Hà Nội");
});

it("cửa hàng giữ tên của nó", () => {
  expect(branchLabel({ name: "Cửa hàng Cầu Giấy", type: "STORE" })).toBe("Cửa hàng Cầu Giấy");
  expect(branchTypeLabel("STORE")).toBe("Cửa hàng");
});

it("MAIN trùng tên công ty: không bao giờ ghi hai lần", () => {
  expect(branchLabel({ name: "Sunny", type: "CENTRAL_KITCHEN", org: "Sunny" })).toBe("Sunny · Bếp trung tâm");
});

it("cửa hàng ghi thêm tên công ty, trừ khi tên cửa hàng đã có sẵn", () => {
  expect(branchLabel({ name: "Cửa hàng Cầu Giấy", type: "STORE", org: "Sunny" })).toBe("Sunny · Cửa hàng Cầu Giấy");
  expect(branchLabel({ name: "Sunny Cầu Giấy", type: "STORE", org: "Sunny" })).toBe("Sunny Cầu Giấy");
});

it("dòng phụ không nhắc lại loại chi nhánh khi nhãn đã nói loại", () => {
  expect(branchMeta({ name: "Sunny", org: "Sunny", type: "CENTRAL_KITCHEN", status: "ACTIVE", code: "MAIN" })).toBe("MAIN · Đang hoạt động");
  expect(branchMeta({ name: "Cửa hàng Cầu Giấy", org: "Sunny", type: "STORE", status: "ACTIVE", code: "CAU-GIAY" })).toBe("CAU-GIAY · Đang hoạt động");
  expect(branchMeta({ name: "Cầu Giấy", type: "STORE", status: "SUSPENDED" })).toBe("Cửa hàng · Tạm ngừng");
  expect(branchMeta({ type: "STORE", status: "ACTIVE" })).toBe("Cửa hàng · Đang hoạt động");
});
