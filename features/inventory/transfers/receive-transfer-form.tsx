"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { Field } from "@/components/patterns/form-field";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { PageHeading } from "@/components/patterns/page-heading";
import { useAccess } from "@/lib/access-boundary";
import type { StockTransfer } from "@/lib/api/stock-transfers";
import { formatDateTime } from "@/lib/format-date";
import { VARIANCE_LABEL, VARIANCE_REASONS, formatQuantity, lotInfo, shortfall, toMilli } from "@/lib/stock-transfer";
import { LotCell } from "./transfer-lines-table";
import { ReceiverSwitch } from "./receiver-switch";
import { useReceiveTransfer } from "./use-receive-transfer";
import { useTransferDetail } from "./use-transfer-detail";
import { useBranchLabels, useMaterialNames } from "./use-transfer-lookups";
import { Tip } from "@/components/patterns/tip";

const REASONS = VARIANCE_REASONS.map(id => ({ id, label: VARIANCE_LABEL[id] }));

function ReceiveBody({ transfer }: { transfer: StockTransfer }) {
  const { scope } = useAccess();
  const names = useBranchLabels();
  const material = useMaterialNames();
  const receive = useReceiveTransfer(transfer);
  const { form, evidence } = receive;
  const { errors, isSubmitting } = form.formState;
  const rows = form.watch("rows");
  const { from: sender } = names.ends(transfer);
  return (
    <PageShell>
      <PageHeading title={`Nhận hàng · ${transfer.code}`} description={`Từ ${sender}, gửi lúc ${formatDateTime(transfer.sent_at)}`}
        actions={<Button variant="outline" asChild><Link href={`/inventory/stock-transfers/${transfer.id}`}>Về chi tiết phiếu</Link></Button>} />
      <form onSubmit={receive.submit} noValidate className="mt-4 grid gap-6" aria-busy={isSubmitting}>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Chi nhánh gửi</dt><dd className="font-medium">{sender}</dd></div>
          <div><dt className="text-muted-foreground">Người gửi</dt><dd className="font-medium">{sender}</dd></div>
          <div><dt className="text-muted-foreground">Giờ gửi</dt><dd className="font-medium tabular-nums">{formatDateTime(transfer.sent_at)}</dd></div>
        </dl>
        <fieldset disabled={isSubmitting} className="grid min-w-0 gap-3">
          <legend className="font-semibold">Dòng hàng</legend>
          <Table aria-label="Dòng hàng nhận" className="min-w-max">
            <TableHeader><TableRow>{["Nguyên liệu", "Lô", "Đơn vị", "Số gửi", "Số nhận", "Lý do lệch", "Hao hụt"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{transfer.lines.map((line, index) => {
              const info = lotInfo(line);
              const gap = toMilli(shortfall(line.sent_qty, rows[index]?.received ?? "")) ?? 0;
              const short = gap > 0 && (toMilli(rows[index]?.received ?? "") ?? -1) >= 0;
              return (
                <TableRow key={line.id}>
                  <TableCell className="align-top pt-8 font-medium">{material(line.sku_ref, index + 1)}</TableCell>
                  <TableCell className="align-top pt-8"><LotCell info={info} /></TableCell>
                  <TableCell className="align-top pt-8">{line.uom.toLowerCase()}</TableCell>
                  <TableCell className="align-top pt-8 text-right tabular-nums">{formatQuantity(line.sent_qty)}</TableCell>
                  <TableCell className="w-40 align-top">
                    <Field label={`Số nhận dòng ${index + 1}`} htmlFor={`receive-qty-${index}`} error={errors.rows?.[index]?.received?.message}>
                      <Input id={`receive-qty-${index}`} inputMode="decimal" autoComplete="off" className="text-right tabular-nums" {...form.register(`rows.${index}.received`)} />
                    </Field>
                  </TableCell>
                  <TableCell className="min-w-56 align-top">
                    {short && (
                      <Controller control={form.control} name={`rows.${index}.reason`} render={({ field }) => (
                        <EntityPicker label={`Lý do lệch dòng ${index + 1}`} name={`receive-reason-${index}`} serializeValue={false} required
                          items={REASONS} status="ready" getId={item => item.id} getLabel={item => item.label} value={field.value || null}
                          onChange={id => field.onChange(id ?? "")} error={errors.rows?.[index]?.reason?.message} placeholder="Chọn lý do" searchPlaceholder="Gõ lý do" />
                      )} />
                    )}
                  </TableCell>
                  <TableCell className="align-top pt-8 text-right tabular-nums">{short ? `${formatQuantity(shortfall(line.sent_qty, rows[index].received))} ${line.uom.toLowerCase()}` : "—"}</TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </fieldset>
        <section className="grid gap-2">
          <Field label="Ảnh hàng nhận" htmlFor="receive-photos" hint={receive.short ? "Có dòng nhận thiếu: cần ít nhất 1 ảnh, tối đa 10, mỗi ảnh tối đa 5 MiB." : "Không bắt buộc khi nhận đủ. Tối đa 10 ảnh, mỗi ảnh tối đa 5 MiB."} error={evidence.error || undefined}>
            <Input id="receive-photos" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={isSubmitting}
              onChange={event => { if (event.target.files) evidence.add(event.target.files); event.target.value = ""; }} />
          </Field>
          {evidence.photos.length > 0 && (
            <ul aria-label="Ảnh đã chọn" className="flex flex-wrap gap-3">
              {evidence.photos.map((photo, index) => (
                <li key={photo.id} className="relative">
                  <img src={photo.url} alt={`Ảnh nhận hàng ${index + 1}`} className="size-24 rounded-lg border border-border object-cover" />
                  <Tip label={`Bỏ ảnh ${index + 1}`}><Button type="button" variant="secondary" size="icon-xs" className="absolute -right-2 -top-2" aria-label={`Bỏ ảnh ${index + 1}`} disabled={isSubmitting} onClick={() => evidence.remove(photo.id)}><X aria-hidden="true" /></Button></Tip>
                </li>
              ))}
            </ul>
          )}
        </section>
        <p className="text-sm text-muted-foreground">Người nhận: Bạn · {scope?.branchName}. Giờ nhận do hệ thống ghi khi bạn bấm Xác nhận.</p>
        {errors.root?.message && <InlineAlert>{errors.root.message}</InlineAlert>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting || receive.needsPhoto}>{isSubmitting ? "Đang nhận…" : "Xác nhận đã nhận"}</Button>
          {receive.needsPhoto && <p className="text-xs text-muted-foreground">Thêm ít nhất 1 ảnh vì có dòng nhận thiếu.</p>}
        </div>
      </form>
    </PageShell>
  );
}

export function ReceiveTransfer({ id }: { id: string }) {
  const { scope } = useAccess();
  const detail = useTransferDetail(id);
  const names = useBranchLabels();
  const { transfer } = detail;
  if (detail.error) return <ErrorState title="Không mở được phiếu này ở chi nhánh đang chọn." onRetry={detail.reload} />;
  if (!transfer) return <LoadingState />;
  if (transfer.status !== "IN_TRANSIT") return <ErrorState title="Phiếu này không còn chờ nhận." action={<Button variant="outline" asChild><Link href={`/inventory/stock-transfers/${transfer.id}`}>Xem phiếu</Link></Button>} />;
  if (!detail.canReceive) {
    return (
      <PageShell>
        <PageHeading title={`Nhận hàng · ${transfer.code}`} />
        <div className="mt-4"><ReceiverSwitch receiver={transfer.to_branch_ref} receiverLabel={names.ends(transfer).to} atSender={transfer.from_branch_ref === scope?.branchId} /></div>
      </PageShell>
    );
  }
  return <ReceiveBody key={transfer.id} transfer={transfer} />;
}
