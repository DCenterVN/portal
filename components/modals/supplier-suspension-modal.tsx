"use client";

import React, { useState } from "react";
import { AlertOctagon, ShieldX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SupplierSuspensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierCode?: string;
  supplierName?: string;
  onConfirmSuspension?: (data: { reason: string; durationDays: number; note: string }) => void;
}

export function SupplierSuspensionModal({
  open,
  onOpenChange,
  supplierCode = "NCC-QN-03",
  supplierName = "Thuỷ Hải Sản Đông Lạnh Quảng Ninh",
  onConfirmSuspension,
}: SupplierSuspensionModalProps) {
  const [reason, setReason] = useState("Vi phạm chuỗi lạnh 3 lần liên tiếp trong tháng 8/2026");
  const [durationDays, setDurationDays] = useState(30);
  const [note, setNote] = useState("Tạm đình chỉ nhập hàng cho đến khi hoàn tất tái đánh giá quy trình bảo quản lạnh");

  const handleConfirm = () => {
    onConfirmSuspension?.({
      reason,
      durationDays,
      note,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="border-rose-500/30 bg-[var(--card)]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 mb-1">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 shrink-0">
              <ShieldX className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-rose-600 dark:text-rose-400 text-lg font-bold">
                Tạm đình chỉ hợp tác Nhà cung cấp
              </DialogTitle>
              <DialogDescription className="text-rose-600/80 dark:text-rose-400/80">
                Khoá tạo mới đơn đặt hàng và tiếp nhận hàng hóa từ đối tác này.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          <div className="p-3 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]">
            <div className="font-bold text-sm text-[var(--foreground)]">{supplierName}</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Mã đối tác: {supplierCode}</div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Lý do đình chỉ</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Thời hạn đình chỉ</Label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value={15}>15 ngày (Cảnh cáo cấp độ 1)</option>
              <option value={30}>30 ngày (Vi phạm tiêu chuẩn chuỗi lạnh)</option>
              <option value={90}>90 ngày (Tái phạm nghiêm trọng)</option>
              <option value={365}>Đình chỉ vô thời hạn (Thu hồi chứng chỉ)</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Ghi chú kiểm định & Khuyến nghị</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-[var(--border)] text-xs font-semibold"
          >
            Đóng
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
          >
            <AlertOctagon className="size-3.5 mr-1.5" />
            Xác nhận đình chỉ (SUSPENDED)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
