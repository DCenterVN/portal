"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Supplier } from "@/lib/api/suppliers";
import { SupplierContactLine } from "./supplier-detail-view";
import { groupLabels } from "./suppliers-view";
import { supplierHref } from "./supplier-routes";

export type PriceTableRow = { material: { id: string; name: string; uom_code: string }; unitPrice: number; validTo: string };

export interface ReceiptSupplierSheetProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceTable: PriceTableRow[];
  pricesReady: boolean;
  usedAt: (sku: string) => number;
  onAddMaterial: (sku: string) => void;
}

const dong = (value: number) => `${value.toLocaleString("vi-VN")} đ`;
const day = (iso: string) => iso.split("-").reverse().join("/");

export function ReceiptSupplierProfile({ supplier, priceTable, pricesReady, usedAt, onAddMaterial }: Omit<ReceiptSupplierSheetProps, "open" | "onOpenChange">) {
  const { shown, more } = groupLabels(supplier);
  const address = [supplier.address?.line, supplier.address?.ward, supplier.address?.province].filter(Boolean).join(", ");
  return <>
      <SheetHeader>
        <SheetTitle>{supplier.name}</SheetTitle>
        <SheetDescription>{supplier.code}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 px-4 pb-4 text-sm">
        <dl className="grid gap-1.5">
          {shown.length > 0 && <div><dt className="text-xs text-muted-foreground">Nhóm nguyên liệu</dt><dd>{shown.join(", ")}{more > 0 && ` +${more}`}</dd></div>}
          {(supplier.contact_name || supplier.contact_phone) && <div><dt className="text-xs text-muted-foreground">Liên hệ</dt><dd><SupplierContactLine supplier={supplier} /></dd></div>}
          {address && <div><dt className="text-xs text-muted-foreground">Địa chỉ</dt><dd>{address}</dd></div>}
        </dl>
        <section aria-label="Bảng giá còn hiệu lực" className="grid gap-2">
          <h3 className="font-semibold">Bảng giá còn hiệu lực vào ngày dự kiến nhập</h3>
          {!pricesReady && <p role="status" className="text-xs text-muted-foreground">Đang tải bảng giá…</p>}
          {pricesReady && priceTable.length === 0 && <p className="text-xs text-muted-foreground">Chưa có giá nào áp dụng cho ngày này.</p>}
          <ul className="grid divide-y rounded-lg border">
            {priceTable.map(({ material, unitPrice, validTo }) => {
              const at = usedAt(material.id);
              return <li key={`${material.id}:${material.uom_code}`} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{material.name}</p>
                  <p className="text-xs text-muted-foreground">{material.uom_code} · {dong(unitPrice)} · đến {day(validTo)}</p>
                </div>
                <Button type="button" size="sm" variant="outline" disabled={at >= 0} onClick={() => onAddMaterial(material.id)}>{at < 0 && <Plus aria-hidden="true" className="text-primary" />}{at >= 0 ? `Đã có ở dòng ${at + 1}` : "Thêm vào phiếu"}</Button>
              </li>;
            })}
          </ul>
        </section>
        <Button asChild variant="ghost" size="sm" className="w-fit"><Link href={supplierHref.tab(supplier.id, "agreements")} target="_blank" rel="noopener">Mở trang hồ sơ đầy đủ</Link></Button>
      </div>
  </>;
}

export function ReceiptSupplierSheet({ open, onOpenChange, ...profile }: ReceiptSupplierSheetProps) {
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[30rem]"><ReceiptSupplierProfile {...profile} /></SheetContent>
  </Sheet>;
}
