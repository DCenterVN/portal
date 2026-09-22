"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Skeleton,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
  Toast,
  useToast,
} from "@dcentervn/ui";

export interface OverlayShowcaseProps {
  filterCategory?: "all" | "badges" | "actions" | "products" | "overlays";
}

export function OverlayShowcase({ filterCategory = "all" }: OverlayShowcaseProps) {
  const { showToast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [hasError, setHasError] = useState(false);

  const showModals = filterCategory === "all" || filterCategory === "overlays";

  if (!showModals) return null;

  return (
    <>
      {/* Lớp phủ & Hộp thoại kiểm định QC */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-[var(--color-ink)]">
          Hộp thoại kiểm định chất lượng (QC Modal)
        </h2>
        <Card variant="glass" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
          <div>
            <h4 className="font-serif text-base font-bold text-[var(--color-ink)]">
              Quy trình phê duyệt nhập kho chuỗi lạnh
            </h4>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Lớp phủ làm mờ hậu cảnh (Backdrop Blur), hỗ trợ phím ESC và bắt sự kiện đóng bên ngoài.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
            Mở hộp thoại kiểm định
          </Button>
        </Card>

        <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} size="md">
          <DialogClose onClick={() => setIsDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Xác nhận Phê duyệt Nhập Kho QC</DialogTitle>
            <DialogDescription>
              Mã lô hàng kiểm định #LOT-2026-CH-0091 đạt 4/4 chỉ tiêu chất lượng nghiêm ngặt.
            </DialogDescription>
          </DialogHeader>
          <DialogContent>
            <div className="space-y-3 rounded-lg bg-[var(--color-panel)] p-4 border border-[var(--color-line)] text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Nhiệt độ tâm lô hàng:</span>
                <span className="font-semibold text-[var(--color-cold)]">-18,7 °C (Đạt chuẩn)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Tổng trọng lượng thực nhận:</span>
                <span className="font-semibold text-[var(--color-ink)]">1.250 kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Chứng nhận kiểm định:</span>
                <span className="font-semibold text-[var(--color-fresh)]">VietGAP + Chuỗi Lạnh A1</span>
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsDialogOpen(false)}>
              Xác nhận nhập kho
            </Button>
          </DialogFooter>
        </Dialog>
      </section>

      {/* Thông báo chuỗi lạnh & Vận hành */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="font-serif text-lg font-bold text-[var(--color-ink)]">
            Thông báo trạng thái & Cảnh báo chuỗi lạnh (Live Toasts)
          </h2>
          <span className="text-xs text-[var(--color-muted)]">
            Kích hoạt toast nổi góc trên phải
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              showToast({
                variant: "success",
                title: "Kiểm định đạt chuẩn VietGAP",
                message: "Đã phê duyệt nhập kho lô hàng rau xà lách hữu cơ.",
              })
            }
          >
            Toast VietGAP chuẩn
          </Button>
          <Button
            variant="cold"
            size="sm"
            onClick={() =>
              showToast({
                variant: "cold",
                title: "Giám sát chuỗi lạnh -18,5 °C",
                message: "Cảm biến kho lạnh Tây Hồ ghi nhận nhiệt độ ổn định.",
              })
            }
          >
            Toast Chuỗi lạnh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              showToast({
                variant: "warning",
                title: "Cảnh báo dao động nhiệt",
                message: "Khoang lạnh số 3 dao động lên -16,2 °C cần kiểm tra.",
              })
            }
          >
            Toast Cảnh báo nhiệt
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              showToast({
                variant: "error",
                title: "Lỗi kết nối cảm biến",
                message: "Mất tín hiệu kết nối thiết bị trạm cân RFID số 12.",
              })
            }
          >
            Toast Lỗi thiết bị
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <Toast
            variant="success"
            title="Kiểm định đạt chuẩn VietGAP"
            message="Đã lưu biên bản đánh giá chất lượng lô rau xà lách thủy canh vào sổ kho."
          />
          <Toast
            variant="cold"
            title="Giám sát Chuỗi lạnh -18,5 °C"
            message="Cảm biến IoT trạm trung tâm Tây Hồ ghi nhận nhiệt độ ổn định."
          />
        </div>
      </section>

      {/* Nhập liệu vận hành & Trạng thái tải */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-[var(--color-ink)]">
          Nhập liệu vận hành & Trạng thái tải (Inputs & Skeletons)
        </h2>
        <Card variant="default" className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-3">
            <Input
              label="Email quản trị kho"
              placeholder="admin@vietsach.vn"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Định dạng email xác thực nội bộ chuỗi cung ứng"
            />
            <Input
              label="Mã định danh trạm trung chuyển"
              placeholder="VD: HUB-LONG-HAU-01"
              error={hasError ? "Mã trạm không tồn tại trên hệ thống chuỗi lạnh" : undefined}
            />
            <Button variant="outline" size="sm" onClick={() => setHasError(!hasError)}>
              Bật / Tắt trạng thái lỗi
            </Button>
          </div>
          <div className="space-y-3 flex flex-col justify-center">
            <p className="text-xs font-semibold text-[var(--color-muted)]">
              Trạng thái tải dữ liệu cảm biến (Skeleton)
            </p>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      </section>
    </>
  );
}
