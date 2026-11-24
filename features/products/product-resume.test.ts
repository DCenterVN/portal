import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resumeProduct, resumeVariant } from "@/lib/api/product-lifecycle";

afterEach(() => vi.unstubAllGlobals());
it("mở bán lại sản phẩm và suất gửi lý do lên server", async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json({ data: {} }));
  vi.stubGlobal("fetch", fetch);
  await resumeProduct("p1", "Có lại nguyên liệu");
  await resumeVariant("p1", "v1", "Đã duyệt giá lại");
  expect(String(fetch.mock.calls[0][0])).toContain("/api/sales/products/p1/resume");
  expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ reason: "Có lại nguyên liệu" });
  expect(String(fetch.mock.calls[1][0])).toContain("/api/sales/products/p1/variants/v1/resume");
  expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toEqual({ reason: "Đã duyệt giá lại" });
});
it("BFF chuyển resume của sản phẩm và suất", async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json({ data: {} }));
  vi.stubGlobal("fetch", fetch);
  const init = { method: "POST", headers: { cookie: "access_token=jwt", "Content-Type": "application/json" }, body: JSON.stringify({ reason: "x" }) };
  const product = await import("../../app/api/sales/products/[id]/resume/route");
  const variant = await import("../../app/api/sales/products/[id]/variants/[variant_id]/resume/route");
  await product.POST(new NextRequest("http://portal.test/api/sales/products/p1/resume", init), { params: Promise.resolve({ id: "p1" }) });
  await variant.POST(new NextRequest("http://portal.test/api/sales/products/p1/variants/v1/resume", init), { params: Promise.resolve({ id: "p1", variant_id: "v1" }) });
  expect(String(fetch.mock.calls[0][0])).toContain("/sales/products/p1/resume");
  expect(String(fetch.mock.calls[1][0])).toContain("/sales/products/p1/variants/v1/resume");
});
