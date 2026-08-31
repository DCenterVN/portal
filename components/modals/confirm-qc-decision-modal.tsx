"use client";

import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmQCDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotCode?: string;
  productName?: string;
  weightFormatted?: string;
  totalValueFormatted?: string;
  onConfirmApprove?: () => void;
  isSubmitting?: boolean;
}

export function ConfirmQCDecisionModal({
  open,
  onOpenChange,
  lotCode = "#LOT-2026-CH-0091",
  productName = "Cá hồi Na Uy fillet đông lạnh",
  weightFormatted = "495,0 kg",
  totalValueFormatted = "148.500.000 ₫",
  onConfirmApprove,
  isSubmitting = false,
}: ConfirmQCDecisionModalProps) {
  const criteria = [
    { label: "1. Cảm quan", value: "ĐẠT — Màu sắc hồng tươi tự nhiên, bao bì nguyên vẹn hút chân không." },
    { label: "2. Nhiệt độ tâm", value: "ĐẠT — Đo thực tế -18,5 °C (Ngưỡng an toàn <= -18,0 °C)." },
    { label: "3. Hạn dùng & Tem nhãn", value: "ĐẠT — HSD: 20/08/2027 (còn 12 tháng), tem QR truy xuất hợp lệ." },
    { label: "4. Mẫu lưu Lab", value: "ĐẠT — Đã lưu 250,0 g tại tủ đông lưu mẫu mã #ML-2026-0827-A." },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="bg-[var(--card)]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 mb-1">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Xác nhận Phê duyệt Nhập kho Lô hàng {lotCode}
              </DialogTitle>
              <DialogDescription>
                Kiểm định viên chịu trách nhiệm về kết quả đạt chuẩn 4 tiêu chí an toàn thực phẩm.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* Summary Banner */}
          <div className="p-3 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)] flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-[var(--foreground)]">{productName}</div>
              <div className="text-[11px] text-[var(--muted-foreground)]">Khối lượng: {weightFormatted}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Giá trị nhập</div>
              <div className="font-serif font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {totalValueFormatted}
              </div>
            </div>
          </div>

          {/* 4 Criteria Checklist */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Kết quả kiểm tra 4 tiêu chí bắt buộc:
            </div>
            {criteria.map((c, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2"
              >
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-[var(--foreground)] mr-1">{c.label}:</span>
                  <span className="text-[var(--muted-foreground)]">{c.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl border-[var(--border)] text-xs font-semibold"
          >
            Huỷ bỏ
          </Button>

          <Button
            type="button"
            onClick={onConfirmApprove}
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận nhập kho thương mại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
