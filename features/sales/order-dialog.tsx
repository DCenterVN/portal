"use client";

import { Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { orderActions } from "./order-actions";
import type { useSalesOrders } from "./use-sales-orders";

type Props = { state: ReturnType<typeof useSalesOrders> };
export function OrderDialog({ state }: Props) {
  const { pending, busy, changeDialogOpen, form, submit, drivers, error } = state;
  const { register, formState: { errors } } = form;
  const shipping = pending?.action === "ship";
  const payment = pending?.action === "payments/confirm";
  const missingDrivers = shipping && drivers.data?.length === 0;
  return <Dialog open={!!pending} onOpenChange={changeDialogOpen}>
    <DialogContent showCloseButton={!busy}>
      <DialogHeader>
        <DialogTitle>{pending ? orderActions[pending.action].label : "Xử lý đơn"}</DialogTitle>
        <DialogDescription>Đơn {pending?.order.order_code || "đã chọn"}. Chỉ cập nhật sau khi hệ thống xác nhận.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} noValidate className="space-y-4">
        {shipping ? <>
          <Controller control={form.control} name="value" render={({ field }) => <EntityPicker
              label="Người giao" name="driver" serializeValue={false} required
              items={drivers.data} status={drivers.error ? "error" : drivers.data ? "ready" : "loading"}
              getId={driver => driver.user_id} getLabel={driver => driver.display_name || driver.email || "Người giao chưa có tên"}
              getMeta={driver => driver.email} value={field.value} onChange={value => field.onChange(value ?? "")}
              emptyText="Chi nhánh chưa có nhân viên bán hàng để giao" error={errors.value?.message} onRetry={() => void drivers.mutate()} />} />
          {missingDrivers && <p>Chi nhánh chưa có nhân viên bán hàng để giao</p>}
        </> : <Field data-invalid={!!errors.value}>
          <FieldLabel htmlFor="order-action-value">{payment ? "Mã giao dịch ngân hàng" : pending?.order.status === "AWAITING_PAYMENT" && pending.action === "cancel" ? "Lý do huỷ (không bắt buộc)" : "Lý do"}</FieldLabel>
          <Input id="order-action-value" disabled={busy} aria-invalid={!!errors.value} aria-describedby="order-action-error" {...register("value")} />
          <FieldError id="order-action-error">{errors.value?.message}</FieldError>
        </Field>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => changeDialogOpen(false)}>Đóng</Button>
          <Button type="submit" variant={pending?.action === "cancel" ? "destructive" : "default"} disabled={busy || !!(shipping && (!drivers.data?.length || drivers.error))}>{busy ? "Đang xử lý…" : pending ? orderActions[pending.action].label : "Xác nhận"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
