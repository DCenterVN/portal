"use client";

import type { Route } from "next";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { useAccess } from "@/lib/access-boundary";
import { getActiveSuppliers, getSupplier, type Supplier } from "@/lib/api/suppliers";
import { loadContractMaterials } from "./use-contract-materials";
import { getAllAgreements, resolveReceiptReferencePrice, type Agreement, type ResolvedAgreementPrice } from "@/lib/api/supplier-agreements";
import { createGoodsReceipt, receiptDraftSchema } from "@/lib/api/goods-receipts";
import { type Material } from "@/lib/api/sales";
import { getMaterialCategories } from "@/lib/api/material-categories";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { FetchError } from "@/lib/fetcher";
import { receiptToday, parseReceiptDate, formatReceiptDate } from "./receipt-date-input";
import { lineAmount, receiptTotal, validQuantity, type ReceiptLine } from "./receipt-lines";

type Setup = { kind: "loading" } | { kind: "error" } | { kind: "ready"; materials: Material[]; branch: string };
type Prices = { kind: "loading" } | { kind: "error" } | { kind: "ready"; supplier: string; items: Agreement[] };


export function useGoodsReceipt() {
  const { can, scope } = useAccess();
  const allowed = can("inventory:goods_receipt:create") && can("inventory:supplier:read");
  const [setup, setSetup] = useState<Setup>({ kind: "loading" });
  const [prices, setPrices] = useState<Prices>({ kind: "loading" });
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(receiptToday);
  const [lines, setLines] = useState<ReceiptLine[]>([{ key: "first", sku: "", quantity: 1 }]);
  const [revision, setRevision] = useState(0);
  const [priceRevision, setPriceRevision] = useState(0);
  const [restored, setRestored] = useState(false);
  const [supplierList, setSupplierList] = useState<Supplier[] | null>(null);
  const [unpricedIds, setUnpricedIds] = useState<ReadonlySet<string>>(new Set());
  const [supplierFailed, setSupplierFailed] = useState(false);
  const [chosen, setChosen] = useState<Supplier | null>(null);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receiveHref, setReceiveHref] = useState("");
  const router = useRouter();
  const [success, setSuccess] = useState("");
  const [reconfirm, setReconfirm] = useState(false);
  const command = useRef({ body: "", key: "" });
  const inFlight = useRef(false);
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    const branch = scope?.branchId;
    if (!branch) { setSetup({ kind: "error" }); return; }
    loadContractMaterials().then(materials => { if (live) setSetup({ kind: "ready", materials, branch }); }).catch(() => { if (live) setSetup({ kind: "error" }); });
    return () => { live = false; };
  }, [allowed, revision, scope?.branchId]);
  useEffect(() => {
    if (!allowed || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    let live = true;
    setSupplierFailed(false);
    Promise.all([getActiveSuppliers(), getActiveSuppliers(date)]).then(([all, priced]) => {
      if (!live) return;
      setSupplierList(all);
      setUnpricedIds(new Set(all.filter(item => !priced.some(other => other.id === item.id)).map(item => item.id)));
    }).catch(() => { if (live) setSupplierFailed(true); });
    return () => { live = false; };
  }, [allowed, date, revision]);
  useEffect(() => {
    if (!supplier || !allowed || chosen?.id === supplier) return;
    let live = true;
    getSupplier(supplier).then(item => { if (live) setChosen(item); }).catch(() => undefined);
    return () => { live = false; };
  }, [supplier, allowed, chosen?.id]);
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    getMaterialCategories().then(items => { if (live) setCategories(items); }).catch(() => undefined);
    return () => { live = false; };
  }, [allowed]);
  const storageKey = setup.kind === "ready" ? `inventory:receipt-draft:${setup.branch}` : "";
  useEffect(() => {
    if (!storageKey || restored) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? receiptDraftSchema.safeParse(JSON.parse(raw)) : null;
      if (parsed?.success) { setSupplier(parsed.data.supplier); setDate(parsed.data.date); setLines(parsed.data.lines.map(line => ({ ...line, key: crypto.randomUUID() }))); }
    } catch { /* Storage không quyết định quyền hoặc giá. */ }
    const fromAddress = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("supplier");
    if (fromAddress && setup.kind === "ready") {
      setSupplier(fromAddress); setLines(items => items.map(({ key, sku, quantity }) => ({ key, sku, quantity }))); setPrices({ kind: "loading" });
    }
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
  const suppliers = supplierList ?? [];
  const priceReady = prices.kind === "ready" && prices.supplier === supplier;
  const priceOf = (material: Material): "none" | "ambiguous" | ResolvedAgreementPrice => {
    if (!priceReady) return "none";
    try { const found = resolveReceiptReferencePrice(prices.items, { sku: material.id, uom: material.uom_code, date }); return found.found ? found.price : "none"; } catch { return "ambiguous"; }
  };
  const allMaterials = setup.kind === "ready" ? setup.materials.filter(material => material.selectable) : [];
  const resolved = allMaterials.map(material => ({ material, price: priceOf(material) })).filter(item => item.price !== "none");
  const priceTable = resolved.flatMap(({ material, price }) => typeof price === "string" ? [] : [{ material, unitPrice: price.unit_price_vnd, validTo: price.valid_to }]);
  const materials = resolved.map(item => item.material);
  const setupKind: "loading" | "error" | "ready" = setup.kind === "error" || supplierFailed ? "error" : setup.kind === "ready" && supplierList ? "ready" : "loading";
  const selectedSupplier = suppliers.find(item => item.id === supplier) ?? (chosen?.id === supplier ? chosen : undefined);
  const pricedCount = supplier && priceReady ? materials.length : null;
  const referenceOf = (sku: string, uom: string): number | undefined => {
    if (!priceReady) return undefined;
    try { const found = resolveReceiptReferencePrice(prices.items, { sku, uom, date }); return found.found ? found.price.unit_price_vnd : undefined; } catch { return undefined; }
  };
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
      const href = `/inventory/goods-receipts/${encodeURIComponent(receipt.id)}/receive?supplier=${encodeURIComponent(supplier)}`;
      const status = receipt.status === "DRAFT" ? "Nháp" : receipt.status;
      const total = receipt.total_amount_vnd === undefined ? "" : ` · tổng ${receipt.total_amount_vnd.toLocaleString("vi-VN")} đ`;
      setReceiveHref(href);
      setSuccess(`Đã tạo phiếu nhập ở trạng thái ${status}${receipt.total_amount_vnd === undefined ? "" : `, tổng ${receipt.total_amount_vnd.toLocaleString("vi-VN")} VND`}.`);
      toast.success("Đã tạo phiếu nhập", { description: `${status}${total}`, ...(can("inventory:goods_receipt:update") ? { action: { label: "Nhận hàng", onClick: () => router.push(href as Route) } } : {}) });
      try { sessionStorage.removeItem(storageKey); } catch { /* Không ảnh hưởng phiếu đã tạo. */ }
    } catch (cause) {
      if (cause instanceof FetchError && cause.status === 409) { setReconfirm(true); setPriceRevision(value => value + 1); const message = "Điều kiện hoặc giá hợp đồng đã thay đổi. Kiểm tra lại bảng giá trước khi tạo lại."; setError(message); toast.error(message); }
      else { const message = cause instanceof Error ? cause.message : "Không tạo được phiếu nhập"; setError(message); toast.error(message); }
    } finally { inFlight.current = false; setBusy(false); }
  }
  return {
    allowed, setupKind, suppliers, unpricedIds, selectedSupplier, priceTable, categories, pricedCount, referenceOf, materials, supplier, date, rows, busy, error: error || priceError, success, receiveHref, canReceive: can("inventory:goods_receipt:update"), reconfirm, valid,
    pricesKind: prices.kind, canUpdate: can("inventory:supplier:update"),
    onSupplier: (id: string | null) => { setSupplier(id ?? ""); setLines(items => items.map(({ key, sku, quantity }) => ({ key, sku, quantity }))); setReconfirm(false); setPrices({ kind: "loading" }); },
    onDate: (value: string) => { setDate(value); setLines(items => items.map(({ key, sku, quantity }) => ({ key, sku, quantity }))); setReconfirm(false); },
    onSku: (key: string, sku: string) => { setLines(items => items.map(item => item.key === key ? { key: item.key, quantity: item.quantity, sku } : item)); setReconfirm(false); },
    onPrice: (key: string, unitPrice: number | undefined) => setLines(items => items.map(item => item.key === key ? { ...item, unitPrice, priceScope: covered.find(row => row.line.key === key)?.scope } : item)),
    onQuantity: (key: string, quantity: number) => setLines(items => items.map(item => item.key === key ? { ...item, quantity } : item)),
    onAdd: () => setLines(items => items.length >= 100 ? items : [...items, { key: crypto.randomUUID(), sku: "", quantity: 1 }]),
    onAddMaterial: (sku: string) => setLines(items => {
      if (items.some(item => item.sku === sku)) return items;
      const empty = items.find(item => !item.sku);
      if (empty) return items.map(item => item === empty ? { key: item.key, quantity: item.quantity, sku } : item);
      return items.length >= 100 ? items : [...items, { key: crypto.randomUUID(), sku, quantity: 1 }];
    }),
    onRemove: (key: string) => setLines(items => items.length <= 1 ? items : items.filter(item => item.key !== key)),
    onRetry: () => { setSetup({ kind: "loading" }); setSupplierList(null); setRevision(value => value + 1); },
    onPriceRetry: () => setPriceRevision(value => value + 1),
    onReconfirm: () => setReconfirm(false), onSubmit: submit,
  };
}
