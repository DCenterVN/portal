"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { StatusBadge } from "@/components/patterns/status-badge";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductionTarget } from "@/lib/api/production";
import { Input } from "@/components/ui/input";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { useTargets } from "./use-targets";

export function TargetsView({ initialTargets, initialShowCreate = false }: { initialTargets?: ProductionTarget[]; initialShowCreate?: boolean }) {
  const { targets, listLoading, listError, can, branchName, branchRef, showCreate, setShowCreate, title, setTitle, periodStart, setPeriodStart, periodEnd, setPeriodEnd, lines, setLines, loading, products, productName, setProductName, productSlug, productError, availableProducts, addProduct, reloadProducts, canCreate, canApprove, primaryTargetId, validLines, updateLine, handleCreate, handleApprove } = useTargets(initialTargets, initialShowCreate);
  return <PageShell>
    <PageHeading title="Chỉ tiêu sản xuất" description="Tạo chỉ tiêu đã duyệt cho set chuẩn bị nguyên liệu theo chi nhánh."
      actions={canCreate ? <Button variant={showCreate ? "outline" : "default"} onClick={() => setShowCreate((value) => !value)}>Tạo chỉ tiêu</Button> : undefined} />

    {canCreate && showCreate && <Card className="mb-6"><CardContent className="pt-6"><form onSubmit={handleCreate} className="space-y-4">
      {can("sales:product:create") && <fieldset className="space-y-2 rounded-lg border border-border p-4"><legend>Tạo sản phẩm nháp</legend>
        <Field label="Tên sản phẩm" value={productName} onChange={setProductName} />
        <label>Slug sản phẩm<output aria-label="Slug sản phẩm" className="block">{productSlug || "Tự tạo từ tên sản phẩm"}</output></label>
        {productError && <InlineAlert>{productError}</InlineAlert>}
        <Button type="button" variant="outline" disabled={loading || !productName.trim() || !productSlug.trim()} onClick={() => void addProduct()}>Tạo product DRAFT</Button>
      </fieldset>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tiêu đề" value={title} onChange={setTitle} required />
        <div className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Chi nhánh</span>
          <p className="flex h-9 items-center px-1 text-sm font-medium">
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
          <label>Đơn vị<output aria-label="Đơn vị" className="block">suất</output></label>
          <Button aria-label="Xóa dòng" className="mt-6" type="button" size="icon" variant="ghost" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
        </div>)}
      </div>
      <div className="flex gap-2"><Button type="submit" disabled={loading || !branchRef || !validLines || !title.trim() || periodEnd < periodStart}>Lưu chỉ tiêu</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button></div>
    </form></CardContent></Card>}

    {listError && <InlineAlert className="mb-4">{listError}</InlineAlert>}
    <Card><CardContent aria-busy={loading} className="p-0"><Table><TableHeader><TableRow><TableHead>Mã</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Kỳ</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
      {(loading || listLoading) && targets.length === 0 ? <TableRow><TableCell colSpan={5}><LoadingState title="Đang tải chỉ tiêu sản xuất…" /></TableCell></TableRow> : targets.length === 0 ? <TableRow><TableCell colSpan={5}><EmptyState title="Chưa có chỉ tiêu sản xuất" description="Chỉ tiêu xác định sản phẩm và tổng suất cần chuẩn bị cho chi nhánh." action={canCreate ? <Button onClick={() => setShowCreate(true)}>Tạo chỉ tiêu</Button> : undefined} /></TableCell></TableRow> : targets.map((target) => <TableRow key={target.id}>
        <TableCell className="font-mono font-medium">{target.target_code}</TableCell><TableCell>{target.title}</TableCell>
        <TableCell>{new Date(target.period_start).toLocaleDateString("vi-VN")} – {new Date(target.period_end).toLocaleDateString("vi-VN")}</TableCell>
        <TableCell><StatusBadge tone={target.status === "APPROVED" ? "success" : target.status === "REJECTED" ? "danger" : "neutral"}>{target.status}</StatusBadge></TableCell>
        <TableCell className="text-right"><div className="flex justify-end gap-2">
          {target.status === "DRAFT" && canApprove && <><Button size="sm" variant={target.id === primaryTargetId ? "default" : "outline"} onClick={() => handleApprove(target.id, "APPROVE")}>Duyệt</Button><Button size="sm" variant="outline" onClick={() => handleApprove(target.id, "REJECT")}>Từ chối</Button></>}
          {(target.status === "APPROVED" || target.status === "IN_PLANNING") && canCreate && <Link className={buttonVariants({ size: "sm", variant: target.id === primaryTargetId ? "default" : "outline" })} href={`/production/food-plans?target_id=${encodeURIComponent(target.id)}`}>Tạo set</Link>}
        </div></TableCell>
      </TableRow>)}
    </TableBody></Table></CardContent></Card>
  </PageShell>;
}

function Field({ label, value, onChange, type = "text", required = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean }) {
  return <label className="grid gap-1.5 text-sm"><span className="text-muted-foreground">{label}</span><Input type={type} value={value} required={required} disabled={disabled} min={type === "number" ? 1 : undefined} step={type === "number" ? "1" : undefined} onChange={(event) => onChange(event.target.value)} /></label>;
}
