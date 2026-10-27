import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import messages from "@/messages/vi.json";
import { AccessProvider } from "@/lib/access-boundary";
import { supplier } from "@/mocks/supplier-contract";
import { SupplierFormContainer } from "./supplier-form-container";
import { saveSupplierWithPhoto, supplierFormErrors, supplierFormInput, supplierFormValues, type SupplierSaveState } from "./use-supplier-form";
import * as suppliersApi from "@/lib/api/suppliers";
import * as photoApi from "@/lib/api/supplier-photo";
import * as documentsApi from "@/lib/api/agreement-documents";
import { documentID } from "@/mocks/supplier-contract";

afterEach(() => vi.restoreAllMocks());
it.each(["presign", "upload", "finalize"])("retry %s không tạo NCC lần hai, giữ upload và key", async failing => {
  const create = vi.spyOn(suppliersApi, "createSupplier").mockResolvedValue(supplier);
  const checksum = vi.spyOn(documentsApi, "fileSHA256").mockResolvedValue("a".repeat(64));
  const target = { upload_id: documentID, upload_url: "http://storage.test/upload", form_fields: {}, expires_in: 300 };
  const presign = vi.spyOn(photoApi, "presignSupplierPhoto").mockResolvedValue(target);
  const upload = vi.spyOn(documentsApi, "uploadDocument").mockResolvedValue();
  const finalized = { upload_id: documentID, mime: "image/png" as const, size_bytes: 4, updated_at: "2026-10-27T00:00:00Z" };
  const finalize = vi.spyOn(photoApi, "finalizeSupplierPhoto").mockResolvedValue(finalized);
  if (failing === "presign") presign.mockRejectedValueOnce(new Error("offline"));
  if (failing === "upload") upload.mockRejectedValueOnce(new Error("offline"));
  if (failing === "finalize") finalize.mockRejectedValueOnce(new Error("offline"));
  const state: SupplierSaveState = { key: "create-key", presignKey: "presign-key", finalizeKey: "finalize-key" };
  const input = supplierFormInput(supplierFormValues(supplier), [], false);
  const options = { state, input, file: new File(["test"], "photo.png", { type: "image/png" }) };
  await expect(saveSupplierWithPhoto(options)).rejects.toThrow("offline");
  expect(state.saved?.id).toBe(supplier.id);
  expect(await saveSupplierWithPhoto(options)).toMatchObject({ id: supplier.id, photo: { mime: "image/png", size_bytes: 4 } });
  expect(create).toHaveBeenCalledTimes(1);
  expect(checksum).toHaveBeenCalledTimes(1);
  expect(presign).toHaveBeenCalledTimes(failing === "presign" ? 2 : 1);
  expect(upload).toHaveBeenCalledTimes(failing === "upload" ? 2 : 1);
  expect(finalize).toHaveBeenLastCalledWith(supplier.id, documentID, "finalize-key");
});
it("không có ảnh chỉ lưu hồ sơ, không presign", async () => {
  const create = vi.spyOn(suppliersApi, "createSupplier").mockResolvedValue(supplier);
  const presign = vi.spyOn(photoApi, "presignSupplierPhoto");
  const state: SupplierSaveState = { key: "save-key", presignKey: "photo-key", finalizeKey: "final-key" };
  expect(await saveSupplierWithPhoto({ state, input: { code: supplier.code, name: supplier.name } })).toEqual(supplier);
  expect(create).toHaveBeenCalledTimes(1);
  expect(presign).not.toHaveBeenCalled();
});

type SurfaceProps = { children?: ReactNode; open?: boolean };
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: SurfaceProps) => open ? children : null,
  DialogContent: ({ children }: SurfaceProps) => <section>{children}</section>,
  DialogHeader: ({ children }: SurfaceProps) => <header>{children}</header>,
  DialogTitle: ({ children }: SurfaceProps) => <h2>{children}</h2>,
  DialogDescription: ({ children }: SurfaceProps) => <p>{children}</p>,
  DialogFooter: ({ children }: SurfaceProps) => <footer>{children}</footer>,
  ConfirmDialog: () => null,
}));

it("form thêm/sửa có đủ section và mọi trường hồ sơ", () => {
  for (const value of [undefined, supplier]) {
    const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:create", "inventory:supplier:update"]) }}><SupplierFormContainer supplier={value} onClose={() => {}} onSaved={() => {}} /></AccessProvider></NextIntlClientProvider>);
    for (const label of ["Thông tin chung", "Địa chỉ", "Liên hệ", "Nhóm nguyên liệu", "Người liên hệ", "Điện thoại", "Email", "Ghi chú nội bộ", "Phường, xã", "Tỉnh, thành phố"]) expect(html).toContain(label);
    expect(html).toContain("Lưu nhà cung cấp");
    expect(html).toContain("Chọn ảnh");
    expect(html).toContain("image/jpeg,image/png,image/webp");
    expect(html).not.toContain("e30=");
  }
});

it("validate email và số VN, đếm ký tự Unicode theo server", () => {
  const values = supplierFormValues(supplier);
  expect(supplierFormErrors({ ...values, email: "sai-email", phone: "123" })).toMatchObject({ email: "emailError", phone: "phoneError" });
  for (const phone of ["", "0901234567", "+84901234567"]) expect(supplierFormErrors({ ...values, phone }).phone).toBeUndefined();
  expect(supplierFormErrors({ ...values, contactName: "á".repeat(151) }).contactName).toBe("lengthError");
  expect(supplierFormErrors({ ...values, contactName: "á".repeat(150) }).contactName).toBeUndefined();
});

it("PATCH giữ nhóm legacy khi chưa chọn lại và gửi rõ rỗng khi xoá", () => {
  const values = supplierFormValues({ ...supplier, contact_phone: "0901234567" });
  const untouched = supplierFormInput(values, [], false);
  expect(untouched).not.toHaveProperty("material_category_codes");
  expect(untouched).not.toHaveProperty("material_categories");
  const cleared = supplierFormInput({ ...values, phone: "", line: "", ward: "", province: "" }, [], true);
  expect(cleared).toMatchObject({ contact_phone: "", address: { line: "", ward: "", province: "" }, material_category_codes: [] });
});
