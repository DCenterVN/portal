"use client";

import { Controller } from "react-hook-form";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Field } from "@/components/patterns/form-field";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { useCart } from "./use-cart";

type CheckoutProps = Pick<ReturnType<typeof useCart>, "discardOpen" | "setDiscardOpen" | "discardCheckout" | "form" | "provinces" | "communes" | "selectProvince" | "checkoutOpen" | "changeCheckoutOpen" | "checkoutError" | "submittingOrder" | "handleCheckout">;
export function CheckoutForm({ discardOpen, setDiscardOpen, discardCheckout, form, provinces, communes, selectProvince, checkoutOpen, changeCheckoutOpen, checkoutError, submittingOrder, handleCheckout }: CheckoutProps) {
  const { errors } = form.formState;
  return <><Dialog open={checkoutOpen} onOpenChange={changeCheckoutOpen}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Thông tin đặt hàng</DialogTitle><DialogDescription>Nhập người nhận và địa chỉ giao hàng. Phí giao hàng được miễn phí.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
        <fieldset disabled={submittingOrder} className="space-y-4">
          <Field label="Họ tên người nhận" htmlFor="recipient-name" error={errors.recipient_name?.message}><Input id="recipient-name" autoComplete="name" {...form.register("recipient_name")} /></Field>
          <Field label="Số điện thoại" htmlFor="recipient-phone" error={errors.recipient_phone?.message}><Input id="recipient-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={10} {...form.register("recipient_phone")} /></Field>
          <Controller control={form.control} name="province_code" render={({ field }) => <EntityPicker label="Tỉnh/Thành" name="province_code" required maxOptions={20} items={provinces.data} status={provinces.error ? "error" : provinces.data ? "ready" : "loading"} getId={item => item.code} getLabel={item => item.name} value={field.value} onChange={selectProvince} error={errors.province_code?.message} onRetry={() => void provinces.mutate()} />} />
          <Controller control={form.control} name="commune_code" render={({ field }) => <EntityPicker label="Xã/Phường" name="commune_code" required maxOptions={20} items={communes.data} status={communes.error ? "error" : communes.data || !form.watch("province_code") ? "ready" : "loading"} getId={item => item.code} getLabel={item => item.name} value={field.value} onChange={code => form.setValue("commune_code", code ?? "", { shouldDirty: true, shouldValidate: true })} error={errors.commune_code?.message} placeholder={form.watch("province_code") ? "Chọn xã/phường" : "Chọn tỉnh/thành trước"} onRetry={() => void communes.mutate()} />} />
          <Field label="Địa chỉ cụ thể" htmlFor="delivery-address" error={errors.delivery_address?.message} hint="Số nhà, tên đường hoặc thôn/xóm"><Input id="delivery-address" autoComplete="street-address" {...form.register("delivery_address")} /></Field>
          <Field label="Ghi chú (không bắt buộc)" htmlFor="delivery-note" error={errors.delivery_note?.message}><Textarea id="delivery-note" {...form.register("delivery_note")} /></Field>
          <Controller control={form.control} name="payment_method" render={({ field }) => <Field label="Thanh toán" htmlFor="payment-method" error={errors.payment_method?.message}><Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="payment-method" className="w-full" onBlur={field.onBlur} ref={field.ref}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COD">Trả tiền khi nhận hàng</SelectItem><SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem></SelectContent></Select></Field>} />
        </fieldset>
        <p className="text-sm">Phí giao: Miễn phí</p>
        {checkoutError && <p role="alert" className="text-sm text-destructive">{checkoutError}</p>}
        <Button type="submit" className="w-full" disabled={submittingOrder || !provinces.data || !communes.data || !!provinces.error || !!communes.error}>{submittingOrder ? "Đang đặt hàng…" : "Xác nhận đặt hàng"}</Button>
      </form>
    </DialogContent>
  </Dialog><ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen} title="Bỏ thay đổi?" description="Thông tin giao hàng đang nhập sẽ bị xoá." confirmLabel="Bỏ thay đổi" onConfirm={discardCheckout} /></>;
}
