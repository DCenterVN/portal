"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SEMI_KINDS, semiKindLabels, slotOfSemiKind, type SemiFinishedItem, type SemiFinishedLine, type SemiKind, type SemiSlot } from "@/lib/api/semi-finished";
import { allergenSummary } from "@/lib/dishes/allergens";
import { uomLabel } from "@/lib/dishes/ingredients";
import { cn } from "@/lib/utils";
import { matchesName } from "../materials-catalog";

export function formatSemiIngredients(components: SemiFinishedLine[]): string {
  return components
    .map(c => {
      const label = c.name?.trim() || "Nguyên liệu";
      const extras = [
        `${c.quantity} ${uomLabel(c.uom)}`,
        c.prep_note?.trim(),
        Number(c.yield_pct) < 100 ? `thu hồi ${c.yield_pct}%` : "",
      ].filter(Boolean).join(" · ");
      return extras ? `${label} (${extras})` : label;
    })
    .join(", ");
}

const FILTER_OPTIONS: { value: "ALL" | SemiKind; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  ...SEMI_KINDS.map(kind => ({ value: kind, label: semiKindLabels[kind] })),
];

export function DishSemiPicker({
  items,
  selectedIds,
  loading = false,
  error = "",
  readOnly = false,
  canCreate = false,
  hideToolbarCreate = false,
  onPick,
  onCreateNew,
  onRetry,
}: {
  items: SemiFinishedItem[];
  selectedIds?: ReadonlySet<string>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
  canCreate?: boolean;
  hideToolbarCreate?: boolean;
  onPick?: (item: SemiFinishedItem) => void;
  onCreateNew?: (defaultSlot: SemiSlot, defaultKind?: SemiKind) => void;
  onRetry?: () => void;
}) {
  const [kindFilter, setKindFilter] = useState<"ALL" | SemiKind>("ALL");
  const [text, setText] = useState("");

  const filtered = useMemo(
    () =>
      items.filter(item => {
        const itemKind = item.kind ?? item.slot;
        if (kindFilter !== "ALL" && itemKind !== kindFilter) return false;
        return matchesName(item.name, text) || item.components.some(c => matchesName(c.name ?? "", text));
      }),
    [items, kindFilter, text],
  );

  const defaultCreateKind: SemiKind = kindFilter === "ALL" ? "DO_CHUA" : kindFilter;
  const defaultCreateSlot: SemiSlot = slotOfSemiKind(defaultCreateKind);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Lọc theo nhóm bán thành phẩm">
          {FILTER_OPTIONS.map(option => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={kindFilter === option.value ? "default" : "outline"}
              className="text-xs"
              onClick={() => setKindFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <InputGroup className="min-w-48 flex-1">
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput
            aria-label="Tìm bán thành phẩm"
            placeholder="Tìm cốt, sốt, nước chấm, đồ chua hoặc nguyên liệu muối…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </InputGroup>
        {canCreate && !readOnly && !hideToolbarCreate && onCreateNew && (
          <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onCreateNew(defaultCreateSlot, defaultCreateKind)}>
            <Plus className="mr-1 size-4" aria-hidden="true" />
            Tạo mới
          </Button>
        )}
      </div>

      {error && (
        <InlineAlert>
          {error} {onRetry && <Button type="button" size="sm" variant="outline" onClick={onRetry}>Thử lại</Button>}
        </InlineAlert>
      )}

      {loading ? (
        <LoadingState title="Đang tải danh sách bán thành phẩm…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Chưa có bán thành phẩm phù hợp"
          description="Tạo cốt nước dùng, sốt nấu/ướp, túi nước chấm hoặc đồ chua muối từ nguyên liệu tươi để gắn vào món."
          action={
            canCreate && !readOnly && onCreateNew
              ? <Button type="button" size="sm" onClick={() => onCreateNew(defaultCreateSlot, defaultCreateKind)}>Tạo bán thành phẩm</Button>
              : undefined
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map(item => {
            const picked = selectedIds?.has(item.id) ?? false;
            const summary = formatSemiIngredients(item.components);
            const allergenText = allergenSummary([item.allergens]);
            const body = (
              <div className="flex flex-1 flex-col gap-1.5 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="font-normal text-xs">{semiKindLabels[item.kind ?? item.slot]}</Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">{item.net_weight_g} g / túi</span>
                    </div>
                  </div>
                  {picked && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Đã chọn">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">Từ: {summary}</p>
                {item.instruction && <p className="line-clamp-1 text-xs text-muted-foreground">Cách làm: {item.instruction}</p>}
                {item.allergens !== null && item.allergens.length > 0 && (
                  <p className="text-xs text-muted-foreground">Dị ứng: {allergenText}</p>
                )}
              </div>
            );
            return (
              <li key={item.id}>
                {onPick && !readOnly ? (
                  <Button
                    type="button"
                    variant={picked ? "soft" : "outline"}
                    size="content"
                    onClick={() => onPick(item)}
                    className={cn(
                      "flex size-full flex-col items-stretch p-3 text-left",
                      picked && "border border-primary",
                    )}
                  >
                    {body}
                  </Button>
                ) : (
                  <div className="flex size-full flex-col rounded-lg border bg-card p-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
