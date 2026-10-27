import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { OPERATIONS } from "@/lib/contracts/operations.generated";
import * as suppliers from "@/app/api/inventory/suppliers/route";
import * as detail from "@/app/api/inventory/suppliers/[id]/route";
import * as suspend from "@/app/api/inventory/suppliers/[id]/suspend/route";
import * as agreements from "@/app/api/inventory/suppliers/[id]/agreements/route";
import * as versions from "@/app/api/inventory/suppliers/[id]/agreements/[agreementId]/versions/route";
import * as documents from "@/app/api/inventory/suppliers/[id]/contract-documents/route";
import * as presign from "@/app/api/inventory/suppliers/[id]/contract-documents/presign/route";
import * as finalize from "@/app/api/inventory/suppliers/[id]/contract-documents/finalize/route";
import * as download from "@/app/api/inventory/suppliers/[id]/contract-documents/[documentId]/download/route";
import * as receipts from "@/app/api/inventory/goods-receipts/route";
import * as history from "@/app/api/inventory/suppliers/[id]/goods-receipts/route";
import { supplierID, agreementID, documentID } from "@/mocks/supplier-contract";
afterEach(() => vi.unstubAllGlobals());
it("metadata taxonomy sinh từ inventory và snapshot giữ nguyên bytes", () => {
  expect(OPERATIONS).toHaveProperty("listMaterialCategories", { service: "inventory", method: "GET", path: "/inventory/material-categories", actionKey: "inventory:supplier:read", scope: "none" });
  expect(readFileSync("contracts/inventory.public.yaml")).toEqual(readFileSync("../inventory/api/openapi.public.yaml"));
  expect(JSON.parse(readFileSync("../inventory/api/permissions.json", "utf8"))).toMatchObject({ permissions: expect.arrayContaining([expect.objectContaining({ action_key: "inventory:supplier:read", operations: expect.arrayContaining(["listMaterialCategories"]) })]) });
});
it("history BFF truyền abort signal và giữ 403/no-store", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ errors: { error_code: "FORBIDDEN" } }, { status: 403 }));
  vi.stubGlobal("fetch", fetch);
  const request = new NextRequest("http://portal.test/api/inventory?cursor=next&branch_ref=forged", { headers: { cookie: "access_token=test-only" } });
  const response = await history.GET(request, context);
  expect(response.status).toBe(403);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(fetch.mock.calls[0][1].signal).toBe(request.signal);
  expect(String(fetch.mock.calls[0][0])).not.toContain("branch_ref");
});
const context = { params: Promise.resolve({ id: supplierID, agreementId: agreementID, documentId: documentID }) };
const cases = [
  ["POST", suppliers.POST, "/suppliers"], ["PATCH", detail.PATCH, `/suppliers/${supplierID}`],
  ["POST", suspend.POST, `/suppliers/${supplierID}/suspend`], ["POST", agreements.POST, `/suppliers/${supplierID}/agreements`],
  ["POST", versions.POST, `/suppliers/${supplierID}/agreements/${agreementID}/versions`],
  ["POST", presign.POST, `/suppliers/${supplierID}/contract-documents/presign`], ["POST", finalize.POST, `/suppliers/${supplierID}/contract-documents/finalize`],
  ["POST", receipts.POST, "/goods-receipts"],
] as const;
it.each(cases)("%s gọi upstream cố định %s", async (method, handler, path) => {
  const fetch = vi.fn().mockImplementation(async () => Response.json({ code: 201, status: "success", message: "OK", data: {} }, { status: 201 }));
  vi.stubGlobal("fetch", fetch);
  const request = new NextRequest("http://portal.test/api/inventory?url=http://attacker/internal&role=ADMIN", { method, body: "{}", headers: { cookie: "access_token=test-only", "If-Match": "2", "Idempotency-Key": "key", "X-Role": "ADMIN" } });
  const response = await handler(request, context);
  expect(new URL(String(fetch.mock.calls[0][0])).pathname).toBe(`/inventory${path}`);
  expect(new URL(String(fetch.mock.calls[0][0])).search).toBe("");
  expect(fetch.mock.calls[0][1].headers).toMatchObject({ "If-Match": "2", "Idempotency-Key": "key" });
  expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("X-Role");
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("GET chuyển đúng scope, chỉ giữ query công khai và response403", async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json({ errors: { error_code: "FORBIDDEN" } }, { status: 403 })); vi.stubGlobal("fetch", fetch);
  const request = new NextRequest("http://portal.test/api/inventory?q=Gao&limit=20&url=http://attacker", { headers: { cookie: "access_token=test-only" } });
  for (const handler of [suppliers.GET, detail.GET, agreements.GET, versions.GET, documents.GET, download.GET]) {
    expect((await handler(request, context)).status).toBe(403);
  }
  expect(fetch.mock.calls.every(([url]) => !new URL(String(url)).searchParams.has("url"))).toBe(true);
});
it("multipart metadata endpoint và request thiếu cookie bị chặn trước upstream", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const form = new FormData(); form.append("file", new Blob(["test"]));
  expect((await presign.POST(new NextRequest("http://portal.test", { method: "POST", headers: { cookie: "access_token=test-only" }, body: form }), context)).status).toBe(400);
  expect((await finalize.POST(new NextRequest("http://portal.test", { method: "POST", body: "{}" }), context)).status).toBe(401);
  expect(fetch).not.toHaveBeenCalled();
});

it("bổ sung chứng từ dùng quyền supplier:update và metadata sinh từ contract", () => {
  expect(OPERATIONS).toHaveProperty("attachSupplierAgreementDocument", {
    service: "inventory", method: "POST", path: "/inventory/suppliers/{supplier_id}/agreements/{agreement_id}/documents", actionKey: "inventory:supplier:update", scope: "none",
  });
  expect(JSON.parse(readFileSync("../inventory/api/permissions.json", "utf8"))).toMatchObject({ permissions: expect.arrayContaining([expect.objectContaining({ action_key: "inventory:supplier:update", operations: expect.arrayContaining(["attachSupplierAgreementDocument"]) })]) });
});

it("ảnh NCC có đủ operations và quyền sinh từ contract", () => {
  for (const [operation, method, suffix, action] of [
    ["presignSupplierPhoto", "POST", "presign", "update"],
    ["finalizeSupplierPhoto", "POST", "finalize", "update"],
    ["downloadSupplierPhoto", "GET", "download", "read"],
  ]) {
    expect(OPERATIONS).toHaveProperty(operation, {
      service: "inventory", method, path: `/inventory/suppliers/{supplier_id}/photo/${suffix}`,
      actionKey: `inventory:supplier:${action}`, scope: "none",
    });
    expect(JSON.parse(readFileSync("../inventory/api/permissions.json", "utf8"))).toMatchObject({ permissions: expect.arrayContaining([expect.objectContaining({ action_key: `inventory:supplier:${action}`, operations: expect.arrayContaining([operation]) })]) });
  }
});
