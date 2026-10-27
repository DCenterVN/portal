import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { useGoodsReceipt } from "./use-goods-receipt";
import * as suppliersAPI from "@/lib/api/suppliers";
import * as agreementsAPI from "@/lib/api/supplier-agreements";
import * as receiptsAPI from "@/lib/api/goods-receipts";
import { agreement, supplier, material, supplierID, documentID } from "@/mocks/supplier-contract";
import { FetchError } from "@/lib/fetcher";
import { AccessProvider } from "@/lib/access-boundary";
import { GoodsReceiptForm } from "./goods-receipt-form";
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
  return { ...actual, useAccess: () => harness.enabled ? { can: () => true } : actual.useAccess() };
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
  vi.spyOn(suppliersAPI, "getActiveSuppliers").mockResolvedValue([supplier]);
  vi.spyOn(agreementsAPI, "getContractMaterials").mockResolvedValue([material]);
  vi.spyOn(agreementsAPI, "getAllAgreements").mockResolvedValue(items);
  vi.spyOn(receiptsAPI, "getReceiptBranch").mockResolvedValue(documentID);
  receiptHook(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  receiptHook().onSupplier(supplierID);
  receiptHook(); await Promise.resolve(); await Promise.resolve();
  let view = receiptHook(); view.onDate("2026-11-01"); view = receiptHook(); view.onSku(view.rows[0].key, material.id);
  return receiptHook();
}
const submitEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
it("hook gửi giá tay 0 không refs và chặn double submit", async () => {
  let view = await readyReceipt();
  expect(view.valid).toBe(false);
  view.onPrice(view.rows[0].key, 0); view = receiptHook();
  expect(view.valid).toBe(true);
  const create = vi.spyOn(receiptsAPI, "createGoodsReceipt").mockResolvedValue({ id: documentID, status: "DRAFT" });
  await Promise.all([view.onSubmit(submitEvent), view.onSubmit(submitEvent)]);
  expect(create).toHaveBeenCalledTimes(1);
  expect(create.mock.calls[0][0].expected_lines[0]).toEqual({ sku_ref: material.id, uom: "KG", expected_quantity: 1, unit_cost_vnd: 0 });
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
