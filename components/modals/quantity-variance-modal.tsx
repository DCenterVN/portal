"use client";

import React, { useState } from "react";
import { FileEdit, Scale } from "lucide-react";
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

interface QuantityVarianceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku?: string;
  productName?: string;
  expectedKg?: number;
  onSaveVariance?: (data: { actualKg: number; reason: string; note: string }) => void;
}

export function QuantityVarianceModal({
  open,
  onOpenChange,
  sku = "SKU-HN-001",
  productName = "Cá hồi Na Uy fillet đông lạnh",
  expectedKg = 500.0,
  onSaveVariance,
}: QuantityVarianceModalProps) {
  const [actualKg, setActualKg] = useState<string>("495,0");
  const [reason, setReason] = useState<string>("Hao hụt tự nhiên trong vận chuyển");
  const [note, setNote] = useState<string>("");

  const numActual = parseFloat(actualKg.replace(",", ".")) || 0;
  const variance = numActual - expectedKg;

  const handleSave = () => {
    onSaveVariance?.({
      actualKg: numActual,
      reason,
      note,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="bg-[var(--card)]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-[var(--primary)] mb-1">
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 shrink-0">
              <FileEdit className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Ghi nhận Chênh lệch Số lượng Thực nhận
              </DialogTitle>
              <DialogDescription>
                Lập biên bản sai lệch số lượng giao hàng đối với đơn nhập kho.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          <div className="p-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
            <div className="font-bold text-sm text-[var(--foreground)]">{productName}</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Mã SKU: {sku}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Dự kiến giao (kg)</Label>
              <Input
                disabled
                value={expectedKg.toFixed(1).replace(".", ",")}
                className="mt-1 bg-[var(--secondary)]/50 text-xs font-bold"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Thực nhận (kg)</Label>
              <Input
                value={actualKg}
                onChange={(e) => setActualKg(e.target.value)}
                placeholder="Nhập số cân thực tế"
                className="mt-1 text-xs font-bold"
              />
            </div>
          </div>

          {/* Variance indicator */}
          <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between text-xs">
            <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
              <Scale className="size-3.5 text-amber-500" />
              Chênh lệch tính toán:
            </span>
            <span className="font-bold font-serif text-amber-600 dark:text-amber-400">
              {variance > 0 ? `+${variance.toFixed(1).replace(".", ",")}` : variance.toFixed(1).replace(".", ",")} kg
            </span>
          </div>

          <div>
            <Label className="text-xs font-semibold">Lý do chênh lệch</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="Hao hụt tự nhiên trong vận chuyển">Hao hụt tự nhiên trong vận chuyển</option>
              <option value="Dập nát bao bì, loại bỏ tại chỗ">Dập nát bao bì, loại bỏ tại chỗ</option>
              <option value="Nhà cung cấp giao thiếu số lượng">Nhà cung cấp giao thiếu số lượng</option>
              <option value="Nhà cung cấp giao thừa khuyến mãi">Nhà cung cấp giao thừa khuyến mãi</option>
              <option value="Lý do khác">Lý do khác</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Ghi chú chi tiết</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm biên bản (nếu có)..."
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
            Huỷ
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-bold"
          >
            Lưu biên bản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
