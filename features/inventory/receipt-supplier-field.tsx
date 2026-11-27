"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EntityPicker, fold } from "@/components/patterns/entity-picker";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import type { Supplier } from "@/lib/api/suppliers";
import { cn } from "@/lib/utils";
import { SupplierContactLine } from "./supplier-detail-view";
import { groupLabels } from "./suppliers-view";
import { supplierHref } from "./supplier-routes";

export function supplierMatches(supplier: Supplier, query: string, group: string) {
  if (group && !(supplier.material_category_labels ?? []).some(label => label.code === group || label.parent_code === group)) return false;
  const needle = fold(query.trim());
  const phone = (supplier.contact_phone ?? "").replace(/[\s.-]/g, "");
  return !needle || fold(`${supplier.name} ${supplier.code} ${supplier.contact_phone ?? ""}`).includes(needle) || (phone !== "" && phone.includes(needle.replace(/[\s.-]/g, "")));
}

function SupplierOption({ supplier, unpriced }: { supplier: Supplier; unpriced: boolean }) {
  const { shown, more } = groupLabels(supplier);
  const contact = [supplier.contact_name, supplier.contact_phone].filter(Boolean).join(" · ");
  return <span className="grid min-w-0 gap-0.5 py-0.5">
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{supplier.name.trim().charAt(0).toUpperCase()}</span>
      <span className="min-w-0 flex-1 truncate font-semibold">{supplier.name}</span>
      {unpriced && <span className="shrink-0 text-xs text-muted-foreground">chưa có bảng giá</span>}
      <span className="shrink-0 text-xs text-muted-foreground">{supplier.code}</span>
    </span>
    <span className="truncate pl-8 text-xs text-muted-foreground">
      {shown.join(", ")}{more > 0 && ` +${more}`}{shown.length > 0 && contact && " · "}{contact || (shown.length === 0 && "Chưa có thông tin liên hệ")}
    </span>
  </span>;
}

function GroupRow({ categories, group, onGroup }: { categories: MaterialCategory[]; group: string; onGroup: (code: string) => void }) {
  if (!categories.length) return null;
  return <div role="group" aria-label="Nhóm nguyên liệu" className="flex flex-wrap gap-1.5">
    <Button type="button" size="sm" variant={group ? "outline" : "secondary"} aria-pressed={!group} onClick={() => onGroup("")}>Tất cả</Button>
    {categories.map(item => <Button key={item.code} type="button" size="sm" variant={group === item.code ? "secondary" : "outline"} aria-pressed={group === item.code}
      onClick={() => onGroup(group === item.code ? "" : item.code)}>{item.name}</Button>)}
  </div>;
}

export interface ReceiptSupplierFieldProps {
  suppliers: Supplier[];
  categories: MaterialCategory[];
  status: "loading" | "ready" | "error";
  value: string;
  onChange: (id: string | null) => void;
  pricedCount: number | null;
  unpricedIds?: ReadonlySet<string>;
  selected?: Supplier;
  onOpenProfile?: () => void;
}

export function activeSupplierCategories(categories: MaterialCategory[], suppliers: Supplier[]): MaterialCategory[] {
  return categories.filter(cat => suppliers.some(item => supplierMatches(item, "", cat.code)));
}

export function ReceiptSupplierField({ suppliers, categories, status, value, onChange, pricedCount, unpricedIds, selected: picked, onOpenProfile }: ReceiptSupplierFieldProps) {
  const [group, setGroup] = useState("");
  const [changing, setChanging] = useState(false);
  const visibleCategories = activeSupplierCategories(categories, suppliers);
  const activeGroup = visibleCategories.some(cat => cat.code === group) ? group : "";
  const selected = suppliers.find(item => item.id === value) ?? picked;
  const listed = suppliers.some(item => item.id === value);
  if (selected && !changing) {
    const { shown, more } = groupLabels(selected);
    return <section aria-label="Nhà cung cấp đã chọn" className="grid gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Nhà cung cấp</p>
          <p className="font-semibold">{selected.name} <span className="text-xs font-normal text-muted-foreground">{selected.code}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setChanging(true)}>Đổi</Button>
          {onOpenProfile ? <Button type="button" variant="ghost" size="sm" onClick={onOpenProfile}>Xem hồ sơ</Button>
            : <Button asChild variant="ghost" size="sm"><Link href={supplierHref.tab(selected.id, "agreements")}>Xem hồ sơ</Link></Button>}
        </div>
      </div>
      {shown.length > 0 && <p className="text-sm">Nhóm nguyên liệu: {shown.join(", ")}{more > 0 && ` +${more}`}</p>}
      {(selected.contact_name || selected.contact_phone) && <p className="text-sm text-muted-foreground">Liên hệ: <SupplierContactLine supplier={selected} /></p>}
      {!listed && <p role="status" className="text-sm text-destructive">Nhà này không có giá cho ngày đã chọn.</p>}
      {listed && pricedCount !== null && <p className={cn("text-sm", pricedCount === 0 && "text-muted-foreground")}>{pricedCount === 0 ? "Chưa có giá nào áp dụng cho ngày dự kiến nhập." : `${pricedCount} nguyên liệu có giá cho ngày dự kiến nhập.`}</p>}
    </section>;
  }
  return <EntityPicker label="Nhà cung cấp" name="receipt-supplier" serializeValue={false} items={suppliers} status={status} defaultOpen={changing}
    placeholder="Chọn nhà cung cấp" searchPlaceholder="Tìm theo tên, mã hoặc số điện thoại" emptyText="Chưa có nhà cung cấp nào có giá cho ngày này."
    getId={item => item.id} getLabel={item => item.name} getMeta={item => item.code} renderOption={item => <SupplierOption supplier={item} unpriced={unpricedIds?.has(item.id) ?? false} />}
    filter={(item, query) => supplierMatches(item, query, activeGroup)}
    header={<GroupRow categories={visibleCategories} group={activeGroup} onGroup={setGroup} />}
    value={value} onChange={id => { setChanging(false); onChange(id); }} required />;
}
