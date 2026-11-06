import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/patterns/form-field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { InlineAlert } from "@/components/patterns/inline-alert";
import type { CreateFoodSetRequest } from "@/lib/api/sales";
import { FOOD_SLOTS, slotName } from "./pack-shared";
import { hasKeptSpice } from "./food-set-rules";
import type { FoodSetsState } from "./use-food-sets";

const METADATA_FIELDS = [["code", "Mã set"], ["name", "Tên set"], ["temperature_regime", "Chế độ nhiệt"]] satisfies [keyof Pick<CreateFoodSetRequest, "code" | "name" | "variant_label" | "temperature_regime">, string][];

function NewSetFields({ s }: { s: FoodSetsState }) {
  const { metadata, setMetadata } = s;
  return <>
    <EntityPicker name="set-family" label="Họ món" value={metadata.product_ref || null} onChange={id => setMetadata(current => ({ ...current, product_ref: id ?? "" }))} items={s.products} status="ready" getId={item => item.id} getLabel={item => item.name} />
    <label>Khẩu phần<NativeSelect value={metadata.variant_label} onChange={e => setMetadata(current => ({ ...current, variant_label: e.target.value }))}>{[1, 2, 3, 4, 6].map(count => <NativeSelectOption key={count} value={`${count} người`}>{count} người</NativeSelectOption>)}</NativeSelect></label>
    <div className="grid gap-3 md:grid-cols-2">{METADATA_FIELDS.map(([key, label]) => <label key={key}>{label}<Input required value={metadata[key]} onChange={e => setMetadata(current => ({ ...current, [key]: e.target.value }))} /></label>)}<label>Khối lượng tịnh (g)<Input type="number" min="1" max="2147483647" value={metadata.net_weight_g} onChange={e => setMetadata(current => ({ ...current, net_weight_g: Number(e.target.value) }))} /></label></div>
  </>;
}

function SlotEditor({ s }: { s: FoodSetsState }) {
  const { slots, packages, changeSlot } = s;
  return <>
    <p>Mỗi ô có đúng một gói mặc định. Món cần ít nhất một gói gia vị không được bỏ; ô cố định chỉ có một lựa chọn.</p>
    {slots.map((slot, index) => <fieldset key={slot.slot} className="space-y-3 rounded-xl border p-4"><legend>{slotName(slot.slot)}</legend>
      <Checkbox label="Cho đổi gói" checked={slot.swappable} onChange={e => changeSlot(index, { swappable: e.target.checked })} /><Checkbox label="Cho bỏ ô" disabled={slot.slot === "COT" || s.nonRemovable(slot)} checked={slot.removable} onChange={e => changeSlot(index, { removable: e.target.checked })} />
      {slot.options.map((option, optionIndex) => <div key={option.sku_ref} className="grid gap-3 md:grid-cols-3"><p>{packages.find(item => item.id === option.sku_ref)?.name ?? "Gói đã chọn"}</p><label>Số gói<Input type="number" min="1" value={option.quantity} onChange={e => changeSlot(index, { options: slot.options.map((row, i) => i === optionIndex ? { ...row, quantity: Number(e.target.value) } : row) })} /></label><Checkbox label="Mặc định" checked={option.is_default} onChange={() => changeSlot(index, { options: slot.options.map((row, i) => ({ ...row, is_default: i === optionIndex })) })} /><Button type="button" variant="outline" onClick={() => changeSlot(index, { options: slot.options.filter((_, i) => i !== optionIndex) })}>Bỏ gói {optionIndex + 1}</Button></div>)}
      <EntityPicker name={`set-pack-${slot.slot}`} label="Thêm gói theo tên" items={packages.filter(item => !slot.options.some(option => option.sku_ref === item.id))} status="ready" value={null} getId={item => item.id} getLabel={item => item.name} onChange={id => { if (id) changeSlot(index, { options: [...slot.options, { sku_ref: id, quantity: 1, is_default: slot.options.length === 0 }] }); }} />
      <Button type="button" variant="outline" disabled={s.nonRemovable(slot)} onClick={() => s.setSlots(current => current.filter((_, i) => i !== index))}>Xóa ô</Button>
    </fieldset>)}
    <label>Thêm ô<NativeSelect value="" onChange={e => { const slot = FOOD_SLOTS.find(item => item.id === e.target.value); if (slot) s.setSlots(current => [...current, { slot: slot.id, swappable: false, removable: false, options: [] }]); }}><NativeSelectOption value="">Chọn loại ô</NativeSelectOption>{FOOD_SLOTS.filter(item => !slots.some(slot => slot.slot === item.id)).map(item => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}</NativeSelect></label>
    {s.touched && !s.validSlots && <InlineAlert>{s.slotCountError || (!hasKeptSpice(slots) ? "Món cần ít nhất một gói gia vị không được bỏ" : "Mỗi ô cần gói với số lượng dương và đúng một mặc định.")}</InlineAlert>}
  </>;
}

export function FoodSetForm({ s }: { s: FoodSetsState }) {
  const { selected } = s;
  if (!s.editing || !(selected ? s.canUpdate : s.canCreate)) return null;
  return <Card><CardContent className="pt-6"><form aria-label="Biên tập set món" onBlur={() => s.setTouched(true)} onSubmit={s.save} className="space-y-4">
    {!selected && <NewSetFields s={s} />}
    <label className="block">Hashtag tay<Input aria-describedby="set-tags-help" list="food-set-tag-suggestions" aria-invalid={s.touched && !!s.tagError} value={s.tagText} onChange={e => s.setTagText(e.target.value)} /></label><datalist id="food-set-tag-suggestions">{s.availableTags.map(tag => <option key={tag} value={s.tagText.includes(",") ? `${s.tagText.slice(0, s.tagText.lastIndexOf(",") + 1)} ${tag}` : tag} />)}</datalist><p id="set-tags-help" role={s.touched && s.tagError ? "alert" : "status"}>{s.tags.length}/8 hashtag · 3–8, cách nhau bằng dấu phẩy. {s.touched && s.tagError}</p>
    {selected ? <SlotEditor s={s} /> : <p>Lưu nháp trước, sau đó thêm ô và gói.</p>}
    <div className="flex gap-3"><Button type="submit" disabled={s.detailBusy || !s.valid}>{s.detailBusy ? "Đang lưu…" : "Lưu set món"}</Button><Button type="button" variant="outline" onClick={() => s.setEditing(false)}>Hủy</Button></div>
  </form></CardContent></Card>;
}
