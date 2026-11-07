"use client";

import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { receiveTransfer, type StockTransfer } from "@/lib/api/stock-transfers";
import { hasVariance, transferError } from "@/lib/stock-transfer";
import { receiveBody, receiveDefaults, receiveSchema, type ReceiveValues } from "./receive-model";
import { useTransferEvidence } from "./use-transfer-evidence";

export function useReceiveTransfer(transfer: StockTransfer) {
  const router = useRouter();
  const evidence = useTransferEvidence(transfer.id);
  const schema = useMemo(() => receiveSchema(transfer), [transfer]);
  const form = useForm<ReceiveValues>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues: receiveDefaults(transfer) });
  const rows = form.watch("rows");
  const short = hasVariance(rows.map((row, index) => ({ sent: transfer.lines[index].sent_qty, received: row.received, reason: row.reason })));
  const needsPhoto = short && evidence.photos.length === 0;
  const command = useRef<{ body: string; key: string } | null>(null);

  async function submit(values: ReceiveValues) {
    if (needsPhoto) { evidence.setError("Có dòng nhận thiếu nên cần ít nhất một ảnh."); return; }
    try {
      const refs = evidence.photos.length ? await evidence.uploadAll() : [];
      const body = receiveBody(transfer, values, refs);
      const serialized = JSON.stringify(body);
      if (command.current?.body !== serialized) command.current = { body: serialized, key: crypto.randomUUID() };
      await receiveTransfer(transfer.id, body, command.current.key);
      await mutate(key => Array.isArray(key) && ["stock-transfers", "stock-rows", "branch-lots"].includes(String(key[0])));
      router.push(`/inventory/stock-transfers/${transfer.id}`);
    } catch (failed) {
      form.setError("root", { type: "server", message: failed instanceof Error && !("status" in failed) ? failed.message : transferError(failed) });
    }
  }
  return { form, evidence, short, needsPhoto, submit: form.handleSubmit(submit) };
}
