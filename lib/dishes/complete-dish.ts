import { slotOf, slotLabels, type DishDraft as StoredDishDraft, type DishContent, type GroupNode, type Line } from "./types";
export { slotOf } from "./types";
import { z } from "zod";
import { contentSchema } from "@/lib/api/dishes";
export type DishDraft = Omit<StoredDishDraft, "content"> & { content: Omit<DishContent, "base"> & { base: unknown } };
type PackageInput = { product_ref: string; code: string; name: string; variant_label: string; net_weight_g: number; uom_code: string; temperature_regime: string };
const slotSchema = z.object({
  slot: z.enum(["DAM", "RAU", "TINH_BOT", "COT", "NUOC_CHAM", "GIA_VI_THEM"]),
  swappable: z.boolean(), removable: z.boolean(),
  options: z.array(z.object({ sku_ref: z.string().min(1), quantity: z.number().positive().finite(), is_default: z.boolean() })),
});
const setSchema = z.object({ slots: z.array(slotSchema), tags: z.array(z.string()) });
const targetSchema = setSchema.extend({ set_ref: z.string().min(1), expected_updated_at: z.string().min(1) });
type Slot = z.infer<typeof slotSchema>;
type Target = z.infer<typeof targetSchema>;
type ReadSlot = { slot: string; removable: boolean; options: { sku_ref: string; is_default: boolean }[] };
export type CompleteDeps = {
  tree: GroupNode[]; skuGroups: Record<string, string | null>;
  createProduct(input: { name: string; slug: string; category_ref: string }, key: string): Promise<{ id: string }>;
  createPackage(input: PackageInput, key: string): Promise<{ id: string }>;
  createRecipe(packageRef: string, input: { components: Line[]; prep_steps: [] }, key: string): Promise<void>;
  createSet(input: Omit<PackageInput, "uom_code"> & { tags: string[] }, key: string): Promise<{ id: string; updated_at: string }>;
  replaceSlots(setRef: string, input: { slots: Slot[]; tags: string[]; expected_updated_at: string }, key: string): Promise<{ updated_at: string }>;
  createSellable(setRef: string, input: { expected_updated_at: string; portion_count: number }, key: string): Promise<{ sku_ref: string }>;
  recordProgress(draftId: string, input: { step: string; ref: string; expected_revision: number }): Promise<void>;
  getActiveRecipe(packageRef: string): Promise<{ components: Line[] } | null>;
  readSet?(setRef: string): Promise<unknown>;
  readSlots?(setRef: string): Promise<ReadSlot[]>;
  completeDraft(draftId: string, input: { product_ref: string; set_ref: string }, key: string): Promise<void>;
};
export type CompleteResult = { ok: true; product_ref: string; set_ref: string } | { ok: false; failed_step: string; error: { status?: number; message: string } };
function isConflict(error: unknown) {
  return error !== null && typeof error === "object" && "status" in error && error.status === 409;
}
function sameSet(target: Target, actual: unknown) {
  const parsed = setSchema.safeParse(actual);
  if (!parsed.success) return false;
  const normalized = (slots: Slot[]) => slots.map(slot => JSON.stringify([
    slot.slot, slot.swappable, slot.removable,
    slot.options.map(option => JSON.stringify([option.sku_ref, option.quantity, option.is_default])).sort(),
  ])).sort();
  return JSON.stringify(normalized(target.slots)) === JSON.stringify(normalized(parsed.data.slots))
    && JSON.stringify([...target.tags].sort()) === JSON.stringify([...parsed.data.tags].sort());
}
function readTarget(value: string, draft: DishDraft, content: DishContent): Target {
  let target: Target;
  try { target = targetSchema.parse(JSON.parse(value)); }
  catch { throw Object.assign(new Error("Đích đã lưu không hợp lệ, mở lại bản sửa"), { status: 409 }); }
  const setRef = draft.kind === "REVISION" ? content.base?.set_ref : draft.progress.set;
  if (target.set_ref !== setRef || (draft.kind === "REVISION" && target.expected_updated_at !== content.base?.set_updated_at)) {
    throw Object.assign(new Error("Đích đã lưu không khớp nháp, mở lại bản sửa"), { status: 409 });
  }
  return target;
}
function sameLines(a: Line[], b: Line[]) {
  return a.length === b.length && a.every(line => b.some(other => other.sku_ref === line.sku_ref && other.uom === line.uom && Number(other.quantity) === Number(line.quantity) && Number(other.yield_pct) === Number(line.yield_pct)));
}
export async function completeDish(draft: DishDraft, deps: CompleteDeps): Promise<CompleteResult> {
  let failed_step = "claim";
  const { progress } = draft;
  
  const key = (step: string) => `dish-${draft.id}-r${draft.revision}-${step}`;
  const run = async (step: string, action: () => Promise<string>) => {
    failed_step = step;
    if (progress[step]) return progress[step];
    const ref = await action();
    await deps.recordProgress(draft.id, { step, ref, expected_revision: draft.revision });
    progress[step] = ref;
    return ref;
  };
  try {
    await run("claim", async () => `r${draft.revision}`);
    const content = contentSchema.parse(draft.content);
    const name = content.name?.trim() ?? "";
    const suffix = draft.id.slice(-6);
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    failed_step = "target:slots";
    let target = progress["target:slots"] === undefined ? null : readTarget(progress["target:slots"], draft, content);
    const product_ref = draft.kind === "CREATE" || draft.kind === "COPY"
      ? await run("product", async () => (await deps.createProduct({ name, slug: `${slug}-${suffix}`, category_ref: content.category_ref ?? "" }, key("product"))).id)
      : content.base?.product_ref ?? "";
    if (!target) {
      const slots: Slot[] = [];
      const weight = (lines: Line[]) => lines.filter(line => ["G", "ML"].includes(line.uom)).reduce((sum, line) => sum + Number(line.quantity), 0);
      for (const slot of ["DAM", "RAU", "TINH_BOT"] as const) {
        const lines: Line[] = content.ingredients.filter(line => line.sku_ref && slotOf(deps.skuGroups[line.sku_ref] ?? null, deps.tree) === slot).map(line => ({ sku_ref: line.sku_ref ?? "", quantity: line.quantity, uom: line.uom, yield_pct: line.yield_pct }));
        if (!lines.length) continue;
        const base = content.base?.slots[slot];
        let ref = base?.package_ref;
        if (progress[`package:${slot}`] || !base || !sameLines(lines, base.lines)) {
          ref = await run(`package:${slot}`, async () => (await deps.createPackage({ product_ref, code: `D-${draft.id}-${slot}`, name: `${name} · ${slotLabels[slot]}`, variant_label: "1 suất", net_weight_g: Math.max(1, Math.round(weight(lines))), uom_code: "EA", temperature_regime: "CHILLED" }, key(`package:${slot}`))).id);
          const packageRef = ref;
          await run(`recipe:${slot}`, async () => {
            try { await deps.createRecipe(packageRef, { components: lines, prep_steps: [] }, key(`recipe:${slot}`)); }
            catch (error) {
              if (!isConflict(error)) throw error;
              const recipe = await deps.getActiveRecipe(packageRef);
              if (!recipe || !sameLines(lines, recipe.components)) throw error;
            }
            return packageRef;
          });
        }
        slots.push({ slot, swappable: false, removable: false, options: [{ sku_ref: ref ?? "", quantity: 1, is_default: true }] });
      }
      for (const line of content.seasonings) slots.push({ slot: line.slot, swappable: false, removable: line.removable, options: [{ sku_ref: line.package_ref ?? "", quantity: 1, is_default: true }] });
      const variant_label = `${content.servings} người`;
      let set_ref = content.base?.set_ref ?? "";
      let expected_updated_at = content.base?.set_updated_at ?? "";
      if (draft.kind !== "REVISION") {
        failed_step = "set";
        const created = await deps.createSet({ product_ref, code: `D-${draft.id}-${content.servings}`, name: `${name} · ${variant_label}`, variant_label, net_weight_g: Math.max(1, Math.round(weight(content.ingredients.map(line => ({ ...line, sku_ref: line.sku_ref ?? "" }))) * (content.servings ?? 1))), temperature_regime: "CHILLED", tags: content.tags }, key("set"));
        if (progress.set && progress.set !== created.id) throw Object.assign(new Error("Set đã lưu không khớp nháp"), { status: 409 });
        set_ref = await run("set", async () => created.id);
        expected_updated_at = created.updated_at;
      }
      const ref = await run("target:slots", async () => JSON.stringify(targetSchema.parse({ set_ref, slots, tags: content.tags, expected_updated_at })));
      target = readTarget(ref, draft, content);
    }
    const { set_ref, ...mutation } = target;
    const revision = await run("slots", async () => {
      try { return (await deps.replaceSlots(set_ref, mutation, key("slots"))).updated_at; }
      catch (error) {
        if (!isConflict(error)) throw error;
        const actual = deps.readSet ? await deps.readSet(set_ref) : null;
        if (!sameSet(target, actual)) throw error;
        return z.object({ updated_at: z.string().datetime({ offset: true }) }).parse(actual).updated_at;
      }
    });
    await run("sellable", async () => {
      let expected_updated_at = revision;
      if (revision === set_ref) {
        const actual = deps.readSet ? await deps.readSet(set_ref) : null;
        if (!sameSet(target, actual)) throw Object.assign(new Error("Món đã bị sửa ở nơi khác, mở lại bản sửa"), { status: 409 });
        expected_updated_at = z.object({ updated_at: z.string().datetime({ offset: true }) }).parse(actual).updated_at;
      }
      return (await deps.createSellable(set_ref, { expected_updated_at, portion_count: z.number().int().positive().parse(content.servings) }, key("sellable"))).sku_ref;
    });
    failed_step = "complete";
    await deps.completeDraft(draft.id, { product_ref, set_ref }, key("complete"));
    return { ok: true, product_ref, set_ref };
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
    const code = error && typeof error === "object" && "code" in error ? error.code : "";
    if (failed_step === "sellable") {
      if (code === "cost_fact_missing") return { ok: false, failed_step, error: { status, message: "Nguyên liệu trong món chưa có giá vốn. Nhập kho nguyên liệu rồi bấm Hoàn tất món lại." } };
      if (status === 409) return { ok: false, failed_step, error: { status, message: "Món chưa chốt hoặc số suất đã thay đổi. Mở lại bản sửa để kiểm tra." } };
      if (status === 503) return { ok: false, failed_step, error: { status, message: "Hệ thống tạm bận, thử hoàn tất món lại sau ít phút." } };
    }
    return { ok: false, failed_step, error: { status, message: failed_step === "slots" && status === 409 ? "Món đã bị sửa ở nơi khác, mở lại bản sửa" : error instanceof Error ? error.message : "Không hoàn tất được món" } };
  }
}
