import { Button } from "@/components/ui/button";
import { Select, Checkbox } from "@/components/ui/field";
import { EntityPicker } from "@/components/ui/entity-picker";
import type { DishContent, SeaSlot } from "@/lib/dishes/types";
import { slotLabels } from "@/lib/dishes/types";
import type { PackOption } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
const slots: SeaSlot[] = ["COT", "NUOC_CHAM", "GIA_VI_THEM"];
export function DishSeasoningsView(props: {
  content: DishContent; packs: PackOption[]; recipes: Record<string, boolean>; loading: boolean; error: string; next: string | null; errors: DishError[];
  readOnly: boolean; onChange: (content: DishContent) => void; onQuery: (q: string) => void; onRetry: () => void; onNext: () => void;
}) {
  const update = (row: string, patch: Partial<DishContent["seasonings"][number]>) => props.onChange({ ...props.content, seasonings: props.content.seasonings.map(line => line.row === row ? { ...line, ...patch } : line) });
  const available = slots.filter(slot => !props.content.seasonings.some(line => line.slot === slot));
  return <section className="space-y-3" aria-label="Gia vị"><h2>Gia vị</h2><p>Công thức tính cho 1 suất. Mỗi loại ô chỉ một gói; luôn giữ ít nhất một gói không được bỏ.</p>
    {props.error && <p role="alert">{props.error} <Button type="button" variant="outline" onClick={props.onRetry}>Thử lại</Button></p>}
    {props.content.seasonings.map((line, index) => <div key={line.row} className="grid gap-3 rounded-xl border border-line p-4 md:grid-cols-3">
      <label>Loại ô<Select disabled={props.readOnly} value={line.slot} onChange={e => { const slot = slots.find(slot => slot === e.target.value); if (slot) update(line.row, { slot, ...(slot === "COT" ? { removable: false } : {}) }); }}>{slots.filter(slot => slot === line.slot || available.includes(slot)).map(slot => <option key={slot} value={slot}>{slotLabels[slot]}</option>)}</Select></label>
      <div onChangeCapture={event => { const target = event.target; if (target instanceof HTMLInputElement && target.getAttribute("role") === "combobox") props.onQuery(target.value); }}>
        <EntityPicker name={`seasoning-${index}`} label={`Gói gia vị ${index + 1}`} value={line.package_ref} items={props.packs} status={props.loading ? "loading" : props.error ? "error" : "ready"} getId={pack => pack.id} getLabel={pack => pack.name} onChange={id => update(line.row, { package_ref: id })} onRetry={props.onRetry} serializeValue={false} />
        {line.package_ref && props.recipes[line.package_ref] === false && <p role="alert">Gói chưa có công thức hiệu lực cho 1 suất.</p>}
      </div>
      <div className="space-y-2"><Checkbox label={`Cho bỏ gói ${index + 1}`} checked={line.removable} disabled={props.readOnly || line.slot === "COT" || (!line.removable && props.content.seasonings.filter(item => !item.removable && item.package_ref).length <= 1)} onChange={e => update(line.row, { removable: e.target.checked })} />
        {!props.readOnly && <Button type="button" variant="ghost" disabled={!line.removable && props.content.seasonings.filter(item => !item.removable && item.package_ref).length <= 1} onClick={() => props.onChange({ ...props.content, seasonings: props.content.seasonings.filter(item => item.row !== line.row) })}>Bỏ dòng gia vị {index + 1}</Button>}
      </div>
      {props.errors.filter(error => error.row === line.row).map(error => <p key={error.field} role="alert">{error.message}</p>)}
    </div>)}
    {!props.readOnly && available.length > 0 && <Button type="button" variant="outline" onClick={() => props.onChange({ ...props.content, seasonings: [...props.content.seasonings, { row: crypto.randomUUID(), slot: available.includes("GIA_VI_THEM") ? "GIA_VI_THEM" : available[0], package_ref: null, removable: false }] })}>Thêm gia vị</Button>}
    {props.next && <Button type="button" variant="outline" disabled={props.loading} onClick={props.onNext}>Thêm gói từ trang sau</Button>}
  </section>;
}
