"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useAccess } from "@/lib/access-boundary";
import { createTransfer } from "@/lib/api/stock-transfers";
import { insufficientSku, formatQuantity, transferError } from "@/lib/stock-transfer";
import { blankLine, lotOptions, sendBody, sendSchema, MAX_LINES, type SendValues } from "./send-form-model";
import { useBranchLabels, useBranchLots, useMaterialNames, useStockRows } from "./use-transfer-lookups";

export function useSendTransfer() {
  const { scope } = useAccess();
  const router = useRouter();
  const branch = scope?.branchId ?? "";
  const stock = useStockRows(branch);
  const lots = useBranchLots(branch);
  const names = useBranchLabels();
  const material = useMaterialNames();
  const rows = useMemo(() => (stock.data ?? []).filter(row => row.available_quantity > 0), [stock.data]);
  const schema = useMemo(() => sendSchema(rows, lots.lots), [rows, lots.lots]);
  const form = useForm<SendValues>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues: { to: "", lines: [blankLine()] } });
  const array = useFieldArray({ control: form.control, name: "lines" });
  const command = useRef<{ body: string; key: string } | null>(null);
  const only = names.targets.length === 1 ? names.targets[0].id : "";
  const soleSku = rows.length === 1 ? rows[0].sku_ref : "";

  useEffect(() => { if (only && !form.getValues("to")) form.setValue("to", only); }, [only, form]);
  useEffect(() => { if (soleSku && !form.getValues("lines.0.sku")) form.setValue("lines.0.sku", soleSku); }, [soleSku, form]);

  const watched = form.watch("lines");
  const recheck = (index: number) => { if (form.getValues(`lines.${index}.quantity`)) void form.trigger(`lines.${index}.quantity`); };
  const used = (index: number) => new Set(watched.filter((_, at) => at !== index).map(line => line.sku));
  const skuOptions = (index: number) => rows.filter(row => !used(index).has(row.sku_ref)).map(row => ({ id: row.sku_ref, name: material(row.sku_ref), meta: `Còn khả dụng ${formatQuantity(row.available_quantity, row.uom)}` }));

  async function submit(values: SendValues) {
    const body = sendBody(values, rows);
    const serialized = JSON.stringify(body);
    if (command.current?.body !== serialized) command.current = { body: serialized, key: crypto.randomUUID() };
    try {
      const created = await createTransfer(body, command.current.key);
      await mutate(key => Array.isArray(key) && ["stock-rows", "stock-transfers", "branch-lots"].includes(String(key[0])));
      router.push(`/inventory/stock-transfers/${created.id}`);
    } catch (failed) {
      const sku = insufficientSku(failed);
      const at = values.lines.findIndex(line => line.sku === sku);
      if (at >= 0) {
        const row = rows.find(item => item.sku_ref === sku);
        form.setError(`lines.${at}.quantity`, { type: "server", message: `Không đủ tồn để gửi${row ? `: chỉ còn ${formatQuantity(row.available_quantity, row.uom)}` : ""}. Giảm số lượng hoặc chọn lô khác.` });
        return;
      }
      form.setError("root", { type: "server", message: transferError(failed) });
    }
  }
  return {
    form, array, names, recheck, material, rows, lots, skuOptions, lotChoices: (sku: string) => lotOptions(lots.lots, sku),
    stockStatus: stock.data ? "ready" as const : stock.error ? "error" as const : "loading" as const, retryStock: () => void stock.mutate(),
    canAdd: array.fields.length < MAX_LINES && array.fields.length < rows.length,
    submit: form.handleSubmit(submit),
  };
}
