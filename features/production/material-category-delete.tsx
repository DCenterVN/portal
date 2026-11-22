"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FetchError } from "@/lib/fetcher";
import { deleteCategory, viMessage } from "@/lib/api/material-catalog-write";
import { IconAction } from "./icon-action";

export function DeleteCategory({ code, label, onDeleted }: { code: string; label: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirm = async () => {
    setBusy(true); setError("");
    try { await deleteCategory(code.toUpperCase()); setOpen(false); onDeleted(); }
    catch (cause) { setError(cause instanceof FetchError && cause.status === 409 && cause.message ? cause.message : viMessage(cause, "category")); }
    finally { setBusy(false); }
  };
  return <AlertDialog open={open} onOpenChange={value => { setOpen(value); setError(""); }}>
    <AlertDialogTrigger asChild><IconAction icon={Trash2} label="Xoá" className="text-destructive hover:text-destructive" /></AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{`Xoá hẳn loại "${label}"? Không lấy lại được.`}</AlertDialogTitle>
        <AlertDialogDescription>Chỉ xoá được khi chưa có nhóm con, nhà cung cấp hay nguyên liệu nào dùng.</AlertDialogDescription>
      </AlertDialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={busy}>Huỷ</AlertDialogCancel>
        <Button variant="destructive" disabled={busy} onClick={confirm}>Xoá</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
