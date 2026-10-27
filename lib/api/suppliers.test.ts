import { afterEach, expect, it, vi } from "vitest";
import { getSuppliers, getSupplier, createSupplier, updateSupplier, suspendSupplier } from "./suppliers";
import { envelope, supplier, supplierID } from "@/mocks/supplier-contract";
afterEach(() => vi.unstubAllGlobals());
it("giữ metadata ảnh hoặc null, từ chối ảnh sai loại/kích thước", async () => {
  const photo = { mime: "image/png", size_bytes: 4, updated_at: "2026-10-27T00:00:00Z" };
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(envelope({ ...supplier, photo }))).mockResolvedValueOnce(Response.json(envelope({ ...supplier, photo: null })));
  vi.stubGlobal("fetch", fetch);
  expect((await getSupplier(supplierID)).photo).toEqual(photo);
  expect((await getSupplier(supplierID)).photo).toBeNull();
  for (const invalid of [{ ...photo, mime: "application/pdf" }, { ...photo, size_bytes: 0 }, { ...photo, size_bytes: 5242881 }, { ...photo, updated_at: "bad" }]) {
    fetch.mockResolvedValueOnce(Response.json(envelope({ ...supplier, photo: invalid })));
    await expect(getSupplier(supplierID)).rejects.toThrow();
  }
});
it("giữ địa chỉ, liên hệ và nhóm mới khi lưu rồi đọc lại", async () => {
  const profile = { address: { line: "12 Nguyễn Trãi", ward: "Bến Thành", province: "TP Hồ Chí Minh" }, contact_name: "Nguyễn An", contact_phone: "+84901234567", contact_email: "an@example.com", note: "Giao buổi sáng", material_category_codes: ["GA", "RAU_LA"], category_migration_required: false };
  const fetch = vi.fn().mockImplementation(async () => Response.json(envelope({ ...supplier, ...profile })));
  vi.stubGlobal("fetch", fetch);
  const saved = await updateSupplier(supplierID, profile);
  expect(saved).toMatchObject(profile);
  expect(await getSupplier(supplierID)).toMatchObject(profile);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(profile);
  await updateSupplier(supplierID, { contact_name: "", contact_phone: "", contact_email: "", note: "", material_category_codes: [] });
  expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ contact_name: "", contact_phone: "", contact_email: "", note: "", material_category_codes: [] });
});
it.each([{ address: "e30=" }, { address: { line: 123 } }, { contact_phone: 123 }, { material_category_codes: [123] }, { category_migration_required: "false" }])("từ chối hồ sơ sai kiểu %j", async invalid => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(envelope({ ...supplier, ...invalid }))));
  await expect(getSupplier(supplierID)).rejects.toThrow();
});
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
