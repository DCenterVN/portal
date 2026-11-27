import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { useGoodsReceipt } from "./use-goods-receipt";
import * as suppliersAPI from "@/lib/api/suppliers";
import * as agreementsAPI from "@/lib/api/supplier-agreements";
import * as categoriesAPI from "@/lib/api/material-categories";
import * as receiptsAPI from "@/lib/api/goods-receipts";
import * as supplierHistoryAPI from "@/lib/api/supplier-history";
import { agreement, supplier, material, supplierID, documentID } from "@/mocks/supplier-contract";
import { FetchError } from "@/lib/fetcher";
import { AccessProvider } from "@/lib/access-boundary";
import { GoodsReceiptForm } from "./goods-receipt-form";
import { toast } from "@/components/ui/toast";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/ui/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
it("chưa tải bảng giá thì chặn tạo; có ô giá thực tế và không lộ UUID", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:goods_receipt:create", "inventory:supplier:read"]) }}><GoodsReceiptForm /></AccessProvider>);
  expect(html).toContain("Giá tham chiếu"); expect(html).toContain("disabled");
  expect(html).toContain('aria-label="Đơn giá dòng 1"'); expect(html).not.toContain('name="supplier_ref" type="text"');
});
it("thiếu action create thì đóng form", () => {
  expect(renderToStaticMarkup(<GoodsReceiptForm />)).toContain('role="alert"');
});

it("presentational form shows Vietnamese date and the child table", async () => {
  const { GoodsReceiptView } = await import("./goods-receipt-form");
  const { vi } = await import("vitest");
  const html = renderToStaticMarkup(<GoodsReceiptView allowed setupKind="ready" suppliers={[]} materials={[]} supplier="" date="2026-10-27"
    rows={[{key:"one",sku:"",quantity:1,amount:null,uom:undefined,unitPrice:undefined,referencePrice:undefined}]} busy={false} success="" error="" pricesKind="loading" reconfirm={false} valid={false} canUpdate={false}
    onPrice={vi.fn()} onSupplier={vi.fn()} onDate={vi.fn()} onSku={vi.fn()} onQuantity={vi.fn()} onAdd={vi.fn()} onRemove={vi.fn()} onRetry={vi.fn()} onPriceRetry={vi.fn()} onReconfirm={vi.fn()} onSubmit={vi.fn()} />);
  expect(html).toContain('value="27/10/2026"');
  expect(html).toContain('aria-label="Dòng nhập"');
  expect(html).toContain("Chưa đủ giá");
  expect(html).toContain('href="/inventory/goods-receipts"');
  expect(html).toContain("Danh sách phiếu nhập");
  expect(html).not.toContain('type="date"');
});

const harness = vi.hoisted(() => ({ enabled: false, slots: [] as unknown[], cursor: 0, effects: [] as (() => void)[] }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  function state<T>(initial: T | (() => T)) {
    if (!harness.enabled) return actual.useState(initial);
    const slot = harness.cursor++;
    if (!(slot in harness.slots)) harness.slots[slot] = typeof initial === "function" ? (initial as () => T)() : initial;
    return [harness.slots[slot] as T, (next: T | ((previous: T) => T)) => { harness.slots[slot] = typeof next === "function" ? (next as (previous: T) => T)(harness.slots[slot] as T) : next; }] as const;
  }
  return { ...actual, useState: state,
    useRef: <T,>(initial: T) => harness.enabled ? state({ current: initial })[0] : actual.useRef(initial),
    useEffect: (effect: () => void, deps?: unknown[]) => {
      if (!harness.enabled) return actual.useEffect(effect, deps);
      const slot = harness.cursor++;
      const previous = harness.slots[slot] as unknown[] | undefined;
      if (!previous || !deps || deps.some((value, index) => value !== previous[index])) { harness.slots[slot] = deps; harness.effects.push(effect); }
    },
  };
});
vi.mock("@/lib/access-boundary", async original => {
  const actual = await original<typeof import("@/lib/access-boundary")>();
  return { ...actual, useAccess: () => harness.enabled ? { can: () => true, scope: { userId: "u", orgId: "o", branchId: documentID, branchName: "B", roles: [] } } : actual.useAccess() };
});
afterEach(() => { harness.enabled = false; vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function receiptHook() {
  harness.cursor = 0;
  const result = useGoodsReceipt();
  for (const effect of harness.effects.splice(0)) effect();
  return result;
}
async function readyReceipt(items: agreementsAPI.Agreement[] = []) {
  harness.enabled = true; harness.slots = []; harness.effects = [];
  vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
  vi.spyOn(categoriesAPI, "getMaterialCategories").mockResolvedValue([]);
  vi.spyOn(suppliersAPI, "getActiveSuppliers").mockResolvedValue([supplier]);
  vi.spyOn(agreementsAPI, "getContractMaterials").mockResolvedValue([material]);
  vi.spyOn(agreementsAPI, "getAllAgreements").mockResolvedValue(items);
  receiptHook(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  receiptHook().onSupplier(supplierID);
  receiptHook(); await Promise.resolve(); await Promise.resolve();
  let view = receiptHook(); view.onDate("2026-11-01"); view = receiptHook(); view.onSku(view.rows[0].key, material.id);
  return receiptHook();
}
const submitEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
it("nhà chưa có giá còn hiệu lực thì danh sách nguyên liệu rỗng, không tạo được phiếu", async () => {
  const view = await readyReceipt();
  expect(view.materials).toHaveLength(0);
  expect(view.valid).toBe(false);
});
it("danh sách nhà gửi ngày dự kiến nhập và tải lại khi đổi ngày", async () => {
  await readyReceipt();
  const spy = suppliersAPI.getActiveSuppliers as unknown as ReturnType<typeof vi.fn>;
  expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
  expect(spy.mock.calls.every(call => Boolean(call[0]))).toBe(true);
  const dates = spy.mock.calls.map(call => call[0]);
  expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(dates).toContain("2026-11-01");
});

it("chỉ giữ nhà có giá theo ngày dự kiến nhập và giữ phiếu RECEIVING trong danh sách đang mở", async () => {
  harness.enabled = true; harness.slots = []; harness.effects = [];
  vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
  vi.spyOn(categoriesAPI, "getMaterialCategories").mockResolvedValue([]);
  vi.spyOn(suppliersAPI, "getActiveSuppliers").mockResolvedValue([supplier]);
  vi.spyOn(agreementsAPI, "getContractMaterials").mockResolvedValue([material]);
  vi.spyOn(agreementsAPI, "getAllAgreements").mockResolvedValue([]);
  vi.spyOn(suppliersAPI, "getSupplier").mockResolvedValue(supplier);
  vi.spyOn(supplierHistoryAPI, "getSupplierHistory").mockResolvedValue({
    items: [
      { id: documentID, branch_ref: documentID, supplier_ref: supplierID, status: "RECEIVING", created_at: "2026-10-26T08:00:00Z", expected_at: "2026-10-27T12:00:00+07:00", completed_at: null, total_amount_vnd: 125000, lines: [] },
      { id: supplierID, branch_ref: documentID, supplier_ref: supplierID, status: "COMPLETED", created_at: "2026-10-25T08:00:00Z", expected_at: "2026-10-26T12:00:00+07:00", completed_at: "2026-10-26T14:00:00+07:00", total_amount_vnd: 100000, lines: [] },
    ],
    total: 2,
    next_cursor: "",
  });
  receiptHook(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  receiptHook().onSupplier(supplierID);
  receiptHook(); await Promise.resolve(); await Promise.resolve();
  const view = receiptHook();
  expect(view.suppliers.map(item => item.id)).toEqual([supplier.id]);
  expect(view.unpricedIds.size).toBe(0);
  expect(view.openReceipts.map(item => item.status)).toEqual(["RECEIVING"]);
});
it("hook gửi giá tay 0 kèm refs bảng giá và chặn double submit", async () => {
  let view = await readyReceipt([{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE", document_ref: null }]);
  view.onPrice(view.rows[0].key, 0); view = receiptHook();
  expect(view.valid).toBe(true);
  const create = vi.spyOn(receiptsAPI, "createGoodsReceipt").mockResolvedValue({ id: documentID, status: "DRAFT" });
  await Promise.all([view.onSubmit(submitEvent), view.onSubmit(submitEvent)]);
  expect(create).toHaveBeenCalledTimes(1);
  expect(create.mock.calls[0][0].expected_lines[0]).toMatchObject({ sku_ref: material.id, uom: "KG", expected_quantity: 1, unit_cost_vnd: 0 });
});
it("hook giữ giá tay khi 409, reload refs và gửi lại đúng key/body", async () => {
  let view = await readyReceipt([{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE", document_ref: null }]);
  expect(view.rows[0].unitPrice).toBe(25000);
  view.onPrice(view.rows[0].key, 27000); view = receiptHook();
  const conflict = new FetchError("Stale", 409);
  const create = vi.spyOn(receiptsAPI, "createGoodsReceipt").mockRejectedValueOnce(conflict).mockResolvedValue({ id: documentID, status: "DRAFT" });
  await view.onSubmit(submitEvent); view = receiptHook();
  await Promise.resolve(); await Promise.resolve(); view = receiptHook();
  expect(view.rows[0].unitPrice).toBe(27000);
  expect(view.reconfirm).toBe(true);
  expect(view.valid).toBe(false);
  view.onReconfirm(); view = receiptHook(); await view.onSubmit(submitEvent);
  expect(create.mock.calls[0][0].expected_lines[0]).toMatchObject({ unit_cost_vnd: 27000, agreement_version_ref: agreement.version_id, price_line_ref: documentID });
  expect(create.mock.calls[1]).toEqual(create.mock.calls[0]);
});
it("hook xóa giá tay khi đổi ngày, SKU, NCC và không biến outage thành thiếu coverage", async () => {
  let view = await readyReceipt();
  view.onPrice(view.rows[0].key, 100); view = receiptHook(); view.onDate("2026-11-02"); view = receiptHook();
  expect(view.rows[0].unitPrice).toBeUndefined();
  view.onPrice(view.rows[0].key, 100); view = receiptHook(); view.onSku(view.rows[0].key, ""); view = receiptHook();
  expect(view.rows[0].unitPrice).toBeUndefined();
  view.onSku(view.rows[0].key, material.id); view = receiptHook(); view.onPrice(view.rows[0].key, 100); view = receiptHook();
  vi.mocked(agreementsAPI.getAllAgreements).mockRejectedValue(new Error("outage"));
  view.onSupplier(supplierID); view = receiptHook(); view.onPriceRetry(); receiptHook();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); view = receiptHook();
  expect(view.rows[0].unitPrice).toBeUndefined();
  view.onPrice(view.rows[0].key, 100); view = receiptHook();
  expect(view.pricesKind).toBe("error"); expect(view.valid).toBe(false);
});
it("hook mơ hồ giá chặn lưu kể cả đã nhập giá tay", async () => {
  const active = { ...agreement, status: "ACTIVE" as const, effective_status: "ACTIVE" };
  let view = await readyReceipt([active, active]);
  view.onPrice(view.rows[0].key, 100); view = receiptHook();
  expect(view.error).toContain("Có nhiều bảng giá"); expect(view.valid).toBe(false);
});

it("?supplier= trên địa chỉ chọn sẵn nhà cung cấp", async () => {
  harness.enabled = true; harness.slots = []; harness.effects = [];
  vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
  vi.stubGlobal("window", { location: { search: `?supplier=${supplierID}` } });
  vi.spyOn(categoriesAPI, "getMaterialCategories").mockResolvedValue([]);
  vi.spyOn(suppliersAPI, "getActiveSuppliers").mockResolvedValue([supplier]);
  vi.spyOn(agreementsAPI, "getContractMaterials").mockResolvedValue([material]);
  vi.spyOn(agreementsAPI, "getAllAgreements").mockResolvedValue([]);
  receiptHook(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  receiptHook(); receiptHook();
  expect(receiptHook().supplier).toBe(supplierID);
});

it("chú giải cạnh nút nêu đúng điều còn thiếu, không lặp câu chung", async () => {
  const { GoodsReceiptView } = await import("./goods-receipt-form");
  const html = renderToStaticMarkup(<GoodsReceiptView allowed setupKind="ready" suppliers={[supplier]} materials={[]} supplier={supplierID} date="2026-10-27"
    rows={[{key:"a",sku:"x",quantity:1,amount:null,unitPrice:5,uom:"KG",referencePrice:undefined},{key:"b",sku:"y",quantity:1,amount:null,uom:"KG",unitPrice:undefined,referencePrice:undefined}]} busy={false} success="" error="" pricesKind="ready" reconfirm={false} valid={false} canUpdate={false}
    onPrice={vi.fn()} onSupplier={vi.fn()} onDate={vi.fn()} onSku={vi.fn()} onQuantity={vi.fn()} onAdd={vi.fn()} onRemove={vi.fn()} onRetry={vi.fn()} onPriceRetry={vi.fn()} onReconfirm={vi.fn()} onSubmit={vi.fn()} />);
  expect(html).toContain("Dòng 2 chưa có đơn giá");
  expect(html).not.toContain("Chọn nhà cung cấp, nguyên liệu, số lượng");
});

it("số nguyên liệu trên thẻ bằng số lựa chọn trong ô và bảng giá của ngăn hồ sơ", async () => {
  const view = await readyReceipt([{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE", document_ref: null }]);
  expect(view.materials.length).toBeGreaterThan(0);
  expect(view.pricedCount).toBe(view.materials.length);
  expect(view.priceTable.map(item => item.material.id)).toEqual(view.materials.map(item => item.id));
  const draft = await readyReceipt([{ ...agreement, status: "DRAFT", effective_status: "DRAFT", document_ref: null }]);
  expect(draft.materials).toHaveLength(0);
  expect(draft.pricedCount).toBe(0);
});
it("Thêm vào phiếu điền dòng trống rồi thêm dòng mới và không thêm trùng", async () => {
  let view = await readyReceipt([{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE", document_ref: null }]);
  view.onSku(view.rows[0].key, ""); view = receiptHook();
  view.onAddMaterial(material.id); view = receiptHook();
  expect(view.rows).toHaveLength(1); expect(view.rows[0].sku).toBe(material.id); expect(view.rows[0].unitPrice).toBe(25000);
  view.onAddMaterial(material.id); view = receiptHook();
  expect(view.rows).toHaveLength(1);
});
it("ngăn hồ sơ liệt kê giá, nút Thêm vào phiếu và nút Đã có ở dòng n", async () => {
  const { ReceiptSupplierProfile } = await import("./receipt-supplier-sheet");
  const { Sheet } = await import("@/components/ui/sheet");
  const props = { supplier, priceTable: [{ material, unitPrice: 25000, validTo: "2026-12-31" }], pricesReady: true, onAddMaterial: vi.fn() };
  for (const [used, text] of [[-1, "Thêm vào phiếu"], [1, "Đã có ở dòng 2"]] as const) {
    const html = renderToStaticMarkup(<Sheet open><ReceiptSupplierProfile {...props} usedAt={() => used} /></Sheet>);
    expect(html).toContain(text); expect(html).toContain("25.000 đ"); expect(html).toContain("31/12/2026"); expect(html).toContain("Mở trang hồ sơ đầy đủ");
  }
});

it("tạo thành công gọi toast.success một lần kèm nút Nhận hàng; lỗi gọi toast.error", async () => {
  vi.mocked(toast.success).mockClear(); vi.mocked(toast.error).mockClear();
  let view = await readyReceipt([{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE", document_ref: null }]);
  view.onPrice(view.rows[0].key, 0); view = receiptHook();
  const create = vi.spyOn(receiptsAPI, "createGoodsReceipt").mockResolvedValueOnce({ id: documentID, status: "DRAFT", total_amount_vnd: 5000 }).mockRejectedValueOnce(new Error("Kho đang đóng"));
  await Promise.all([view.onSubmit(submitEvent), view.onSubmit(submitEvent)]);
  expect(toast.success).toHaveBeenCalledTimes(1);
  expect(toast.success).toHaveBeenCalledWith("Đã tạo phiếu nhập", expect.objectContaining({ description: "Nháp · tổng 5.000 đ", action: expect.objectContaining({ label: "Nhận hàng" }) }));
  view = receiptHook(); await view.onSubmit(submitEvent);
  expect(create).toHaveBeenCalledTimes(2);
  expect(toast.error).toHaveBeenCalledWith("Kho đang đóng");
});

it("hiển thị danh sách phiếu nhập đang mở kèm nút nhận hàng tiếp", async () => {
  const { GoodsReceiptView } = await import("./goods-receipt-form");
  const html = renderToStaticMarkup(
    <GoodsReceiptView
      allowed
      setupKind="ready"
      suppliers={[supplier]}
      materials={[]}
      supplier={supplierID}
      date="2026-10-27"
      rows={[{ key: "a", sku: "", quantity: 1, amount: null, uom: undefined, unitPrice: undefined, referencePrice: undefined }]}
      busy={false}
      success=""
      error=""
      pricesKind="ready"
      reconfirm={false}
      valid={false}
      canUpdate={false}
      openReceipts={[
        {
          id: documentID,
          branch_ref: documentID,
          supplier_ref: supplierID,
          status: "RECEIVING",
          created_at: "2026-10-26T08:00:00Z",
          expected_at: "2026-10-27T12:00:00+07:00",
          completed_at: null,
          total_amount_vnd: 125000,
          lines: [
            {
              receipt_line_ref: documentID,
              sku_ref: material.id,
              uom: "KG",
              expected_quantity: "5",
              actual_quantity: "2",
              unit_cost_vnd: 25000,
              expected_amount_vnd: 125000,
              actual_amount_vnd: 50000,
            },
          ],
        },
      ]}
      onPrice={vi.fn()}
      onSupplier={vi.fn()}
      onDate={vi.fn()}
      onSku={vi.fn()}
      onQuantity={vi.fn()}
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onRetry={vi.fn()}
      onPriceRetry={vi.fn()}
      onReconfirm={vi.fn()}
      onSubmit={vi.fn()}
    />
  );
  expect(html).toContain('aria-label="Phiếu nhập đang mở"');
  expect(html).toContain("27/10/2026");
  expect(html).toContain("Đang nhận");
  expect(html).toContain("1 dòng hàng");
  expect(html).toContain("125.000");
  expect(html).toContain("Nhận hàng tiếp");
  expect(html).toContain(`/inventory/goods-receipts/${documentID}/receive?supplier=${supplierID}`);
});
