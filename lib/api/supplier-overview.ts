import { z } from "zod";
import { inventoryRequest } from "./suppliers";

const count = z.number().int().min(0);
const list = <T extends z.ZodType>(item: T) => z.array(item).nullish().transform(items => items ?? []);
export const supplierOverviewSchema = z.object({
  as_of: z.string(),
  suppliers: z.object({ active: count, suspended: count }),
  price_coverage: z.object({ suppliers_with_active_price: count, suppliers_without_active_price: count, materials_priced: count }),
  agreements: z.object({ draft: count, expiring_within_14_days: count }),
  receipts: z.object({ last_30_days: count, last_received_at: z.string().nullable() }),
  attention: z.object({
    expiring: list(z.object({ supplier_id: z.string(), supplier_name: z.string(), agreement_code: z.string(), valid_to: z.string() })),
    without_price: list(z.object({ supplier_id: z.string(), supplier_name: z.string() })),
  }),
});
export type SupplierOverview = z.infer<typeof supplierOverviewSchema>;

export const getSupplierOverview = () => inventoryRequest("suppliers/overview", supplierOverviewSchema);
