import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { packageCode } from "./package-rules";
import type { PackagesState } from "./use-packages";

export function PackageForm({ s }: { s: PackagesState }) {
  const { metadata, setMetadata, selected } = s;
  if (!s.editing || !(selected ? s.can("sales:variant:update") : s.can("sales:variant:create"))) return null;
  return <Card><CardContent className="pt-6"><form aria-label="Biên tập gói" onSubmit={s.save} className="space-y-4">
    <EntityPicker name="package-family" label="Họ món của gói" items={s.products} status="ready" value={metadata.product_ref || null} getId={item => item.id} getLabel={item => item.name} onChange={id => setMetadata(current => ({ ...current, product_ref: id ?? "" }))} />
    <div className="grid gap-3 md:grid-cols-2">
      <label>Mã gói<output className="block" aria-label="Mã gói">{metadata.code || "Tự tạo từ tên gói"}</output></label>
      <label>Tên gói<Input required value={metadata.name} onChange={e => { const name = e.target.value; setMetadata(current => ({ ...current, name, code: selected ? current.code : packageCode(name) })); }} /></label>
      <label>Quy cách gói<Input required value={metadata.variant_label} onChange={e => setMetadata(current => ({ ...current, variant_label: e.target.value }))} /></label>
      <label>Chế độ nhiệt<NativeSelect value={metadata.temperature_regime} onChange={e => setMetadata(current => ({ ...current, temperature_regime: e.target.value }))}><NativeSelectOption value="CHILLED">Mát 0–4 °C</NativeSelectOption><NativeSelectOption value="FROZEN">Đông lạnh</NativeSelectOption><NativeSelectOption value="AMBIENT">Nhiệt độ thường</NativeSelectOption></NativeSelect></label>
      <label>Khối lượng gói (g)<Input type="number" min="1" max="2147483647" value={metadata.net_weight_g} onChange={e => setMetadata(current => ({ ...current, net_weight_g: Number(e.target.value) }))} /></label>
    </div>
    {s.codeError && <InlineAlert>{s.codeError}</InlineAlert>}
    {!s.validMetadata && <p>Chọn họ món, nhập tên, quy cách và khối lượng nguyên dương.</p>}<div className="flex gap-3"><Button type="submit" disabled={s.detailBusy || !s.validMetadata}>{s.detailBusy ? "Đang lưu…" : "Lưu gói"}</Button><Button type="button" variant="outline" onClick={() => s.setEditing(false)}>Hủy</Button></div>
  </form></CardContent></Card>;
}
