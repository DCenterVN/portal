"use client";

import { formatDate } from "@/lib/format-date";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { RowActions } from "@/components/patterns/row-actions";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { TablePager } from "@/components/patterns/table-pager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductionTarget } from "@/lib/api/production";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { statusLabel } from "@/lib/status-labels";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { targetStatuses } from "./order-status";
import { useTargets } from "./use-targets";
import { Tip } from "@/components/patterns/tip";
import { ProductionFlowBar } from "./production-flow-bar";

const statusFilters = [
  { id: "all", label: "Tất cả" },
  { id: "draft", label: "Chờ duyệt" },
  { id: "ready", label: "Sẵn sàng" },
  { id: "active", label: "Đang nấu" },
  { id: "done", label: "Kết thúc" },
] as const;

export function TargetsView({ initialTargets, initialShowCreate = false }: { initialTargets?: ProductionTarget[]; initialShowCreate?: boolean }) {
  const { list, targets, filteredTargets, search, setSearch, statusFilter, setStatusFilter, editingId, startEdit, resetForm, deleting, setDeleting, handleDelete, listLoading, listError, can, branchName, branchRef, showCreate, setShowCreate, title, setTitle, periodStart, setPeriodStart, periodEnd, setPeriodEnd, lines, setLines, loading, products, productName, setProductName, productOpen, setProductOpen, productSlug, productError, availableProducts, addProduct, reloadProducts, canCreate, canApproveTarget, primaryTargetId, validLines, updateLine, handleCreate, handleApprove } = useTargets(initialTargets, initialShowCreate);

  const draftCount = targets.filter((t) => t.status === "DRAFT").length;
  const readyCount = targets.filter((t) => t.status === "APPROVED" || t.status === "IN_PLANNING").length;
  const activeOrDoneCount = targets.filter((t) => t.status === "HANDED_OFF" || t.status === "IN_PRODUCTION" || t.status === "COMPLETED").length;

  return <PageShell>
    <PageHeading
      title="Chỉ tiêu sản xuất"
      description="Đặt các món và tổng số suất cần chuẩn bị cho chi nhánh. Chỉ tiêu được người khác duyệt sẽ chuyển sang lập kế hoạch nấu."
      actions={canCreate ? <Button variant={showCreate ? "outline" : "default"} onClick={() => showCreate ? resetForm() : setShowCreate(true)}>Tạo chỉ tiêu</Button> : undefined}
    />
    <ProductionFlowBar current="targets" />

    {targets.length > 0 && (
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-t-[3px] border-t-primary py-4">
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Chờ phê duyệt</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{draftCount}</p>
          </CardContent>
        </Card>
        <Card className="border-t-[3px] border-t-primary py-4">
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Sẵn sàng lập kế hoạch</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{readyCount}</p>
          </CardContent>
        </Card>
        <Card className="border-t-[3px] border-t-primary py-4">
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">Đang nấu &amp; hoàn tất</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{activeOrDoneCount}</p>
          </CardContent>
        </Card>
      </div>
    )}

    {canCreate && showCreate && <Card className="mb-6">
      <CardHeader className="border-b pb-4">
        <CardTitle>{editingId ? "Sửa chỉ tiêu sản xuất" : "Tạo chỉ tiêu sản xuất mới"}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2"><form onSubmit={handleCreate} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tiêu đề" value={title} onChange={setTitle} required />
          <div className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Chi nhánh</span>
            <p className="flex h-9 items-center px-1 text-sm font-medium">
              {branchName || "Chi nhánh hiện tại"}
            </p>
          </div>
          <DateField label="Từ ngày" id="target-period-start" value={periodStart} onChange={value => { setPeriodStart(value); if (!periodEnd || periodEnd < value) setPeriodEnd(value); }} max={periodEnd || undefined} />
          <DateField label="Đến ngày" id="target-period-end" value={periodEnd} onChange={setPeriodEnd} min={periodStart || undefined} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><p className="text-sm font-medium">Sản phẩm và tổng suất chỉ tiêu</p><div className="flex gap-2">{!editingId && can("sales:product:create") && <Button type="button" size="sm" variant="outline" aria-expanded={productOpen} onClick={() => setProductOpen(open => !open)}>Tạo sản phẩm mới</Button>}<Button type="button" size="sm" variant="outline" onClick={() => setLines((current) => [...current, { product_ref: "", target_quantity: "4", uom: "EA" }])}>Thêm sản phẩm</Button></div></div>
          {productOpen && !editingId && can("sales:product:create") && <Card><CardHeader><CardTitle>Tạo sản phẩm nháp</CardTitle></CardHeader><CardContent className="grid gap-3">
            <Field label="Tên sản phẩm" value={productName} onChange={setProductName} />
            {productError && <InlineAlert>{productError}</InlineAlert>}
            <div className="flex gap-2"><Button type="button" variant="outline" disabled={loading || !productName.trim() || !productSlug.trim()} onClick={() => void addProduct()}>Lưu sản phẩm nháp</Button><Button type="button" variant="ghost" onClick={() => setProductOpen(false)}>Đóng</Button></div>
          </CardContent></Card>}
          {lines.map((line, index) => <div className="grid items-end gap-2 md:grid-cols-[1fr_160px_40px]" key={index}>
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
                getMeta={(p) => [statusLabel(p.status), p.setNote].filter(Boolean).join(" · ")}
                onRetry={reloadProducts}
                emptyText="Chưa có sản phẩm nào."
                placeholder="Tìm theo tên hoặc mã hàng"
              />
            <Field label="Tổng suất chỉ tiêu" suffix="suất" value={String(line.target_quantity)} onChange={(value) => updateLine(index, { target_quantity: value })} type="number" required />
            <Tip label="Xóa dòng"><Button aria-label="Xóa dòng" type="button" size="icon" variant="ghost" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}><Trash2 className="h-4 w-4" /></Button></Tip>
          </div>)}
        </div>
        <div className="flex gap-2"><Button type="submit" disabled={loading || !branchRef || !validLines || !title.trim() || periodEnd < periodStart}>Lưu chỉ tiêu</Button><Button type="button" variant="outline" onClick={resetForm}>Hủy</Button></div>
      </form></CardContent>
    </Card>}

    {listError && <InlineAlert className="mb-4">{listError}</InlineAlert>}
    <Card className="gap-0 overflow-hidden py-0">
      {targets.length > 0 && (
        <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="search"
            aria-label="Tìm chỉ tiêu"
            placeholder="Tìm tên hoặc mã chỉ tiêu…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo trạng thái">
            {statusFilters.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={statusFilter === item.id ? "secondary" : "ghost"}
                onClick={() => setStatusFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
      )}
      <CardContent aria-busy={loading} className="p-0"><Table><TableHeader><TableRow><TableHead>Chỉ tiêu</TableHead><TableHead className="hidden md:table-cell">Kỳ áp dụng</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Bước tiếp theo</TableHead></TableRow></TableHeader><TableBody>
        {(loading || listLoading) && targets.length === 0 ? <TableRow><TableCell colSpan={4}><LoadingState title="Đang tải chỉ tiêu sản xuất…" /></TableCell></TableRow> : targets.length === 0 ? <TableRow><TableCell colSpan={4}><EmptyState title="Chưa có chỉ tiêu sản xuất" description="Chỉ tiêu xác định sản phẩm và tổng suất cần chuẩn bị cho chi nhánh." action={canCreate ? <Button onClick={() => setShowCreate(true)}>Tạo chỉ tiêu</Button> : undefined} /></TableCell></TableRow> : filteredTargets.length === 0 ? <TableRow><TableCell colSpan={4}><EmptyState title="Không tìm thấy chỉ tiêu phù hợp" description="Thử đổi từ khóa hoặc chọn lại bộ lọc trạng thái." action={<Button type="button" variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Xoá lọc</Button>} /></TableCell></TableRow> : filteredTargets.map((target) => {
          const totalPortions = target.lines.reduce((sum, line) => sum + (Number(line.target_quantity) || 0), 0);
          return <TableRow key={target.id}>
            <TableCell>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{target.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="font-mono">{target.target_code}</span>
                  {" · "}
                  {target.lines.length} món ({totalPortions} suất)
                  <span className="md:hidden"> · {formatDate(target.period_start)} – {formatDate(target.period_end)}</span>
                </p>
              </div>
            </TableCell>
            <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">{formatDate(target.period_start)} – {formatDate(target.period_end)}</TableCell>
            <TableCell><StatusBadge tone={statusTone(target.status)}>{targetStatuses[target.status] ?? target.status}</StatusBadge></TableCell>
            <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2">
              {target.status === "DRAFT" && canApproveTarget(target) && <><Button size="sm" variant={target.id === primaryTargetId ? "default" : "outline"} onClick={() => handleApprove(target.id, "APPROVE")}>Duyệt</Button><Button size="sm" variant="outline" onClick={() => handleApprove(target.id, "REJECT")}>Từ chối</Button></>}
              {target.status === "DRAFT" && canCreate && <RowActions label={target.target_code} actions={[
                { label: "Sửa", icon: Pencil, onSelect: () => startEdit(target) },
                { label: "Xoá", icon: Trash2, danger: true, onSelect: () => setDeleting(target) },
              ]} />}
              {planLabel(target.status) && canCreate && <Link className={buttonVariants({ size: "sm", variant: target.id === primaryTargetId ? "default" : "outline" })} href={`/production/food-plans?target_id=${encodeURIComponent(target.id)}`}>{planLabel(target.status)}</Link>}
              {target.status !== "DRAFT" && can("production:material_requirement:read") && <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href={`/production/material-requirements?target_id=${encodeURIComponent(target.id)}`}>Xem nhu cầu</Link>}
            </div></TableCell>
          </TableRow>;
        })}
      </TableBody></Table></CardContent>
    </Card>
    <TablePager label="Phân trang chỉ tiêu" busy={listLoading} status={`Trang ${list.page}`} hasPrevious={list.hasPrevious} onPrevious={list.previous} hasNext={list.hasNext} onNext={list.next} />
    <ConfirmDialog open={deleting !== null} onOpenChange={open => { if (!open) setDeleting(null); }} title={`Xoá chỉ tiêu ${deleting?.target_code ?? ""}?`} description="Chỉ tiêu nháp bị xoá hẳn và không khôi phục được." confirmLabel="Xoá chỉ tiêu" danger busy={loading} onConfirm={() => void handleDelete()} />
  </PageShell>;
}

const planLabel = (status: string) => status === "APPROVED" || status === "IN_PLANNING" ? "Tạo kế hoạch" : status === "HANDED_OFF" || status === "IN_PRODUCTION" ? "Tạo kế hoạch thay thế" : "";

function DateField({ label, id, ...props }: { label: string; id: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) {
  return <div className="grid gap-1.5 text-sm"><label htmlFor={id} className="text-muted-foreground">{label}</label><DatePicker id={id} {...props} /></div>;
}

function Field({ label, value, onChange, type = "text", required = false, disabled = false, suffix }: { suffix?: string; label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean }) {
  return <label className="grid gap-1.5 text-sm"><span className="text-muted-foreground">{label}</span><span className="flex items-center gap-2"><Input type={type} value={value} required={required} disabled={disabled} min={type === "number" ? 1 : undefined} step={type === "number" ? "1" : undefined} onChange={(event) => onChange(event.target.value)} />{suffix && <span className="text-muted-foreground">{suffix}</span>}</span></label>;
}
