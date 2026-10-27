import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { attachAgreementDocument } from "./supplier-agreement-documents";
import { agreementID, envelope, supplierID, documentID } from "@/mocks/supplier-contract";
import { POST } from "@/app/api/inventory/suppliers/[id]/agreements/[agreementId]/documents/route";
const { forward } = vi.hoisted(() => ({ forward: vi.fn() }));
vi.mock("@/lib/api/inventory-bff", () => ({ forwardInventory: forward }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("gắn file bằng POST, giữ key khi retry và đọc envelope thật", async () => {
  const result = { primary_document_ref: documentID, document_attached_at: "2026-10-27T00:00:00Z" };
  const fetch = vi.fn().mockImplementation(async () => Response.json(envelope(result, 201)));
  vi.stubGlobal("fetch", fetch);
  expect(await attachAgreementDocument(supplierID, agreementID, documentID, "attach-key")).toEqual(result);
  await attachAgreementDocument(supplierID, agreementID, documentID, "attach-key");
  for (const [url, init] of fetch.mock.calls) {
    expect(new URL(String(url)).pathname).toBe(`/api/inventory/suppliers/${supplierID}/agreements/${agreementID}/documents`);
    expect(init.method).toBe("POST");
    expect(init.headers["Idempotency-Key"]).toBe("attach-key");
    expect(JSON.parse(init.body)).toEqual({ document_ref: documentID });
  }
});
it.each([404, 409])("trả lỗi %i để hook giữ trạng thái và báo lỗi", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ errors: { error_code: "STATE_CONFLICT", message: "Không gắn được" } }, { status })));
  await expect(attachAgreementDocument(supplierID, agreementID, documentID, "key")).rejects.toMatchObject({ status });
});
it("BFF forward request và encode từng ID qua inventory helper", async () => {
  const request = new NextRequest("http://localhost/api/inventory/suppliers/s/agreements/a/documents", { method: "POST", body: JSON.stringify({ document_ref: documentID }), headers: { "Idempotency-Key": "key" } });
  forward.mockResolvedValue(Response.json(envelope({}, 201)));
  await POST(request, { params: Promise.resolve({ id: "s/1", agreementId: "a/2" }) });
  expect(forward).toHaveBeenCalledWith(request, "/inventory/suppliers/s%2F1/agreements/a%2F2/documents", "POST");
});
