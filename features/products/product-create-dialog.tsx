"use client";

import React, { useState } from "react";
import { PackagePlus } from "lucide-react";
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
import { useToast } from "@/components/ui/toast";
import { createProduct, Product } from "@/lib/api/sales";

interface ProductCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: Product) => void;
}

export function ProductCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProductCreateDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [uom, setUom] = useState("kg");
  const [priceVnd, setPriceVnd] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !skuCode.trim() || !priceVnd) {
      toast.error("Thiếu thông tin", "Vui lòng nhập đầy đủ tên, mã SKU và giá niêm yết.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createProduct({
        name: name.trim(),
        sku_code: skuCode.trim(),
        uom,
        base_price_vnd: Number(priceVnd) || 0,
        description: description.trim() || undefined,
      });

      toast.success("Tạo sản phẩm thành công", `Mã SKU ${created.sku_code} ở trạng thái bản nháp (DRAFT).`);
      onSuccess?.(created);
      onOpenChange(false);
      // Reset form
      setName("");
      setSkuCode("");
      setPriceVnd("");
      setDescription("");
    } catch (err: unknown) {
      toast.error("Không thể tạo sản phẩm", err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="bg-[var(--card)]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                <PackagePlus className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Thêm Sản Phẩm Mới (SKU Catalog)
                </DialogTitle>
                <DialogDescription>
                  Khởi tạo thông tin mặt hàng mới. Sản phẩm tạo xong sẽ ở trạng thái Bản nháp (DRAFT) chờ duyệt kích hoạt.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 my-3 text-xs">
            <div>
              <Label className="text-xs font-semibold">Tên sản phẩm (*)</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Cá hồi Na Uy fillet đông lạnh"
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Mã định danh SKU (*)</Label>
                <Input
                  required
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
                  placeholder="SKU-HN-005"
                  className="mt-1 text-xs font-mono"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Đơn vị tính (UOM) (*)</Label>
                <select
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="kg">kg (Kilogram)</option>
                  <option value="g">g (Gram)</option>
                  <option value="khay">khay</option>
                  <option value="túi">túi</option>
                  <option value="hộp">hộp</option>
                  <option value="gói">gói</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Giá niêm yết (VND) (*)</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="1000"
                  value={priceVnd}
                  onChange={(e) => setPriceVnd(e.target.value)}
                  placeholder="Ví dụ: 300000"
                  className="mt-1 text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Mô tả sản phẩm & Quy cách bảo quản</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả nguồn gốc, cấp đông IQF -18°C..."
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="rounded-xl border-[var(--border)] text-xs font-semibold"
            >
              Huỷ
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              {submitting ? "Đang tạo..." : "Lưu bản nháp (DRAFT)"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
