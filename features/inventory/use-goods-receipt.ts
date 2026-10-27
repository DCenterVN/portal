"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getActiveSuppliers, type Supplier } from "@/lib/api/suppliers";
import { getContractMaterials, getAllAgreements, resolveReceiptReferencePrice, type Agreement } from "@/lib/api/supplier-agreements";
import { getReceiptBranch, createGoodsReceipt, receiptDraftSchema } from "@/lib/api/goods-receipts";
import { type Material } from "@/lib/api/sales";
import { FetchError } from "@/lib/fetcher";
import { receiptToday, parseReceiptDate, formatReceiptDate } from "./receipt-date-input";
import { lineAmount, receiptTotal, validQuantity, type ReceiptLine } from "./receipt-lines";

type Setup = { kind: "loading" } | { kind: "error" } | { kind: "ready"; suppliers: Supplier[]; materials: Material[]; branch: string };
type Prices = { kind: "loading" } | { kind: "error" } | { kind: "ready"; supplier: string; items: Agreement[] };


export function useGoodsReceipt() {
  const { can } = useAccess();
  const allowed = can("inventory:goods_receipt:create") && can("inventory:supplier:read");
  const [setup, setSetup] = useState<Setup>({ kind: "loading" });
  const [prices, setPrices] = useState<Prices>({ kind: "loading" });
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(receiptToday);
  const [lines, setLines] = useState<ReceiptLine[]>([{ key: "first", sku: "", quantity: 1 }]);
  const [revision, setRevision] = useState(0);
  const [priceRevision, setPriceRevision] = useState(0);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reconfirm, setReconfirm] = useState(false);
  const command = useRef({ body: "", key: "" });
  const inFlight = useRef(false);
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    Promise.all([getActiveSuppliers(), getContractMaterials(), getReceiptBranch()]).then(([suppliers, materials, branch]) => { if (live) setSetup({ kind: "ready", suppliers, materials, branch }); }).catch(() => { if (live) setSetup({ kind: "error" }); });
    return () => { live = false; };
  }, [allowed, revision]);
  const storageKey = setup.kind === "ready" ? `inventory:receipt-draft:${setup.branch}` : "";
  useEffect(() => {
    if (!storageKey || restored) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? receiptDraftSchema.safeParse(JSON.parse(raw)) : null;
      if (parsed?.success) { setSupplier(parsed.data.supplier); setDate(parsed.data.date); setLines(parsed.data.lines.map(line => ({ ...line, key: crypto.randomUUID() }))); }
    } catch { /* Storage không quyết định quyền hoặc giá. */ }
    setRestored(true);
  }, [storageKey, restored]);
  useEffect(() => {
    if (!storageKey || !restored || success) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ supplier, date, lines: lines.map(({ sku, quantity }) => ({ sku, quantity })) })); } catch { /* Bản nháp trong RAM vẫn dùng được. */ }
  }, [storageKey, restored, supplier, date, lines, success]);
  useEffect(() => {
    if (!supplier || !allowed) return;
    let live = true;
    setPrices({ kind: "loading" });
    getAllAgreements(supplier).then(items => { if (live) setPrices({ kind: "ready", supplier, items }); }).catch(() => { if (live) setPrices({ kind: "error" }); });
    return () => { live = false; };
  }, [supplier, allowed, priceRevision]);
  const materials = setup.kind === "ready" ? setup.materials.filter(material => material.selectable) : [];
  const suppliers = setup.kind === "ready" ? setup.suppliers : [];
  const covered = lines.map(line => {
    const material = materials.find(item => item.id === line.sku);
    const scope = `${supplier}:${line.sku}:${material?.uom_code}:${date}`;
    try {
      const reference = material && prices.kind === "ready" && prices.supplier === supplier ? resolveReceiptReferencePrice(prices.items, { sku: material.id, uom: material.uom_code, date }) : { found: false as const };
      const price = reference.found ? reference.price : null;
      const unitPrice = line.priceScope === scope ? line.unitPrice : price?.unit_price_vnd;
      return { line, material, price, unitPrice, scope, ambiguous: false };
    } catch { return { line, material, price: null, unitPrice: line.priceScope === scope ? line.unitPrice : undefined, scope, ambiguous: true }; }
  });
  const rows = covered.map(({ line, material, price, unitPrice }) => ({ ...line, uom: material?.uom_code, unitPrice, referencePrice: price?.unit_price_vnd, amount: lineAmount(line.quantity, unitPrice) }));
  const priceError = covered.some(row => row.ambiguous) ? "Có nhiều bảng giá cùng hiệu lực. Tải lại để kiểm tra." : "";
  const valid = rows.length <= 100 && receiptTotal(rows.map(row => row.amount)) !== null && allowed && setup.kind === "ready" && suppliers.some(item => item.id === supplier && item.status === "ACTIVE") && Boolean(parseReceiptDate(formatReceiptDate(date))) && covered.length > 0 && prices.kind === "ready" && prices.supplier === supplier && !priceError && covered.every(({ line, material, price }) => material && (!price || price.price_line_ref) && validQuantity(line.quantity)) && !reconfirm;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || inFlight.current || busy || setup.kind !== "ready") return;
    const expected = covered.flatMap(({ line, material, price, unitPrice }) => material && unitPrice !== undefined ? [{ sku_ref: material.id, uom: material.uom_code, expected_quantity: line.quantity, unit_cost_vnd: unitPrice, ...(price ? { agreement_version_ref: price.agreement_version_ref, price_line_ref: price.price_line_ref } : {}) }] : []);
    const input = { branch_ref: setup.branch, supplier_ref: supplier, expected_at: `${date}T12:00:00+07:00`, expected_lines: expected };
    const encoded = JSON.stringify(input);
    if (command.current.body !== encoded) command.current = { body: encoded, key: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true); setError("");
    try {
      const receipt = await createGoodsReceipt(input, command.current.key);
      setSuccess(`Đã tạo phiếu nhập ở trạng thái ${receipt.status === "DRAFT" ? "Nháp" : receipt.status}${receipt.total_amount_vnd === undefined ? "" : `, tổng ${receipt.total_amount_vnd.toLocaleString("vi-VN")} VND`}.`);
      try { sessionStorage.removeItem(storageKey); } catch { /* Không ảnh hưởng phiếu đã tạo. */ }
    } catch (cause) {
      if (cause instanceof FetchError && cause.status === 409) { setReconfirm(true); setPriceRevision(value => value + 1); setError("Điều kiện hoặc giá hợp đồng đã thay đổi. Kiểm tra lại bảng giá trước khi tạo lại."); }
      else setError(cause instanceof Error ? cause.message : "Không tạo được phiếu nhập");
    } finally { inFlight.current = false; setBusy(false); }
  }
  return {
    allowed, setupKind: setup.kind, suppliers, materials, supplier, date, rows, busy, error: error || priceError, success, reconfirm, valid,
    pricesKind: prices.kind, canUpdate: can("inventory:supplier:update"),
    onSupplier: (id: string | null) => { setSupplier(id ?? ""); setLines(items => items.map(({ key, sku, quantity }) => ({ key, sku, quantity }))); setReconfirm(false); setPrices({ kind: "loading" }); },
    onDate: (value: string) => { setDate(value); setLines(items => items.map(({ key, sku, quantity }) => ({ key, sku, quantity }))); setReconfirm(false); },
    onSku: (key: string, sku: string) => { setLines(items => items.map(item => item.key === key ? { key: item.key, quantity: item.quantity, sku } : item)); setReconfirm(false); },
    onPrice: (key: string, unitPrice: number | undefined) => setLines(items => items.map(item => item.key === key ? { ...item, unitPrice, priceScope: covered.find(row => row.line.key === key)?.scope } : item)),
    onQuantity: (key: string, quantity: number) => setLines(items => items.map(item => item.key === key ? { ...item, quantity } : item)),
    onAdd: () => setLines(items => items.length >= 100 ? items : [...items, { key: crypto.randomUUID(), sku: "", quantity: 1 }]),
    onRemove: (key: string) => setLines(items => items.length <= 1 ? items : items.filter(item => item.key !== key)),
    onRetry: () => { setSetup({ kind: "loading" }); setRevision(value => value + 1); },
    onPriceRetry: () => setPriceRevision(value => value + 1),
    onReconfirm: () => setReconfirm(false), onSubmit: submit,
  };
}
