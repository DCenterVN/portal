"use client";

import React from "react";
import { AlertCircle, ArrowRightLeft, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AllergenWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detectedAllergen?: string;
  sourceItem?: string;
  adjacentItem?: string;
  onQuarantine?: () => void;
  onRelocate?: () => void;
}

export function AllergenWarningModal({
  open,
  onOpenChange,
  detectedAllergen = "Giáp xác (Crustacean)",
  sourceItem = "Tôm sú bóc nõn cấp đông (#SKU-HN-003)",
  adjacentItem = "Cá hồi Na Uy fillet đông lạnh (#SKU-HN-001)",
  onQuarantine,
  onRelocate,
}: AllergenWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" layer="critical" className="border-amber-500/30 bg-[var(--card)]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 mb-1">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-amber-600 dark:text-amber-400 text-lg font-bold">
                Phát hiện Nguy cơ Nhiễm chéo Dị nguyên
              </DialogTitle>
              <DialogDescription className="text-amber-600/80 dark:text-amber-400/80">
                Khoang chứa thực phẩm chưa có màng ngăn cách ly dị nguyên đạt chuẩn HACCP.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 my-2 text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
              <span>Dị nguyên xác định:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{detectedAllergen}</span>
            </div>
            <div className="text-[var(--foreground)]">
              Mặt hàng nguồn: <span className="font-bold">{sourceItem}</span>
            </div>
            <div className="text-[var(--muted-foreground)]">
              Xếp liền kề với: <span className="font-semibold text-[var(--foreground)]">{adjacentItem}</span> mà không có vách ngăn nhiệt & dị nguyên chuyên dụng.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onQuarantine}
            size="default"
          >
            <ShieldAlert className="size-3.5 mr-1.5 text-amber-500" />
            Cách ly kệ hàng
          </Button>

          <Button
            type="button"
            onClick={onRelocate}
            variant="default"
            size="default"
          >
            <ArrowRightLeft className="size-3.5 mr-1.5" />
            Chuyển vị trí kho chỉ định
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
