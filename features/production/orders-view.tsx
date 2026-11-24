"use client";

import Link from "next/link";
import { ErrorState } from "@/components/patterns/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { formatServings } from "@/lib/stock-transfer";
import { failableOrderStatuses, productionOrderStatuses } from "./order-status";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePager } from "@/components/patterns/table-pager";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import type { ProductionOrder } from "@/lib/api/production";
import { useProductionOrders } from "./use-production-orders";
import { ExecutionFlowBar } from "./execution-flow-bar";

interface OrdersViewProps {
  initialOrders?: ProductionOrder[];
}

export function OrdersView({ initialOrders }: OrdersViewProps) {
  const { list, orders, listLoading, listError, reload, loadingId, canUpdate, handleAccept, handleAllocate, handleStart, completionOrder, completionForm, openCompletion, changeCompletionOpen, submitCompletion, failingOrder, failureForm, openFailure, changeFailureOpen, submitFailure } = useProductionOrders(initialOrders);

  const { register, formState: { errors, isSubmitting } } = completionForm;
  const pendingCount = orders.filter((o) => o.status === "HANDED_OFF" || o.status === "ACCEPTED").length;
  const cookingCount = orders.filter((o) => o.status === "ALLOCATED" || o.status === "IN_PROGRESS").length;
  const qcCount = orders.filter((o) => o.status === "COMPLETED" || o.status === "QC_PASSED").length;

  return (
    <PageShell>
      <PageHeading
        title="Điều hành Sản xuất & Chế biến"
        description="Nhận lệnh → cấp nguyên liệu (lô gần hết hạn dùng trước) → sơ chế, nấu → đóng gói"
      />
      <ExecutionFlowBar current="orders" />

      {orders.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card className="border-t-[3px] border-t-primary py-4">
            <CardContent>
              <p className="text-xs font-medium text-muted-foreground">Chờ nhận &amp; cấp nguyên liệu</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="border-t-[3px] border-t-primary py-4">
            <CardContent>
              <p className="text-xs font-medium text-muted-foreground">Đang chế biến</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{cookingCount}</p>
            </CardContent>
          </Card>
          <Card className="border-t-[3px] border-t-primary py-4">
            <CardContent>
              <p className="text-xs font-medium text-muted-foreground">Chờ QC &amp; hoàn tất</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{qcCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {listError ? <ErrorState title={listError} onRetry={reload} className="mb-4" /> : <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã lệnh</TableHead>
                <TableHead>Số lượng kế hoạch</TableHead>
                <TableHead>SL Thực tế</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tiến độ quy trình</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    {listLoading ? "Đang tải lệnh sản xuất…" : "Chưa có lệnh sản xuất nào được chuyển giao từ Chuyên gia dinh dưỡng"}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.order_code}</TableCell>
                    <TableCell>{formatServings(o.planned_quantity)}</TableCell>
                    <TableCell>{o.actual_output_quantity > 0 ? formatServings(o.actual_output_quantity) : "—"}</TableCell>
                    <TableCell>
                      <StatusBadge tone={statusTone(o.status)}>{productionOrderStatuses[o.status] ?? o.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.status === "HANDED_OFF" && canUpdate && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingId === o.id}
                          onClick={() => handleAccept(o.id)}
                        >
                          Tiếp nhận
                        </Button>
                      )}
                      {o.status === "ACCEPTED" && canUpdate && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingId === o.id}
                          onClick={() => handleAllocate(o.id)}
                        >
                          Cấp nguyên liệu
                        </Button>
                      )}
                      {o.status === "ALLOCATED" && canUpdate && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingId === o.id}
                          onClick={() => handleStart(o.id)}
                        >
                          Bắt đầu nấu
                        </Button>
                      )}
                      {o.status === "IN_PROGRESS" && canUpdate && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingId === o.id}
                          onClick={() => openCompletion(o)}
                        >
                          Đóng gói
                        </Button>
                      )}
                      {o.status === "COMPLETED" && (
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <StatusBadge tone="warning">Chờ QC nghiệm thu</StatusBadge>
                          <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href="/production/qc">Sang QC</Link>
                        </div>
                      )}
                      {failableOrderStatuses.includes(o.status) && canUpdate && (
                        <Button size="sm" variant="ghost" className="ml-2" disabled={loadingId === o.id} onClick={() => openFailure(o)}>
                          Hỏng mẻ
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>}
      <TablePager label="Phân trang lệnh sản xuất" busy={listLoading} status={`Trang ${list.page}`} hasPrevious={list.hasPrevious} onPrevious={list.previous} hasNext={list.hasNext} onNext={list.next} />
      <Dialog open={completionOrder !== null} onOpenChange={changeCompletionOpen}>
        <DialogContent showCloseButton={!isSubmitting}>
          <DialogHeader>
            <DialogTitle>Đóng gói</DialogTitle>
            <DialogDescription>Lệnh {completionOrder?.order_code}. Kế hoạch: {completionOrder?.planned_quantity} hộp.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCompletion} noValidate className="space-y-4">
            <Field data-invalid={!!errors.actualQuantity}>
              <FieldLabel htmlFor="actual-output-quantity">Sản lượng thực tế (hộp)</FieldLabel>
              <Input id="actual-output-quantity" type="number" inputMode="numeric" min={1} step={1} disabled={isSubmitting} aria-invalid={!!errors.actualQuantity} aria-describedby="actual-output-error" {...register("actualQuantity")} />
              <FieldError id="actual-output-error">{errors.actualQuantity?.message}</FieldError>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => changeCompletionOpen(false)}>Huỷ</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang đóng gói…" : "Xác nhận đóng gói"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={failingOrder !== null} onOpenChange={changeFailureOpen} title={`Báo hỏng mẻ lệnh ${failingOrder?.order_code ?? ""}?`}
        description="Lệnh dừng lại và không làm tiếp được. Cần lý do để bếp và quản lý truy vết." confirmLabel="Xác nhận hỏng mẻ" danger
        busy={failureForm.formState.isSubmitting} onConfirm={() => void submitFailure()}>
        <Field data-invalid={!!failureForm.formState.errors.reason}>
          <FieldLabel htmlFor="failure-reason">Lý do hỏng mẻ</FieldLabel>
          <Input id="failure-reason" aria-invalid={!!failureForm.formState.errors.reason} aria-describedby="failure-reason-error" {...failureForm.register("reason")} />
          <FieldError id="failure-reason-error">{failureForm.formState.errors.reason?.message}</FieldError>
        </Field>
      </ConfirmDialog>
    </PageShell>
  );
}
