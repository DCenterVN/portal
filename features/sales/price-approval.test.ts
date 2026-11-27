import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { FetchError } from "@/lib/fetcher";
import { approveFailureMessage, listPendingPrices, pricedVariant, priceableVariants, proposerLabel } from "./price-approval";
import { approvePrice } from "@/lib/api/sales";

const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
afterEach(() => vi.unstubAllGlobals());

it("suất bán hiện tên món và tên suất, không hiện mã", () => {
  const rows = [{ product: { id: "p1", name: "Cơm gà", category_ref: null, category_name: "" }, variants: [{ set_ref: uuid, variant_label: "2 suất", journey: "DONE" as const }], counts: { DRAFT: 0, DONE: 1, SELLING: 0, STOPPED: 0 }, open_revision_drafts: 0 }];
  expect(priceableVariants(rows)).toEqual([{ id: uuid, productId: "p1", label: "Cơm gà", meta: "2 suất" }]);
});

it("người đề xuất: tên nếu có, không thì Bạn hoặc Đồng nghiệp", () => {
  expect(proposerLabel({ authored_by_name: "Hệ thống", authored_by_is_me: false })).toBe("Hệ thống");
  expect(proposerLabel({ authored_by_name: "", authored_by_is_me: true })).toBe("Bạn");
  expect(proposerLabel({ authored_by_name: "", authored_by_is_me: false })).toBe("Đồng nghiệp");
});

it("người đề xuất tự duyệt bị 409 thì báo bằng câu dễ hiểu", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "maker checker violation" }, { status: 409 })));
  const error = await approvePrice(uuid, uuid).catch((e) => e);
  expect(error).toBeInstanceOf(FetchError);
  expect(approveFailureMessage(error)).toBe("Người đề xuất không tự duyệt được, nhờ người khác duyệt.");
  expect(approveFailureMessage(new Error("Lỗi khác"))).toBe("Lỗi khác");
});

it("danh sách chờ duyệt đọc toàn tổ chức, không cần chọn suất", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { items: [], next_cursor: null } }));
  vi.stubGlobal("fetch", fetchMock);
  await listPendingPrices("abc");
  expect(String(fetchMock.mock.calls[0][0])).toContain("/api/sales/price-book-versions?status=DRAFT&page_size=20&cursor=abc");
  const { GET } = await import("../../app/api/sales/price-book-versions/route");
  await GET(new NextRequest("http://portal.test/api/sales/price-book-versions?status=DRAFT", { headers: { cookie: "access_token=jwt" } }));
  expect(String(fetchMock.mock.calls[1][0])).toContain("/sales/price-book-versions?status=DRAFT");
});

it("BFF chuyển GET danh sách suất bán của món", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { items: [] } }));
  vi.stubGlobal("fetch", fetchMock);
  const { GET } = await import("../../app/api/sales/products/[id]/variants/route");
  const response = await GET(new NextRequest(`http://portal.test/api/sales/products/${uuid}/variants`, { headers: { cookie: "access_token=jwt" } }), { params: Promise.resolve({ id: uuid }) });
  expect(response.status).toBe(200);
  expect(String(fetchMock.mock.calls[0][0])).toContain(`/sales/products/${uuid}/variants`);
});

it("danh sách suất bán xin đúng trần 50 của máy chủ và đọc hết các trang", async () => {
  const { loadPriceableVariants } = await import("./price-approval");
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({ data: { items: [], next_cursor: "c2" } }))
    .mockResolvedValueOnce(Response.json({ data: { items: [], next_cursor: null } }));
  vi.stubGlobal("fetch", fetchMock);
  await loadPriceableVariants();
  expect(String(fetchMock.mock.calls[0][0])).toContain("limit=50");
  expect(String(fetchMock.mock.calls[1][0])).toContain("cursor=c2");
});

it("suất bán của món là bộ set không có định mức: lấy biến thể sản xuất cùng nhãn, có định mức, mới nhất", () => {
  const rows = [
    { id: "a", sku_kind: "COMMERCIAL_SET", variant_label: "2 người", created_at: "1" },
    { id: "b", sku_kind: "PRODUCED_VARIANT", variant_label: "1 suất", bom_ref: "bom-b", bom_version: 1, created_at: "2" },
    { id: "c", sku_kind: "PRODUCED_VARIANT", variant_label: "2 người", bom_ref: "bom-c", bom_version: 1, created_at: "3" },
    { id: "d", sku_kind: "PRODUCED_VARIANT", variant_label: "2 người", bom_ref: "bom-d", bom_version: 2, created_at: "4" },
    { id: "e", sku_kind: "PRODUCED_VARIANT", variant_label: "2 người", created_at: "5" },
  ];
  expect(pricedVariant(rows, "a")).toEqual({ id: "d", bom_ref: "bom-d", bom_version: 2 });
  expect(pricedVariant(rows, "zzz")).toBeNull();
  expect(pricedVariant(rows.slice(0, 2), "a")).toBeNull();
});
