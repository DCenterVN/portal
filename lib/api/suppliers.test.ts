import { afterEach, expect, it, vi } from "vitest";
import { getSuppliers, getSupplier, createSupplier, updateSupplier, suspendSupplier } from "./suppliers";
import { envelope, supplier, supplierID } from "@/mocks/supplier-contract";
afterEach(() => vi.unstubAllGlobals());
it("đọc envelope, q/cursor và tên NCC, không chấp nhận body phẳng", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(envelope({ items: [supplier], next_cursor: "" }))).mockResolvedValueOnce(Response.json(envelope(supplier))).mockResolvedValueOnce(Response.json(supplier));
  vi.stubGlobal("fetch", fetch);
  expect((await getSuppliers({ q: "Gạo An", cursor: "next" })).items[0].name).toBe("Gạo An Bình");
  expect(new URL(String(fetch.mock.calls[0][0])).searchParams.get("q")).toBe("Gạo An");
  expect((await getSupplier(supplierID)).code).toBe("NCC-GAO");
  await expect(getSupplier(supplierID)).rejects.toThrow();
});
it("CRUD dùng key, đúng method và giữ lỗi quyền", async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json(envelope(supplier, 201)));
  vi.stubGlobal("fetch", fetch);
  await createSupplier({ code: "NCC-GAO", name: "Gạo An Bình", material_categories: [] });
  await updateSupplier(supplierID, { name: "Tên mới" });
  await suspendSupplier(supplierID, "SUSPEND", "Tạm ngừng");
  expect(fetch.mock.calls.map(([, init]) => init.method)).toEqual(["POST", "PATCH", "POST"]);
  expect(fetch.mock.calls.every(([, init]) => Boolean(init.headers["Idempotency-Key"]))).toBe(true);
  fetch.mockResolvedValueOnce(Response.json({ errors: { error_code: "FORBIDDEN", message: "Quyền đã thu hồi" } }, { status: 403 }));
  await expect(getSupplier(supplierID)).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
});
