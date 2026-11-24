import { expect, it } from "vitest";
import { stepDone, stepEnabled } from "./qc-steps";

const all = () => true;
const received = { status: "RECEIVED", storage_location_code: "" };

it("lô vừa nhận phải có vị trí kho mới lấy mẫu được", () => {
  expect(stepEnabled("samples", received, all)).toBe(false);
  expect(stepEnabled("samples", { ...received, storage_location_code: "KHO-LANH-01" }, all)).toBe(true);
  expect(stepEnabled("sensory", received, all)).toBe(false);
});

it("chỉ lô đang kiểm mới ghi kết quả, hoàn tất và duyệt", () => {
  const checking = { status: "UNDER_QC", storage_location_code: "KHO-LANH-01" };
  for (const step of ["sensory", "temperature", "shelfLife", "complete", "decide"] as const) expect(stepEnabled(step, checking, all)).toBe(true);
  expect(stepEnabled("samples", checking, all)).toBe(false);
  expect(stepEnabled("decide", { ...checking, status: "APPROVED" }, all)).toBe(false);
});

it("thiếu quyền thì tắt đúng bước", () => {
  const checking = { status: "UNDER_QC", storage_location_code: "KHO-LANH-01" };
  const only = (action: string) => action === "inventory:qc:update";
  expect(stepEnabled("sensory", checking, only)).toBe(true);
  expect(stepEnabled("decide", checking, only)).toBe(false);
  expect(stepEnabled("location", checking, only)).toBe(false);
  expect(stepEnabled("allergens", checking, only)).toBe(false);
});

it("bước lấy mẫu và vị trí xong theo dữ liệu lô, bước còn lại theo phiên làm việc", () => {
  const checking = { status: "UNDER_QC", storage_location_code: "KHO-LANH-01" };
  expect(stepDone("location", checking, new Set())).toBe(true);
  expect(stepDone("samples", received, new Set())).toBe(false);
  expect(stepDone("samples", checking, new Set())).toBe(true);
  expect(stepDone("sensory", checking, new Set())).toBe(false);
  expect(stepDone("sensory", checking, new Set(["sensory"]))).toBe(true);
});

it("tải lại trang vẫn thấy tiêu chí đã xong theo phiếu kiểm", () => {
  const checking = { status: "UNDER_QC", storage_location_code: "KHO-LANH-01" };
  const progress = { sample_taken: true, sensory_checked: true, temperature_checked: false, shelf_life_checked: true, decision: null };
  expect(stepDone("sensory", checking, new Set(), progress)).toBe(true);
  expect(stepDone("temperature", checking, new Set(), progress)).toBe(false);
  expect(stepDone("shelfLife", checking, new Set(), progress)).toBe(true);
  expect(stepDone("complete", checking, new Set(), progress)).toBe(false);
  expect(stepDone("complete", checking, new Set(), { ...progress, decision: "PASS" })).toBe(true);
});
