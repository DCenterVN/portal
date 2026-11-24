import { expect, it } from "vitest";
import { supplierSuspendReasons, supplierReasonNoteRequired } from "./supplier-suspend";

it("danh sách lý do đúng năm giá trị của hợp đồng, nhãn tiếng Việt", () => {
  expect(supplierSuspendReasons.map(item => item.code)).toEqual(["QUALITY", "DELIVERY", "DOCUMENTS", "BUSINESS_CLOSED", "OTHER"]);
  expect(supplierSuspendReasons.map(item => item.label)).toEqual(["Chất lượng hàng không đạt", "Giao hàng chậm hoặc thiếu", "Thiếu hoặc sai chứng từ", "Ngừng kinh doanh", "Lý do khác"]);
});
it("ghi chú bắt buộc khi hợp tác lại hoặc chọn lý do khác, còn lại tuỳ chọn", () => {
  expect(supplierReasonNoteRequired("ACTIVATE", "")).toBe(true);
  expect(supplierReasonNoteRequired("SUSPEND", "OTHER")).toBe(true);
  expect(supplierReasonNoteRequired("SUSPEND", "QUALITY")).toBe(false);
});
