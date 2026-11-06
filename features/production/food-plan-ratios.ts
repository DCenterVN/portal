import { z } from "zod";
import type { SetSlot } from "@/lib/api/sales";

export const variantLabel = (value: string) => /^VAR-[0-9a-f]{8}-/i.test(value) ? "—" : value;
export const positiveQuantity = (s: string) => /^\d+(\.\d{1,3})?$/.test(s) && /[1-9]/.test(s);
export const servingCount = (label: string) => /^([12346]) người$/.exec(label)?.[1];

export const pinnedPlanSchema = z.object({ pack_plan: z.object({
  set_ref: z.string(), set_updated_at: z.string(),
  slot_ratios: z.array(z.object({ slot: z.string(), options: z.array(z.object({ sku_ref: z.string().nullable(), ratio: z.string() })) })),
}).nullable().optional() });

export function ratioTotal(values: string[]): bigint | null {
  if (values.some(value => !/^(100(\.0{1,4})?|[0-9]{1,2}(\.[0-9]{1,4})?)$/.test(value))) return null;
  return values.reduce((sum, value) => { const [whole, fraction = ""] = value.split("."); return sum + BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0")); }, 0n);
}
export function ratioPercent(value: string): string {
  if (!/^(0(\.[0-9]{1,6})?|1(\.0{1,6})?)$/.test(value)) throw new Error("Tỉ lệ đã pin không hợp lệ");
  const [whole, fraction = ""] = value.split(".");
  const scaled = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
  return `${scaled / 10000n}.${(scaled % 10000n).toString().padStart(4, "0")}`;
}
export function percentRatio(value: string): string {
  const amount = ratioTotal([value]);
  if (amount === null) throw new Error("Tỉ lệ phần trăm không hợp lệ");
  return `${amount / 1000000n}.${(amount % 1000000n).toString().padStart(6, "0")}`;
}
export const slotRatioValues = (slot: SetSlot, ratios: Record<string, string>) =>
  slot.options.map(option => ratios[`${slot.slot}:${option.sku_ref}`] ?? "0").concat(slot.removable ? [ratios[`${slot.slot}:empty`] ?? "0"] : []);
