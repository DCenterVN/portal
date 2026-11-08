import { tree, ID, T, L, ing, content, draft, base, fake, type Fail, type Slots } from "./complete-dish.fixtures";
import { describe, expect, it } from "vitest";
import { completeDish, slotOf, } from "./complete-dish";

describe("slotOf (bảng §4)", () => {
  it.each([
    ["THIT", "DAM"], ["THUY_HAI_SAN", "DAM"], ["TRUNG_SUA", "DAM"], ["DO_CHE_BIEN", "DAM"],
    ["GAO_NGU_COC", "TINH_BOT"], ["RAU_CU", "RAU"], ["TRAI_CAY", "RAU"], ["GIA_VI", "RAU"],
    ["THIT_TRAU", "DAM"], ["RAU_AN_LA", "RAU"], ["HANH_TOI", "RAU"],
    [null, "RAU"], ["MA_LA_KHONG_CO", "RAU"],
  ])("%s -> %s", (code, slot) => expect(slotOf(code as string | null, tree)).toBe(slot));
});

describe("completeDish", () => {
  it("(a) CREATE M1: thứ tự gọi, payload, progress, Idempotency-Key", async () => {
    const f = fake();
    const r = await completeDish(draft(), f.deps);
    expect(r).toMatchObject({ ok: true, product_ref: "prod-new", set_ref: "set-new-1" });
    expect(f.log).toEqual([
      "progress:claim", "product", "progress:product", "package:DAM", "progress:package:DAM", "recipe:DAM", "progress:recipe:DAM",
      "package:RAU", "progress:package:RAU", "recipe:RAU", "progress:recipe:RAU",
      "set", "progress:set", "progress:target:slots", "slots", "progress:slots", "sellable", "progress:sellable", "complete",
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
    expect(f.steps()).toEqual(["claim", "product", "package:DAM", "recipe:DAM", "package:RAU", "recipe:RAU", "set", "target:slots", "slots", "sellable"]);
    expect(f.arg("recordProgress", 0)).toEqual([ID, { step: "claim", ref: "r3", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 1)).toEqual([ID, { step: "product", ref: "prod-new", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 2)).toEqual([ID, { step: "package:DAM", ref: "pkg-new-DAM", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 3)).toEqual([ID, { step: "recipe:DAM", ref: "pkg-new-DAM", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 6)).toEqual([ID, { step: "set", ref: "set-new-1", expected_revision: 3 }]);
    expect(f.arg("recordProgress", 7)).toMatchObject([ID, { step: "target:slots", expected_revision: 3 }]);
    expect(JSON.parse((f.arg("recordProgress", 7)[1] as { ref: string }).ref)).toMatchObject({ set_ref: "set-new-1", expected_updated_at: T });
    expect(f.arg("recordProgress", 8)).toEqual([ID, { step: "slots", ref: "2026-10-22T00:00:00Z", expected_revision: 3 }]);
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
    expect(f.steps()).toEqual(["recipe:DAM", "package:RAU", "recipe:RAU", "set", "target:slots", "slots", "sellable"]);
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

it("sellable dùng revision sau PUT và số suất, retry giữ nguyên payload/key", async () => {
  const failures: Fail = { sellable: { status: 503, message: "down" } };
  const f = fake(failures);
  const d = draft();
  expect(await completeDish(d, f.deps)).toMatchObject({ ok: false, failed_step: "sellable", error: { status: 503 } });
  expect(f.calls.completeDraft).toBeUndefined();
  delete failures.sellable;
  expect(await completeDish(d, f.deps)).toMatchObject({ ok: true });
  expect(f.calls.createSellable).toEqual([
    ["set-new-1", { expected_updated_at: "2026-10-22T00:00:00Z", portion_count: 2 }, `dish-${ID}-r3-sellable`],
    ["set-new-1", { expected_updated_at: "2026-10-22T00:00:00Z", portion_count: 2 }, `dish-${ID}-r3-sellable`],
  ]);
  expect(f.calls.replaceSlots).toHaveLength(1);
  expect(f.calls.createSet).toHaveLength(1);
});

it.each([
  [409, "cost_fact_missing", "Nguyên liệu trong món chưa có giá vốn. Nhập kho nguyên liệu rồi bấm Hoàn tất món lại."],
  [409, "state_conflict", "Món chưa chốt hoặc số suất đã thay đổi"],
  [503, "dependency_unavailable", "Hệ thống tạm bận"],
])("sellable dịch lỗi %s %s", async (status, code, message) => {
  const f = fake({ sellable: { status: Number(status), code, message: "upstream failure" } });
  expect(await completeDish(draft(), f.deps)).toMatchObject({ ok: false, failed_step: "sellable", error: { status, message: expect.stringContaining(message) } });
  expect(f.calls.completeDraft).toBeUndefined();
});

it("complete lỗi sau sellable: thử lại bỏ qua handoff đã ghi progress", async () => {
  const failures: Fail = { complete: { status: 503 } };
  const f = fake(failures);
  const d = draft();
  expect(await completeDish(d, f.deps)).toMatchObject({ ok: false, failed_step: "complete" });
  delete failures.complete;
  expect(await completeDish(d, f.deps)).toMatchObject({ ok: true });
  expect(f.calls.createSellable).toHaveLength(1);
});

it("progress slots cũ chứa set ref: đối soát cấu hình và đọc revision trước handoff", async () => {
  const failures: Fail = { sellable: { status: 503 } };
  const f = fake(failures);
  const d = draft();
  await completeDish(d, f.deps);
  d.progress.slots = "set-new-1";
  f.deps.readSet = async () => ({ ...JSON.parse(d.progress["target:slots"]), updated_at: "2026-10-23T00:00:00Z" });
  delete failures.sellable;
  expect(await completeDish(d, f.deps)).toMatchObject({ ok: true });
  expect(f.calls.createSellable[1][1]).toEqual({ expected_updated_at: "2026-10-23T00:00:00Z", portion_count: 2 });
});
