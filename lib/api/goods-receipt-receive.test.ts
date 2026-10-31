import { afterEach, expect, it, vi } from "vitest";
import { envelope, supplierID, materialID, documentID } from "@/mocks/supplier-contract";
import { presignReceiptEvidence, finalizeReceiptEvidence, receiveReceiptLine, recordQuantityVariance } from "./goods-receipt-receive";

afterEach(() => vi.unstubAllGlobals());
const metadata = { goods_receipt_line_id: materialID, receive_attempt_ref: documentID, purpose: "DELIVERED_GOODS" as const, content_type: "image/png", size_bytes: 1024, sha256: "a".repeat(64) };
const receive = { goods_receipt_line_id: materialID, receive_attempt_ref: documentID, evidence_refs: [supplierID, documentID], supplier_lot_code: "LO-01", sku_ref: materialID, initial_quantity: 2.125, expiry_date: "2026-12-01T00:00:00+07:00", received_temperature_celsius: -2.5, uom: "KG" };
const variance = { receive_attempt_ref: documentID, evidence_refs: [documentID], expected_quantity: 2, actual_quantity: 2.125, explanation: "Giao dư" };
const presigned = { upload_id: documentID, upload_url: "https://storage.example.test/upload", form_fields: { key: "test" }, expires_in: 300 };
const finalized = { media_ref: documentID, sha256: metadata.sha256, content_type: "image/png", size_bytes: 1024, status: "FINALIZED" };
const lot = { id: documentID, status: "RECEIVED" };

it.each([
  ["presign", `evidence-uploads`, metadata, presigned, (key: string) => presignReceiptEvidence(supplierID, metadata, key)],
  ["finalize", `evidence-uploads/${documentID}/finalize`, {}, finalized, (key: string) => finalizeReceiptEvidence(supplierID, documentID, key)],
  ["receive", "receive", receive, lot, (key: string) => receiveReceiptLine(supplierID, receive, key)],
  ["variance", "quantity-variances", variance, { id: documentID }, (key: string) => recordQuantityVariance(supplierID, variance, key)],
] as const)("%s gửi đúng đường dẫn, body và giữ key khi gửi lại", async (_name, path, body, result, run) => {
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(Response.json(envelope(result))));
  vi.stubGlobal("fetch", fetch);
  await run("same-key"); await run("same-key");
  expect(fetch).toHaveBeenCalledTimes(2);
  for (const [url, init] of fetch.mock.calls) {
    expect(new URL(url, "http://127.0.0.1:3000").pathname).toBe(`/api/inventory/goods-receipts/${supplierID}/${path}`);
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe("same-key");
    expect(JSON.parse(init.body)).toEqual(body);
  }
});

it.each([
  [() => presignReceiptEvidence(supplierID, metadata, "key"), { ...presigned, expires_in: 600 }],
  [() => presignReceiptEvidence(supplierID, metadata, "key"), { ...presigned, form_fields: null }],
  [() => finalizeReceiptEvidence(supplierID, documentID, "key"), { ...finalized, media_ref: "wrong" }],
  [() => finalizeReceiptEvidence(supplierID, documentID, "key"), { ...finalized, status: "PENDING" }],
  [() => receiveReceiptLine(supplierID, receive, "key"), { status: "RECEIVED" }],
  [() => recordQuantityVariance(supplierID, variance, "key"), { id: 123 }],
] as const)("từ chối response sai schema %#", async (run, result) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(envelope(result))));
  await expect(run()).rejects.toThrow();
});

it("giữ body và key khi nhận lỗi mạng rồi thử lại", async () => {
  const fetch = vi.fn().mockRejectedValueOnce(new TypeError("offline")).mockResolvedValue(Response.json(envelope(lot)));
  vi.stubGlobal("fetch", fetch);
  await expect(receiveReceiptLine(supplierID, receive, "retry-key")).rejects.toThrow();
  await receiveReceiptLine(supplierID, receive, "retry-key");
  expect(fetch.mock.calls[0][1].body).toBe(fetch.mock.calls[1][1].body);
  expect(fetch.mock.calls[0][1].headers).toEqual(fetch.mock.calls[1][1].headers);
});
