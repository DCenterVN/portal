import { describe, expect, it } from "vitest";
import { draftAttempt, draftSchema } from "@/lib/api/dishes";

// S14c (6): draftAttempt() trả hàm attempt(input) => key; attempt.done() gọi sau khi tạo nháp THÀNH CÔNG để lần tạo mới cùng payload nhận key khác.
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
