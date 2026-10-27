import React from "react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierDetailContainer as SupplierDetailView } from "./supplier-detail-container";
import { supplier, supplierID } from "@/mocks/supplier-contract";
import SupplierPage from "@/app/(console)/inventory/suppliers/[id]/page";
import { loadSupplierPhoto, useSupplierDetail } from "./use-supplier-detail";
import { SupplierPhoto } from "./supplier-detail-view";
import * as photoApi from "@/lib/api/supplier-photo";

afterEach(() => vi.restoreAllMocks());
it("ảnh có metadata mới tải URL, lỗi tải giữ placeholder", async () => {
  const download = vi.spyOn(photoApi, "downloadSupplierPhoto").mockResolvedValue("http://storage.test/read");
  expect(await loadSupplierPhoto(supplier, true)).toBe("");
  const withPhoto = { ...supplier, photo: { mime: "image/png" as const, size_bytes: 4, updated_at: "2026-10-27T00:00:00Z" } };
  expect(await loadSupplierPhoto(withPhoto, false)).toBe("");
  expect(download).not.toHaveBeenCalled();
  expect(await loadSupplierPhoto(withPhoto, true)).toBe("http://storage.test/read");
  expect(download).toHaveBeenCalledWith(supplierID);
  download.mockRejectedValueOnce(new Error("offline"));
  expect(await loadSupplierPhoto(withPhoto, true)).toBe("");
});
it("header hiện ảnh thật có alt, thiếu URL hiện chữ đầu", () => {
  const render = (url: string) => renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><SupplierPhoto name={supplier.name} url={url} onError={() => {}} /></NextIntlClientProvider>);
  expect(render("http://storage.test/read")).toContain('src="http://storage.test/read"');
  expect(render("http://storage.test/read")).toContain('alt="Ảnh nhà cung cấp Gạo An Bình"');
  expect(render("")).toContain(">G</span>");
  expect(render("")).not.toContain("<img");
});

it.each(["overview", "agreements", "receipts", "unknown"])("route giữ tab hợp lệ %s và fallback tab lạ", async tab => {
  const page = await SupplierPage({ params: Promise.resolve({ id: supplierID }), searchParams: Promise.resolve({ tab }) });
  expect(page.props.initialTab).toBe(tab === "unknown" ? "overview" : tab);
});

function ReceiptTabProbe() {
  const detail = useSupplierDetail({ supplierId: supplierID, initialSupplier: supplier, initialTab: "receipts" });
  return <span>{detail.tab}</span>;
}
it("state hồ sơ giữ initialTab receipts", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><ReceiptTabProbe /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("receipts");
});
it("detail có thông tin NCC và tab hợp đồng; read không mở mutation", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={supplier} /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Gạo An Bình"); expect(html).toContain("Bảng giá"); expect(html).not.toContain(">Sửa thông tin<");
});
it("hồ sơ có ảnh chữ đầu, mã, nhóm cũ, địa chỉ và liên hệ đúng dữ liệu", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={{ ...supplier, address: { line: "12 Nguyễn Trãi", ward: "", province: "" }, material_category_codes: [], contact_name: "", contact_phone: "", material_categories: [supplierID] }} /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Ảnh nhà cung cấp Gạo An Bình");
  expect(html).toContain("Mã nhà cung cấp");
  expect(html).toContain("Nhóm cũ cần chọn lại");
  expect(html).toContain("12 Nguyễn Trãi");
  expect(html).toContain("Chưa có thông tin liên hệ");
  expect(html.replace(/<[^>]*>/g, " ")).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
it.each(["overview", "agreements", "receipts"] as const)("hồ sơ ghép địa chỉ và đặt hành động ở header của tab %s", tab => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierDetailView supplierId={supplierID} initialTab={tab} initialSupplier={{ ...supplier, address: { line: "12 Nguyễn Trãi", ward: "Bến Thành", province: "TP Hồ Chí Minh" }, contact_name: "Nguyễn An", contact_phone: "+84901234567", contact_email: "an@example.com", note: "Giao buổi sáng" }} /></AccessProvider></NextIntlClientProvider>);
  expect(html.indexOf(">Sửa thông tin<")).toBeGreaterThan(0);
  expect(html.indexOf(">Sửa thông tin<")).toBeLessThan(html.indexOf('role="tablist"'));
  expect(html.indexOf(">Ngừng hợp tác<")).toBeLessThan(html.indexOf('role="tablist"'));
  if (tab === "overview") {
    expect(html).toContain("12 Nguyễn Trãi, Bến Thành, TP Hồ Chí Minh");
    expect(html).toContain("Nguyễn An"); expect(html).toContain('href="tel:+84901234567"');
    expect(html).toContain('href="mailto:an@example.com"'); expect(html).toContain("Giao buổi sáng");
    expect(html).not.toContain("Chưa có thông tin liên hệ");
  }
});
