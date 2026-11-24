import { expect, it } from "vitest";
import { FetchError } from "@/lib/fetcher";
import { requestErrorMessage } from "./error-message";

it.each([[401, "đăng nhập"], [403, "quyền"], [404, "Không tìm thấy"], [409, "vừa thay đổi"], [422, "chưa hợp lệ"], [500, "thử lại"], [503, "thử lại"]])("lỗi %s hiện câu tiếng Việt, không lộ câu thô của backend", (status, part) => {
  const message = requestErrorMessage(new FetchError("missing permission inventory:shelf_pending:read", status));
  expect(message).toContain(part);
  expect(message).not.toContain("missing permission");
});
it("mất mạng hiện câu tiếng Việt, không lộ Failed to fetch", () => {
  expect(requestErrorMessage(new TypeError("Failed to fetch"))).toContain("kết nối");
});
it("lỗi do chính portal viết bằng tiếng Việt thì giữ nguyên câu", () => {
  expect(requestErrorMessage(new Error("Danh sách trả lại trang trùng. Hãy thử lại."))).toBe("Danh sách trả lại trang trùng. Hãy thử lại.");
});

it("403 luôn mang một câu cố định, kể cả khi đọc thẳng error.message", () => {
  const raw = "chỉ bếp trung tâm làm việc với nhà cung cấp và phiếu nhập";
  const error = new FetchError(raw, 403, { message: raw });
  expect(error.message).toBe(requestErrorMessage(error));
  expect(error.message).not.toContain(raw);
  expect(new FetchError(raw, 409).message).toBe(raw);
});
