import { describe, expect, it } from "vitest";
import { draftAttempt, draftSchema, safeMessage } from "@/lib/api/dishes";

describe("draftAttempt", () => {
  const empty = { kind: "CREATE", content: { schema_version: 1, name: "" } };
  it("giữ key khi gửi lại cùng payload (chưa rõ kết quả)", () => {
    const attempt = draftAttempt();
    expect(attempt(empty)).toBe(attempt(empty));
  });
  it("đổi key khi payload đổi", () => {
    const attempt = draftAttempt();
    expect(attempt(empty)).not.toBe(attempt({ ...empty, kind: "COPY" }));
  });
  it("sau done() (tạo thành công) cùng payload nháp rỗng nhận key mới", () => {
    const attempt = draftAttempt();
    const first = attempt(empty);
    expect(typeof attempt.done).toBe("function");
    attempt.done();
    expect(attempt(empty)).not.toBe(first);
  });
  it("chưa done() -> key vẫn giữ sau lần gọi", () => {
    const attempt = draftAttempt();
    const first = attempt(empty);
    expect(attempt(empty)).toBe(first);
  });
});

describe("draftSchema giữ nguồn do server lưu", () => {
  const base = { id: "d1", kind: "REVISION", revision: 2, status: "OPEN", progress: { claim: "r2" }, content: { schema_version: 1 } };
  it("product_ref / set_ref được giữ khi nháp đã đóng", () => {
    const parsed = draftSchema.parse({ ...base, status: "COMPLETED", product_ref: "prod-done", set_ref: "set-done" }) as Record<string, unknown>;
    expect(parsed.product_ref).toBe("prod-done");
    expect(parsed.set_ref).toBe("set-done");
  });
  it("source_product_ref / source_set_ref được giữ", () => {
    const parsed = draftSchema.parse({ ...base, source_product_ref: "prod-A", source_set_ref: "set-A" }) as Record<string, unknown>;
    expect(parsed.source_product_ref).toBe("prod-A");
    expect(parsed.source_set_ref).toBe("set-A");
  });
  it("null -> null (CREATE)", () => {
    const parsed = draftSchema.parse({ ...base, kind: "CREATE", source_product_ref: null, source_set_ref: null }) as Record<string, unknown>;
    expect(parsed.source_product_ref).toBeNull();
    expect(parsed.source_set_ref).toBeNull();
  });
});

describe("draftSchema giữ mốc nguồn bất biến do server lưu (R2-C1, S15c)", () => {
  const base = { id: "d1", kind: "REVISION", revision: 2, status: "OPEN", progress: { claim: "r2" }, content: { schema_version: 1 }, source_product_ref: "prod-A", source_set_ref: "set-A" };
  it("source_set_updated_at được giữ nguyên chuỗi server", () => {
    const parsed = draftSchema.parse({ ...base, source_set_updated_at: "2026-10-20T01:02:03.456789Z" }) as Record<string, unknown>;
    expect(parsed.source_set_updated_at).toBe("2026-10-20T01:02:03.456789Z");
  });
  it("null -> null (CREATE)", () => {
    const parsed = draftSchema.parse({ ...base, kind: "CREATE", source_product_ref: null, source_set_ref: null, source_set_updated_at: null }) as Record<string, unknown>;
    expect(parsed.source_set_updated_at).toBeNull();
  });
  it("thiếu trường -> null, không điền mốc khác", () => {
    const parsed = draftSchema.parse(base) as Record<string, unknown>;
    expect(parsed.source_set_updated_at).toBeNull();
  });
});

describe("safeMessage", () => {
  it("mask UUID thành mục đã chọn", () => {
    expect(safeMessage("Không thấy 123e4567-e89b-12d3-a456-426614174999")).toBe("Không thấy mục đã chọn");
  });

  it("dịch các thông báo lỗi kỹ thuật tiếng Anh sang tiếng Việt", () => {
    expect(safeMessage("food catalog reference not found")).toBe("Không tìm thấy nháp hoặc món này. Có thể mục này đã bị xoá.");
    expect(safeMessage("không tìm thấy product 123e4567-e89b-12d3-a456-426614174999")).toBe("Không tìm thấy món ăn này. Có thể món đã bị xoá.");
    expect(safeMessage("Product not found")).toBe("Không tìm thấy món ăn này. Có thể món đã bị xoá.");
    expect(safeMessage("Not found")).toBe("Không tìm thấy dữ liệu yêu cầu.");
    expect(safeMessage("Resource not found")).toBe("Không tìm thấy dữ liệu yêu cầu.");
    expect(safeMessage("forbidden")).toBe("Bạn không có quyền thực hiện thao tác này.");
    expect(safeMessage("unauthorized")).toBe("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    expect(safeMessage("internal server error")).toBe("Hệ thống gặp lỗi tạm thời. Vui lòng thử lại sau.");
    expect(safeMessage("service unavailable")).toBe("Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.");
    expect(safeMessage("dependency unavailable")).toBe("Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.");
    expect(safeMessage("name must not be empty")).toBe("Tên món không được để trống.");
    expect(safeMessage("invalid draft kind")).toBe("Loại nháp không hợp lệ.");
    expect(safeMessage("Failed to fetch")).toBe("Không kết nối được máy chủ. Vui lòng thử lại.");
  });

  it("giữ nguyên thông báo và tên nguyên liệu tiếng Việt", () => {
    expect(safeMessage("Thịt bò thăn (cần nhập thêm giá)")).toBe("Thịt bò thăn (cần nhập thêm giá)");
  });
});
