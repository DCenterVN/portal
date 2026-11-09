import { z } from "zod";

export const nutritionLabels = {
  HIGH_PROTEIN: "Giàu đạm", LOW_FAT: "Ít béo", LOW_SODIUM: "Ít natri", HIGH_FIBRE: "Nhiều xơ",
} as const;
export const nutrientFields = [
  ["kcal", "Năng lượng", "kcal"], ["protein_g", "Đạm", "g"], ["fat_g", "Béo", "g"],
  ["carb_g", "Tinh bột", "g"], ["fiber_g", "Xơ", "g"], ["sugar_g", "Đường", "g"], ["sodium_mg", "Natri", "mg"],
] as const;
const decimal = z.string().regex(/^[0-9]+(\.[0-9]+)?$/).nullable();
const servingSchema = z.object({ kcal: decimal, protein_g: decimal, fat_g: decimal, carb_g: decimal, fiber_g: decimal, sugar_g: decimal, sodium_mg: decimal });
export const catalogNutritionSchema = z.object({
  per_serving: servingSchema,
  missing: z.array(z.string()).nullable().transform(value => value ?? []),
  labels: z.array(z.enum(["HIGH_PROTEIN", "LOW_FAT", "LOW_SODIUM", "HIGH_FIBRE"])).nullable().transform(value => value ?? []),
  summary: z.string(),
  components: z.array(z.object({ name: z.string(), grams: z.string(), kcal: decimal, protein_g: decimal, fat_g: decimal, carb_g: decimal })).optional(),
});
export type CatalogNutrition = z.infer<typeof catalogNutritionSchema>;
export const nutritionSources = { VN2007: "Bảng thực phẩm Việt Nam 2007", USDA_FDC: "USDA FoodData Central", LABEL: "Nhãn sản phẩm", OTHER: "Nguồn khác" } as const;
const nullableInput = z.string().transform(value => value.trim().replace(",", ".") || null).pipe(decimal);
const sourceSchema = z.object({ dataset: z.enum(["VN2007", "USDA_FDC", "LABEL", "OTHER"]), food_code: z.string().nullable().optional(), url: z.string().nullable().optional() }).nullable();
const factSchema = z.object({ value: nullableInput, source: sourceSchema }).superRefine((fact, ctx) => {
  if (fact.value !== null && !fact.source) ctx.addIssue({ code: "custom", path: ["source"], message: "Chọn nguồn cho số liệu đã nhập." });
}).transform(fact => ({ ...fact, source: fact.value === null ? null : fact.source }));
const positiveInput = nullableInput.refine(value => value === null || Number(value) > 0, "Nhập số lớn hơn 0 hoặc để trống.");
export const materialNutritionFormSchema = z.object({
  schema_version: z.literal(1), basis: z.literal("per_100g_edible_raw"),
  nutrients: z.object({ kcal: factSchema, protein_g: factSchema, fat_g: factSchema, carb_g: factSchema, fiber_g: factSchema, sugar_g: factSchema, sodium_mg: factSchema }),
  grams_per_ml: positiveInput, edible_grams_per_ea: positiveInput,
});
export type MaterialNutritionInput = z.input<typeof materialNutritionFormSchema>;
export type MaterialNutrition = z.output<typeof materialNutritionFormSchema>;
export function nutritionDefaults(facts?: MaterialNutrition | null): MaterialNutritionInput {
  const fact = (key: typeof nutrientFields[number][0]) => ({ value: facts?.nutrients[key].value ?? "", source: facts?.nutrients[key].source ?? null });
  return { schema_version: 1, basis: "per_100g_edible_raw", nutrients: { kcal: fact("kcal"), protein_g: fact("protein_g"), fat_g: fact("fat_g"), carb_g: fact("carb_g"), fiber_g: fact("fiber_g"), sugar_g: fact("sugar_g"), sodium_mg: fact("sodium_mg") }, grams_per_ml: facts?.grams_per_ml ?? "", edible_grams_per_ea: facts?.edible_grams_per_ea ?? "" };
}
const wireFactSchema = z.object({ value: decimal, source: sourceSchema.optional() });
export const materialNutritionSchema = z.object({
  schema_version: z.literal(1), basis: z.literal("per_100g_edible_raw"),
  nutrients: z.object({ kcal: wireFactSchema, protein_g: wireFactSchema, fat_g: wireFactSchema, carb_g: wireFactSchema, fiber_g: wireFactSchema, sugar_g: wireFactSchema, sodium_mg: wireFactSchema }),
  grams_per_ml: decimal.optional(), edible_grams_per_ea: decimal.optional(),
}).transform(facts => materialNutritionFormSchema.parse(nutritionDefaults(facts as MaterialNutrition)));
export function nutritionNumber(value: string | null) {
  return value === null ? "Chưa có" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(Number(value));
}
