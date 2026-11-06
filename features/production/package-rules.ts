import { fold } from "@/components/patterns/entity-picker";
import type { CreatePackageRequest, RawLabelsView } from "@/lib/api/sales";
import type { RecipeComponent } from "@/lib/api/production";

export const allergens = ["GLUTEN", "CRUSTACEANS", "EGGS", "FISH", "PEANUTS", "SOYBEANS", "MILK", "TREE_NUTS", "CELERY", "MUSTARD", "SESAME", "SULPHITES", "LUPIN", "MOLLUSCS"] satisfies RawLabelsView["allergen_summary"]["contains"];
export const avoidance = ["PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"] satisfies RawLabelsView["avoidance_flags"];
export const initialPackageMetadata: CreatePackageRequest = { product_ref: "", code: "", name: "", variant_label: "Tiêu chuẩn", net_weight_g: 100, uom_code: "EA", temperature_regime: "CHILLED" };
export const packageCode = (name: string) => `${fold(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 51).toUpperCase() || "GOI"}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
export const positive = (value: string) => /^(?!0(?:\.0{1,3})?$)(0|[1-9][0-9]*)(\.[0-9]{1,3})?$/.test(value);
export const yieldValid = (value: string) => /^(100(\.0{1,3})?|[1-9][0-9]?(\.[0-9]{1,3})?|0\.(?!0{1,3}$)[0-9]{1,3})$/.test(value);
export const unitsFor = (uom: string): RecipeComponent["uom"][] => uom === "KG" || uom === "G" ? ["KG", "G"] : uom === "L" || uom === "ML" ? ["L", "ML"] : ["EA"];
export type ComponentDraft = { line: RecipeComponent; name: string; units: RecipeComponent["uom"][] };
