import { z } from "zod";

export const quoteSchema = z.object({ price: z.object({ unit_price_vnd: z.number().int().nonnegative(), uom: z.enum(["KG", "L", "EA"]), source: z.enum(["SEED_RETAIL_REFERENCE", "CONTRACT", "SUPPLIER_PRICE"]), observed_at: z.string().nullable() }).strict().nullable().optional() });
export const pinsSchema = z.object({ pack_plan: z.object({ recipe_versions: z.array(z.object({ sku_ref: z.string(), bom_ref: z.string(), version: z.number().int().positive() }).strict()) }).nullable().optional() });
