import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { MaterialPicker } from "./material-picker";
import { unitsFor } from "./package-rules";
import { slotName } from "./pack-shared";
import { ratioTotal, servingCount, slotRatioValues, variantLabel } from "./food-plan-ratios";
import type { FoodPlansState } from "./use-food-plans";

function PackRatios({ s }: { s: FoodPlansState }) {
  const { chosenSet, ratios, packs } = s;
  const packName = (id: string | null) => packs.find(pack => pack.id === id)?.name;
  return <>{chosenSet?.slots.map(slot => {
    const sum = ratioTotal(slotRatioValues(slot, ratios));
    const name = slotName(slot.slot);
    return <fieldset key={slot.slot} className="space-y-3 rounded-xl border p-4"><legend>{name}</legend>
      {slot.options.map(option => <label className="block" key={option.sku_ref}>{packName(option.sku_ref) ?? "Gói đã chọn"} · {option.quantity} EA (%)<Input aria-label={`Tỉ lệ ${name} ${packName(option.sku_ref) ?? "gói đã chọn"}`} inputMode="decimal" readOnly={!slot.swappable && !slot.removable} value={ratios[`${slot.slot}:${option.sku_ref}`] ?? "0"} onChange={e => s.setRatio(`${slot.slot}:${option.sku_ref}`, e.target.value)} /></label>)}
      {slot.removable && <label className="block">Để trống ô (%)<Input aria-label={`Tỉ lệ ${name} để trống`} inputMode="decimal" value={ratios[`${slot.slot}:empty`] ?? "0"} onChange={e => s.setRatio(`${slot.slot}:empty`, e.target.value)} /></label>}
      <p role={sum === 1000000n ? "status" : "alert"}>Tổng {sum === null ? "chưa hợp lệ" : String(Number(sum) / 10000)}% / 100%{sum !== 1000000n && " · Tổng phải bằng 100% từng ô."}</p>
    </fieldset>;
  })}</>;
}

function RawComponents({ s }: { s: FoodPlansState }) {
  return <>{s.components.map((c, i) => <div key={c.sku_ref} className="grid gap-3 md:grid-cols-4"><p>{c.name}</p>
    <label>Định lượng {i + 1}<Input value={c.quantity} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,3})?" required onChange={e => s.changeComponent(i, { quantity: e.target.value })} /></label>
    <label>Đơn vị {i + 1}<NativeSelect value={c.uom} onChange={e => s.changeComponent(i, { uom: e.target.value })}>{unitsFor(c.uom).map(unit => <NativeSelectOption key={unit}>{unit}</NativeSelectOption>)}</NativeSelect></label>
    <Button type="button" variant="outline" onClick={() => s.removeComponent(i)}>Bỏ nguyên liệu {i + 1}</Button>
  </div>)}</>;
}

export function FoodPlanForm({ s }: { s: FoodPlansState }) {
  const { editing, chosenSet, productRef, sets, mode } = s;
  if (!s.showForm || !(editing ? s.canUpdate : s.canCreate)) return null;
  const inRange = (set: { slots: unknown[] }) => set.slots.length >= 2 && set.slots.length <= 6;
  return <Card><CardContent className="space-y-4 pt-6">
    <form onSubmit={s.save} className="space-y-4" aria-label={editing ? "Sửa set" : "Tạo set"}>
      {editing ? <p>Sản phẩm: {s.products.find(p => p.id === editing.product_ref)?.name ?? "Sản phẩm trong chỉ tiêu"}. Sản phẩm, mã set và khẩu phần giữ nguyên khi sửa định mức.</p> : <EntityPicker name="product_ref" label="Sản phẩm thuộc chỉ tiêu" value={productRef || null} onChange={s.changeProduct} items={s.availableProducts} status={s.ready ? "ready" : "loading"} getId={p => p.id} getLabel={p => p.name} />}
      <div className="grid gap-3 md:grid-cols-2">
        {editing ? <label>Mã set<output aria-label="Mã set" className="block">{variantLabel(s.code)}</output></label> : <EntityPicker name="plan-variant" label="Mã set" required items={sets.filter(set => set.product_ref === productRef && inRange(set))} status={s.busy ? "loading" : "ready"} value={chosenSet?.id ?? null} getId={set => set.id} getLabel={set => set.code} getMeta={set => `${set.name} · ${set.variant_label}`} onChange={id => void s.chooseSet(id)} />}
        {!editing && s.setCursor && <Button type="button" variant="outline" disabled={s.busy} onClick={() => void s.loadSets(true)}>Thêm biến thể từ trang sau</Button>}
        {!editing && chosenSet && !servingCount(chosenSet.variant_label) ? <label>Khẩu phần<NativeSelect required value={s.servingSize} onChange={e => s.changeServingSize(e.target.value)}><NativeSelectOption value="">Chọn khẩu phần</NativeSelectOption>{[1, 2, 3, 4, 6].map(count => <NativeSelectOption key={count} value={`${count} người`}>{count} người</NativeSelectOption>)}</NativeSelect></label> : <label>Khẩu phần<output aria-label="Khẩu phần" className="block">{s.servingSize || "Chọn mã set"}</output></label>}
        <label>Số kit<Input inputMode="numeric" value={s.kits} pattern="[1-9][0-9]*" required onChange={e => s.setKits(e.target.value)} /></label>
        <label>Số suất mỗi kit<output aria-label="Số suất mỗi kit" className="block">{s.servings || "Chọn mã set"}</output></label>
      </div>
      {s.slotCountError && <InlineAlert>{s.slotCountError}</InlineAlert>}
      <p>Tổng suất: {s.total || "Chưa hợp lệ"} EA. Tối đa 1.000.000 suất.</p>
      <label>Nguồn định mức<NativeSelect value={mode} onChange={e => s.changeMode(e.target.value)}><NativeSelectOption value="raw">Nguyên liệu trực tiếp</NativeSelectOption><NativeSelectOption value="pack">Theo set và gói</NativeSelectOption></NativeSelect></label>
      {mode === "pack" && <div className="space-y-4">
        <EntityPicker name="plan-food-set" label="Set món trong họ món" items={sets.filter(set => set.product_ref === productRef && inRange(set) && (!editing || set.code === s.code))} status={s.busy ? "loading" : "ready"} value={chosenSet?.id ?? null} getId={set => set.id} getLabel={set => `${set.name} · ${set.variant_label}`} onChange={id => void s.chooseSet(id)} />
        {s.setCursor && <Button type="button" variant="outline" disabled={s.busy} onClick={() => void s.loadSets(true)}>Thêm set từ trang sau</Button>}
        <PackRatios s={s} />
      </div>}
      {mode === "raw" && <RawComponents s={s} />}
      <p>Nhập lượng dương, tối đa 3 số lẻ theo đơn vị đã chọn.</p>
      {!s.valid && <p>Chọn sản phẩm, mã set và định mức hợp lệ. Theo set: tổng tỉ lệ mỗi ô phải bằng 100%.</p>}
      <div className="flex gap-3"><Button type="submit" disabled={s.busy || !s.valid}>{s.busy ? "Đang lưu…" : "Lưu set"}</Button><Button type="button" variant="outline" onClick={() => s.setShowForm(false)}>Hủy</Button></div>
    </form>
    {mode === "raw" && <MaterialPicker onSelect={s.addMaterial} />}
  </CardContent></Card>;
}
