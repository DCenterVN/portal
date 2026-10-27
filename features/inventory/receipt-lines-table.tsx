"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { EntityPicker } from "@/components/ui/entity-picker";
import { TextInput } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { receiptTotal, priceDeviation, type ReceiptLineRow } from "./receipt-lines";

type ReceiptMaterialOption = { id: string; name: string; sku_code: string; uom_code: string };

export interface ReceiptLinesTableProps {
  rows: ReceiptLineRow[];
  materials: ReceiptMaterialOption[];
  status: "loading" | "ready" | "error";
  supplierSelected: boolean;
  busy: boolean;
  onSku: (key: string, sku: string) => void;
  onPrice: (key: string, price: number | undefined) => void;
  onQuantity: (key: string, quantity: number) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
}

const money = (value: number | undefined | null) => value == null ? "—" : `${value.toLocaleString("vi-VN")} VND`;

export function ReceiptLinesTable({ rows, materials, status, supplierSelected, busy, onSku, onPrice, onQuantity, onAdd, onRemove }: ReceiptLinesTableProps) {
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
    <p className="text-xs text-fg-3 md:hidden">Vuốt ngang để xem đơn giá và thành tiền.</p>
    <Table aria-label="Dòng nhập" className="min-w-max">
      <TableHeader><TableRow>{["Nguyên liệu", "ĐVT", "SL", "Đơn giá", "Thành tiền", "Xoá"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{rows.map((row, index) => <TableRow key={row.key} ref={element => {
        if (element && (focusKey.current === row.key || (focusKey.current === "new" && index === rows.length - 1))) {
          element.querySelector<HTMLInputElement>("input[role=combobox]")?.focus();
          focusKey.current = null;
        }
      }}>
        <TableCell className="min-w-64">
          <fieldset disabled={!supplierSelected || busy}>
            <EntityPicker label={`Nguyên liệu dòng ${index + 1}`} name={`receipt-material-${index}`} serializeValue={false}
              items={materials} status={status} getId={item => item.id} getLabel={item => item.name} getMeta={item => `${item.sku_code} · ${item.uom_code}`}
              value={row.sku} onChange={id => onSku(row.key, id ?? "")} required />
          </fieldset>
          {!supplierSelected && <p className="text-xs text-fg-3">Chọn NCC trước</p>}
        </TableCell>
        <TableCell>{row.uom || "—"}</TableCell>
        <TableCell><TextInput aria-label={`Số lượng dòng ${index + 1}`} type="number" step="0.001" min="0.001" required value={row.quantity}
          onChange={event => onQuantity(row.key, Number(event.target.value))} /></TableCell>
        <TableCell className="text-right tabular-nums"><TextInput aria-label={`Đơn giá dòng ${index + 1}`} name="unit_cost_vnd" type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" required value={row.unitPrice === undefined || Number.isNaN(row.unitPrice) ? "" : row.unitPrice} onChange={event => onPrice(row.key, event.target.value === "" ? Number.NaN : Number(event.target.value))} />
          {row.referencePrice !== undefined && <p className="text-xs text-fg-3">Giá tham chiếu: {money(row.referencePrice)}</p>}
          {row.unitPrice !== undefined && Number.isSafeInteger(row.unitPrice) && row.unitPrice >= 0 && row.referencePrice !== undefined && row.unitPrice !== row.referencePrice && <p role="status" className="text-xs text-fg-3">Giá nhập khác bảng giá tham chiếu{priceDeviation(row.unitPrice, row.referencePrice) === null ? "" : ` (${priceDeviation(row.unitPrice, row.referencePrice)!.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%)`}</p>}</TableCell>
        <TableCell className="text-right tabular-nums">{money(row.amount)}</TableCell>
        <TableCell><Button type="button" variant="ghost" aria-label={`Xoá dòng ${index + 1}`} title={rows.length === 1 ? "Giữ ít nhất một dòng nhập" : `Xoá dòng ${index + 1}`}
          disabled={busy || rows.length === 1} onClick={() => remove(index)}>Xoá</Button></TableCell>
      </TableRow>)}</TableBody>
    </Table>
    <Button ref={element => {
      if (element && focusKey.current === "add") { element.focus(); focusKey.current = null; }
    }} type="button" variant="outline" disabled={busy || rows.length >= 100} onClick={add}>Thêm dòng nhập</Button>
    {rows.length >= 100 && <p className="text-xs text-fg-3">Tối đa 100 dòng</p>}
    <p className="tabular-nums">Số dòng: {rows.length} · Tổng tiền dự kiến: <output aria-label="Tổng tiền dự kiến">{total === null ? "Chưa đủ giá" : money(total)}</output></p>
  </fieldset>;
}
