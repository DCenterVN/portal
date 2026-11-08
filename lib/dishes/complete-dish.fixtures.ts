import type { CompleteDeps, DishDraft } from "./complete-dish";
export const tree = [
  { code: "THIT", parent_code: null }, { code: "THIT_TRAU", parent_code: "THIT" },
  { code: "THIT_BO", parent_code: "THIT" },
  { code: "THUY_HAI_SAN", parent_code: null }, { code: "TRUNG_SUA", parent_code: null },
  { code: "DO_CHE_BIEN", parent_code: null }, { code: "GAO_NGU_COC", parent_code: null },
  { code: "RAU_CU", parent_code: null }, { code: "RAU_AN_LA", parent_code: "RAU_CU" },
  { code: "TRAI_CAY", parent_code: null }, { code: "GIA_VI", parent_code: null }, { code: "HANH_TOI", parent_code: "GIA_VI" },
];

export const ID = "01960000-0000-7000-8000-00000000abcd";
export const T = "2026-10-21T00:00:00Z";
export const skuGroups: Record<string, string | null> = {
  "sku-trau": "THIT_TRAU", "sku-bo": "THIT_BO", "sku-rau": "RAU_AN_LA", "sku-toi": "HANH_TOI", "sku-hanh": "HANH_TOI",
};
export const L = (sku_ref: string, quantity: string, yield_pct = "100") => ({ sku_ref, quantity, uom: "G", yield_pct });
export const ing = (row: string, l: ReturnType<typeof L>) => ({ row, ...l });
const seasonings = [{ row: "g1", slot: "GIA_VI_THEM" as const, package_ref: "pkg-gvxao", removable: false }];
export const content = (over = {}) => ({
  schema_version: 1 as const, name: "Thịt trâu xào rau muống", category_ref: "cat-1",
  tags: ["xao", "thit-trau", "rau-muong"], servings: 2,
  ingredients: [ing("r1", L("sku-trau", "150")), ing("r2", L("sku-rau", "200")), ing("r3", L("sku-toi", "10"))],
  seasonings, reason: null as string | null, base: null as unknown, ...over,
});
export const draft = (over: Partial<DishDraft> = {}): DishDraft =>
  ({ id: ID, kind: "CREATE", revision: 3, content: content(), progress: {}, ...over }) as DishDraft;
export const base = {
  product_ref: "prod-m1", set_ref: "set-m1", set_updated_at: T,
  slots: {
    DAM: { package_ref: "pkg-dam-m1", lines: [L("sku-trau", "150")] },
    RAU: { package_ref: "pkg-rau-m1", lines: [L("sku-rau", "200"), L("sku-toi", "10")] },
  },
};

export type Fail = Record<string, { status?: number; message?: string; code?: string }>;
export type Slots = { slot: string; removable: boolean; options: { sku_ref: string; is_default: boolean }[] }[];
export function fake(fail: Fail = {}, read: { recipes?: Record<string, { components: ReturnType<typeof L>[] } | null>; slots?: Slots } = {}) {
  const log: string[] = [];
  const calls: Record<string, unknown[][]> = {};
  const slotOfPkg: Record<string, string> = {};
  let n = 0;
  const rec = (name: string, tag: string, args: unknown[]) => {
    log.push(tag);
    (calls[name] ??= []).push(args);
    const f = fail[tag];
    if (f) throw Object.assign(new Error(f.message ?? "boom"), { status: f.status ?? 500, code: f.code });
  };
  const slotFromName = (name: string) => (name.endsWith("Đạm") ? "DAM" : name.endsWith("Rau") ? "RAU" : "TINH_BOT");
  const deps: CompleteDeps = {
    tree, skuGroups,
    createProduct: async (...a) => { rec("createProduct", "product", a); return { id: "prod-new" }; },
    createPackage: async (input, key) => {
      const s = slotFromName((input as { name: string }).name);
      rec("createPackage", `package:${s}`, [input, key]);
      slotOfPkg[`pkg-new-${s}`] = s;
      return { id: `pkg-new-${s}` };
    },
    createRecipe: async (pkg, input, key) => { rec("createRecipe", `recipe:${slotOfPkg[pkg] ?? pkg}`, [pkg, input, key]); },
    createSet: async (...a) => { rec("createSet", "set", a); return { id: `set-new-${++n}`, updated_at: T }; },
    replaceSlots: async (...a) => { rec("replaceSlots", "slots", a); return { updated_at: "2026-10-22T00:00:00Z" }; },
    createSellable: async (...a) => { rec("createSellable", "sellable", a); return { sku_ref: "serving-new" }; },
    recordProgress: async (...a) => { const step = (a[1] as { step: string }).step; log.push(`progress:${step}`); (calls.recordProgress ??= []).push(a); const f = fail[`progress:${step}`]; if (f) throw Object.assign(new Error(f.message ?? "boom"), { status: f.status ?? 500, code: f.code }); },
    getActiveRecipe: async (pkg) => { (calls.getActiveRecipe ??= []).push([pkg]); return read.recipes?.[pkg] ?? null; },
    readSlots: async (ref) => { (calls.readSlots ??= []).push([ref]); return read.slots ?? []; },
    readSet: async (ref) => { (calls.readSlots ??= []).push([ref]); return { updated_at: "2026-10-22T00:00:00Z", slots: (read.slots ?? []).map(s => ({ ...s, swappable: false, options: s.options.map(o => ({ ...o, quantity: 1 })) })), tags: ["xao", "thit-trau", "rau-muong"] }; },
    completeDraft: async (...a) => { rec("completeDraft", "complete", a); },
  };
  const steps = () => (calls.recordProgress ?? []).map((a) => (a[1] as { step: string }).step);
  const arg = (name: string, i = 0) => calls[name]?.[i] ?? [];
  return { deps, log, calls, steps, arg };
}

