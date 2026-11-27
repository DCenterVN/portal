"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DishImageBox({ current, canEdit, busy, error, hint, onPick, onRemove }: {
  current: string | null;
  canEdit: boolean;
  busy: boolean;
  error?: string;
  hint?: string;
  onPick: (file: File) => void;
  onRemove?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const showImage = Boolean(current) && failedUrl !== current;
  const pick = (list: FileList | null) => {
    if (!canEdit || busy) return;
    const file = list?.[0];
    if (file) onPick(file);
  };
  return <Card className="gap-0 overflow-hidden py-0"><CardContent className="p-0">
    <div
      onDragOver={event => {
        if (!canEdit || busy) {
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setDragging(true);
      }}
      onDragLeave={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={event => {
        setDragging(false);
        if (!canEdit || busy) return;
        event.preventDefault();
        pick(event.dataTransfer.files);
      }}
      className="flex items-center gap-4 p-4"
    >
      <div className={cn(
        "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted text-muted-foreground sm:size-24",
        dragging && "border-primary bg-primary/5 text-primary"
      )}>
        {showImage
          ? <img key={current} src={current as string} alt="Ảnh món ăn" onError={() => setFailedUrl(current)} className="size-full object-cover" />
          : <ImagePlus className="size-5" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">Ảnh món ăn</h2>
          <p className="text-xs text-muted-foreground">
            {hint ?? (!canEdit
              ? (current ? "Ảnh đại diện của món ăn." : "Chưa có ảnh món ăn.")
              : current
                ? "Kéo ảnh mới vào khung hoặc bấm Đổi ảnh."
                : "Kéo ảnh vào khung hoặc bấm Chọn ảnh (JPEG, PNG, WebP tối đa 5 MB).")}
          </p>
        </div>
        {canEdit && <>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={!canEdit || busy}
            tabIndex={-1}
            aria-label="Chọn ảnh món"
            aria-describedby={error ? errorId : undefined}
            className="sr-only"
            onChange={event => {
              pick(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              <ImagePlus aria-hidden="true" />
              {current ? "Đổi ảnh" : "Chọn ảnh"}
            </Button>
            {current && onRemove && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onRemove}>
              <Trash2 aria-hidden="true" />
              Xoá ảnh
            </Button>}
          </div>
        </>}
        {error
          ? <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>
          : Boolean(current) && !showImage && <p role="alert" className="text-xs text-destructive">Không tải được ảnh xem trước.</p>}
      </div>
    </div>
  </CardContent></Card>;
}
