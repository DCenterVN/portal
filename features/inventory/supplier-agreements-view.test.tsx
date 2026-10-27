import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { useSupplierAgreements } from "./use-supplier-agreements";
import * as documentsAPI from "@/lib/api/agreement-documents";
import * as attachmentAPI from "@/lib/api/supplier-agreement-documents";
import { document, documentID } from "@/mocks/supplier-contract";
import { FetchError } from "@/lib/fetcher";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierAgreementsContainer as SupplierAgreementsView } from "./supplier-agreements-container";
import { agreement, supplierID } from "@/mocks/supplier-contract";
it("ACTIVE chỉ Ngừng dùng và Lập bảng giá mới, không có editor sửa giá", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE" }]} /></AccessProvider>);
  expect(html).toContain("Ngừng dùng"); expect(html).toContain("Lập bảng giá mới"); expect(html).not.toContain("Lưu nháp"); expect(html).not.toContain('name="unit_price_vnd"');
});
it("SUSPENDED không mở lại; read-only không có action áp dụng", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, status: "SUSPENDED", status_reason: "Ngừng hợp tác" }]} /></AccessProvider>);
  expect(html).toContain("Ngừng hợp tác"); expect(html).not.toContain(">Áp dụng bảng giá<"); expect(html).not.toContain(">Lập bảng giá mới<");
});
it("bảng giá nhiều dòng hiển thị ngày VN và chứng từ gọn", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, document_ref: null, lines: [...agreement.lines, { ...agreement.lines[0], uom: "G", unit_price_vnd: 50 }] }]} /></AccessProvider>);
  expect(html).toContain("Bảng giá tham chiếu");
  expect(html).toContain("01/11/2026");
  expect(html).toContain("Chưa có chứng từ");
  expect(html).toContain("Nháp");
  expect(html).toContain("25.000");
  expect(html).not.toContain("Chứng từ chính");
});

it("ACTIVE thiếu file cho gắn bổ sung, file primary hiện Có chứng từ", () => {
  function show(primary?: string, update = true, status: "ACTIVE" | "DRAFT" | "SUSPENDED" = "ACTIVE") {
    return renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", ...(update ? ["inventory:supplier:update"] : [])]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, status, document_ref: null, primary_document_ref: primary }]} /></AccessProvider>);
  }
  expect(show()).toContain(">Gắn chứng từ<");
  expect(show(agreement.document_ref)).toContain("Có chứng từ");
  expect(show(agreement.document_ref)).not.toContain(">Gắn chứng từ<");
  expect(show(undefined, false)).not.toContain(">Gắn chứng từ<");
  expect(show(undefined, true, "DRAFT")).not.toContain(">Gắn chứng từ<");
  expect(show(undefined, true, "SUSPENDED")).not.toContain(">Gắn chứng từ<");
});

const harness = vi.hoisted(() => ({ enabled: false, slots: [] as unknown[], cursor: 0 }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  function state<T>(initial: T | (() => T)) {
    if (!harness.enabled) return actual.useState(initial);
    const slot = harness.cursor++;
    if (!(slot in harness.slots)) harness.slots[slot] = typeof initial === "function" ? (initial as () => T)() : initial;
    return [harness.slots[slot] as T, (next: T | ((previous: T) => T)) => { harness.slots[slot] = typeof next === "function" ? (next as (previous: T) => T)(harness.slots[slot] as T) : next; }] as const;
  }
  return { ...actual, useState: state,
    useRef: <T,>(initial: T) => harness.enabled ? state({ current: initial })[0] : actual.useRef(initial),
    useEffect: (effect: () => void, deps?: unknown[]) => { if (!harness.enabled) actual.useEffect(effect, deps); },
  };
});
vi.mock("@/lib/access-boundary", async original => {
  const actual = await original<typeof import("@/lib/access-boundary")>();
  return { ...actual, useAccess: () => harness.enabled ? { can: () => true } : actual.useAccess() };
});
afterEach(() => { harness.enabled = false; vi.restoreAllMocks(); });
function attachmentHook() {
  harness.cursor = 0;
  return useSupplierAgreements({ supplierId: supplierID });
}
function selectedAttachment() {
  harness.enabled = true; harness.slots = [];
  const file = new File(["pdf"], "gia.pdf", { type: "application/pdf" });
  const presign = vi.spyOn(documentsAPI, "presignDocument").mockResolvedValue({ upload_id: documentID, upload_url: "https://upload.example", form_fields: {}, expires_in: 300 });
  const upload = vi.spyOn(documentsAPI, "uploadDocument").mockResolvedValue();
  vi.spyOn(documentsAPI, "fileSHA256").mockResolvedValue("a".repeat(64));
  const finalize = vi.spyOn(documentsAPI, "finalizeDocument").mockResolvedValue(document);
  const attach = vi.spyOn(attachmentAPI, "attachAgreementDocument").mockResolvedValue({ primary_document_ref: documentID, document_attached_at: "2026-10-27T00:00:00Z" });
  attachmentHook().setAttachment({ agreement: { ...agreement, status: "ACTIVE", document_ref: null }, file, key: "attach-key" });
  expect(presign).not.toHaveBeenCalled();
  return { presign, upload, finalize, attach };
}
it("hook gắn bổ sung chỉ upload lúc lưu, chặn double click và giữ phiên bản", async () => {
  const { presign, upload, finalize, attach } = selectedAttachment();
  const view = attachmentHook(); await Promise.all([view.attach(), view.attach()]);
  expect(presign).toHaveBeenCalledTimes(1); expect(upload).toHaveBeenCalledTimes(1); expect(finalize).toHaveBeenCalledTimes(1);
  expect(attach).toHaveBeenCalledTimes(1);
  expect(attach).toHaveBeenCalledWith(supplierID, agreement.agreement_id, documentID, "attach-key");
  expect(attachmentHook().attachment).toBeNull();
  expect(presign.mock.invocationCallOrder[0]).toBeLessThan(upload.mock.invocationCallOrder[0]);
  expect(upload.mock.invocationCallOrder[0]).toBeLessThan(finalize.mock.invocationCallOrder[0]);
  expect(finalize.mock.invocationCallOrder[0]).toBeLessThan(attach.mock.invocationCallOrder[0]);
});
it("hook 409 giữ file finalized, retry không gửi bytes hoặc finalize lần nữa", async () => {
  const { upload, finalize, attach } = selectedAttachment();
  attach.mockRejectedValueOnce(new FetchError("Conflict", 409));
  await attachmentHook().attach();
  expect(attachmentHook().error).toContain("đã có chứng từ");
  await attachmentHook().attach();
  expect(upload).toHaveBeenCalledTimes(1); expect(finalize).toHaveBeenCalledTimes(1);
  expect(attach.mock.calls[1]).toEqual(attach.mock.calls[0]);
});
it("hook 404 yêu cầu phiên tải mới và hiện thông báo", async () => {
  const { finalize } = selectedAttachment();
  finalize.mockRejectedValueOnce(new FetchError("Expired", 404));
  await attachmentHook().attach();
  expect(attachmentHook().error).toContain("không còn tồn tại");
  expect(attachmentHook().attachment?.uploadId).toBeUndefined();
  expect(attachmentHook().attachment?.file).toBeNull();
});
