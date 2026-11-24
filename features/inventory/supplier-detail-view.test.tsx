import React from "react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierDetailContainer as SupplierDetailView } from "./supplier-detail-container";
import { supplier, supplierID } from "@/mocks/supplier-contract";
import { loadSupplierPhoto } from "./use-supplier-detail";
import { SupplierInfo, SupplierPhoto } from "./supplier-detail-view";
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

it("detail có thông tin NCC và tab hợp đồng; read không mở mutation", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={supplier} /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Gạo An Bình"); expect(html).toContain("Nguyên liệu và giá"); expect(html).not.toContain(">Sửa thông tin<");
});
it("hồ sơ có ảnh chữ đầu, mã, nhóm cũ, địa chỉ và liên hệ đúng dữ liệu", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} tab="overview" initialSupplier={{ ...supplier, address: { line: "12 Nguyễn Trãi", ward: "", province: "" }, material_category_codes: [], contact_name: "", contact_phone: "", material_categories: [supplierID] }}><SupplierInfo supplier={{ ...supplier, address: { line: "12 Nguyễn Trãi", ward: "", province: "" }, material_category_codes: [], contact_name: "", contact_phone: "", material_categories: [supplierID] }} /></SupplierDetailView></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Ảnh nhà cung cấp Gạo An Bình");
  expect(html).toContain("Nhóm cũ cần chọn lại");
  expect(html).toContain("12 Nguyễn Trãi");
  expect(html).toContain("Chưa có: mã số thuế, liên hệ");
  expect(html.replace(/<[^>]*>/g, " ")).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
it.each(["overview", "agreements", "receipts"] as const)("hồ sơ ghép địa chỉ và đặt hành động ở header của tab %s", tab => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierDetailView supplierId={supplierID} tab={tab} initialSupplier={{ ...supplier, address: { line: "12 Nguyễn Trãi", ward: "Bến Thành", province: "TP Hồ Chí Minh" }, contact_name: "Nguyễn An", contact_phone: "+84901234567", contact_email: "an@example.com", note: "Giao buổi sáng" }}><SupplierInfo supplier={{ ...supplier, address: { line: "12 Nguyễn Trãi", ward: "Bến Thành", province: "TP Hồ Chí Minh" }, contact_name: "Nguyễn An", contact_phone: "+84901234567", contact_email: "an@example.com", note: "Giao buổi sáng" }} /></SupplierDetailView></AccessProvider></NextIntlClientProvider>);
  expect(html.indexOf(">Sửa thông tin<")).toBeGreaterThan(0);
  expect(html.indexOf(">Sửa thông tin<")).toBeLessThan(html.indexOf('role="tablist"'));
  expect(html.indexOf(">Ngừng hợp tác<")).toBeLessThan(html.indexOf('role="tablist"'));
  if (tab === "overview") {
    expect(html).toContain("12 Nguyễn Trãi, Bến Thành, TP Hồ Chí Minh");
    expect(html.split("Nguyễn An").length - 1).toBe(1); expect(html.split('href="tel:+84901234567"').length - 1).toBe(1);
    expect(html).toContain('href="mailto:an@example.com"'); expect(html).toContain("Giao buổi sáng");
    expect(html).not.toContain("Chưa có thông tin liên hệ");
  }
});

it("hồ sơ mặc định mở tab Nguyên liệu và giá, tab Thông tin đứng cuối", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={supplier} /></AccessProvider></NextIntlClientProvider>);
  expect(html.indexOf(">Nguyên liệu và giá<")).toBeLessThan(html.indexOf(">Lịch sử nhập<"));
  expect(html.indexOf(">Lịch sử nhập<")).toBeLessThan(html.indexOf(">Thông tin<"));
  expect(html).toMatch(/aria-selected="true"[^>]*>Nguyên liệu và giá</);
});
it("tab Thông tin chỉ hiện ô có dữ liệu và gom phần thiếu vào một dòng", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierDetailView supplierId={supplierID} tab="overview" initialSupplier={{ ...supplier, contact_phone: "", contact_name: "" }}><SupplierInfo supplier={{ ...supplier, contact_phone: "", contact_name: "" }} /></SupplierDetailView></AccessProvider></NextIntlClientProvider>);
  expect(html).not.toContain("Chưa cung cấp");
  expect(html).toContain("Chưa có: mã số thuế, địa chỉ, liên hệ");
  expect(html).not.toContain(">Bổ sung<");
});
it("dòng mô tả không lặp mã với tên", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={{ ...supplier, code: "a", name: "a" }} /></AccessProvider></NextIntlClientProvider>);
  expect(html).not.toContain("a · a");
});

it("nhãn trạng thái ngừng giống danh sách và nút chính chỉ có một", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={{ ...supplier, status: "SUSPENDED" }} /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Ngừng hợp tác"); expect(html).not.toContain("Đã ngừng hợp tác");
  expect(html).not.toContain(">Thêm bảng giá<");
});
it("ngừng hợp tác: không có Thêm bảng giá, Hợp tác lại là nút chính, Sửa thông tin là outline", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={{ ...supplier, status: "SUSPENDED" }} /></AccessProvider></NextIntlClientProvider>);
  expect(html).not.toContain(">Thêm bảng giá<");
  expect(html).toMatch(/data-variant="default"[^>]*>Hợp tác lại</);
  expect(html).toMatch(/data-variant="outline"[^>]*>Sửa thông tin</);
});
it("nhãn thư điện tử dùng chung form và tab Thông tin", () => {
  expect(messages.supplierForm.email).toBe("Thư điện tử");
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} tab="overview" initialSupplier={{ ...supplier, contact_email: "an@example.com" }}><SupplierInfo supplier={{ ...supplier, contact_email: "an@example.com" }} /></SupplierDetailView></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain(">Thư điện tử<");
});

it.each([["agreements", "Nguyên liệu và giá", ""], ["receipts", "Lịch sử nhập", "/receipts"], ["overview", "Thông tin", "/info"]] as const)("tab %s sáng đúng và là liên kết tới đường dẫn riêng", (tab, name, path) => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} tab={tab} initialSupplier={supplier} /></AccessProvider></NextIntlClientProvider>);
  expect(html).toMatch(new RegExp(`aria-selected="true"[^>]*href="/inventory/suppliers/${supplierID}${path}"[^>]*>${name}<|href="/inventory/suppliers/${supplierID}${path}"[^>]*aria-selected="true"[^>]*>${name}<|aria-selected="true"[^>]*>${name}<`));
  expect(html).not.toContain("?tab=");
});
it("nút Sửa thông tin và Thêm giá nguyên liệu là liên kết tới đường con", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={supplier} /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain(`href="/inventory/suppliers/${supplierID}/edit"`);
  expect(html).toContain(`href="/inventory/suppliers/${supplierID}/prices/new"`);
});
