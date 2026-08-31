"use client";

import { AlertTriangle, Flame, FileX, BarChart2, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ColdChainViolationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotCode?: string;
  measuredTemp?: string;
  thresholdTemp?: string;
  durationMinutes?: number;
  sensorCode?: string;
  onViewHeatmap?: () => void;
  onCreateDisposalReport?: () => void;
}

export function ColdChainViolationModal({
  open,
  onOpenChange,
  lotCode = "#LOT-2026-CH-0091",
  measuredTemp = "-12,4 °C",
  thresholdTemp = "-18,0 °C",
  durationMinutes = 45,
  sensorCode = "#TEMP-A1-04",
  onViewHeatmap,
  onCreateDisposalReport,
}: ColdChainViolationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" layer="critical" className="border-rose-500/30 bg-[var(--card)]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 mb-1">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 shrink-0">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-rose-600 dark:text-rose-400 text-lg font-bold">
                CẢNH BÁO VI PHẠM CHUỖI LẠNH — KHÔNG ĐẠT TIÊU CHUẨN
              </DialogTitle>
              <DialogDescription className="text-rose-600/80 dark:text-rose-400/80">
                Phát hiện gián đoạn nhiệt độ bảo quản vượt ngưỡng an toàn thực phẩm. Quy tắc Fail-Closed được kích hoạt.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Nhiệt độ đo được
              </div>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                <Flame className="size-4 shrink-0" />
                {measuredTemp}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                Ngưỡng chuẩn: &le; {thresholdTemp}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40">
              <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Thời gian vi phạm
              </div>
              <div className="text-xl font-extrabold text-[var(--foreground)] mt-1">
                {durationMinutes} phút
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                14:15 &ndash; 15:00 hôm nay
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40">
              <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Mã cảm biến & Lô
              </div>
              <div className="text-sm font-bold text-[var(--foreground)] mt-1 truncate">
                {sensorCode}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5 truncate">
                Lô: {lotCode}
              </div>
            </div>
          </div>

          {/* Hard-block note */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-bold">Quy định chuỗi lạnh nghiêm ngặt: </span>
              Lô hàng bị khoá nhập kho tự động. Hệ thống tuyệt đối không cho phép ghi đè (override) hoặc bỏ qua cảnh báo này để bảo đảm an toàn thực phẩm.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onViewHeatmap}
            className="rounded-xl border-[var(--border)] text-xs font-semibold"
          >
            <BarChart2 className="size-3.5 mr-1.5" />
            Xem biểu đồ nhiệt chi tiết
          </Button>

          <Button
            type="button"
            onClick={onCreateDisposalReport}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
          >
            <FileX className="size-3.5 mr-1.5" />
            Lập biên bản huỷ lô hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
