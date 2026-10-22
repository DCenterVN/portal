import { afterEach, describe, expect, it, vi } from "vitest";
import { addToCart, createDraftProduct, getCatalog, getCatalogProduct, getProducts } from "./sales";

const ORG = "0198fd55-3f46-7a01-9e52-f4c0de000010";
const BRANCH = "0198fd55-3f46-7a01-9e52-f4c0de000020";
const PRODUCT_ID = "0198fd55-3f46-7a01-9e52-f4c0de000001";
const SKU_ID = "0198fd55-3f46-7a01-9e52-f4c0de000002";
const DRAFT_ID = "0198fd55-3f46-7a01-9e52-f4c0de000003";
const ok = (data: unknown, status = 200) => Response.json({ code: status, status: "success", message: "Success", data }, { status });
const fail = (status: number, error: string, message: string) => Response.json({ error, message }, { status });
const fetchMock = vi.fn<typeof fetch>();
const calls = () => fetchMock.mock.calls.map(([input, init]) => ({ url: String(input), init: init as RequestInit | undefined }));
const bodyOf = (init?: RequestInit) => JSON.parse(String(init?.body));
const headerOf = (init: RequestInit | undefined, name: string) => new Headers(init?.headers).get(name);

afterEach(() => { fetchMock.mockReset(); vi.unstubAllGlobals(); });
function stub(impl: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  fetchMock.mockImplementation(async (input, init) => impl(String(input), init));
  vi.stubGlobal("fetch", fetchMock);
}

const baseProduct = { org_ref: ORG, branch_ref: BRANCH, slug: "ca-hoi", media_refs: [], image_urls: [], created_at: "2026-10-20T08:00:00Z", updated_at: "2026-10-20T08:00:00Z" };
const staffVariant = { id: SKU_ID, sku_code: "CA-HOI-500", name: "Cá hồi 500g", uom_code: "kg", base_price_vnd: 300000, status: "ACTIVE", sellable: true };

describe("AC-3 getProducts đọc envelope staff {product, variants}", () => {
  const items = [
    { product: { ...baseProduct, id: PRODUCT_ID, name: "Cá hồi", status: "ACTIVE" }, variants: [staffVariant] },
    { product: { ...baseProduct, id: DRAFT_ID, name: "Bún nháp", slug: "bun-nhap", status: "DRAFT" }, variants: [] },
  ];

  it("giữ cả DRAFT không có variant và map biến thể đầu vào dòng", async () => {
    stub(() => ok({ items, next_cursor: "" }));
    const result = await getProducts();
    expect(result.source).toBe("api");
    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({ id: PRODUCT_ID, name: "Cá hồi", status: "ACTIVE", sku_code: "CA-HOI-500", uom: "kg", base_price_vnd: 300000 });
    expect(result.data[1]).toMatchObject({ id: DRAFT_ID, name: "Bún nháp", status: "DRAFT" });
    expect(calls()[0].url).toContain("/api/sales/products");
  });

  it("lỗi 403 trả unavailable kèm message, không có dữ liệu giả", async () => {
    stub(() => fail(403, "forbidden", "action sales:product:read is not authorized"));
    const result = await getProducts();
    expect(result).toMatchObject({ source: "unavailable", data: [] });
    expect(result.error).toContain("sales:product:read");
  });

  it("body không đúng envelope thì báo lỗi, không trả danh sách rỗng giả thành công", async () => {
    stub(() => ok({ items: [{ id: PRODUCT_ID, name: "sai hình dạng" }] }));
    const result = await getProducts();
    expect(result.source).toBe("unavailable");
    expect(result.error).toBeTruthy();
  });
});

describe("AC-3 createDraftProduct", () => {
  it("chỉ gửi name/slug kèm Idempotency-Key, không gửi sku/giá/status", async () => {
    stub(() => ok({ product: { ...baseProduct, id: DRAFT_ID, name: "Bún bò", slug: "bun-bo", status: "DRAFT" }, variants: [] }, 201));
    const created = await createDraftProduct({ name: "Bún bò", slug: "bun-bo" });
    const [call] = calls();
    expect(call.url).toContain("/api/sales/products");
    expect(call.init?.method).toBe("POST");
    expect(bodyOf(call.init)).toEqual({ name: "Bún bò", slug: "bun-bo" });
    expect(headerOf(call.init, "Idempotency-Key")).toBeTruthy();
    expect(created).toMatchObject({ id: DRAFT_ID, status: "DRAFT" });
  });

  it("lỗi 409 ném đúng message của Sales", async () => {
    stub(() => fail(409, "conflict", "slug đã tồn tại"));
    await expect(createDraftProduct({ name: "Bún bò", slug: "bun-bo" })).rejects.toThrow("slug đã tồn tại");
  });
});

describe("AC-5 addToCart gửi sku_ref thật + branch_id", () => {
  const cartData = { cart: { id: "cart-1", status: "ACTIVE", version: 2 }, items: [{ sku_ref: SKU_ID, quantity: 2, price_snapshot_vnd: 300000 }] };

  it("query branch_id, body sku_ref thật, trả envelope đã giải mã", async () => {
    stub(() => ok(cartData, 201));
    const result = await addToCart("cart-1", { sku_ref: SKU_ID, branch_id: BRANCH, quantity: 2 });
    const [call] = calls();
    expect(new URL(call.url, "http://portal.test").searchParams.get("branch_id")).toBe(BRANCH);
    expect(call.url).toContain("/api/sales/carts/cart-1/items");
    expect(bodyOf(call.init)).toEqual({ sku_ref: SKU_ID, quantity: 2 });
    expect(bodyOf(call.init).sku_ref).not.toBe(PRODUCT_ID);
    expect(headerOf(call.init, "Idempotency-Key")).toBeTruthy();
    expect(result.cart.id).toBe("cart-1");
    expect(result.items).toEqual([{ sku_ref: SKU_ID, quantity: 2, price_snapshot_vnd: 300000 }]);
  });

  it("thiếu sku_ref hoặc branch_id thì từ chối trước khi gọi mạng", async () => {
    stub(() => ok(cartData));
    await expect(addToCart("cart-1", { sku_ref: "", branch_id: BRANCH, quantity: 1 })).rejects.toThrow();
    await expect(addToCart("cart-1", { sku_ref: SKU_ID, branch_id: "", quantity: 1 })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, "unauthorized", "phiên đã hết hạn"],
    [403, "forbidden", "không có quyền mua"],
    [409, "state_conflict", "hết hàng"],
    [503, "unavailable", "dịch vụ tạm ngưng"],
  ])("lỗi %i ném message upstream và đã gửi branch_id, không báo thành công", async (status, code, message) => {
    stub(() => fail(status, code, message));
    await expect(addToCart("cart-1", { sku_ref: SKU_ID, branch_id: BRANCH, quantity: 1 })).rejects.toThrow(message);
    expect(calls()[0].url).toContain(`branch_id=${BRANCH}`);
  });
});

describe("AC-1/AC-5 getCatalog giữ dữ liệu card", () => {
  const publicItem = {
    product: { ...baseProduct, id: PRODUCT_ID, name: "Cá hồi", description: "Tươi mỗi ngày", status: "ACTIVE", image_urls: ["https://cdn.example.test/ca-hoi.jpg"] },
    variants: [{ ...staffVariant, unit_price_vnd: 310000, available_quantity: 12.5 }],
  };

  it("giữ image_urls, branch_ref, sku_ref thật, giá và next_cursor", async () => {
    stub(() => ok({ items: [publicItem], next_cursor: "cursor-2" }));
    const result = await getCatalog();
    expect(result.source).toBe("api");
    expect(result.data[0]).toMatchObject({ id: PRODUCT_ID, sku_ref: SKU_ID, branch_ref: BRANCH, base_price_vnd: 310000, image_urls: ["https://cdn.example.test/ca-hoi.jpg"] });
    expect(result.next_cursor).toBe("cursor-2");
  });

  it("truyền cursor lên BFF công khai khi xem thêm", async () => {
    stub(() => ok({ items: [], next_cursor: "" }));
    await getCatalog({ cursor: "cursor-2" });
    expect(calls()[0].url).toContain("/api/public/catalog");
    expect(new URL(calls()[0].url, "http://portal.test").searchParams.get("cursor")).toBe("cursor-2");
  });

  it("giá 0 thật khác với món chưa có biến thể", async () => {
    stub(() => ok({ items: [{ ...publicItem, variants: [{ ...publicItem.variants[0], unit_price_vnd: 0 }] }, { ...publicItem, product: { ...publicItem.product, id: DRAFT_ID }, variants: [] }], next_cursor: "" }));
    const [free, noVariant] = (await getCatalog()).data;
    expect(free.base_price_vnd).toBe(0);
    expect(noVariant.base_price_vnd).toBeUndefined();
    expect(noVariant.sku_ref).toBeUndefined();
  });

  it("getCatalogProduct cũng giữ image_urls và branch_ref", async () => {
    stub(() => ok(publicItem));
    const { data } = await getCatalogProduct(PRODUCT_ID);
    expect(data).toMatchObject({ sku_ref: SKU_ID, branch_ref: BRANCH, image_urls: ["https://cdn.example.test/ca-hoi.jpg"] });
  });
});
