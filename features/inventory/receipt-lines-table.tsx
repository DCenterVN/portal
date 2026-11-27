"use client";

import { useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { QuantityInput } from "./quantity-input";
import { WholeNumberInput } from "./whole-number-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { receiptTotal, priceDeviation, type ReceiptLineRow } from "./receipt-lines";

type ReceiptMaterialOption = { id: string; name: string; sku_code: string; uom_code: string };

export interface ReceiptLinesTableProps {
  rows: ReceiptLineRow[];
  materials: ReceiptMaterialOption[];
  status: "loading" | "ready" | "error";
  supplierSelected: boolean;
  busy: boolean;
  referenceOf?: (sku: string, uom: string) => number | undefined;
  onSku: (key: string, sku: string) => void;
  onPrice: (key: string, price: number | undefined) => void;
  onQuantity: (key: string, quantity: number) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
}

const money = (value: number | undefined | null) => value == null ? "—" : `${value.toLocaleString("vi-VN")} đ`;

function MaterialOption({ name, uom, price, usedAt }: { name: string; uom: string; price: number | undefined; usedAt: number }) {
  return <span className="grid min-w-0 gap-0.5">
    <span className="font-medium">{name}</span>
    <span className="text-xs text-muted-foreground">{uom}{price !== undefined && ` · Giá tham chiếu ${money(price)}`}{usedAt >= 0 && ` · Đã có ở dòng ${usedAt + 1}`}</span>
  </span>;
}

export function ReceiptLinesTable({ rows, materials, status, supplierSelected, busy, referenceOf, onSku, onPrice, onQuantity, onAdd, onRemove }: ReceiptLinesTableProps) {
  const focusKey = useRef<string | null>(null);
  const total = receiptTotal(rows.map(row => row.amount));
  function remove(index: number) {
    if (busy || rows.length <= 1) return;
    focusKey.current = rows[index + 1]?.key ?? "add";
    onRemove(rows[index].key);
  }
  function add() {
    if (busy || rows.length >= 100) return;
    focusKey.current = "new";
    onAdd();
  }
  return <fieldset disabled={busy} className="grid min-w-0 gap-3">
    <legend className="font-semibold">Dòng nhập</legend>
        <Table aria-label="Dòng nhập" className="max-md:block">
      <TableHeader className="max-md:hidden"><TableRow><TableHead>Nguyên liệu</TableHead>
        {["Đơn vị", "Số lượng", "Đơn giá"].map(label => <TableHead key={label} className="w-px whitespace-nowrap">{label}</TableHead>)}
        <TableHead className="w-px text-right whitespace-nowrap">Thành tiền</TableHead>
        <TableHead className="w-px"><span className="sr-only">Xoá</span></TableHead></TableRow></TableHeader>
      <TableBody className="max-md:block">{rows.map((row, index) => <TableRow key={row.key} className="max-md:grid max-md:grid-cols-[auto_minmax(0,1fr)_auto] max-md:items-start max-md:gap-x-2 max-md:gap-y-2 max-md:py-3" ref={element => {
        if (element && (focusKey.current === row.key || (focusKey.current === "new" && index === rows.length - 1))) {
          element.querySelector<HTMLInputElement>("input[role=combobox]")?.focus();
          focusKey.current = null;
        }
      }}>
        <TableCell className="align-top whitespace-normal max-md:order-1 max-md:col-span-3 max-md:p-0 md:min-w-64">
          <fieldset disabled={!supplierSelected || busy}>
            <EntityPicker label={`Nguyên liệu dòng ${index + 1}`} hideLabel name={`receipt-material-${index}`} serializeValue={false}
              items={materials} status={status} getId={item => item.id} getLabel={item => item.name} getMeta={item => `${item.sku_code} · ${item.uom_code}`}
              isDisabled={item => rows.some((other, at) => at !== index && other.sku === item.id)}
              renderOption={item => <MaterialOption name={item.name} uom={item.uom_code} price={referenceOf?.(item.id, item.uom_code)} usedAt={rows.findIndex((other, at) => at !== index && other.sku === item.id)} />}
              value={row.sku} onChange={id => onSku(row.key, id ?? "")} required />
          </fieldset>
          {!supplierSelected && <p className="text-xs text-muted-foreground">Chọn nhà cung cấp trước</p>}
        </TableCell>
        <TableCell className="align-top leading-9 whitespace-nowrap max-md:order-5 max-md:p-0 max-md:text-sm max-md:text-muted-foreground">{row.uom || "—"}</TableCell>
        <TableCell className="align-top max-md:order-2 max-md:p-0"><QuantityInput groupClassName="w-36" label={`Số lượng dòng ${index + 1}`} stepper={{ decrease: `Giảm số lượng dòng ${index + 1}`, increase: `Tăng số lượng dòng ${index + 1}` }} value={row.quantity} onValue={value => onQuantity(row.key, value)} /></TableCell>
        <TableCell className="align-top max-md:order-3 max-md:p-0"><WholeNumberInput groupClassName="w-full md:w-40" suffix="đ" label={`Đơn giá dòng ${index + 1}`} name="unit_cost_vnd" min={0} emptyValue={Number.NaN} value={row.unitPrice} onValue={value => onPrice(row.key, value === undefined || Number.isNaN(value) ? Number.NaN : value)} />
          {row.referencePrice !== undefined && <p className="mt-1 text-xs whitespace-nowrap text-muted-foreground">Giá tham chiếu {money(row.referencePrice)}</p>}
          {row.unitPrice !== undefined && Number.isSafeInteger(row.unitPrice) && row.unitPrice >= 0 && row.referencePrice !== undefined && row.unitPrice !== row.referencePrice && <p role="status" className="text-xs text-muted-foreground">Giá nhập khác bảng giá tham chiếu{priceDeviation(row.unitPrice, row.referencePrice) === null ? "" : ` (${priceDeviation(row.unitPrice, row.referencePrice)!.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%)`}</p>}</TableCell>
        <TableCell className="text-right align-top leading-9 whitespace-nowrap tabular-nums max-md:order-6 max-md:col-span-2 max-md:p-0">{money(row.amount)}</TableCell>
        <TableCell className="align-top max-md:order-4 max-md:p-0"><Button type="button" variant="ghost" size="icon" aria-label={`Xoá dòng ${index + 1}`} title={rows.length === 1 ? "Giữ ít nhất một dòng nhập" : `Xoá dòng ${index + 1}`}
          disabled={busy || rows.length === 1} onClick={() => remove(index)}><Trash2 aria-hidden="true" className="text-destructive/80 [button:hover>&]:text-destructive" /></Button></TableCell>
      </TableRow>)}</TableBody>
    </Table>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button ref={element => {
        if (element && focusKey.current === "add") { element.focus(); focusKey.current = null; }
      }} type="button" variant="outline" size="sm" className="w-fit" disabled={busy || rows.length >= 100} onClick={add}><Plus aria-hidden="true" className="text-primary" />Thêm dòng nhập</Button>
      <p className="ml-auto text-sm tabular-nums">{rows.length} dòng · Tổng tiền dự kiến <output aria-label="Tổng tiền dự kiến" className="font-semibold">{total === null ? "Chưa đủ giá" : money(total)}</output></p>
    </div>
    {rows.length >= 100 && <p className="text-xs text-muted-foreground">Tối đa 100 dòng</p>}
  </fieldset>;
}
