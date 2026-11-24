import { expect, it } from "vitest";
import { FetchError } from "@/lib/fetcher";
import { qcFailureMessage, qcWhoCanDecide } from "./qc-rules";

it("trùng người nấu hoặc đóng gói: nói rõ lý do và việc cần làm tiếp", () => {
  const error = new FetchError("vi phạm SoD: người kiểm định QC không được trùng với người tham gia các công đoạn chế biến/đóng gói", 403, {});
  const text = qcFailureMessage(error);
  expect(text).toContain("đã nấu hoặc đóng gói");
  expect(text).toContain("nhân viên Chế biến khác");
  expect(text).not.toMatch(/SoD|không có quyền/);
});

it("thiếu quyền kiểm: nói ai được làm", () => {
  const text = qcFailureMessage(new FetchError("forbidden", 403, {}));
  expect(text).toContain("Chế biến");
  expect(text).toContain("Quản trị");
  expect(qcWhoCanDecide).toContain("Chế biến");
});

it("lỗi khác giữ nguyên câu của máy chủ", () => {
  expect(qcFailureMessage(new FetchError("Lô không ở trạng thái chờ QC", 409, {}))).toBe("Lô không ở trạng thái chờ QC");
  expect(qcFailureMessage(new Error("Mất mạng"))).toBe("Mất mạng");
  expect(qcFailureMessage("x")).toBe("Lỗi không xác định");
});
