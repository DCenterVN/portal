import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { MaterialPicker } from "./material-picker";
import type { PackagesState } from "./use-packages";

export function PackageRecipeForm({ s }: { s: PackagesState }) {
  const { recipe, components, steps } = s;
  if (!s.recipeEditing || !s.selected || !(recipe ? s.can("production:recipe:update") : s.can("production:recipe:create"))) return null;
  return <Card><CardContent className="space-y-4 pt-6"><form aria-label="Biên tập công thức" onSubmit={s.saveRecipe} className="space-y-4">
    <p>Định lượng hữu ích cho 1 EA. Yield lớn hơn 0 và không quá 100%, tối đa 3 số lẻ. Mã BOM do máy chủ tạo.</p>
    {components.map(({ line, name, units }, index) => <fieldset className="grid gap-3 rounded-xl border p-4 md:grid-cols-4" key={line.sku_ref}><legend>{name}</legend>
      <label>Định lượng {index + 1}<Input required inputMode="decimal" value={line.quantity} onChange={e => s.changeComponent(index, { quantity: e.target.value })} /></label><label>Đơn vị {index + 1}<NativeSelect value={line.uom} onChange={e => { const unit = units.find(unit => unit === e.target.value); if (unit) s.changeComponent(index, { uom: unit }); }}>{units.map(unit => <NativeSelectOption key={unit}>{unit}</NativeSelectOption>)}</NativeSelect></label><label>Yield % {index + 1}<Input required inputMode="decimal" value={line.yield_pct} onChange={e => s.changeComponent(index, { yield_pct: e.target.value })} /></label><Button type="button" variant="outline" onClick={() => s.setComponents(current => current.filter((_, i) => i !== index))}>Bỏ nguyên liệu {index + 1}</Button>
    </fieldset>)}
    {steps.map((step, index) => <div className="grid gap-3 md:grid-cols-3" key={index}><label>Hướng dẫn {index + 1}<Input required value={step.instruction} onChange={e => s.changeStep(index, { instruction: e.target.value })} /></label><label>Thời gian (giây) {index + 1}<Input type="number" min="0" step="1" value={step.duration_seconds} onChange={e => s.changeStep(index, { duration_seconds: Number(e.target.value) })} /></label><Button type="button" variant="outline" onClick={() => s.setSteps(current => current.filter((_, i) => i !== index))}>Bỏ bước {index + 1}</Button></div>)}
    <Button type="button" variant="outline" onClick={() => s.setSteps(current => [...current, { instruction: "", duration_seconds: 0 }])}>Thêm bước chế biến</Button>
    {!s.validRecipe && <InlineAlert>Thêm 1–100 nguyên liệu, kiểm tra định lượng, yield và thời gian nguyên không âm.</InlineAlert>}
    <div className="flex gap-3"><Button type="submit" disabled={s.detailBusy || !s.validRecipe}>{s.detailBusy ? "Đang lưu…" : "Lưu công thức"}</Button><Button type="button" variant="outline" onClick={() => s.setRecipeEditing(false)}>Hủy</Button></div>
  </form><MaterialPicker onSelect={s.addMaterial} /></CardContent></Card>;
}
