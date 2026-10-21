"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Plus, Trash2, XCircle } from "lucide-react";
import { EmptyState, Skeleton } from "@/components/ui/state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { approveTarget, createTarget, getProductionContext, ProductionTarget } from "@/lib/api/production";
import { Input } from "@/components/ui/input";
import { EntityPicker } from "@/components/ui/entity-picker";
import { getDraftProducts, createDraftProduct, type DraftProduct, type DataResult } from "@/lib/api/sales";

type TargetLine = { product_ref: string; target_quantity: string; uom: string };

const dateInput = (date: Date) => date.toISOString().slice(0, 10);
const messageOf = (error: unknown) => error instanceof Error ? error.message : "Lỗi không xác định";

export function TargetsView({ initialTargets, initialShowCreate = false }: { initialTargets: ProductionTarget[]; initialShowCreate?: boolean }) {
  const { toast } = useToast();
  const [targets, setTargets] = useState(initialTargets);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [branchRef, setBranchRef] = useState("");
  const [showCreate, setShowCreate] = useState(initialShowCreate);
  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState(dateInput(new Date()));
  const [periodEnd, setPeriodEnd] = useState(dateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const [lines, setLines] = useState<TargetLine[]>([{ product_ref: "", target_quantity: "4", uom: "EA" }]);
  const [loading, setLoading] = useState(false);
  const [branchName, setBranchName] = useState("Chi nhánh hiện tại");
  const [products, setProducts] = useState<DataResult<DraftProduct[]> | null>(null);

  useEffect(() => {
    getProductionContext()
      .then((context) => {
        setPermissions(context.permissions ?? []);
        setBranchRef(context.active_context?.branch_id ?? "");
        setBranchName(context.active_context?.branch_name ?? "Chi nhánh hiện tại");
      })
      .catch(() => setPermissions([]));
  }, []);

  const reloadProducts = async () => {
    setProducts(null);
    try { setProducts({ data: await getDraftProducts(), source: "api" }); }
    catch (e) { setProducts({ data: [], source: "unavailable", error: messageOf(e) }); }
  };

  useEffect(() => {
    void getDraftProducts().then(data => setProducts({ data, source: "api" })).catch(e => setProducts({ data: [], source: "unavailable", error: messageOf(e) }));
  }, []);

  const [productName, setProductName] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [productError, setProductError] = useState("");
  const availableProducts = products?.data;
  const addProduct = async () => {
    setLoading(true); setProductError("");
    try {
      const product = await createDraftProduct({ name: productName.trim(), slug: productSlug.trim() });
      setProducts(current => ({ data: [...(current?.data ?? []), product], source: "api" }));
      setLines(current => current.map((line, index) => index === 0 ? { ...line, product_ref: product.id } : line));
      setProductName(""); setProductSlug("");
    } catch (e) { setProductError(messageOf(e)); }
    finally { setLoading(false); }
  };

  const canCreate = permissions.includes("production:target:create");
  const canApprove = permissions.includes("production:target_approval:create");
  const primaryTargetId = !canCreate && !showCreate ? targets.find((target) => (target.status === "DRAFT" && canApprove) || target.status === "APPROVED" || target.status === "IN_PLANNING")?.id : undefined;
  const validLines = lines.every((line) => line.product_ref.trim() && /^\d+$/.test(line.target_quantity) && BigInt(line.target_quantity) > 0n && line.uom.trim());
  const updateLine = (index: number, patch: Partial<TargetLine>) => setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate || !branchRef || !validLines) return;
    setLoading(true);
    try {
      const created = await createTarget({
        title: title.trim(), branch_ref: branchRef,
        period_start: new Date(`${periodStart}T00:00:00`).toISOString(),
        period_end: new Date(`${periodEnd}T23:59:59`).toISOString(), lines,
      });
      setTargets((current) => [created, ...current]);
      setShowCreate(false);
      setTitle("");
      setLines([{ product_ref: "", target_quantity: "4", uom: "EA" }]);
      toast({ title: "Đã tạo chỉ tiêu APPROVED", description: `Mã ${created.target_code}`, variant: "success" });
    } catch (error) {
      toast({ title: "Lỗi tạo chỉ tiêu", description: messageOf(error), variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, decision: "APPROVE" | "REJECT") => {
    try {
      const updated = await approveTarget(id, decision);
      setTargets((current) => current.map((target) => target.id === id ? updated : target));
      toast({ title: decision === "APPROVE" ? "Đã duyệt chỉ tiêu" : "Đã từ chối chỉ tiêu", description: `${updated.target_code}: ${updated.status}`, variant: "success" });
    } catch (error) {
      toast({ title: "Lỗi duyệt chỉ tiêu", description: messageOf(error), variant: "error" });
    }
  };

  return <PageShell className="bg-[var(--color-bg)] text-[var(--color-ink)]">
    <PageHeader title="Chỉ tiêu sản xuất" description="Tạo chỉ tiêu đã duyệt cho set chuẩn bị nguyên liệu theo chi nhánh."
      actions={canCreate ? <Button variant={showCreate ? "outline" : "default"} onClick={() => setShowCreate((value) => !value)}><Plus className="mr-2 h-4 w-4" />Tạo chỉ tiêu</Button> : undefined} />

    {canCreate && showCreate && <Card className="mb-6 border-[var(--color-line)] bg-[var(--color-surface)]"><CardContent className="pt-6"><form onSubmit={handleCreate} className="space-y-4">
      {permissions.includes("sales:product:create") && <fieldset className="space-y-2 rounded-xl border border-line p-4"><legend>Tạo sản phẩm nháp</legend>
        <Field label="Tên sản phẩm" value={productName} onChange={setProductName} />
        <Field label="Slug sản phẩm" value={productSlug} onChange={setProductSlug} />
        {productError && <p role="alert">{productError}</p>}
        <Button type="button" variant="outline" disabled={loading || !productName.trim() || !productSlug.trim()} onClick={() => void addProduct()}>Tạo product DRAFT</Button>
      </fieldset>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tiêu đề" value={title} onChange={setTitle} required />
        <div className="block text-sm">
          <span className="mb-1 block text-[var(--color-muted)]">Chi nhánh</span>
          <p className="flex h-11 items-center px-1 text-sm font-medium text-[var(--color-ink)]">
            {branchName || "Chi nhánh hiện tại"}
          </p>
        </div>
        <Field label="Từ ngày" value={periodStart} onChange={setPeriodStart} type="date" required />
        <Field label="Đến ngày" value={periodEnd} onChange={setPeriodEnd} type="date" required />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><p className="text-sm font-medium">Sản phẩm và tổng suất chỉ tiêu</p><Button type="button" size="sm" variant="outline" onClick={() => setLines((current) => [...current, { product_ref: "", target_quantity: "4", uom: "EA" }])}>Thêm sản phẩm</Button></div>
        {lines.map((line, index) => <div className="grid gap-2 md:grid-cols-[1fr_160px_120px_40px]" key={index}>
          <EntityPicker
              label="Sản phẩm"
              name="product_ref"
              required
              value={line.product_ref || null}
              onChange={(id) => updateLine(index, { product_ref: id ?? "" })}
              items={availableProducts}
              status={!products ? "loading" : products.source === "api" ? "ready" : "error"}
              getId={(p) => p.id}
              getLabel={(p) => p.name}
              getMeta={(p) => p.status}
              onRetry={reloadProducts}
              emptyText="Chưa có sản phẩm nào."
              placeholder="Tìm theo tên hoặc SKU"
            />
          <Field label="Tổng suất chỉ tiêu" value={String(line.target_quantity)} onChange={(value) => updateLine(index, { target_quantity: value })} type="number" required />
          <Field label="Đơn vị" value={line.uom} onChange={(value) => updateLine(index, { uom: value })} required />
          <Button aria-label="Xóa dòng" className="mt-6" type="button" size="icon" variant="ghost" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
        </div>)}
      </div>
      <div className="flex gap-2"><Button type="submit" disabled={loading || !branchRef || !validLines || !title.trim() || periodEnd < periodStart}>Lưu chỉ tiêu</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button></div>
    </form></CardContent></Card>}

    <Card className="border-[var(--color-line)] bg-[var(--color-surface)]"><CardContent aria-busy={loading} className="p-0"><Table><TableHeader><TableRow><TableHead>Mã</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Chi nhánh</TableHead><TableHead>Kỳ</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
      {loading && targets.length === 0 ? <TableRow><TableCell colSpan={6}><Skeleton title="Đang tải chỉ tiêu sản xuất…" /></TableCell></TableRow> : targets.length === 0 ? <TableRow><TableCell colSpan={6}><EmptyState title="Chưa có chỉ tiêu sản xuất" description="Chỉ tiêu xác định sản phẩm và tổng suất cần chuẩn bị cho chi nhánh." action={canCreate ? <Button onClick={() => setShowCreate(true)}>Tạo chỉ tiêu</Button> : undefined} /></TableCell></TableRow> : targets.map((target) => <TableRow key={target.id}>
        <TableCell className="font-mono font-medium">{target.target_code}</TableCell><TableCell>{target.title}</TableCell><TableCell className="font-mono text-xs">{target.branch_ref}</TableCell>
        <TableCell>{new Date(target.period_start).toLocaleDateString("vi-VN")} – {new Date(target.period_end).toLocaleDateString("vi-VN")}</TableCell>
        <TableCell><Badge variant={target.status === "APPROVED" ? "active" : target.status === "REJECTED" ? "revoked" : "outline"}>{target.status}</Badge></TableCell>
        <TableCell className="text-right"><div className="flex justify-end gap-2">
          {target.status === "DRAFT" && canApprove && <><Button size="sm" variant={target.id === primaryTargetId ? "default" : "outline"} onClick={() => handleApprove(target.id, "APPROVE")}><CheckCircle2 className={target.id === primaryTargetId ? "mr-1 h-4 w-4 text-[var(--color-primary-ink)]" : "mr-1 h-4 w-4 text-[var(--color-leaf)]"} />Duyệt</Button><Button size="sm" variant="outline" onClick={() => handleApprove(target.id, "REJECT")}><XCircle className="mr-1 h-4 w-4 text-[var(--color-danger)]" />Từ chối</Button></>}
          {(target.status === "APPROVED" || target.status === "IN_PLANNING") && canCreate && <Link className={buttonVariants({ size: "sm", variant: target.id === primaryTargetId ? "default" : "outline" })} href={`/production/food-plans?target_id=${encodeURIComponent(target.id)}`}>Tạo set</Link>}
        </div></TableCell>
      </TableRow>)}
    </TableBody></Table></CardContent></Card>
  </PageShell>;
}

function Field({ label, value, onChange, type = "text", required = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean }) {
  return <label className="block text-sm"><span className="mb-1 block text-[var(--color-muted)]">{label}</span><Input style={{ borderWidth: 1.5 }} className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-surface)] p-2 text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:bg-[var(--color-tint)]" type={type} value={value} required={required} disabled={disabled} min={type === "number" ? 1 : undefined} step={type === "number" ? "1" : undefined} onChange={(event) => onChange(event.target.value)} /></label>;
}
