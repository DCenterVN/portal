import { afterEach, expect, it, vi } from "vitest";
import { useGoodsReceiptReceive } from "./use-goods-receipt-receive";
import * as suppliersAPI from "@/lib/api/suppliers";
import * as historyAPI from "@/lib/api/supplier-history";
import * as receiveAPI from "@/lib/api/goods-receipt-receive";
import * as materialsAPI from "./use-contract-materials";

const harness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, effects: [] as (() => void)[] }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  function state<T>(initial: T | (() => T)) {
    const slot = harness.cursor++;
    if (!(slot in harness.slots)) harness.slots[slot] = typeof initial === "function" ? (initial as () => T)() : initial;
    return [harness.slots[slot] as T, (next: T | ((previous: T) => T)) => { harness.slots[slot] = typeof next === "function" ? (next as (previous: T) => T)(harness.slots[slot] as T) : next; }] as const;
  }
  return { ...actual, useState: state, useRef: <T,>(initial: T) => state({ current: initial })[0],
    useEffect: (effect: () => void, deps?: unknown[]) => {
      const slot = harness.cursor++;
      const previous = harness.slots[slot] as unknown[] | undefined;
      if (!previous || !deps || deps.some((value, index) => value !== previous[index])) { harness.slots[slot] = deps; harness.effects.push(effect); }
    },
  };
});
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => true }) }));
afterEach(() => vi.restoreAllMocks());

const ids = { receipt: "0190a000-0000-7000-8000-000000000001", supplier: "0190a000-0000-7000-8000-000000000002", line: "0190a000-0000-7000-8000-000000000003", sku: "0190a000-0000-7000-8000-000000000004", branch: "0190a000-0000-7000-8000-000000000005" };
const receipt = (status: string, actual: string) => ({ id: ids.receipt, branch_ref: ids.branch, supplier_ref: ids.supplier, status, created_at: "", expected_at: "", completed_at: null, total_amount_vnd: 0,
  lines: [{ receipt_line_ref: ids.line, sku_ref: ids.sku, uom: "KG", expected_quantity: "1", actual_quantity: actual, unit_cost_vnd: 1000, expected_amount_vnd: 1000, actual_amount_vnd: 0 }] });
const page = (item: ReturnType<typeof receipt>) => ({ items: [item], total: 1, next_cursor: "" });
const hook = () => { harness.cursor = 0; const result = useGoodsReceiptReceive(ids.receipt, ids.supplier); for (const effect of harness.effects.splice(0)) effect(); return result; };
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

it("nhận xong một dòng thì tải lại phiếu và lấy trạng thái thật từ backend", async () => {
  harness.slots = []; harness.effects = [];
  vi.spyOn(suppliersAPI, "getSupplier").mockResolvedValue({ name: "NCC" } as never);
  vi.spyOn(materialsAPI, "loadContractMaterials").mockResolvedValue([]);
  const history = vi.spyOn(historyAPI, "getSupplierHistory").mockResolvedValueOnce(page(receipt("DRAFT", "0"))).mockResolvedValue(page(receipt("RECEIVING", "1")));
  vi.spyOn(receiveAPI, "receiveReceiptLine").mockResolvedValue({ id: "lot" } as never);
  hook(); await settle();
  let view = hook();
  expect(view.setup.kind === "ready" && view.setup.receipt.status).toBe("DRAFT");
  const evidence = { media_ref: "m" } as never;
  view.patch(ids.line, { lot: "L1", quantity: "1", expiry: "2999-01-01", temperature: "4", goods: evidence, document: evidence });
  view = hook();
  await view.receive(view.rows[0]);
  hook(); await settle();
  view = hook();
  expect(history).toHaveBeenCalledTimes(2);
  expect(view.setup.kind === "ready" && view.setup.receipt.status).toBe("RECEIVING");
  expect(view.rows[0].done).toBe(true);
});
