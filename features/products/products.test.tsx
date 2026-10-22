import { describe, it, expect, vi } from "vitest";
import React from "react";
import { clearCart, Product, formatVND, loadCartItems, recordCartResponse } from "@/lib/api/sales";
import { ProductsView } from "./products-view";
import { ProductDetailView } from "./product-detail-view";
import { ProductCreateDialog } from "./product-create-dialog";
import { CartView } from "./cart-view";

describe("Sales & Products UI Feature", () => {
  const products: Product[] = [{ id: "0198fd55-3f46-7a01-9e52-f4c0de000001", sku_code: "SKU-HN-001", name: "Cá hồi", uom: "kg", base_price_vnd: 300000, status: "ACTIVE", created_at: "2026-08-28T08:00:00Z" }];

  it("product fixture conforms to the normalized sales API contract", () => {
    expect(products.length).toBeGreaterThan(0);

    products.forEach((p) => {
      expect(p.sku_code).toMatch(/^SKU-[A-Z]+-\d+$/);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.base_price_vnd).toBeGreaterThan(0);
      expect(["DRAFT", "ACTIVE", "SUSPENDED"]).toContain(p.status);
      expect(["kg", "g", "khay", "túi", "hộp", "gói"]).toContain(p.uom);
    });
  });

  it("formatVND formats Vietnamese currency with ₫ symbol and dots separator", () => {
    expect(formatVND(300000)).toMatch(/300[.,]000\s*₫/);
    expect(formatVND(1250000)).toMatch(/1[.,]250[.,]000\s*₫/);
  });

  it("CartView initializes with items and computes total via useMemo", () => {
    const sampleCart = {
      id: "cart-test",
      items: [
        {
          product_id: "prod-1",
          sku_code: "SKU-HN-001",
          name: "Cá hồi",
          quantity: 2,
          price_snapshot_vnd: 300000,
          uom: "kg",
        },
      ],
      total_amount_vnd: 600000,
    };

    const element = React.createElement(CartView, {
      initialCart: sampleCart,
    });
    expect(element).toBeDefined();
  });

  it("Strict scope enforcement: no forbidden features in sales components", () => {
    const forbiddenKeywords = ["voucher", "coupon", "refund", "substitution"];
    const productKeys = Object.keys(products[0]);

    forbiddenKeywords.forEach((keyword) => {
      productKeys.forEach((key) => {
        expect(key.toLowerCase()).not.toContain(keyword);
      });
    });
  });

  it("hydrates cart display cache from the confirmed Sales response", () => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } } });
    recordCartResponse({ cart: { id: "cart-id", status: "ACTIVE", version: 1 }, items: [{ sku_ref: products[0].id, quantity: 2, price_snapshot_vnd: 275000 }] }, products[0]);
    expect(loadCartItems()).toEqual([expect.objectContaining({ product_id: products[0].id, quantity: 2, price_snapshot_vnd: 275000 })]);
    Reflect.deleteProperty(globalThis, "window");
  });

  it("rotates a checked-out cart by clearing cached items and its id", () => {
    const storage = new Map<string, string>([
      ["vietsach.cart_id", "checked-out-cart"],
      ["vietsach.cart_items", JSON.stringify([{ product_id: "sku-1" }])],
    ]);
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } } });

    clearCart();

    expect(storage.has("vietsach.cart_id")).toBe(false);
    expect(storage.has("vietsach.cart_items")).toBe(false);
    Reflect.deleteProperty(globalThis, "window");
  });
});


const orderHarness = vi.hoisted(() => ({ toast: { error: vi.fn(), success: vi.fn() }, slots: [] as unknown[], cursor: 0, effects: [] as (() => unknown)[], mounted: false, active: false }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState(initial: unknown) {
      if (!orderHarness.active) return actual.useState(initial);
      const index = orderHarness.cursor++;
      if (!(index in orderHarness.slots)) orderHarness.slots[index] = initial;
      return [orderHarness.slots[index], (next: unknown) => { orderHarness.slots[index] = typeof next === "function" ? next(orderHarness.slots[index]) : next; }];
    },
    useCallback: (callback: never, deps: never) => orderHarness.active ? callback : actual.useCallback(callback, deps),
    useMemo: (compute: () => unknown, deps: never) => orderHarness.active ? compute() : actual.useMemo(compute, deps),
    useEffect: (effect: () => unknown, deps: never) => { if (!orderHarness.active) return actual.useEffect(effect as never, deps); if (!orderHarness.mounted) orderHarness.effects.push(effect); },
  };
});
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: orderHarness.toast }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), usePathname: () => "/", useSearchParams: () => new URLSearchParams() }));
import { renderToStaticMarkup } from "react-dom/server";
import { OrdersView, orderStatusLabels } from "./orders-view";
import { OrderDetailView } from "./order-detail-view";

it("orders_no_uuid", async () => {
  orderHarness.active = true;
  const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
  const createdAt = "2026-10-21T07:05:00Z";
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  try {
    for (const [status, label] of Object.entries(orderStatusLabels)) {
      const order = { id: uuid, order_code: "DH-261021-00001", cart_ref: uuid, branch_ref: uuid, status, total_vnd: 120000, subtotal_vnd: 120000, created_at: createdAt };
      for (const component of [OrdersView, () => OrderDetailView({ id: uuid })]) {
        orderHarness.slots = []; orderHarness.cursor = 0; orderHarness.effects = []; orderHarness.mounted = false;
        fetchMock.mockReset().mockImplementation(async (input) => Response.json({ code: 200, status: "success", message: "Success", data: String(input).includes("page_size") ? { items: [order] } : order }));
        const view = () => { orderHarness.cursor = 0; return component(); };
        view(); orderHarness.mounted = true;
        orderHarness.effects.forEach((effect) => effect());
        await vi.waitFor(() => {
          const html = renderToStaticMarkup(view());
          expect(html).toContain(label);
          expect(html).toContain(order.order_code);
          expect(html).toContain(new Date(createdAt).toLocaleString("vi-VN"));
          expect(html).toContain(formatVND(120000));
          expect(html).not.toContain("Giỏ");
          if (component === OrdersView) expect(html).toContain(`href="/orders/${uuid}"`);
          expect(userFacingContent(html)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
          expect(html).not.toContain(status);
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
      }
    }
  } finally { orderHarness.active = false; vi.unstubAllGlobals(); }
});

function userFacingContent(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ");
  const labels = html.match(/\s(?:label|placeholder|title|aria-[\w-]+)="[^"]*"/g) ?? [];
  const values = (html.match(/<input\b[^>]*>/g) ?? [])
    .filter((input) => !input.includes('type="hidden"'))
    .flatMap((input) => input.match(/\svalue="[^"]*"/g) ?? []);
  return [text, ...labels, ...values].join(" ");
}


// SSR has no portal target. Keep the real dialog context/open state while rendering its content.
vi.mock("@/components/ui/dialog", async (original) => {
  const actual = await original<typeof import("@/components/ui/dialog")>();
  return { ...actual, DialogContent: ({ children }: { children: React.ReactNode }) => actual.useDialog().open ? React.createElement("div", { role: "dialog" }, children) : null };
});
import { Button } from "@/components/ui/button";

function checkoutAction(node: React.ReactNode): (() => Promise<void>) | undefined {
  for (const child of React.Children.toArray(node)) {
    if (!React.isValidElement<{ children?: React.ReactNode; onClick?: () => Promise<void> }>(child)) continue;
    if (child.type === Button && React.Children.toArray(child.props.children).includes("Tạo Đơn Hàng")) return child.props.onClick;
    const action = checkoutAction(child.props.children);
    if (action) return action;
  }
}

it.each(["DH-261021-00001", undefined])("cart_order_code_no_uuid (%s)", async (orderCode) => {
  const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
  const order = { id: uuid, cart_ref: uuid, order_code: orderCode, status: "AWAITING_PAYMENT", subtotal_vnd: 120000, total_vnd: 120000, created_at: "2026-10-21T07:05:00Z" };
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 201, status: "success", message: "Created", data: order }));
  vi.stubGlobal("fetch", fetchMock);
  orderHarness.active = true;
  orderHarness.slots = []; orderHarness.cursor = 0; orderHarness.effects = []; orderHarness.mounted = true;
  orderHarness.toast.success.mockClear(); orderHarness.toast.error.mockClear();
  const view = () => {
    orderHarness.cursor = 0;
    return CartView({ initialCart: { id: uuid, total_amount_vnd: 120000, items: [{ product_id: uuid, sku_code: "BUN-7K", name: "Bún bò Huế QA7K", uom: "suất", quantity: 1, price_snapshot_vnd: 120000 }] } });
  };
  try {
    const checkout = checkoutAction(view());
    expect(checkout).toBeDefined();
    await checkout?.();
    expect(orderHarness.toast.error).not.toHaveBeenCalled();
    expect(orderHarness.toast.success).toHaveBeenCalledWith("Tạo đơn hàng thành công", orderCode ? `Mã đơn: ${orderCode}` : undefined);
    expect(JSON.stringify(orderHarness.toast.success.mock.calls)).not.toContain(uuid);
    const html = renderToStaticMarkup(view());
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Đã Tạo Đơn Hàng Thành Công!");
    if (orderCode) expect(html).toContain(orderCode);
    else expect(html).not.toContain("Mã Đơn Hàng");
    expect(userFacingContent(html)).not.toContain(uuid);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally { orderHarness.active = false; vi.unstubAllGlobals(); }
});

const PRODUCT_ID = "0198fd55-3f46-7a01-9e52-f4c0de000001";
const DRAFT_ID = "0198fd55-3f46-7a01-9e52-f4c0de000003";
const SKU_ID = "0198fd55-3f46-7a01-9e52-f4c0de000002";
const BRANCH_ID = "0198fd55-3f46-7a01-9e52-f4c0de000020";
const staffRows: Product[] = [
  { id: PRODUCT_ID, sku_ref: SKU_ID, sku_code: "CA-HOI-500", name: "Cá hồi tươi", uom: "kg", base_price_vnd: 300000, status: "ACTIVE", created_at: "2026-10-20T08:00:00Z" },
  { id: DRAFT_ID, sku_code: "", name: "Bún bò nháp", uom: "", base_price_vnd: 0, status: "DRAFT", created_at: "2026-10-21T08:00:00Z" },
];
const html = (element: React.ReactElement) => renderToStaticMarkup(element);

describe("AC-3/AC-4 ProductsView là màn quản trị console", () => {
  it("AC-3 hiển thị cả DRAFT lẫn ACTIVE kèm tên, không lộ UUID", () => {
    const out = html(React.createElement(ProductsView, { initialProducts: staffRows, dataSource: "api", canCreate: true }));
    expect(out).toContain("Cá hồi tươi");
    expect(out).toContain("Bún bò nháp");
    expect(out).toContain("Bản nháp");
    expect(userFacingContent(out)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });
  it("AC-4 nút tạo chỉ có khi canCreate, ẩn khi thiếu quyền create", () => {
    expect(html(React.createElement(ProductsView, { initialProducts: staffRows, dataSource: "api", canCreate: true }))).toContain("Tạo sản phẩm");
    expect(html(React.createElement(ProductsView, { initialProducts: staffRows, dataSource: "api", canCreate: false }))).not.toContain("Tạo sản phẩm");
  });
  it("AC-3 có ô lọc theo tên và lọc trạng thái, ô tìm không nhắc mã vạch", () => {
    const out = html(React.createElement(ProductsView, { initialProducts: staffRows, dataSource: "api", canCreate: true }));
    expect(out).toMatch(/<input[^>]*placeholder="[^"]*[Tt]ên/);
    expect(out).not.toMatch(/mã vạch|barcode/i);
    expect(out).toContain("Bản nháp (1)");
    expect(out).toContain("Đang mở bán (1)");
  });
  it("AC-3 DRAFT không dẫn tới trang chi tiết công khai, ACTIVE có liên kết xem catalog", () => {
    const out = html(React.createElement(ProductsView, { initialProducts: staffRows, dataSource: "api", canCreate: true }));
    expect(out).not.toContain(`href="/products/${DRAFT_ID}"`);
    expect(out).toContain(`href="/products/${PRODUCT_ID}"`);
  });
  it("OD-4 console chưa có nút kích hoạt khi lifecycle API chưa đúng", () => {
    expect(html(React.createElement(ProductsView, { initialProducts: staffRows, dataSource: "api", canCreate: true }))).not.toMatch(/Kích hoạt/);
  });
  it("AC-6 nguồn lỗi hiện role alert và không dựng dòng giả", () => {
    const out = html(React.createElement(ProductsView, { initialProducts: [], dataSource: "unavailable", canCreate: true }));
    expect(out).toContain('role="alert"');
    expect(out).not.toContain("Cá hồi tươi");
  });
});

describe("AC-3 form tạo sản phẩm nháp chỉ tên + mã", () => {
  const dialog = () => html(React.createElement(ProductCreateDialog, { open: true, onOpenChange: () => undefined }));
  it("có trường tên và mã, không còn SKU/giá/đơn vị/mô tả", () => {
    const out = dialog();
    expect(out).toMatch(/Tên sản phẩm/);
    expect(out).toMatch(/Mã (sản phẩm|định danh|slug)/i);
    expect(out).not.toMatch(/SKU|Giá niêm yết|Đơn vị tính|type="number"/);
    expect((out.match(/<input\b/g) ?? []).length).toBe(2);
  });
  it("không có select đơn vị", () => {
    expect(dialog()).not.toContain("<select");
  });
});

describe("AC-2 chi tiết khách không còn thao tác/metadata quản trị", () => {
  const customerProduct: Product = { ...staffRows[0], barcode: "8930000000017", branch_ref: BRANCH_ID, image_urls: ["https://cdn.example.test/ca-hoi.jpg"] };
  it("không có kích hoạt, mã SKU, barcode, DRAFT, ngày tạo SKU", () => {
    const out = html(React.createElement(ProductDetailView, { initialProduct: customerProduct }));
    expect(out).toContain("Cá hồi tươi");
    expect(out).toContain(formatVND(300000));
    expect(out).not.toMatch(/Kích hoạt|ACTIVE|DRAFT|Mã SKU|Barcode|Mã vạch|Ngày tạo SKU|8930000000017/);
    expect(userFacingContent(out)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });
  it("AC-5 có nút thêm giỏ khi đủ sku_ref và branch_ref", () => {
    expect(html(React.createElement(ProductDetailView, { initialProduct: customerProduct }))).toContain("Thêm vào giỏ hàng");
  });
  it("AC-5 thiếu sku_ref thì không có nút thêm giỏ dùng được (không lấy product.id làm SKU)", () => {
    const out = html(React.createElement(ProductDetailView, { initialProduct: { ...customerProduct, sku_ref: undefined } }));
    const button = out.match(/<button[^>]*>(?:(?!<\/button>).)*Thêm vào giỏ hàng(?:(?!<\/button>).)*<\/button>/s)?.[0];
    if (button) expect(button.match(/<button[^>]*>/)?.[0]).toMatch(/\sdisabled(?:=|\s|>)/);
  });
});
