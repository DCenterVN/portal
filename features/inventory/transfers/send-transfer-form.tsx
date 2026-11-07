"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { Field } from "@/components/patterns/form-field";
import { ErrorState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { PageHeading } from "@/components/patterns/page-heading";
import { useAccess } from "@/lib/access-boundary";
import { branchLabel, branchMeta } from "@/lib/branch-label";
import { FEFO_LABEL, FEFO_LOT } from "@/lib/stock-transfer";
import { blankLine } from "./send-form-model";
import { useSendTransfer } from "./use-send-transfer";
import { Tip } from "@/components/patterns/tip";

const FEFO_OPTION = { id: FEFO_LOT, label: FEFO_LABEL, meta: "Lấy lô có hạn dùng gần nhất trước" };

export function SendTransferForm() {
  const { can, scope } = useAccess();
  const send = useSendTransfer();
  const { form, array } = send;
  const { errors, isSubmitting } = form.formState;
  if (!can("inventory:transfer:create")) return <ErrorState denied title="Tài khoản của bạn chưa có quyền gửi hàng." />;
  const noStock = send.stockStatus === "ready" && !send.rows.length;
  return (
    <PageShell>
      <PageHeading title="Gửi hàng sang chi nhánh khác" description="Hàng trừ khỏi kho ngay khi gửi. Chi nhánh nhận kiểm và xác nhận số thực nhận." actions={<Button variant="outline" asChild><Link href="/inventory/stock-transfers">Về danh sách phiếu</Link></Button>} />
      <form onSubmit={send.submit} noValidate className="mt-4 grid gap-6" aria-busy={isSubmitting}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Chi nhánh gửi" htmlFor="transfer-from" hint="Chi nhánh bạn đang làm việc."><Input id="transfer-from" readOnly value={scope?.branchName ?? ""} /></Field>
          <Controller control={form.control} name="to" render={({ field }) => (
            <EntityPicker label="Chi nhánh nhận" name="transfer-to" serializeValue={false} required maxOptions={20}
              items={send.names.targets} status={send.names.status} getId={item => item.id} getLabel={branchLabel} getMeta={item => branchMeta(item)}
              value={field.value || null} onChange={id => field.onChange(id ?? "")} error={errors.to?.message}
              placeholder="Chọn chi nhánh nhận" searchPlaceholder="Gõ tên chi nhánh" onRetry={send.names.retry}
              emptyText="Chưa có danh sách chi nhánh để chọn." />
          )} />
        </div>
        <p className="text-sm text-muted-foreground">Người gửi: Bạn · {scope?.branchName}. Giờ gửi, mã phiếu và trạng thái "Đang chuyển" do hệ thống ghi khi bạn bấm Gửi.</p>
        {noStock && <InlineAlert tone="warning">Chi nhánh này chưa có nguyên liệu khả dụng để gửi.</InlineAlert>}
        {send.stockStatus === "error" && <ErrorState title="Không tải được tồn kho của chi nhánh." onRetry={send.retryStock} />}
        <fieldset disabled={isSubmitting} className="grid min-w-0 gap-3">
          <legend className="font-semibold">Dòng hàng</legend>
          <Table aria-label="Dòng hàng gửi" className="min-w-max">
            <TableHeader><TableRow>{["Nguyên liệu", "Đơn vị", "Số lượng", "Lô", ""].map((label, index) => <TableHead key={index}>{label || <span className="sr-only">Xoá dòng</span>}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{array.fields.map((item, index) => {
              const sku = form.watch(`lines.${index}.sku`);
              const uom = send.rows.find(row => row.sku_ref === sku)?.uom;
              const lotItems = [FEFO_OPTION, ...send.lotChoices(sku)];
              return (
                <TableRow key={item.id}>
                  <TableCell className="min-w-64 align-top">
                    <Controller control={form.control} name={`lines.${index}.sku`} render={({ field }) => (
                      <EntityPicker label={`Nguyên liệu dòng ${index + 1}`} name={`transfer-sku-${index}`} serializeValue={false} required maxOptions={20}
                        items={send.skuOptions(index)} status={send.stockStatus} getId={row => row.id} getLabel={row => row.name} getMeta={row => row.meta}
                        value={field.value || null} onChange={id => { field.onChange(id ?? ""); form.setValue(`lines.${index}.lot`, FEFO_LOT); send.recheck(index); }}
                        error={errors.lines?.[index]?.sku?.message} placeholder="Chọn nguyên liệu" searchPlaceholder="Gõ tên nguyên liệu"
                        emptyText="Chi nhánh chưa có nguyên liệu khả dụng." onRetry={send.retryStock} />
                    )} />
                  </TableCell>
                  <TableCell className="align-top pt-8">{uom?.toLowerCase() ?? "—"}</TableCell>
                  <TableCell className="w-44 align-top">
                    <Field label={`Số lượng dòng ${index + 1}`} htmlFor={`transfer-qty-${index}`} error={errors.lines?.[index]?.quantity?.message}>
                      <Input id={`transfer-qty-${index}`} inputMode="decimal" autoComplete="off" className="text-right tabular-nums" {...form.register(`lines.${index}.quantity`)} />
                    </Field>
                  </TableCell>
                  <TableCell className="min-w-64 align-top">
                    <Controller control={form.control} name={`lines.${index}.lot`} render={({ field }) => (
                      <EntityPicker label={`Lô dòng ${index + 1}`} name={`transfer-lot-${index}`} serializeValue={false} required maxOptions={20}
                        items={lotItems} status="ready" getId={lot => lot.id} getLabel={lot => lot.label} getMeta={lot => lot.meta}
                        value={field.value} onChange={id => { field.onChange(id ?? FEFO_LOT); send.recheck(index); }} placeholder={FEFO_LABEL} searchPlaceholder="Gõ mã lô" />
                    )} />
                  </TableCell>
                  <TableCell className="align-top pt-6"><Tip label={`Xoá dòng ${index + 1}`}><Button type="button" variant="ghost" size="icon" aria-label={`Xoá dòng ${index + 1}`} disabled={array.fields.length === 1} onClick={() => array.remove(index)}><Trash2 aria-hidden="true" /></Button></Tip></TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
          {errors.lines?.root?.message && <p role="alert" className="text-xs font-medium text-destructive">{errors.lines.root.message}</p>}
          <div><Button type="button" variant="outline" disabled={!send.canAdd} onClick={() => array.append(blankLine())}><Plus aria-hidden="true" />Thêm dòng</Button></div>
        </fieldset>
        {errors.root?.message && <InlineAlert>{errors.root.message}</InlineAlert>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting || send.stockStatus !== "ready" || send.names.status !== "ready"}>{isSubmitting ? "Đang gửi…" : "Gửi hàng"}</Button>
          {send.names.status === "error" && <p className="self-center text-xs text-muted-foreground">Chưa có danh sách chi nhánh để chọn nên chưa gửi được.</p>}
        </div>
      </form>
    </PageShell>
  );
}
