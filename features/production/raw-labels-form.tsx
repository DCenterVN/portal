import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/patterns/form-field";
import { MaterialPicker } from "./material-picker";
import { allergens, avoidance } from "./package-rules";
import type { PackagesState } from "./use-packages";

const dietValue = (diet: string[] | null) => diet === null ? "unknown" : diet.includes("VEGAN") ? "VEGAN" : diet.includes("VEGETARIAN") ? "VEGETARIAN" : "none";

export function RawLabelsForm({ s }: { s: PackagesState }) {
  const { labels, setLabels } = s;
  if (!s.can("sales:product:read")) return null;
  const canEdit = s.can("sales:product:update");
  return <Card><CardContent className="space-y-4 pt-6"><h3 className="text-lg font-bold">Khai báo nhãn nguyên liệu</h3><p>Nhãn là khai báo của FOOD_DEV, không phải chứng nhận. Chưa biết khác với đã kiểm tra và không có chế độ ăn.</p>
    <MaterialPicker onSelect={material => void s.readLabels(material)} />
    {labels && <form aria-label="Nhãn nguyên liệu" onSubmit={s.saveLabels} className="space-y-4"><h4>{s.raw?.name}</h4><fieldset disabled={!canEdit || s.detailBusy} className="space-y-4">
      <Checkbox label="Đã khai báo dị ứng" checked={labels.allergen_summary.known} onChange={e => setLabels(current => current && ({ ...current, allergen_summary: { known: e.target.checked, contains: [] } }))} />
      {!labels.allergen_summary.known && <p>Dị ứng chưa khai báo.</p>}<div className="grid gap-2 md:grid-cols-3">{allergens.map(value => <Checkbox key={value} label={value} disabled={!labels.allergen_summary.known} checked={labels.allergen_summary.contains.includes(value)} onChange={e => setLabels(current => current && ({ ...current, allergen_summary: { ...current.allergen_summary, contains: e.target.checked ? [...current.allergen_summary.contains, value] : current.allergen_summary.contains.filter(item => item !== value) } }))} />)}</div>
      <p>Kiêng</p><div className="grid gap-2 md:grid-cols-3">{avoidance.map(value => <Checkbox key={value} label={value} checked={labels.avoidance_flags.includes(value)} onChange={e => setLabels(current => current && ({ ...current, avoidance_flags: e.target.checked ? [...current.avoidance_flags, value] : current.avoidance_flags.filter(item => item !== value) }))} />)}</div>
      <label>Chế độ ăn nguyên liệu<NativeSelect value={dietValue(labels.diet_flags)} onChange={e => { const value = e.target.value; setLabels(current => current && ({ ...current, diet_flags: value === "unknown" ? null : value === "VEGETARIAN" ? ["VEGETARIAN"] : value === "VEGAN" ? ["VEGAN"] : [] })); }}><NativeSelectOption value="unknown">Chưa biết</NativeSelectOption><NativeSelectOption value="none">Không khẳng định chế độ ăn</NativeSelectOption><NativeSelectOption value="VEGETARIAN">Chay</NativeSelectOption><NativeSelectOption value="VEGAN">Thuần chay</NativeSelectOption></NativeSelect></label>
    </fieldset>{canEdit && <Button type="submit" disabled={s.detailBusy}>{s.detailBusy ? "Đang lưu…" : "Lưu nhãn nguyên liệu"}</Button>}</form>}
  </CardContent></Card>;
}
