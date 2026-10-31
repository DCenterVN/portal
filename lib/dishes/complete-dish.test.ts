import { describe, expect, it } from "vitest";
import { completeDish, slotOf, type CompleteDeps, type DishDraft } from "./complete-dish";

const tree = [
  { code: "THIT", parent_code: null }, { code: "THIT_TRAU", parent_code: "THIT" },
  { code: "THIT_BO", parent_code: "THIT" },
  { code: "THUY_HAI_SAN", parent_code: null }, { code: "TRUNG_SUA", parent_code: null },
  { code: "DO_CHE_BIEN", parent_code: null }, { code: "GAO_NGU_COC", parent_code: null },
  { code: "RAU_CU", parent_code: null }, { code: "RAU_AN_LA", parent_code: "RAU_CU" },
  { code: "TRAI_CAY", parent_code: null }, { code: "GIA_VI", parent_code: null }, { code: "HANH_TOI", parent_code: "GIA_VI" },
];

describe("slotOf (bảng §4)", () => {
  it.each([
    ["THIT", "DAM"], ["THUY_HAI_SAN", "DAM"], ["TRUNG_SUA", "DAM"], ["DO_CHE_BIEN", "DAM"],
    ["GAO_NGU_COC", "TINH_BOT"], ["RAU_CU", "RAU"], ["TRAI_CAY", "RAU"], ["GIA_VI", "RAU"],
    ["THIT_TRAU", "DAM"], ["RAU_AN_LA", "RAU"], ["HANH_TOI", "RAU"],
    [null, "RAU"], ["MA_LA_KHONG_CO", "RAU"],
  ])("%s -> %s", (code, slot) => expect(slotOf(code as string | null, tree)).toBe(slot));
});

const ID = "01960000-0000-7000-8000-00000000abcd";
const T = "2026-10-21T00:00:00Z";
const skuGroups: Record<string, string | null> = {
  "sku-trau": "THIT_TRAU", "sku-bo": "THIT_BO", "sku-rau": "RAU_AN_LA", "sku-toi": "HANH_TOI", "sku-hanh": "HANH_TOI",
};
const L = (sku_ref: string, quantity: string, yield_pct = "100") => ({ sku_ref, quantity, uom: "G", yield_pct });
const ing = (row: string, l: ReturnType<typeof L>) => ({ row, ...l });
const seasonings = [{ row: "g1", slot: "GIA_VI_THEM" as const, package_ref: "pkg-gvxao", removable: false }];
const content = (over = {}) => ({
  schema_version: 1 as const, name: "Thịt trâu xào rau muống", category_ref: "cat-1",
  tags: ["xao", "thit-trau", "rau-muong"], servings: 2,
  ingredients: [ing("r1", L("sku-trau", "150")), ing("r2", L("sku-rau", "200")), ing("r3", L("sku-toi", "10"))],
  seasonings, reason: null as string | null, base: null as unknown, ...over,
});
const draft = (over: Partial<DishDraft> = {}): DishDraft =>
  ({ id: ID, kind: "CREATE", revision: 3, content: content(), progress: {}, ...over }) as DishDraft;
const base = {
  product_ref: "prod-m1", set_ref: "set-m1", set_updated_at: T,
  slots: {
    DAM: { package_ref: "pkg-dam-m1", lines: [L("sku-trau", "150")] },
    RAU: { package_ref: "pkg-rau-m1", lines: [L("sku-rau", "200"), L("sku-toi", "10")] },
  },
};

type Fail = Record<string, { status?: number; message?: string }>;
type Slots = { slot: string; removable: boolean; options: { sku_ref: string; is_default: boolean }[] }[];
function fake(fail: Fail = {}, read: { recipes?: Record<string, { components: ReturnType<typeof L>[] } | null>; slots?: Slots } = {}) {
  const log: string[] = [];
  const calls: Record<string, unknown[][]> = {};
  const slotOfPkg: Record<string, string> = {};
  let n = 0;
  const rec = (name: string, tag: string, args: unknown[]) => {
    log.push(tag);
    (calls[name] ??= []).push(args);
    const f = fail[tag];
    if (f) throw Object.assign(new Error(f.message ?? "boom"), { status: f.status ?? 500 });
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
    replaceSlots: async (...a) => { rec("replaceSlots", "slots", a); },
    recordProgress: async (...a) => { const step = (a[1] as { step: string }).step; log.push(`progress:${step}`); (calls.recordProgress ??= []).push(a); const f = fail[`progress:${step}`]; if (f) throw Object.assign(new Error(f.message ?? "boom"), { status: f.status ?? 500 }); },
    getActiveRecipe: async (pkg) => { (calls.getActiveRecipe ??= []).push([pkg]); return read.recipes?.[pkg] ?? null; },
    readSlots: async (ref) => { (calls.readSlots ??= []).push([ref]); return read.slots ?? []; },
    readSet: async (ref) => { (calls.readSlots ??= []).push([ref]); return { slots: (read.slots ?? []).map(s => ({ ...s, swappable: false, options: s.options.map(o => ({ ...o, quantity: 1 })) })), tags: ["xao", "thit-trau", "rau-muong"] }; },
    completeDraft: async (...a) => { rec("completeDraft", "complete", a); },
  };
  const steps = () => (calls.recordProgress ?? []).map((a) => (a[1] as { step: string }).step);
  const arg = (name: string, i = 0) => calls[name]?.[i] ?? [];
  return { deps, log, calls, steps, arg };
}

describe("completeDish", () => {
  it("(a) CREATE M1: thứ tự gọi, payload, progress, Idempotency-Key", async () => {
    const f = fake();
    const r = await completeDish(draft(), f.deps);
    expect(r).toMatchObject({ ok: true, product_ref: "prod-new", set_ref: "set-new-1" });
    expect(f.log).toEqual([
      "progress:claim", "product", "progress:product", "package:DAM", "progress:package:DAM", "recipe:DAM", "progress:recipe:DAM",
      "package:RAU", "progress:package:RAU", "recipe:RAU", "progress:recipe:RAU",
      "set", "progress:set", "progress:target:slots", "slots", "progress:slots", "complete",
    ]);
    const [prod, pkeyP] = f.arg("createProduct");
    expect(prod).toEqual({ name: "Thịt trâu xào rau muống", slug: "thit-trau-xao-rau-muong-00abcd", category_ref: "cat-1" });
    expect(pkeyP).toBe(`dish-${ID}-r3-product`);

    const [pDam, kDam] = f.arg("createPackage", 0);
    expect(pDam).toMatchObject({ product_ref: "prod-new", name: "Thịt trâu xào rau muống · Đạm", variant_label: "1 suất", net_weight_g: 150, uom_code: "EA", temperature_regime: "CHILLED" });
    expect(typeof (pDam as { code: string }).code).toBe("string");
    expect(kDam).toBe(`dish-${ID}-r3-package:DAM`);
    const [pRau] = f.arg("createPackage", 1);
    expect(pRau).toMatchObject({ name: "Thịt trâu xào rau muống · Rau", net_weight_g: 210 });

    const [, recDam, kRecDam] = f.arg("createRecipe", 0);
    expect(recDam).toEqual({ components: [L("sku-trau", "150")], prep_steps: [] });
    expect(kRecDam).toBe(`dish-${ID}-r3-recipe:DAM`);
    const [, recRau] = f.arg("createRecipe", 1);
    expect(recRau).toEqual({ components: [L("sku-rau", "200"), L("sku-toi", "10")], prep_steps: [] });

    const [set, kSet] = f.arg("createSet");
    expect(set).toMatchObject({ product_ref: "prod-new", name: "Thịt trâu xào rau muống · 2 người", variant_label: "2 người", net_weight_g: 720, temperature_regime: "CHILLED", tags: ["xao", "thit-trau", "rau-muong"] });
    expect(kSet).toBe(`dish-${ID}-r3-set`);

    const [setRef, slotsIn, kSlots] = f.arg("replaceSlots");
    expect(setRef).toBe("set-new-1");
    expect(kSlots).toBe(`dish-${ID}-r3-slots`);
    expect((slotsIn as { slots: unknown[] }).slots).toMatchObject([
      { slot: "DAM", swappable: false, removable: false, options: [{ sku_ref: "pkg-new-DAM", quantity: 1, is_default: true }] },
      { slot: "RAU", swappable: false, removable: false, options: [{ sku_ref: "pkg-new-RAU", quantity: 1, is_default: true }] },
      { slot: "GIA_VI_THEM", removable: false, options: [{ sku_ref: "pkg-gvxao", quantity: 1, is_default: true }] },
    ]);
    expect(f.steps()).toEqual(["claim", "product", "package:DAM", "recipe:DAM", "package:RAU", "recipe:RAU", "set", "target:slots", "slots"]);
    expect(f.arg("recordProgress", 0)).toEqual([ID, { step: "claim", ref: "r3", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 1)).toEqual([ID, { step: "product", ref: "prod-new", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 2)).toEqual([ID, { step: "package:DAM", ref: "pkg-new-DAM", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 3)).toEqual([ID, { step: "recipe:DAM", ref: "pkg-new-DAM", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 6)).toEqual([ID, { step: "set", ref: "set-new-1", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 7)).toMatchObject([ID, { step: "target:slots", expected_revision: 3 }]);
    expect(JSON.parse((f.arg("recordProgress", 7)[1] as { ref: string }).ref)).toMatchObject({ set_ref: "set-new-1", expected_updated_at: T });
    expect(f.arg("recordProgress", 8)).toEqual([ID, { step: "slots", ref: "set-new-1", expected_revision: 3 }]);
    expect(f.arg("completeDraft")[0]).toBe(ID);
    expect(f.arg("completeDraft")[1]).toEqual({ product_ref: "prod-new", set_ref: "set-new-1" });
    expect(f.arg("completeDraft")[2]).toBe(`dish-${ID}-r3-complete`);
  });

  it("ô gia vị removable theo dòng", async () => {
    const f = fake();
    const sea = [
      { row: "g1", slot: "GIA_VI_THEM" as const, package_ref: "pkg-gvxao", removable: false },
      { row: "g2", slot: "NUOC_CHAM" as const, package_ref: "pkg-cham", removable: true },
    ];
    await completeDish(draft({ content: content({ seasonings: sea }) }), f.deps);
    const slots = (f.arg("replaceSlots")[1] as { slots: { slot: string; removable: boolean }[] }).slots;
    expect(slots.find((s) => s.slot === "NUOC_CHAM")?.removable).toBe(true);
    expect(slots.find((s) => s.slot === "GIA_VI_THEM")?.removable).toBe(false);
  });

  it("(b) retry: bỏ qua bước đã có progress, tiếp từ recipe:DAM", async () => {
    const f = fake();
    const r = await completeDish(draft({ progress: { claim: "r3", product: "prod-1", "package:DAM": "pkg-dam-1" } }), f.deps);
    expect(r).toMatchObject({ ok: true, product_ref: "prod-1" });
    expect(f.calls.createProduct).toBeUndefined();
    expect(f.log.filter((t) => t.startsWith("package:"))).toEqual(["package:RAU"]);
    expect(f.arg("createRecipe", 0)[0]).toBe("pkg-dam-1");
    expect(f.log.slice(0, 2)).toEqual(["recipe:pkg-dam-1", "progress:recipe:DAM"]);
    expect(f.calls.recordProgress.every((a) => (a[1] as { expected_revision: number }).expected_revision === 3)).toBe(true);
    expect(f.steps()).toEqual(["recipe:DAM", "package:RAU", "recipe:RAU", "set", "target:slots", "slots"]);
    expect(f.arg("createPackage", 0)[0]).toMatchObject({ product_ref: "prod-1" });
  });

  it("(c) lỗi ở createPackage(RAU) -> failed_step, không gọi bước sau", async () => {
    const f = fake({ "package:RAU": { status: 500, message: "boom" } });
    const r = await completeDish(draft(), f.deps);
    expect(r).toMatchObject({ ok: false, failed_step: "package:RAU", error: { status: 500, message: "boom" } });
    expect(f.log[f.log.length - 1]).toBe("package:RAU");
    expect(f.calls.createSet).toBeUndefined();
    expect(f.calls.completeDraft).toBeUndefined();
    expect(f.steps()).toEqual(["claim", "product", "package:DAM", "recipe:DAM"]);
  });

  it("(d) COPY M1->M2 (trâu->bò): dùng lại gói RAU trùng hệt, DAM tạo mới, product mới", async () => {
    const f = fake();
    const c = content({
      name: "Thịt bò xào rau muống",
      ingredients: [ing("a", L("sku-toi", "10.0")), ing("b", L("sku-bo", "150")), ing("c", L("sku-rau", "200.000"))],
      base,
    });
    const r = await completeDish(draft({ kind: "COPY", content: c }), f.deps);
    expect(r).toMatchObject({ ok: true, product_ref: "prod-new" });
    expect(f.calls.createProduct).toHaveLength(1);
    expect(f.log.filter((t) => t.startsWith("package:"))).toEqual(["package:DAM"]);
    expect(f.log.filter((t) => t.startsWith("recipe:"))).toEqual(["recipe:DAM"]);
    expect(f.steps().some((s) => s.endsWith(":RAU"))).toBe(false);
    const slots = (f.arg("replaceSlots")[1] as { slots: { slot: string; options: { sku_ref: string }[] }[] }).slots;
    expect(slots.find((s) => s.slot === "RAU")?.options[0].sku_ref).toBe("pkg-rau-m1");
    expect(slots.find((s) => s.slot === "DAM")?.options[0].sku_ref).toBe("pkg-new-DAM");
    expect(f.arg("createSet")[0]).toMatchObject({ product_ref: "prod-new" });
  });

  it("(e) VARIANT 4 người cùng dòng: 0 gói mới, set mới cùng product, 1440 g", async () => {
    const f = fake();
    const r = await completeDish(draft({ kind: "VARIANT", content: content({ servings: 4, base }) }), f.deps);
    expect(r).toMatchObject({ ok: true, product_ref: "prod-m1" });
    expect(f.calls.createProduct).toBeUndefined();
    expect(f.calls.createPackage).toBeUndefined();
    expect(f.calls.createRecipe).toBeUndefined();
    expect(f.arg("createSet")[0]).toMatchObject({ product_ref: "prod-m1", name: "Thịt trâu xào rau muống · 4 người", variant_label: "4 người", net_weight_g: 1440 });
    const slots = (f.arg("replaceSlots")[1] as { slots: { slot: string; options: { sku_ref: string; quantity: number }[] }[] }).slots;
    expect(slots.find((s) => s.slot === "DAM")?.options[0]).toMatchObject({ sku_ref: "pkg-dam-m1", quantity: 1 });
    expect(slots.find((s) => s.slot === "RAU")?.options[0]).toMatchObject({ sku_ref: "pkg-rau-m1", quantity: 1 });
    expect(f.arg("completeDraft")[1]).toEqual({ product_ref: "prod-m1", set_ref: "set-new-1" });
  });

  const revision = (over = {}) => draft({
    kind: "REVISION",
    content: content({
      reason: "đổi tỏi sang hành",
      ingredients: [ing("r1", L("sku-trau", "150")), ing("r2", L("sku-rau", "200")), ing("r3", L("sku-hanh", "10"))],
      base, ...over,
    }),
  });

  it("(f) REVISION: không tạo product/set; ô đổi -> gói mới; PUT set gốc kèm expected_updated_at", async () => {
    const f = fake();
    const r = await completeDish(revision(), f.deps);
    expect(r).toMatchObject({ ok: true, product_ref: "prod-m1", set_ref: "set-m1" });
    expect(f.calls.createProduct).toBeUndefined();
    expect(f.calls.createSet).toBeUndefined();
    expect(f.log.filter((t) => t.startsWith("package:"))).toEqual(["package:RAU"]);
    const [setRef, body, key] = f.arg("replaceSlots");
    expect(setRef).toBe("set-m1");
    expect(body).toMatchObject({ expected_updated_at: T });
    expect(key).toBe(`dish-${ID}-r3-slots`);
    const slots = (body as { slots: { slot: string; options: { sku_ref: string }[] }[] }).slots;
    expect(slots.find((s) => s.slot === "DAM")?.options[0].sku_ref).toBe("pkg-dam-m1");
    expect(slots.find((s) => s.slot === "RAU")?.options[0].sku_ref).toBe("pkg-new-RAU");
    expect(f.arg("completeDraft")[1]).toEqual({ product_ref: "prod-m1", set_ref: "set-m1" });
  });

  it("(f) REVISION: 409 stale ở slots -> failed_step slots, không completeDraft", async () => {
    const f = fake({ slots: { status: 409, message: "stale" } });
    const r = await completeDish(revision(), f.deps);
    expect(r).toMatchObject({
      ok: false, failed_step: "slots",
      error: { status: 409, message: "Món đã bị sửa ở nơi khác, mở lại bản sửa" },
    });
    expect(f.calls.completeDraft).toBeUndefined();
  });

  // ---- S14c (review r1) ----
  it("claim: ghi progress claim=r<revision> với expected_revision TRƯỚC mọi lệnh ghi; mọi progress cùng revision", async () => {
    const f = fake();
    await completeDish(draft({ revision: 7 }), f.deps);
    expect(f.log[0]).toBe("progress:claim");
    expect(f.arg("recordProgress", 0)).toEqual([ID, { step: "claim", ref: "r7", expected_revision: 7 }]);
    expect(f.calls.recordProgress.every((a) => (a[1] as { expected_revision: number }).expected_revision === 7)).toBe(true);
    expect(f.arg("createProduct")[1]).toBe(`dish-${ID}-r7-product`);
  });

  it("claim 409 (nháp đã đổi revision) -> dừng, 0 tác dụng phụ", async () => {
    const f = fake({ "progress:claim": { status: 409, message: "stale" } });
    const r = await completeDish(draft(), f.deps);
    expect(r).toMatchObject({ ok: false, failed_step: "claim", error: { status: 409 } });
    expect(f.log).toEqual(["progress:claim"]);
    for (const name of ["createProduct", "createPackage", "createRecipe", "createSet", "replaceSlots", "completeDraft"]) expect(f.calls[name]).toBeUndefined();
  });

  it("đã claim (chạy lại): không ghi claim lần nữa", async () => {
    const f = fake();
    await completeDish(draft({ progress: { claim: "r3" } }), f.deps);
    expect(f.steps()).not.toContain("claim");
  });

  it("chạy lại sau khi mất progress set: POST set cùng Idempotency-Key dish-<id>-r<rev>-set", async () => {
    const f = fake();
    const r = await completeDish(draft({ progress: { claim: "r3", product: "prod-1", "package:DAM": "p-d", "recipe:DAM": "p-d", "package:RAU": "p-r", "recipe:RAU": "p-r" } }), f.deps);
    expect(r).toMatchObject({ ok: true });
    expect(f.arg("createSet")[1]).toBe(`dish-${ID}-r3-set`);
    expect(f.calls.createPackage).toBeUndefined();
  });

  describe("recipe 409 đối soát", () => {
    const damLines = [L("sku-trau", "150")];
    it("công thức ACTIVE của gói vừa tạo trùng payload -> coi là xong, đi tiếp", async () => {
      const f = fake({ "recipe:DAM": { status: 409, message: "exists" } }, { recipes: { "pkg-new-DAM": { components: [L("sku-trau", "150.000")] } } });
      const r = await completeDish(draft(), f.deps);
      expect(r).toMatchObject({ ok: true });
      expect(f.calls.getActiveRecipe[0]).toEqual(["pkg-new-DAM"]);
      expect(f.steps()).toContain("recipe:DAM");
      expect(f.arg("recordProgress", f.steps().indexOf("recipe:DAM"))).toEqual([ID, { step: "recipe:DAM", ref: "pkg-new-DAM", expected_revision: 3 }]);
      expect(f.calls.completeDraft).toHaveLength(1);
    });
    it("công thức khác payload -> lỗi 409 tại recipe:DAM, không đi tiếp", async () => {
      const f = fake({ "recipe:DAM": { status: 409, message: "exists" } }, { recipes: { "pkg-new-DAM": { components: [L("sku-trau", "999")] } } });
      const r = await completeDish(draft(), f.deps);
      expect(r).toMatchObject({ ok: false, failed_step: "recipe:DAM", error: { status: 409 } });
      expect(f.steps()).not.toContain("recipe:DAM");
      expect(f.calls.createSet).toBeUndefined();
    });
    it("409 nhưng chưa có công thức ACTIVE -> lỗi", async () => {
      const f = fake({ "recipe:DAM": { status: 409 } });
      expect(await completeDish(draft(), f.deps)).toMatchObject({ ok: false, failed_step: "recipe:DAM" });
    });
    it("lỗi khác 409 -> không đối soát", async () => {
      const f = fake({ "recipe:DAM": { status: 500 } }, { recipes: { "pkg-new-DAM": { components: damLines } } });
      expect(await completeDish(draft(), f.deps)).toMatchObject({ ok: false, failed_step: "recipe:DAM", error: { status: 500 } });
      expect(f.calls.getActiveRecipe).toBeUndefined();
    });
  });

  describe("REVISION slots 409 stale đối soát", () => {
    const target: Slots = [
      { slot: "DAM", removable: false, options: [{ sku_ref: "pkg-dam-m1", is_default: true }] },
      { slot: "RAU", removable: false, options: [{ sku_ref: "pkg-new-RAU", is_default: true }] },
      { slot: "GIA_VI_THEM", removable: false, options: [{ sku_ref: "pkg-gvxao", is_default: true }] },
    ];
    it("slots set hiện tại đã bằng đích -> xong, ghi progress slots, completeDraft", async () => {
      const f = fake({ slots: { status: 409, message: "stale" } }, { slots: target });
      const r = await completeDish(revision(), f.deps);
      expect(r).toMatchObject({ ok: true, product_ref: "prod-m1", set_ref: "set-m1" });
      expect(f.calls.readSlots[0]).toEqual(["set-m1"]);
      expect(f.steps()).toContain("slots");
      expect(f.calls.completeDraft).toHaveLength(1);
    });
    it("slots hiện tại khác đích -> lỗi, thông điệp mở lại bản sửa", async () => {
      const other: Slots = [{ ...target[0], options: [{ sku_ref: "pkg-khac", is_default: true }] }, target[1], target[2]];
      const f = fake({ slots: { status: 409, message: "stale" } }, { slots: other });
      expect(await completeDish(revision(), f.deps)).toMatchObject({ ok: false, failed_step: "slots", error: { status: 409, message: "Món đã bị sửa ở nơi khác, mở lại bản sửa" } });
      expect(f.steps()).not.toContain("slots");
      expect(f.calls.completeDraft).toBeUndefined();
    });
  });
});

// ===== S15c (review r2: R2-C1 mốc nguồn, R2-C2 đối soát đủ mutation) =====
// Hợp đồng đề xuất: CompleteDeps.replaceSlots(setRef, { slots, tags, expected_updated_at }, key);
// CompleteDeps.readSet(setRef): Promise<{ slots; tags }> thay readSlots (fake bên dưới vẫn giữ readSlots kiểu cũ để test đỏ vì hành vi, không vì TypeError).
// Trước PUT: recordProgress({ step: "target:slots", ref: JSON.stringify({ set_ref, slots, tags, expected_updated_at }), expected_revision }).
import { prepareComplete, type ServerDraft } from "./prepare-complete";
import { validateDish } from "./validate-dish";

describe("S15c r2", () => {
  const T0 = "2026-10-20T00:00:00Z";
  const T1 = "2026-10-22T00:00:00Z";
  const TAGS = ["xao", "thit-trau", "rau-muong"];
  type RSlot = { slot: string; swappable: boolean; removable: boolean; options: { sku_ref: string; quantity: number; is_default: boolean }[] };
  type RSet = { slots: RSlot[]; tags: string[] };
  const rs = (slot: string, sku_ref: string, removable = false): RSlot => ({ slot, swappable: false, removable, options: [{ sku_ref, quantity: 1, is_default: true }] });
  const targetSet = (): RSet => ({ slots: [rs("DAM", "pkg-dam-m1"), rs("RAU", "pkg-new-RAU"), rs("GIA_VI_THEM", "pkg-gvxao")], tags: [...TAGS] });
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

  // Server giả: PUT chỉ nhận khi expected_updated_at = mốc hiện tại; 409 nếu lệch; GET trả đủ quantity/swappable/tags.
  function server(current: { updated_at: string; set: RSet }, forceConflict = false) {
    const f = fake();
    const puts: { setRef: string; input: Record<string, unknown>; key: string }[] = [];
    const reads: string[] = [];
    f.deps.replaceSlots = async (setRef, input, key) => {
      puts.push({ setRef, input: clone(input) as Record<string, unknown>, key });
      f.log.push("slots");
      if (forceConflict || (input as { expected_updated_at?: string }).expected_updated_at !== current.updated_at) throw Object.assign(new Error("stale"), { status: 409 });
      current.set = { slots: clone(input.slots) as RSlot[], tags: [...((input as { tags?: string[] }).tags ?? [])] };
    };
    Object.assign(f.deps, {
      readSlots: async (ref: string) => { reads.push(ref); return clone(current.set.slots); },
      readSet: async (ref: string) => { reads.push(ref); return clone(current.set); },
    });
    return { ...f, puts, reads, current };
  }
  const rev = (progress: Record<string, string> = {}, mark: string | null = T0) => ({
    ...draft({
      kind: "REVISION", progress,
      content: content({ reason: "đổi tỏi sang hành", ingredients: [ing("r1", L("sku-trau", "150")), ing("r2", L("sku-rau", "200")), ing("r3", L("sku-hanh", "10"))], base: { ...base, set_updated_at: "2099-01-01T00:00:00Z" } }),
    }),
    source_product_ref: "prod-m1", source_set_ref: "set-m1", source_set_updated_at: mark,
  }) as unknown as ServerDraft;
  const variantOf = (updated_at: string) => ({
    set_ref: "set-m1", variant_label: "2 người", servings: 2, journey: "DONE" as const, updated_at,
    packs: [{ slot: "DAM" as const, package_ref: "pkg-dam-m1", package_name: "Đạm", lines: [L("sku-trau", "150")] }, { slot: "RAU" as const, package_ref: "pkg-rau-m1", package_name: "Rau", lines: [L("sku-rau", "200"), L("sku-toi", "10")] }], seasonings: [],
  });
  const detailAt = (updated_at: string) => ({ loadDetail: async () => ({ product: { id: "prod-m1", name: "x", slug: "x", category_ref: null, status: "ACTIVE" }, variants: [variantOf(updated_at)], open_drafts: [], revision_history: [] }) });
  const prepared = async (d: ServerDraft, nowAt = T1) => {
    const r = await prepareComplete(d, detailAt(nowAt));
    if (!r.ok) throw new Error("prepare failed");
    return r.draft;
  };

  describe("R2-C1: mốc nguồn t0 xuyên prepare -> complete", () => {
    it("Hoàn tất lần đầu khi set bị PUT ở t1: PUT mang t0, 409, không progress slots, không complete, dữ liệu t1 còn nguyên", async () => {
      const other = targetSet(); other.tags = ["khac"];
      const s = server({ updated_at: T1, set: other });
      const r = await completeDish(await prepared(rev()), s.deps);
      expect(s.puts).toHaveLength(1);
      expect(s.puts[0].input).toMatchObject({ expected_updated_at: T0 });
      expect(r).toMatchObject({ ok: false, failed_step: "slots", error: { status: 409 } });
      expect(s.steps()).not.toContain("slots");
      expect(s.calls.completeDraft).toBeUndefined();
      expect(s.current.set.tags).toEqual(["khac"]);
    });
    it("đã claim, lỗi trước PUT, set đổi sang t1: retry vẫn gửi t0 và giữ 409", async () => {
      const s = server({ updated_at: T1, set: { ...targetSet(), tags: ["khac"] } });
      const r = await completeDish(await prepared(rev({ claim: "r3", "package:RAU": "pkg-new-RAU", "recipe:RAU": "pkg-new-RAU" })), s.deps);
      expect(s.puts[0].input).toMatchObject({ expected_updated_at: T0 });
      expect(r).toMatchObject({ ok: false, error: { status: 409 } });
      expect(s.calls.completeDraft).toBeUndefined();
    });
  });

  describe("target:slots chốt trước PUT", () => {
    it("ghi progress target:slots = JSON {set_ref, slots, tags, expected_updated_at} cùng expected_revision, rồi mới PUT cùng nội dung", async () => {
      const s = server({ updated_at: T0, set: targetSet() });
      const r = await completeDish(await prepared(rev(), T0), s.deps);
      expect(r).toMatchObject({ ok: true });
      const iTarget = s.log.indexOf("progress:target:slots");
      expect(iTarget).toBeGreaterThan(-1);
      expect(iTarget).toBeLessThan(s.log.indexOf("slots"));
      const call = (s.calls.recordProgress ?? []).find(a => (a[1] as { step: string }).step === "target:slots")?.[1] as { ref: string; expected_revision: number };
      expect(call.expected_revision).toBe(3);
      const target = JSON.parse(call.ref);
      expect(Object.keys(target).sort()).toEqual(["expected_updated_at", "set_ref", "slots", "tags"]);
      expect(target).toMatchObject({ set_ref: "set-m1", tags: TAGS, expected_updated_at: T0 });
      expect(target.slots).toEqual(targetSet().slots);
      expect(s.puts[0].input).toMatchObject({ slots: target.slots, tags: target.tags, expected_updated_at: T0 });
    });
    it("target:slots ghi thất bại -> không PUT", async () => {
      const s = server({ updated_at: T0, set: targetSet() });
      s.deps.recordProgress = async (id, input) => { if (input.step === "target:slots") throw Object.assign(new Error("boom"), { status: 500 }); };
      const r = await completeDish(await prepared(rev(), T0), s.deps);
      expect(r.ok).toBe(false);
      expect(s.puts).toHaveLength(0);
    });
    it("retry sau PUT đã commit rồi mất phản hồi (R3-N1): CAS tăng mốc, nháp tải lại, detail t1 -> nguyên payload t0, không tạo lại tài nguyên, COMPLETED", async () => {
      const s = server({ updated_at: T0, set: { slots: [rs("DAM", "pkg-dam-m1")], tags: ["cu"] } });
      const persisted: Record<string, string> = {};
      const record = s.deps.recordProgress;
      s.deps.recordProgress = async (id, input) => { await record(id, input); persisted[input.step] = input.ref; };
      const put = s.deps.replaceSlots;
      let lost = false;
      s.deps.replaceSlots = async (setRef, input, key) => {
        await put(setRef, input, key);
        s.current.updated_at = T1;
        if (!lost) { lost = true; throw Object.assign(new Error("mất phản hồi"), { status: 500 }); }
      };
      const first = await completeDish(await prepared(rev(), T0), s.deps);
      expect(first).toMatchObject({ ok: false, failed_step: "slots" });
      expect(persisted["target:slots"]).toBeDefined();
      expect(persisted.slots).toBeUndefined();
      const created = { product: s.calls.createProduct?.length ?? 0, pkg: s.calls.createPackage?.length ?? 0, recipe: s.calls.createRecipe?.length ?? 0, set: s.calls.createSet?.length ?? 0 };

      const reloaded = JSON.parse(JSON.stringify(rev({ ...persisted })));
      const second = await completeDish(await prepared(reloaded, T1), s.deps);
      expect(second).toMatchObject({ ok: true, product_ref: "prod-m1", set_ref: "set-m1" });
      expect(s.puts).toHaveLength(2);
      expect(s.puts[1].input).toEqual(s.puts[0].input);
      expect(s.puts[1].input).toMatchObject({ expected_updated_at: T0 });
      expect({ product: s.calls.createProduct?.length ?? 0, pkg: s.calls.createPackage?.length ?? 0, recipe: s.calls.createRecipe?.length ?? 0, set: s.calls.createSet?.length ?? 0 }).toEqual(created);
      expect(s.calls.completeDraft).toHaveLength(1);
      expect(s.steps()).toContain("slots");
    });
    it("target sẵn nhưng set_ref khác set nguồn của nháp -> dừng, không PUT", async () => {
      const stored = { set_ref: "set-khac", slots: targetSet().slots, tags: TAGS, expected_updated_at: T0 };
      const s = server({ updated_at: T0, set: targetSet() });
      const r = await completeDish(await prepared(rev({ claim: "r3", "target:slots": JSON.stringify(stored) }), T0), s.deps);
      expect(r.ok).toBe(false);
      expect(s.puts).toHaveLength(0);
    });
    it("target sẵn hỏng shape (không phải JSON) -> dừng, không PUT", async () => {
      const s = server({ updated_at: T0, set: targetSet() });
      const r = await completeDish(await prepared(rev({ claim: "r3", "target:slots": "khong-phai-json" }), T0), s.deps);
      expect(r.ok).toBe(false);
      expect(s.puts).toHaveLength(0);
    });
  });

  describe("R2-C2: đối soát sau 409 phải so đủ", () => {
    const mutate: [string, (set: RSet) => void][] = [
      ["quantity", set => { set.slots[1].options[0].quantity = 2; }],
      ["swappable", set => { set.slots[0].swappable = true; }],
      ["tags (chỉ khác hashtag)", set => { set.tags = ["xao"]; }],
      ["tags (đổi 1 phần tử)", set => { set.tags[2] = "khac"; }],
      ["slot", set => { set.slots[1].slot = "TINH_BOT"; }],
      ["removable", set => { set.slots[2].removable = true; }],
      ["sku_ref", set => { set.slots[1].options[0].sku_ref = "pkg-khac"; }],
      ["is_default", set => { set.slots[1].options[0].is_default = false; }],
      ["thừa option", set => { set.slots[1].options.push({ sku_ref: "pkg-them", quantity: 1, is_default: false }); }],
      ["thiếu option", set => { set.slots[1].options = []; }],
      ["thừa slot", set => { set.slots.push(rs("COT", "pkg-cot")); }],
      ["thiếu slot", set => { set.slots.pop(); }],
    ];
    it.each(mutate)("read-back chỉ khác %s -> giữ 409, không progress slots, không complete", async (_name, change) => {
      const set = targetSet(); change(set);
      const s = server({ updated_at: T1, set }, true);
      const r = await completeDish(await prepared(rev()), s.deps);
      expect(r).toMatchObject({ ok: false, failed_step: "slots", error: { status: 409, message: "Món đã bị sửa ở nơi khác, mở lại bản sửa" } });
      expect(s.steps()).not.toContain("slots");
      expect(s.calls.completeDraft).toBeUndefined();
    });
    it("chỉ khác thứ tự slots và tags -> phục hồi, ghi progress slots, complete", async () => {
      const set = targetSet(); set.slots.reverse(); set.tags.reverse();
      const s = server({ updated_at: T1, set }, true);
      const r = await completeDish(await prepared(rev()), s.deps);
      expect(r).toMatchObject({ ok: true, set_ref: "set-m1" });
      expect(s.steps()).toContain("slots");
      expect(s.calls.completeDraft).toHaveLength(1);
    });
    it("read-back khớp hệt -> phục hồi", async () => {
      const s = server({ updated_at: T1, set: targetSet() }, true);
      expect(await completeDish(await prepared(rev()), s.deps)).toMatchObject({ ok: true });
    });
    it.each([
      ["thiếu quantity", (set: RSet) => { delete (set.slots[1].options[0] as Partial<RSlot["options"][0]>).quantity; }],
      ["thiếu swappable", (set: RSet) => { delete (set.slots[0] as Partial<RSlot>).swappable; }],
      ["thiếu tags", (set: RSet) => { delete (set as Partial<RSet>).tags; }],
    ])("GET set %s -> dừng an toàn, giữ 409", async (_name, change) => {
      const set = targetSet(); change(set);
      const s = server({ updated_at: T1, set }, true);
      const r = await completeDish(await prepared(rev()), s.deps);
      expect(r).toMatchObject({ ok: false, error: { status: 409 } });
      expect(s.steps()).not.toContain("slots");
      expect(s.calls.completeDraft).toBeUndefined();
    });
    it("E9: journey nguồn SELLING dù mốc hợp lệ -> prepare ok nhưng validate chặn base (409), không đi tới complete", async () => {
      const r = await prepareComplete(rev(), { loadDetail: async () => ({ ...(await detailAt(T0).loadDetail()), variants: [{ ...variantOf(T0), journey: "SELLING" as const }] }) });
      expect(r).toMatchObject({ ok: true, sourceJourney: "SELLING" });
      if (!r.ok) return;
      const errors = validateDish(r.draft.content as never, { kind: "REVISION", tree, skuGroups, packagesWithRecipe: ["pkg-gvxao"], existingVariants: [], source_journey: r.sourceJourney });
      expect(errors.some(error => error.field === "base")).toBe(true);
    });
  });

  describe("R3-C2: set mới (CREATE/COPY/VARIANT) PUT đã commit rồi mất phản hồi", () => {
    const kinds = [["CREATE", false], ["COPY", true], ["VARIANT", true]] as const;
    const modes = ["mất phản hồi PUT", "lỗi ghi progress slots"] as const;
    const mismatch: [string, (set: RSet) => void][] = [
      ["quantity", set => { set.slots[0].options[0].quantity = 2; }],
      ["tags", set => { set.tags = ["khac"]; }],
    ];
    async function firstRun(kind: "CREATE" | "COPY" | "VARIANT", withBase: boolean, mode: (typeof modes)[number]) {
      const s = server({ updated_at: T, set: { slots: [], tags: [] } });
      const persisted: Record<string, string> = {};
      let failedOnce = false;
      const record = s.deps.recordProgress;
      s.deps.recordProgress = async (id, input) => {
        if (mode === modes[1] && input.step === "slots" && !failedOnce) { failedOnce = true; throw Object.assign(new Error("boom"), { status: 500 }); }
        await record(id, input);
        persisted[input.step] = input.ref;
      };
      const put = s.deps.replaceSlots;
      s.deps.replaceSlots = async (setRef, input, key) => {
        await put(setRef, input, key);
        s.current.updated_at = T1;
        if (mode === modes[0] && !failedOnce) { failedOnce = true; throw Object.assign(new Error("mất phản hồi"), { status: 500 }); }
      };
      const mk = (progress: Record<string, string>) => JSON.parse(JSON.stringify(draft({ kind, content: content({ base: withBase ? base : null }), progress })));
      const first = await completeDish(mk({}), s.deps);
      expect(first).toMatchObject({ ok: false, failed_step: "slots" });
      expect(persisted["target:slots"]).toBeDefined();
      expect(persisted.slots).toBeUndefined();
      expect(s.current.updated_at).toBe(T1);
      return { s, retry: () => completeDish(mk({ ...persisted }), s.deps) };
    }
    const cases = kinds.flatMap(([kind, b]) => modes.map(mode => [kind, b, mode] as const));
    it.each(cases)("%s (base=%s) · %s: retry gặp 409 stale, set khớp đủ target -> phục hồi và complete", async (kind, b, mode) => {
      const { s, retry } = await firstRun(kind, b, mode);
      const createdSets = s.calls.createSet?.length ?? 0;
      const r = await retry();
      expect(r).toMatchObject({ ok: true, set_ref: "set-new-1" });
      expect(s.puts).toHaveLength(2);
      expect(s.puts[1].input).toEqual(s.puts[0].input);
      expect(s.calls.createSet?.length ?? 0).toBe(createdSets);
      expect(s.steps()).toContain("slots");
      expect(s.calls.completeDraft).toHaveLength(1);
    });
    const mismatchCases = kinds.flatMap(([kind, b]) => mismatch.map(([name, change]) => [kind, b, name, change] as const));
    it.each(mismatchCases)("%s: set đã commit nhưng khác %s -> giữ 409, không progress slots, không complete", async (kind, b, _name, change) => {
      const { s, retry } = await firstRun(kind, b, modes[0]);
      change(s.current.set);
      const r = await retry();
      expect(r).toMatchObject({ ok: false, failed_step: "slots", error: { status: 409, message: "Món đã bị sửa ở nơi khác, mở lại bản sửa" } });
      expect(s.steps()).not.toContain("slots");
      expect(s.calls.completeDraft).toBeUndefined();
    });
  });
});
