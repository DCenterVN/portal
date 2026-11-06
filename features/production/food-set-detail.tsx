import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { slotName } from "./pack-shared";
import type { FoodSetsState } from "./use-food-sets";

export function FoodSetEvaluation({ s }: { s: FoodSetsState }) {
  const { evaluation } = s;
  if (!evaluation) return null;
  return <div className="space-y-3" aria-live="polite">
    <p>Dị ứng</p><div className="flex flex-wrap gap-2">{!evaluation.allergen_summary.known && <Badge variant="outline">Dị ứng chưa khai báo</Badge>}{evaluation.allergen_summary.contains.map(value => <Badge variant="outline" key={value}>{value}</Badge>)}</div>
    <p>Kiêng</p><div className="flex flex-wrap gap-2">{evaluation.avoidance_flags.map(value => <Badge variant="outline" key={value}>{value}</Badge>)}</div>
    <p>Chế độ ăn</p><div className="flex flex-wrap gap-2">{evaluation.unknown.some(item => item.fields.includes("diet_flags")) ? <Badge variant="outline">Chế độ ăn chưa khai báo</Badge> : evaluation.diet_flags.map(value => <Badge variant="outline" key={value}>{value === "VEGAN" ? "Thuần chay" : "Chay"}</Badge>)}</div>
    {evaluation.unknown.length > 0 && <p>Có {evaluation.unknown.length} nguyên liệu chưa khai báo đầy đủ nhãn.</p>}
    {[["Hashtag tay", evaluation.manual_hashtags], ["Hashtag hệ thống", evaluation.system_hashtags], ["Hashtag suy ra", evaluation.derived_hashtags]].map(([label, values]) => <div key={String(label)}><p>{label}</p><div className="flex flex-wrap gap-2">{Array.isArray(values) && values.map(value => label === "Hashtag tay" ? <Button key={value} type="button" variant="outline" aria-pressed={s.filterTags.includes(value)} aria-label={`Lọc hashtag ${value}`} onClick={() => s.toggleFilterTag(value)}>{value}</Button> : <Badge variant="secondary" key={value}>{value}</Badge>)}</div></div>)}
  </div>;
}

export function FoodSetDetail({ s }: { s: FoodSetsState }) {
  const { selected, selections } = s;
  if (!selected) return null;
  return <Card><CardContent className="space-y-4 pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">{selected.name}</h3><div className="flex gap-3">{s.canUpdate && <Button variant="outline" disabled={s.detailBusy} onClick={() => void s.begin(false)}>Sửa set món</Button>}{s.canDelete && <Button variant="outline" disabled={s.detailBusy} onClick={() => s.setConfirmRetire(true)}>Ngừng set</Button>}</div></div>
    {selected.slots.map(slot => <label key={slot.slot} className="block">{slotName(slot.slot)}<NativeSelect disabled={!slot.swappable && !slot.removable} value={selections.find(item => item.slot === slot.slot)?.sku_ref ?? (selections.some(item => item.slot === slot.slot) ? "" : slot.options.find(option => option.is_default)?.sku_ref ?? "")} onChange={e => s.setSelections(current => [...current.filter(item => item.slot !== slot.slot), { slot: slot.slot, sku_ref: e.target.value || null }])}>
      {slot.removable && <NativeSelectOption value="">Bỏ ô này</NativeSelectOption>}{slot.options.map(option => <NativeSelectOption key={option.sku_ref} value={option.sku_ref}>{s.packages.find(item => item.id === option.sku_ref)?.name ?? "Gói đã chọn"} · {option.quantity} EA</NativeSelectOption>)}
    </NativeSelect></label>)}
    {s.evaluating && <LoadingState title="Đang tính nhãn theo lựa chọn…" />}
    {s.evaluateError && <ErrorState title="Không tính được nhãn" description={s.evaluateError} onRetry={() => s.setEvaluateRetry(value => value + 1)} />}
    {!s.canReadRecipe && <p>Chưa có quyền đọc nhãn công thức.</p>}
    <FoodSetEvaluation s={s} />
    <p className="text-sm text-muted-foreground">Nhãn là khai báo của FOOD_DEV, không phải chứng nhận. Có thể xảy ra nhiễm chéo trong bảo quản và chế biến.</p>
  </CardContent></Card>;
}
