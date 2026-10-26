import { afterEach, expect, it, vi } from "vitest";
import { presignDocument, uploadDocument, finalizeDocument, downloadDocument } from "./agreement-documents";
import { document, documentID, envelope, supplierID } from "@/mocks/supplier-contract";
afterEach(() => vi.unstubAllGlobals());
it("upload bytes dùng POST multipart trực tiếp, finalize/download chỉ metadata", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(envelope({ upload_id: documentID, upload_url: "http://storage.test/upload", form_fields: { key: "tmp/test" }, expires_in: 300 }, 201))).mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(Response.json(envelope(document))).mockResolvedValueOnce(Response.json(envelope({ url: "http://storage.test/read", expires_in: 300 })));
  vi.stubGlobal("fetch", fetch);
  const file = new File(["test"], "contract.pdf", { type: "application/pdf" });
  const target = await presignDocument(supplierID, file, "a".repeat(64), "presign-key");
  await uploadDocument(target, file);
  expect(fetch.mock.calls[1][0]).toBe("http://storage.test/upload");
  expect(fetch.mock.calls[1][1].method).toBe("POST");
  expect(fetch.mock.calls[1][1].body).toBeInstanceOf(FormData);
  expect(fetch.mock.calls[1][1].headers).toBeUndefined();
  expect((await finalizeDocument(supplierID, documentID)).document_id).toBe(documentID);
  expect(await downloadDocument(supplierID, documentID)).toBe("http://storage.test/read");
});
it.each([404, 503])("giữ status %i để UI tải lại hoặc retry cùng upload_id", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ errors: { error_code: status === 404 ? "RESOURCE_NOT_FOUND" : "UNAVAILABLE" } }, { status })));
  await expect(finalizeDocument(supplierID, documentID)).rejects.toMatchObject({ status });
});
