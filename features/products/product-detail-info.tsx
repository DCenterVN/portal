import { ProductOrigin } from "./product-origin";
import type { Product } from "@/lib/api/sales";
import { nutrientFields, nutritionNumber } from "@/lib/nutrition";
import type { useProductDetail } from "./use-product-detail";
import { Badge } from "@/components/ui/badge";
import type { RawAllergens } from "@/lib/api/sales-materials";

const allergenLabels: Record<RawAllergens["contains"][number], string> = {
  GLUTEN: "Gluten (lúa mì)", CRUSTACEANS: "Giáp xác (tôm, cua)", EGGS: "Trứng",
  FISH: "Cá", PEANUTS: "Đậu phộng", SOYBEANS: "Đậu nành", MILK: "Sữa",
  TREE_NUTS: "Hạt cây", CELERY: "Cần tây", MUSTARD: "Mù tạt", SESAME: "Vừng",
  SULPHITES: "Sulphite", LUPIN: "Đậu lupin", MOLLUSCS: "Nhuyễn thể (mực, nghêu)",
};

export function ProductDetailInfo({ product, selected }: { product: Product; selected?: ReturnType<typeof useProductDetail>["selected"] }) {
  const nutrition = product.nutrition;
  const allergens = product.allergen_summary;
  const contains = allergens?.contains ?? [];
  const allergenNotice = contains.length > 0
    ? allergens?.known ? null : `Chưa đủ thông tin: ${allergens?.unknown.join(", ") || "nguyên liệu chưa khai báo"}`
    : allergens?.known ? "Không chứa 14 nhóm dị ứng phổ biến (theo khai báo)" : "Chưa có thông tin dị ứng";
  const incomplete = !nutrition || nutrition.missing.length > 0 || nutrientFields.some(([key]) => nutrition.per_serving[key] === null);
  return <div className="mt-8 space-y-7">
    {selected && <section id="selected-compartment" aria-live="polite" className="rounded-sm bg-muted/50 p-4">
      <h2 className="text-lg font-semibold">Ngăn {selected.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{selected.grams} g/người · {selected.share}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4">{selected.nutrients.map(nutrient => <div key={nutrient.key}>
        <dt className="text-xs text-muted-foreground">{nutrient.label}</dt><dd className="mt-1 font-medium tabular-nums">{nutrient.value}</dd>
      </div>)}</dl>
    </section>}
    <section aria-labelledby="serving-nutrition" className="py-1">
      <h2 id="serving-nutrition" className="text-xl font-semibold">Dinh dưỡng mỗi người (1 suất)</h2>
      {incomplete && <p className="mt-3 text-sm text-muted-foreground">Chưa đủ dữ liệu dinh dưỡng. Các chỉ số còn thiếu sẽ được cập nhật.</p>}
      <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5">
        {nutrientFields.map(([key, name, unit]) => <div key={key}>
          <dt className="text-xs text-muted-foreground">{name}</dt>
          <dd className="mt-1 text-lg font-medium tabular-nums">{nutrition?.per_serving[key] == null ? "Chưa có" : `${nutritionNumber(nutrition.per_serving[key])} ${unit}`}</dd>
        </div>)}
      </dl>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Ước tính từ nguyên liệu sống, chưa gồm dầu ăn tự thêm.</p>
    </section>
    <div className="space-y-8 py-1">
      <section aria-labelledby="meal-ingredients">
        <h2 id="meal-ingredients" className="text-xl font-semibold">Thành phần & dị ứng</h2>
        <p className="mt-2 text-xs text-muted-foreground">Lượng cho 1 người</p>
        {contains.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{contains.map(allergen => <Badge key={allergen} variant="outline">{allergenLabels[allergen]}</Badge>)}</div>}
        {allergenNotice && <p className="mt-4 text-sm leading-6 text-muted-foreground">{allergenNotice}</p>}
      </section>
      <ProductOrigin />
    </div>
  </div>;
}
