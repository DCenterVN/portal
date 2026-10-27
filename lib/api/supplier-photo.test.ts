import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { presignSupplierPhoto, finalizeSupplierPhoto, validSupplierPhoto, downloadSupplierPhoto } from "./supplier-photo";
import * as download from "@/app/api/inventory/suppliers/[id]/photo/download/route";
import { uploadDocument } from "./agreement-documents";
import * as presign from "@/app/api/inventory/suppliers/[id]/photo/presign/route";
import * as finalize from "@/app/api/inventory/suppliers/[id]/photo/finalize/route";
import { supplierID, documentID, envelope } from "@/mocks/supplier-contract";

afterEach(() => vi.unstubAllGlobals());
const photo = { upload_id: documentID, mime: "image/png", size_bytes: 4, updated_at: "2026-10-27T00:00:00Z" };
it("download BFF giữ JSON và no-store, client kiểm TTL đọc", async () => {
  const data = { url: "http://storage.test/read", expires_in: 300 };
  const fetch = vi.fn().mockImplementation(async () => Response.json(envelope(data)));
  vi.stubGlobal("fetch", fetch);
  const response = await download.GET(new NextRequest("http://portal.test", { headers: { cookie: "access_token=test-only" } }), { params: Promise.resolve({ id: supplierID }) });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual(envelope(data));
  expect(await downloadSupplierPhoto(supplierID)).toBe(data.url);
  expect(fetch.mock.calls[1][1].cache).toBe("no-store");
  fetch.mockResolvedValueOnce(Response.json(envelope({ ...data, expires_in: 301 })));
  await expect(downloadSupplierPhoto(supplierID)).rejects.toThrow();
});
it("ảnh dùng envelope, POST byte trực tiếp và finalize cùng upload", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(envelope({ upload_id: documentID, upload_url: "http://storage.test/upload", form_fields: { key: "test" }, expires_in: 299 }, 201)))
    .mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(Response.json(envelope(photo)));
  vi.stubGlobal("fetch", fetch);
  const file = new File(["test"], "photo.png", { type: "image/png" });
  const target = await presignSupplierPhoto(supplierID, file, "a".repeat(64), "presign-key");
  await uploadDocument(target, file);
  expect(fetch.mock.calls[0][1]).toMatchObject({ cache: "no-store", headers: { "Idempotency-Key": "presign-key" } });
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ filename: "photo.png", content_type: "image/png", size_bytes: 4, sha256: "a".repeat(64) });
  expect(fetch.mock.calls[1]).toEqual(["http://storage.test/upload", expect.objectContaining({ method: "POST", credentials: "omit", body: expect.any(FormData) })]);
  expect(await finalizeSupplierPhoto(supplierID, documentID, "final-key")).toEqual(photo);
  expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ upload_id: documentID });
});
it("chỉ nhận JPEG/PNG/WebP trong 1 byte..5 MiB, file lỗi không presign", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    expect(validSupplierPhoto(new File(["a"], "photo", { type }))).toBe(true);
    expect(validSupplierPhoto(new File([new Uint8Array(5242880)], "photo", { type }))).toBe(true);
  }
  for (const file of [new File([], "empty", { type: "image/png" }), new File([new Uint8Array(5242881)], "big", { type: "image/png" }), ...["application/pdf", "image/svg+xml", "text/html"].map(type => new File(["a"], "bad", { type }))]) {
    expect(validSupplierPhoto(file)).toBe(false);
    await expect(presignSupplierPhoto(supplierID, file, "a".repeat(64))).rejects.toThrow();
  }
  expect(fetch).not.toHaveBeenCalled();
});
it.each([0, 301])("từ chối TTL upload %i", async expires_in => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(envelope({ upload_id: documentID, upload_url: "http://storage.test/upload", form_fields: {}, expires_in }))));
  await expect(presignSupplierPhoto(supplierID, new File(["a"], "photo", { type: "image/png" }), "a".repeat(64))).rejects.toThrow();
});
it.each([[presign.POST, "presign"], [finalize.POST, "finalize"]] as const)("BFF ảnh forward metadata, key và no-store %s", async (handler, suffix) => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope(photo)));
  vi.stubGlobal("fetch", fetch);
  const response = await handler(new NextRequest("http://portal.test/api/inventory?url=forged", { method: "POST", body: "{}", headers: { cookie: "access_token=test-only", "Idempotency-Key": "retry" } }), { params: Promise.resolve({ id: supplierID }) });
  expect(new URL(String(fetch.mock.calls[0][0])).pathname).toBe(`/inventory/suppliers/${supplierID}/photo/${suffix}`);
  expect(fetch.mock.calls[0][1].headers).toMatchObject({ "Idempotency-Key": "retry" });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual(envelope(photo));
});
