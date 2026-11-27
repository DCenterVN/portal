import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Tip } from "@/components/patterns/tip";
import { uomLabel } from "@/lib/dishes/ingredients";
import { MAX_PREP_NOTE_LENGTH, slotLabels, slotOf, type DishContent, type FoodSlot, type GroupNode } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import { formatSemiIngredients } from "./dish-semi-picker";
import type { SemiFinishedItem, SemiFinishedLine } from "@/lib/api/semi-finished";
import type { MaterialInfo } from "./use-dish-data";

const PREP_CHIPS = ["bào sợi", "băm nhỏ", "cắt nhỏ", "ngâm nở"] as const;
const SLOTS: FoodSlot[] = ["DAM", "RAU", "TINH_BOT", "COT", "NUOC_CHAM", "GIA_VI_THEM", "DO_CHUA"];
type Line = DishContent["ingredients"][number];

const slotPrefix = (row: string): FoodSlot | null => {
  const code = row.split("-")[0];
  return SLOTS.includes(code as FoodSlot) ? (code as FoodSlot) : null;
};

function Thumb({ info }: { info?: MaterialInfo }) {
  const name = info?.name ?? "?";
  return info?.imageUrl
    ? <img src={info.imageUrl} alt="" loading="lazy" className="size-8 shrink-0 rounded-lg object-cover" />
    : <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">{name.trim().charAt(0).toUpperCase()}</span>;
}

export function DishIngredientsView({ content, materials, tree, packNames = {}, semiById = {}, packComponents = {}, catalogReady = true, semiLoading = false, errors = [], missingCosts, readOnly = false, allergensText, onChange }: {
  content: DishContent; materials: Record<string, MaterialInfo>; tree: GroupNode[]; packNames?: Record<string, string>; semiById?: Record<string, SemiFinishedItem>; packComponents?: Record<string, SemiFinishedLine[]>; catalogReady?: boolean; semiLoading?: boolean; errors?: DishError[]; missingCosts?: Record<string, string>; readOnly?: boolean; allergensText?: string; onChange: (content: DishContent) => void;
}) {
  const update = (row: string, patch: Partial<Line>) => onChange({ ...content, ingredients: content.ingredients.map(line => line.row === row ? { ...line, ...patch } : line) });
  const remove = (row: string) => onChange({ ...content, ingredients: content.ingredients.filter(line => line.row !== row) });
  const legacy = content.seasonings.filter(line => line.package_ref);
  const slotFor = (line: Line): FoodSlot => (readOnly ? slotPrefix(line.row) as FoodSlot | null : null) ?? slotOf(line.sku_ref ? materials[line.sku_ref]?.group ?? null : null, tree);
  const hasRawSpice = content.ingredients.some(line => { const slot = slotFor(line); return slot === "GIA_VI_THEM" || slot === "COT"; });
  const keptPackCount = legacy.filter(pack => pack.slot !== "DO_CHUA" && !pack.removable).length;
  return <section aria-label="Nguyên liệu món" className="overflow-hidden rounded-xl border bg-card shadow-sm">
    <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
      <h2 className="text-sm font-semibold">Món này dùng</h2>
      <span className="text-xs text-muted-foreground">Định lượng cho 1 suất</span>
    </div>
    {!content.ingredients.length && !legacy.length && <p className="px-4 py-4 text-sm text-muted-foreground">Bấm một nguyên liệu hoặc bán thành phẩm bên trái để thêm vào món. Lượng tính cho 1 suất.</p>}
    {SLOTS.map(slot => {
      const lines = content.ingredients.filter(line => slotFor(line) === slot);
      const packs = legacy.filter(line => line.slot === slot || (slot === "GIA_VI_THEM" && !SLOTS.includes(line.slot as FoodSlot)));
      if (!lines.length && !packs.length) return null;
      return <div key={slot}>
        <h3 className="border-y border-border/60 bg-muted/25 px-4 py-1.5 text-xs font-medium text-muted-foreground">{slotLabels[slot]}</h3>
        <ul className="divide-y divide-border">{lines.map(line => {
          const info = line.sku_ref ? materials[line.sku_ref] : undefined;
          const name = info?.name ?? (catalogReady ? "Nguyên liệu không còn trong danh mục" : "Đang tải nguyên liệu…");
          return <li key={line.row} className="space-y-1.5 px-4 py-2.5"><div className="flex items-center gap-2.5">
            <Thumb info={info} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{name}{info?.retired && <Badge variant="outline" className="ml-2 font-normal">Đã ngừng dùng</Badge>}{info?.draft && <Badge variant="secondary" className="ml-2 font-normal">Chưa duyệt</Badge>}{line.sku_ref && missingCosts?.[line.sku_ref] && <Badge variant="outline" className="ml-2 border-destructive/40 text-destructive font-normal">{missingCosts[line.sku_ref] === "UOM_MISMATCH" ? "Khác đơn vị giá" : "Chưa có giá"}</Badge>}</span>
            {readOnly
              ? <span className="shrink-0 text-sm font-medium tabular-nums">{line.quantity} <span className="font-normal text-muted-foreground">{uomLabel(line.uom)}</span></span>
              : <InputGroup className="h-8 w-28 shrink-0">
                <InputGroupInput aria-label={`Lượng mỗi suất của ${name}`} className="h-8 text-right text-sm tabular-nums" inputMode="decimal" value={line.quantity} onChange={event => update(line.row, { quantity: event.target.value })} />
                <InputGroupAddon align="inline-end" className="pr-2.5"><InputGroupText className="text-xs">{uomLabel(line.uom)}</InputGroupText></InputGroupAddon>
              </InputGroup>}
            {!readOnly && <Tip label="Bỏ nguyên liệu"><Button type="button" variant="ghost" size="icon-sm" aria-label={`Bỏ ${name}`} onClick={() => remove(line.row)}><Trash2 aria-hidden="true" /></Button></Tip>}
          </div>{readOnly ? ((line.prep_note?.trim() || Number(line.yield_pct) < 100) && (
            <p className="pl-11 text-xs text-muted-foreground">
              {[
                line.prep_note?.trim() ? `Sơ chế: ${line.prep_note.trim()}` : "",
                Number(line.yield_pct) < 100 ? `Thu hồi: ${line.yield_pct}%` : "",
              ].filter(Boolean).join(" · ")}
            </p>
          )) : (
            <div className="space-y-1.5 pl-11">
              <div className="flex items-center gap-2">
                <Input
                  aria-label={`Ghi chú sơ chế của ${name}`}
                  className="h-7 min-w-0 flex-1 text-xs"
                  maxLength={MAX_PREP_NOTE_LENGTH}
                  placeholder="Ghi chú sơ chế (vd: bào sợi, băm nhỏ…)"
                  value={line.prep_note ?? ""}
                  onChange={event => update(line.row, { prep_note: event.target.value })}
                />
                <Tip label="Tỷ lệ thu hồi (1–100%): định lượng là phần ăn được sau sơ chế">
                  <InputGroup className="h-7 w-22 shrink-0">
                    <InputGroupInput
                      aria-label={`Tỷ lệ thu hồi của ${name}`}
                      className="h-7 text-right text-xs tabular-nums"
                      inputMode="numeric"
                      value={line.yield_pct}
                      onChange={event => update(line.row, { yield_pct: event.target.value })}
                    />
                    <InputGroupAddon align="inline-end" className="pr-2"><InputGroupText className="text-xs">%</InputGroupText></InputGroupAddon>
                  </InputGroup>
                </Tip>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {PREP_CHIPS.map(chip => (
                  <Button
                    key={chip}
                    type="button"
                    size="xs"
                    variant={line.prep_note?.trim() === chip ? "secondary" : "outline"}
                    className="font-normal"
                    onClick={() => update(line.row, { prep_note: line.prep_note?.trim() === chip ? "" : chip })}
                  >
                    {chip}
                  </Button>
                ))}
              </div>
            </div>
          )}{errors.filter(error => error.row === line.row).map((error, index) => <InlineAlert key={`${error.field}-${index}`}>{error.message}</InlineAlert>)}</li>;
        })}{packs.map(pack => {
          const ref = pack.package_ref ?? "";
          const semi = ref ? semiById[ref] : undefined;
          const components = (semi?.components?.length ? semi.components : packComponents[ref]) ?? [];
          const packLabel = semi?.name ?? packNames[ref] ?? "Gói bán thành phẩm";
          const cannotMakeRemovable = pack.slot === "COT" || (!pack.removable && pack.slot !== "DO_CHUA" && !hasRawSpice && keptPackCount <= 1);
          const toggleRemovable = (checked: boolean) => {
            if (checked && cannotMakeRemovable) return;
            onChange({
              ...content,
              seasonings: content.seasonings.map(item => item.row === pack.row ? { ...item, removable: checked } : item),
            });
          };
          return <li key={pack.row} className="space-y-1.5 px-4 py-2.5"><div className="flex items-start gap-2.5">
            <Thumb /><div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-medium">{packLabel}</span>
                {semi && <span className="text-xs text-muted-foreground tabular-nums">{semi.net_weight_g} g / túi</span>}
                {!semi && !components.length && <Badge variant="outline" className="font-normal">Gói đã có</Badge>}
                {readOnly && <Badge variant="outline" className="font-normal">{pack.removable ? "Cho bỏ" : "Bắt buộc"}</Badge>}
              </div>
              {components.length > 0 && <p className="text-xs text-muted-foreground">{(semiLoading || !catalogReady) && components.some(c => !c.name?.trim()) ? "Đang tải thành phần…" : `Từ: ${formatSemiIngredients(components)}`}</p>}
              {!readOnly && <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <Switch
                  id={`removable-${pack.row}`}
                  size="sm"
                  checked={pack.removable}
                  disabled={!pack.removable && cannotMakeRemovable}
                  onCheckedChange={toggleRemovable}
                />
                <label htmlFor={`removable-${pack.row}`} className="text-xs text-muted-foreground">
                  {pack.slot === "COT"
                    ? "Cốt bắt buộc theo món"
                    : !pack.removable && cannotMakeRemovable
                      ? "Cần giữ lại làm gia vị chính"
                      : "Cho khách bỏ"}
                </label>
              </div>}
            </div>
            {!readOnly && <Tip label="Bỏ gói"><Button type="button" variant="ghost" size="icon-sm" aria-label="Bỏ gói" onClick={() => onChange({ ...content, seasonings: content.seasonings.filter(item => item.row !== pack.row) })}><Trash2 aria-hidden="true" /></Button></Tip>}
          </div>{errors.filter(error => error.row === pack.row).map((error, index) => <InlineAlert key={`${error.field}-${index}`}>{error.message}</InlineAlert>)}</li>;
        })}</ul>
      </div>;
    })}
    {allergensText && <div className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground"><span className="font-medium text-foreground">Dị ứng:</span> {allergensText}</div>}
  </section>;
}
