import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Tip } from "@/components/patterns/tip";
import { uomLabel } from "@/lib/dishes/ingredients";
import { slotLabels, slotOf, type DishContent, type GroupNode, type IngredientSlot } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import type { MaterialInfo } from "./use-dish-data";

const SLOTS: IngredientSlot[] = ["DAM", "RAU", "TINH_BOT", "GIA_VI_THEM", "COT"];
type Line = DishContent["ingredients"][number];

const slotPrefix = (row: string): IngredientSlot | null => {
  const code = row.split("-")[0];
  return SLOTS.includes(code as IngredientSlot) ? (code as IngredientSlot) : null;
};

function Thumb({ info }: { info?: MaterialInfo }) {
  const name = info?.name ?? "?";
  return info?.imageUrl
    ? <img src={info.imageUrl} alt="" loading="lazy" className="size-8 shrink-0 rounded-lg object-cover" />
    : <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">{name.trim().charAt(0).toUpperCase()}</span>;
}

export function DishIngredientsView({ content, materials, tree, packNames = {}, errors = [], missingCosts, readOnly = false, allergensText, onChange }: {
  content: DishContent; materials: Record<string, MaterialInfo>; tree: GroupNode[]; packNames?: Record<string, string>; errors?: DishError[]; missingCosts?: Record<string, string>; readOnly?: boolean; allergensText?: string; onChange: (content: DishContent) => void;
}) {
  const update = (row: string, patch: Partial<Line>) => onChange({ ...content, ingredients: content.ingredients.map(line => line.row === row ? { ...line, ...patch } : line) });
  const remove = (row: string) => onChange({ ...content, ingredients: content.ingredients.filter(line => line.row !== row) });
  const legacy = content.seasonings.filter(line => line.package_ref);
  const slotFor = (line: Line) => (readOnly ? slotPrefix(line.row) : null) ?? slotOf(line.sku_ref ? materials[line.sku_ref]?.group ?? null : null, tree);
  return <section aria-label="Nguyên liệu món" className="overflow-hidden rounded-xl border bg-card shadow-sm">
    <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
      <h2 className="text-sm font-semibold">Món này dùng</h2>
      <span className="text-xs text-muted-foreground">Định lượng cho 1 suất</span>
    </div>
    {!content.ingredients.length && !legacy.length && <p className="px-4 py-4 text-sm text-muted-foreground">Bấm một nguyên liệu bên trái để thêm vào món. Lượng tính cho 1 suất.</p>}
    {SLOTS.map(slot => {
      const lines = content.ingredients.filter(line => slotFor(line) === slot);
      const packs = legacy.filter(line => line.slot === slot || (slot === "GIA_VI_THEM" && !SLOTS.includes(line.slot as IngredientSlot)));
      if (!lines.length && !packs.length) return null;
      return <div key={slot}>
        <h3 className="border-y border-border/60 bg-muted/25 px-4 py-1.5 text-xs font-medium text-muted-foreground">{slotLabels[slot]}</h3>
        <ul className="divide-y divide-border">{lines.map(line => {
          const info = line.sku_ref ? materials[line.sku_ref] : undefined;
          const name = info?.name ?? "Nguyên liệu không còn trong danh mục";
          return <li key={line.row} className="space-y-1.5 px-4 py-2.5"><div className="flex items-center gap-2.5">
            <Thumb info={info} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{name}{info?.retired && <Badge variant="outline" className="ml-2 font-normal">Đã ngừng dùng</Badge>}{line.sku_ref && missingCosts?.[line.sku_ref] && <Badge variant="outline" className="ml-2 border-destructive/40 text-destructive font-normal">{missingCosts[line.sku_ref] === "UOM_MISMATCH" ? "Khác đơn vị giá" : "Chưa có giá"}</Badge>}</span>
            {readOnly
              ? <span className="shrink-0 text-sm font-medium tabular-nums">{line.quantity} <span className="font-normal text-muted-foreground">{uomLabel(line.uom)}</span></span>
              : <InputGroup className="h-8 w-28 shrink-0">
                <InputGroupInput aria-label={`Lượng mỗi suất của ${name}`} className="h-8 text-right text-sm tabular-nums" inputMode="decimal" value={line.quantity} onChange={event => update(line.row, { quantity: event.target.value })} />
                <InputGroupAddon align="inline-end" className="pr-2.5"><InputGroupText className="text-xs">{uomLabel(line.uom)}</InputGroupText></InputGroupAddon>
              </InputGroup>}
            {!readOnly && <Tip label="Bỏ nguyên liệu"><Button type="button" variant="ghost" size="icon-sm" aria-label={`Bỏ ${name}`} onClick={() => remove(line.row)}><Trash2 aria-hidden="true" /></Button></Tip>}
          </div>{errors.filter(error => error.row === line.row).map((error, index) => <InlineAlert key={`${error.field}-${index}`}>{error.message}</InlineAlert>)}</li>;
        })}{packs.map(pack => <li key={pack.row} className="space-y-1.5 px-4 py-2.5"><div className="flex items-center gap-2.5">
          <Thumb /><span className="min-w-0 flex-1 truncate text-sm font-medium">{packNames[pack.package_ref ?? ""] ?? "Gói gia vị đã có"}<Badge variant="outline" className="ml-2 font-normal">Gói gia vị cũ</Badge>{readOnly && <Badge variant="outline" className="ml-1.5 font-normal">{pack.removable ? "Cho bỏ" : "Bắt buộc"}</Badge>}</span>
          {!readOnly && <Tip label="Bỏ gói gia vị"><Button type="button" variant="ghost" size="icon-sm" aria-label="Bỏ gói gia vị" onClick={() => onChange({ ...content, seasonings: content.seasonings.filter(item => item.row !== pack.row) })}><Trash2 aria-hidden="true" /></Button></Tip>}
        </div>{errors.filter(error => error.row === pack.row).map((error, index) => <InlineAlert key={`${error.field}-${index}`}>{error.message}</InlineAlert>)}</li>)}</ul>
      </div>;
    })}
    {allergensText && <div className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground"><span className="font-medium text-foreground">Dị ứng:</span> {allergensText}</div>}
  </section>;
}
