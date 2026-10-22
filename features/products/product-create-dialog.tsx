"use client";

import { useId, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createDraftProduct, type Product } from "@/lib/api/sales";

interface ProductCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: Product) => void;
}

export function ProductCreateDialog({ open, onOpenChange, onSuccess }: ProductCreateDialogProps) {
  const id = useId();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !name.trim() || !slug.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await createDraftProduct({ name: name.trim(), slug: slug.trim() });
      onSuccess?.({ ...created, status: "DRAFT", sku_code: "", uom: "", created_at: "" });
      toast.success("Đã tạo sản phẩm nháp", created.name);
      onOpenChange(false);
      setName("");
      setSlug("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không tạo được sản phẩm nháp");
    } finally {
      setSubmitting(false);
    }
  }
  return <Dialog open={open} onOpenChange={value => { if (!submitting) onOpenChange(value); }}>
    <DialogContent>
      <form onSubmit={submit} aria-busy={submitting}>
        <DialogHeader>
          <DialogTitle>Tạo sản phẩm nháp</DialogTitle>
          <DialogDescription>Lưu tên và mã sản phẩm. Sản phẩm chưa được mở bán.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor={`${id}-name`}>Tên sản phẩm (*)</Label>
            <Input id={`${id}-name`} required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Bún bò Huế" />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${id}-slug`}>Mã sản phẩm (*)</Label>
            <Input id={`${id}-slug`} required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e => setSlug(e.target.value)} aria-describedby={`${id}-hint`} placeholder="bun-bo-hue" />
            <p id={`${id}-hint`} className="text-xs text-[var(--color-muted)]">Chữ thường không dấu, số và dấu gạch ngang.</p>
          </div>
          {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button type="submit" disabled={submitting || !name.trim() || !slug.trim()}>{submitting ? "Đang tạo..." : "Lưu bản nháp (DRAFT)"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
