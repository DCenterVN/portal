import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Tip } from "@/components/patterns/tip";
import { uomLabel } from "@/lib/dishes/ingredients";
import { slotLabels, slotOf, type DishContent, type GroupNode, type IngredientSlot } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import type { MaterialInfo } from "./use-dish-data";

const SLOTS: IngredientSlot[] = ["DAM", "RAU", "TINH_BOT", "GIA_VI_THEM", "COT"];
type Line = DishContent["ingredients"][number];

function Thumb({ info }: { info?: MaterialInfo }) {
  const name = info?.name ?? "?";
  return info?.imageUrl
    ? <img src={info.imageUrl} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg object-cover" />
    : <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">{name.trim().charAt(0).toUpperCase()}</span>;
}

export function DishIngredientsView({ content, materials, tree, packNames = {}, errors = [], readOnly = false, onChange }: {
  content: DishContent; materials: Record<string, MaterialInfo>; tree: GroupNode[]; packNames?: Record<string, string>; errors?: DishError[]; readOnly?: boolean; onChange: (content: DishContent) => void;
}) {
  const update = (row: string, patch: Partial<Line>) => onChange({ ...content, ingredients: content.ingredients.map(line => line.row === row ? { ...line, ...patch } : line) });
  const remove = (row: string) => onChange({ ...content, ingredients: content.ingredients.filter(line => line.row !== row) });
  const legacy = content.seasonings.filter(line => line.package_ref);
  const slotFor = (line: Line) => slotOf(line.sku_ref ? materials[line.sku_ref]?.group ?? null : null, tree);
  return <section className="space-y-3" aria-label="Nguyên liệu món"><h2>Món này dùng</h2>
    {content.ingredients.length === 0 && <p className="text-sm text-muted-foreground">Bấm một nguyên liệu bên trái để thêm vào món. Lượng tính cho 1 suất.</p>}
    {SLOTS.map(slot => {
      const lines = content.ingredients.filter(line => slotFor(line) === slot);
      const packs = slot === "GIA_VI_THEM" ? legacy : [];
      if (!lines.length && !packs.length) return null;
      return <div key={slot} className="space-y-2"><h3 className="text-sm font-medium text-muted-foreground">{slotLabels[slot]}</h3>
        <ul className="space-y-2">{lines.map(line => {
          const info = line.sku_ref ? materials[line.sku_ref] : undefined;
          const name = info?.name ?? "Nguyên liệu không còn trong danh mục";
          return <li key={line.row} className="space-y-1"><div className="flex items-center gap-3">
            <Thumb info={info} /><span className="min-w-0 flex-1 truncate">{name}{info?.retired && <Badge variant="outline" className="ml-2">Đã ngừng dùng</Badge>}</span>
            {readOnly ? <span className="tabular-nums">{line.quantity}</span> : <Input aria-label={`Lượng mỗi suất của ${name}`} className="w-24" inputMode="decimal" value={line.quantity} onChange={event => update(line.row, { quantity: event.target.value })} />}
            <span className="w-8 text-sm text-muted-foreground">{uomLabel(line.uom)}</span>
            {!readOnly && <Tip label="Bỏ nguyên liệu"><Button type="button" variant="ghost" size="icon" aria-label={`Bỏ ${name}`} onClick={() => remove(line.row)}><Trash2 aria-hidden="true" /></Button></Tip>}
          </div>{errors.filter(error => error.row === line.row).map(error => <InlineAlert key={error.field}>{error.message}</InlineAlert>)}</li>;
        })}{packs.map(pack => <li key={pack.row} className="space-y-1"><div className="flex items-center gap-3">
          <Thumb /><span className="min-w-0 flex-1 truncate">{packNames[pack.package_ref ?? ""] ?? "Gói gia vị đã có"}<Badge variant="outline" className="ml-2">Gói gia vị cũ</Badge></span>
          {!readOnly && <Tip label="Bỏ gói gia vị"><Button type="button" variant="ghost" size="icon" aria-label="Bỏ gói gia vị" onClick={() => onChange({ ...content, seasonings: content.seasonings.filter(item => item.row !== pack.row) })}><Trash2 aria-hidden="true" /></Button></Tip>}
        </div>{errors.filter(error => error.row === pack.row).map(error => <InlineAlert key={error.field}>{error.message}</InlineAlert>)}</li>)}</ul></div>;
    })}
  </section>;
}
