import { afterEach, expect, it, vi } from "vitest";
import { getLifecycleDetail, hasApprovedPrice } from "./product-lifecycle";
import { GET as listPrices } from "@/app/api/sales/price-books/[price_book_id]/versions/route";
import { POST as variantLifecycle } from "@/app/api/sales/products/[id]/variants/[variant_id]/lifecycle/route";
import { NextRequest } from "next/server";

const fetchMock = vi.fn<typeof fetch>();
const envelope = (data: unknown) => Response.json({ code: 200, status: "success", message: "OK", data });
afterEach(() => { vi.unstubAllGlobals(); fetchMock.mockReset(); });

it("đọc product cùng versions, giữ cả suất bán để hook chọn", async () => {
  const detail = { product: { id: "p", status: "DRAFT", version: 3 }, variants: [
    { id: "v", name: "Món", variant_label: "4 người", sku_kind: "PRODUCED_VARIANT", sellable: true, status: "READY", version: 8 },
  ] };
  vi.stubGlobal("fetch", fetchMock.mockResolvedValue(envelope(detail)));
  expect(await getLifecycleDetail("p")).toEqual(detail);
});

it("giá ACTIVE hiệu lực ở trang sau, không suy từ base_price_vnd", async () => {
  const row = (status: string, effective_from: string | null = null, effective_until: string | null = null) => ({ status, effective_from, effective_until });
  vi.stubGlobal("fetch", fetchMock
    .mockResolvedValueOnce(envelope({ items: [row("DRAFT"), row("ACTIVE", "2099-01-01T00:00:00Z"), row("ACTIVE", null, "2020-01-01T00:00:00Z")], next_cursor: "next" }))
    .mockResolvedValueOnce(envelope({ items: [row("ACTIVE")], next_cursor: null })));
  expect(await hasApprovedPrice("v")).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(String(fetchMock.mock.calls[1][0])).toContain("cursor=next");
});

it("giá nháp hoặc mới duyệt chưa ACTIVE không đủ mở bán", async () => {
  vi.stubGlobal("fetch", fetchMock.mockResolvedValue(envelope({ items: [
    { status: "APPROVED", effective_from: null, effective_until: null },
  ], next_cursor: null })));
  expect(await hasApprovedPrice("v")).toBe(false);
});

it("BFF giá giữ phân trang và xác thực", async () => {
  vi.stubGlobal("fetch", fetchMock.mockResolvedValue(envelope({ items: [], next_cursor: null })));
  const req = new NextRequest("http://portal.test/api/sales/price-books/v/versions?limit=100&cursor=next", { headers: { cookie: "access_token=token" } });
  expect((await listPrices(req, { params: Promise.resolve({ price_book_id: "v" }) })).status).toBe(200);
  expect(String(fetchMock.mock.calls[0][0])).toContain("/sales/price-books/v/versions?limit=100&cursor=next");
});

it("BFF variant giữ body và operation_id trong header", async () => {
  vi.stubGlobal("fetch", fetchMock.mockResolvedValue(envelope({ state: "READY" })));
  const body = { operation_id: "op", expected_version: 2, to_state: "READY", reason: "Chuẩn bị suất bán" };
  const req = new NextRequest("http://portal.test/api/sales/products/p/variants/v/lifecycle", {
    method: "POST", headers: { cookie: "access_token=token", "content-type": "application/json", "Idempotency-Key": "op" }, body: JSON.stringify(body),
  });
  expect((await variantLifecycle(req, { params: Promise.resolve({ id: "p", variant_id: "v" }) })).status).toBe(200);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/sales/products/p/variants/v/lifecycle"), expect.objectContaining({
    body: JSON.stringify(body), headers: expect.objectContaining({ "Idempotency-Key": "op" }),
  }));
});
