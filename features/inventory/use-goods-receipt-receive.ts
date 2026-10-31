"use client";

import { useEffect, useRef, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getSupplier } from "@/lib/api/suppliers";
import { getSupplierHistory, type SupplierReceipt } from "@/lib/api/supplier-history";
import { getContractMaterials } from "@/lib/api/supplier-agreements";
import { receiveReceiptLine, recordQuantityVariance, type QuantityVarianceInput, type ReceiveReceiptInput } from "@/lib/api/goods-receipt-receive";
import { FetchError } from "@/lib/fetcher";
import { receiptToday, parseReceiptDate, formatReceiptDate } from "./receipt-date-input";
import { validQuantity } from "./receipt-lines";
import type { ReceiptEvidence } from "./receipt-evidence-field";

type Line = SupplierReceipt["lines"][number];
type Row = {
  line: Line; attempt: string; lot: string; quantity: string; expiry: string; temperature: string;
  goods?: ReceiptEvidence; document?: ReceiptEvidence; variance?: ReceiptEvidence;
  busy: boolean; done: boolean; error: string; reload: boolean; submitted: boolean;
};
type Setup = { kind: "loading" } | { kind: "error"; message: string } | { kind: "empty" } | { kind: "ready"; receipt: SupplierReceipt; supplier: string; names: Record<string, string> };
const number = (value: string) => Number(value.replace(",", "."));
const validTemperature = (value: string) => /^-?\d+(?:[.,]\d+)?$/.test(value) && Number.isFinite(number(value));
const receiveError = (cause: unknown) => cause instanceof FetchError && cause.status === 403 ? "Bạn cần quyền cập nhật phiếu nhập" : cause instanceof Error ? cause.message : "Không nhận được hàng. Hãy thử lại.";

export function useGoodsReceiptReceive(receiptID: string, supplierID: string) {
  const { can } = useAccess();
  const allowed = can("inventory:goods_receipt:update") && can("inventory:supplier:read");
  const [setup, setSetup] = useState<Setup>({ kind: "loading" });
  const [rows, setRows] = useState<Row[]>([]);
  const [revision, setRevision] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [varianceState, setVarianceState] = useState({ busy: false, done: false, submitted: false, error: "", reload: false });
  const varianceCommand = useRef<{ body: QuantityVarianceInput; key: string } | null>(null);
  const varianceInFlight = useRef(false);
  const commands = useRef(new Map<string, { body: ReceiveReceiptInput; key: string }>());
  const inFlight = useRef(new Set<string>());
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    async function load() {
      if (!supplierID) { if (live) setSetup({ kind: "empty" }); return; }
      const [supplier, materials] = await Promise.all([getSupplier(supplierID), getContractMaterials()]);
      let cursor = "";
      let receipt: SupplierReceipt | undefined;
      // ponytail: Tìm tối đa 10 trang lịch sử; thay bằng GET detail khi inventory có RD-3b.
      for (let page = 0; page < 10; page++) {
        const history = await getSupplierHistory(supplierID, { cursor });
        receipt = history.items.find(item => item.id === receiptID);
        if (receipt || !history.next_cursor || cursor === history.next_cursor) break;
        cursor = history.next_cursor;
      }
      if (!live) return;
      if (!receipt) { setSetup({ kind: "empty" }); return; }
      setSetup({ kind: "ready", receipt, supplier: supplier.name, names: Object.fromEntries(materials.map(item => [item.id, item.name])) });
      setRows(previous => receipt.lines.map(line => {
        const existing = previous.find(row => row.line.receipt_line_ref === line.receipt_line_ref);
        if (existing) return { ...existing, line, reload: false, done: existing.done || number(line.actual_quantity) > 0 };
        return { line, attempt: crypto.randomUUID(), lot: "", quantity: line.expected_quantity.replace(".", ","), expiry: "", temperature: "", busy: false, done: number(line.actual_quantity) > 0, error: "", reload: false, submitted: false };
      }));
    }
    load().catch(cause => { if (live) setSetup({ kind: "error", message: receiveError(cause) }); });
    return () => { live = false; };
  }, [allowed, receiptID, supplierID, revision]);
  const patch = (id: string, changes: Partial<Row>) => setRows(items => items.map(row => row.line.receipt_line_ref === id ? { ...row, ...changes } : row));
  const open = setup.kind === "ready" && ["DRAFT", "IN_PROGRESS", "RECEIVING"].includes(setup.receipt.status);
  const ready = (row: Row) => open && !row.done && !row.busy && Boolean(row.lot.trim() && /^\d+(?:[.,]\d{1,3})?$/.test(row.quantity) && validQuantity(number(row.quantity)) && row.expiry > receiptToday() && parseReceiptDate(formatReceiptDate(row.expiry)) && validTemperature(row.temperature) && row.goods && row.document && (number(row.quantity) === number(row.line.expected_quantity) || row.variance));
  async function receive(row: Row) {
    const id = row.line.receipt_line_ref;
    if (!allowed || !ready(row) || row.reload || inFlight.current.has(id)) return;
    const body = { goods_receipt_line_id: id, receive_attempt_ref: row.attempt, evidence_refs: [row.goods, row.document, ...(number(row.quantity) !== number(row.line.expected_quantity) ? [row.variance] : [])].flatMap(item => item ? [item.media_ref] : []), supplier_lot_code: row.lot.trim(), sku_ref: row.line.sku_ref, initial_quantity: number(row.quantity), expiry_date: `${row.expiry}T00:00:00+07:00`, received_temperature_celsius: number(row.temperature), uom: row.line.uom };
    let command = commands.current.get(id);
    if (!command || JSON.stringify(command.body) !== JSON.stringify(body)) {
      command = { body, key: crypto.randomUUID() }; commands.current.set(id, command);
    }
    inFlight.current.add(id); patch(id, { busy: true, error: "", reload: false, submitted: true });
    try {
      await receiveReceiptLine(receiptID, command.body, command.key);
      patch(id, { done: true, line: { ...row.line, actual_quantity: String(command.body.initial_quantity) } });
    } catch (cause) {
      patch(id, { submitted: !(cause instanceof FetchError && [400, 403, 404, 422].includes(cause.status)), error: receiveError(cause), reload: cause instanceof FetchError && cause.status === 409 && cause.code === "state_conflict" });
    } finally { inFlight.current.delete(id); patch(id, { busy: false }); }
  }
  const units: Record<string, { unit: string; factor: number }> = { KG: { unit: "KG", factor: 1000 }, G: { unit: "KG", factor: 1 }, L: { unit: "L", factor: 1000 }, ML: { unit: "L", factor: 1 } };
  const unit = units[rows[0]?.line.uom]?.unit ?? rows[0]?.line.uom ?? "";
  const compatible = rows.every(row => (units[row.line.uom]?.unit ?? row.line.uom) === unit);
  const expected = rows.reduce((sum, row) => sum + Math.round(number(row.line.expected_quantity) * 1000) * (units[row.line.uom]?.factor ?? 1000), 0) / 1000000;
  const actual = rows.reduce((sum, row) => sum + Math.round(number(row.line.actual_quantity) * 1000) * (units[row.line.uom]?.factor ?? 1000), 0) / 1000000;
  const allReceived = rows.length > 0 && rows.every(row => row.done);
  const needsVariance = compatible && allReceived && expected > 0 && Math.abs(actual - expected) * 100 > expected * 5 + 1e-9;
  const varianceRow = rows.find(row => row.variance) ?? rows[0];
  async function recordVariance() {
    if (!allowed || !needsVariance || !varianceRow?.variance || !explanation.trim() || varianceState.done || varianceInFlight.current) return;
    const body: QuantityVarianceInput = { receive_attempt_ref: varianceRow.attempt, evidence_refs: [varianceRow.variance.media_ref], expected_quantity: expected, actual_quantity: actual, explanation: explanation.trim() };
    if (!varianceCommand.current || JSON.stringify(varianceCommand.current.body) !== JSON.stringify(body)) varianceCommand.current = { body, key: crypto.randomUUID() };
    varianceInFlight.current = true;
    setVarianceState({ busy: true, done: false, submitted: true, error: "", reload: false });
    try {
      await recordQuantityVariance(receiptID, varianceCommand.current.body, varianceCommand.current.key);
      setVarianceState({ busy: false, done: true, submitted: true, error: "", reload: false });
    } catch (cause) {
      setVarianceState({ busy: false, done: false, submitted: !(cause instanceof FetchError && [400, 403, 404, 422].includes(cause.status)), error: receiveError(cause), reload: cause instanceof FetchError && cause.status === 409 && cause.code === "state_conflict" });
    } finally { varianceInFlight.current = false; }
  }
  return { allowed, setup, rows, open, ready, patch, receive, expected, actual, unit, compatible, needsVariance, varianceRow, explanation, setExplanation, varianceState, recordVariance, onReload: () => { setVarianceState(state => ({ ...state, reload: false })); setRevision(value => value + 1); } };
}
