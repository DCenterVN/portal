"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { EntityPicker } from "@/components/ui/entity-picker";
import { PageShell, PageHeader } from "@/components/ui/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { useAccess } from "@/lib/access-boundary";
import { getActiveSuppliers, type Supplier } from "@/lib/api/suppliers";
import { getContractMaterials, getAllAgreements, resolveAgreementPrice, type Agreement } from "@/lib/api/supplier-agreements";
import { getReceiptBranch, createGoodsReceipt, receiptDraftSchema } from "@/lib/api/goods-receipts";
import { type Material } from "@/lib/api/sales";
import { FetchError } from "@/lib/fetcher";

type Setup = { kind: "loading" } | { kind: "error" } | { kind: "ready"; suppliers: Supplier[]; materials: Material[]; branch: string };
type Prices = { kind: "loading" } | { kind: "error" } | { kind: "ready"; supplier: string; items: Agreement[] };
type Line = { key: string; sku: string; quantity: number };

export function GoodsReceiptForm() {
  const { can } = useAccess();
  const allowed = can("inventory:goods_receipt:create") && can("inventory:supplier:read");
  const [setup, setSetup] = useState<Setup>({ kind: "loading" });
  const [prices, setPrices] = useState<Prices>({ kind: "loading" });
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(() => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()));
  const [lines, setLines] = useState<Line[]>([{ key: "first", sku: "", quantity: 1 }]);
  const [revision, setRevision] = useState(0);
  const [priceRevision, setPriceRevision] = useState(0);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reconfirm, setReconfirm] = useState(false);
  const command = useRef({ body: "", key: "" });
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
    const price = material && prices.kind === "ready" && prices.supplier === supplier ? resolveAgreementPrice(prices.items, { sku: material.id, uom: material.uom_code, date }) : null;
    return { line, material, price };
  });
  const valid = allowed && setup.kind === "ready" && suppliers.some(item => item.id === supplier && item.status === "ACTIVE") && /^\d{4}-\d{2}-\d{2}$/.test(date) && covered.length > 0 && covered.every(({ line, material, price }) => material && price?.price_line_ref && Number.isFinite(line.quantity) && line.quantity > 0) && !reconfirm;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || busy || setup.kind !== "ready") return;
    const expected = covered.flatMap(({ line, material, price }) => material && price?.price_line_ref ? [{ sku_ref: material.id, uom: material.uom_code, expected_quantity: line.quantity, agreement_version_ref: price.agreement_version_ref, price_line_ref: price.price_line_ref }] : []);
    const input = { branch_ref: setup.branch, supplier_ref: supplier, expected_at: `${date}T12:00:00+07:00`, expected_lines: expected };
    const encoded = JSON.stringify(input);
    if (command.current.body !== encoded) command.current = { body: encoded, key: crypto.randomUUID() };
    setBusy(true); setError("");
    try {
      const receipt = await createGoodsReceipt(input, command.current.key);
      setSuccess(`Đã tạo phiếu nhập ở trạng thái ${receipt.status === "DRAFT" ? "Nháp" : receipt.status}${receipt.total_amount_vnd === undefined ? "" : `, tổng ${receipt.total_amount_vnd.toLocaleString("vi-VN")} VND`}.`);
      try { sessionStorage.removeItem(storageKey); } catch { /* Không ảnh hưởng phiếu đã tạo. */ }
    } catch (cause) {
      if (cause instanceof FetchError && cause.status === 409) { setReconfirm(true); setPriceRevision(value => value + 1); setError("Điều kiện hoặc giá hợp đồng đã thay đổi. Kiểm tra lại bảng giá trước khi tạo lại."); }
      else setError(cause instanceof Error ? cause.message : "Không tạo được phiếu nhập");
    } finally { setBusy(false); }
  }
  if (!allowed) return <ErrorState denied title="Bạn cần quyền tạo phiếu và đọc nhà cung cấp" />;
  return <PageShell><PageHeader title="Tạo phiếu nhập" description="Chọn nhà cung cấp, nguyên liệu và ngày dự kiến. Giá do hợp đồng đang áp dụng quyết định." />
    {setup.kind === "loading" && <Skeleton title="Đang tải nhà cung cấp, nguyên liệu và chi nhánh" />}
    {setup.kind === "error" && <ErrorState title="Không tải được dữ liệu tạo phiếu" onRetry={() => { setSetup({ kind: "loading" }); setRevision(value => value + 1); }} />}
    {setup.kind === "ready" && suppliers.length === 0 && <EmptyState title="Chưa có nhà cung cấp đang hợp tác" action={<Link href="/inventory/suppliers">Mở nhà cung cấp</Link>} />}
    {success ? <p role="status" className="my-6">{success}</p> : <form onSubmit={submit} className="mt-6 grid gap-4">
      <EntityPicker label="Nhà cung cấp" name="receipt-supplier" serializeValue={false} items={suppliers} status={setup.kind === "ready" ? "ready" : setup.kind} getId={item => item.id} getLabel={item => item.name} getMeta={item => item.code} value={supplier} onChange={id => { setSupplier(id ?? ""); setReconfirm(false); setPrices({ kind: "loading" }); }} required />
      <Field label="Ngày dự kiến nhập" htmlFor="receipt-date" hint="Ngày Việt Nam; hợp đồng và mọi dòng giá phải phủ ngày này."><TextInput id="receipt-date" type="date" value={date} onChange={event => { setDate(event.target.value); setReconfirm(false); }} required disabled={busy} /></Field>
      {covered.map(({ line, material, price }, index) => <fieldset key={line.key} disabled={busy} className="grid gap-3 rounded-lg border border-line p-4"><legend>Dòng nhập {index + 1}</legend>
        <EntityPicker label="Nguyên liệu" name={`receipt-material-${index}`} serializeValue={false} items={materials} status={setup.kind === "ready" ? "ready" : setup.kind} getId={item => item.id} getLabel={item => item.name} getMeta={item => `${item.sku_code} · ${item.uom_code}`} value={line.sku} onChange={id => { setLines(items => items.map(item => item.key === line.key ? { ...item, sku: id ?? "" } : item)); setReconfirm(false); }} required />
        <p>Đơn vị: {material?.uom_code || "Chọn nguyên liệu"}</p>
        <Field label="Số lượng dự kiến" htmlFor={`receipt-qty-${index}`}><TextInput id={`receipt-qty-${index}`} type="number" step="0.001" min="0.001" required value={line.quantity} onChange={event => setLines(items => items.map(item => item.key === line.key ? { ...item, quantity: Number(event.target.value) } : item))} /></Field>
        <p>Giá hợp đồng: <output aria-label={`Giá hợp đồng dòng ${index + 1}`} className="tabular-nums">{price ? `${price.unit_price_vnd.toLocaleString("vi-VN")} VND / ${material?.uom_code}` : "Chưa có giá hợp lệ"}</output></p>
        {supplier && line.sku && !price && <p role="alert">Chưa có hợp đồng đã áp dụng phủ nguyên liệu, đơn vị và ngày dự kiến.</p>}
        <Button type="button" variant="outline" disabled={lines.length === 1} onClick={() => setLines(items => items.filter(item => item.key !== line.key))}>Bỏ dòng nhập {index + 1}</Button>
      </fieldset>)}
      <Button type="button" variant="outline" disabled={busy} onClick={() => setLines(items => [...items, { key: crypto.randomUUID(), sku: "", quantity: 1 }])}>Thêm dòng nhập</Button>
      {supplier && can("inventory:supplier:update") && <Link href={`/inventory/suppliers/${encodeURIComponent(supplier)}?tab=agreements`}>Mở bảng giá nhà cung cấp đã chọn</Link>}
      {prices.kind === "error" && <ErrorState title="Không tải được bảng giá hợp đồng" onRetry={() => setPriceRevision(value => value + 1)} />}
      {error && <p role="alert">{error}</p>}
      {reconfirm && prices.kind === "ready" && <Button type="button" variant="outline" onClick={() => setReconfirm(false)}>Tôi đã kiểm tra lại bảng giá</Button>}
      {!valid && <p>Chọn nhà cung cấp, nguyên liệu, số lượng và hợp đồng hợp lệ cho mọi dòng để tạo phiếu.</p>}
      <Button type="submit" disabled={!valid || busy}>{busy ? "Đang tạo phiếu…" : "Tạo phiếu nhập"}</Button>
    </form>}
  </PageShell>;
}
