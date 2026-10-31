import { describe, expect, it } from "vitest";
import { validateDish, type DishContent, type ValidateCtx } from "./validate-dish";

const tree = [
  { code: "THIT", parent_code: null }, { code: "THIT_TRAU", parent_code: "THIT" },
  { code: "RAU_CU", parent_code: null }, { code: "RAU_AN_LA", parent_code: "RAU_CU" },
  { code: "GIA_VI", parent_code: null }, { code: "HANH_TOI", parent_code: "GIA_VI" },
  { code: "GAO_NGU_COC", parent_code: null },
];
const ctx = (over: Partial<ValidateCtx> = {}): ValidateCtx => ({
  kind: "CREATE", tree,
  skuGroups: { "sku-trau": "THIT_TRAU", "sku-rau": "RAU_AN_LA", "sku-toi": "HANH_TOI", "sku-gao": "GAO_NGU_COC", "sku-thit2": "THIT" },
  packagesWithRecipe: ["pkg-gvxao", "pkg-cot", "pkg-cham"],
  existingVariants: [], ...over,
});
const m1 = (over: Partial<DishContent> = {}): DishContent => ({
  schema_version: 1, name: "Thịt trâu xào rau muống", category_ref: "cat-1",
  tags: ["xao", "thit-trau", "rau-muong"], servings: 2,
  ingredients: [
    { row: "r1", sku_ref: "sku-trau", quantity: "150", uom: "G", yield_pct: "100" },
    { row: "r2", sku_ref: "sku-rau", quantity: "200", uom: "G", yield_pct: "100" },
    { row: "r3", sku_ref: "sku-toi", quantity: "10", uom: "G", yield_pct: "100" },
  ],
  seasonings: [{ row: "g1", slot: "GIA_VI_THEM", package_ref: "pkg-gvxao", removable: false }],
  reason: null, base: null, ...over,
});
const row = (r: string, over: object) => (c: DishContent) => c.ingredients.map((i) => (i.row === r ? { ...i, ...over } : i));
const find = (errs: ReturnType<typeof validateDish>, field: string, r?: string) =>
  errs.filter((e) => e.field === field && (r === undefined || e.row === r));

describe("validateDish", () => {
  it("M1 hợp lệ -> 0 lỗi", () => expect(validateDish(m1(), ctx())).toEqual([]));

  it("nhóm rỗng -> lỗi theo dòng, không thêm ngăn", () => {
    const content = m1({ ingredients: [m1().ingredients[0]] });
    const emptyGroups: ValidateCtx["skuGroups"][] = [{}, { "sku-trau": null }, { "sku-trau": "" }];
    for (const skuGroups of emptyGroups) {
      const errs = validateDish(content, ctx({ skuGroups }));
      expect(find(errs, "sku_ref")).toEqual([{
        field: "sku_ref", row: "r1",
        message: "Nguyên liệu chưa thuộc nhóm hợp lệ — gán nhóm ở kho trước khi hoàn tất",
      }]);
      expect(find(errs, "slots")).toHaveLength(1);
    }
  });

  it("mã nhóm lạ -> lỗi theo dòng, không thêm ngăn", () => {
    const content = m1({ ingredients: [m1().ingredients[0]] });
    const errs = validateDish(content, ctx({ skuGroups: { "sku-trau": "UNKNOWN" } }));
    expect(find(errs, "sku_ref")).toEqual([{
      field: "sku_ref", row: "r1",
      message: "Nguyên liệu chưa thuộc nhóm hợp lệ — gán nhóm ở kho trước khi hoàn tất",
    }]);
    expect(find(errs, "slots")).toHaveLength(1);
  });

  it("tên 1..150", () => {
    expect(find(validateDish(m1({ name: "" }), ctx()), "name")).toHaveLength(1);
    expect(find(validateDish(m1({ name: "a".repeat(151) }), ctx()), "name")).toHaveLength(1);
    expect(validateDish(m1({ name: "a".repeat(150) }), ctx())).toEqual([]);
  });

  it("thiếu danh mục", () => expect(find(validateDish(m1({ category_ref: null }), ctx()), "category_ref")).toHaveLength(1));

  it.each([[2, true], [3, false], [8, false], [9, true]])("hashtag %i nhãn -> lỗi=%s", (n, bad) => {
    const tags = Array.from({ length: n }, (_, i) => `t${i}`);
    expect(find(validateDish(m1({ tags }), ctx()), "tags").length > 0).toBe(bad);
  });

  it.each([[1, false], [2, false], [3, false], [4, false], [6, false], [5, true], [0, true], [null, true]])(
    "khẩu phần %s -> lỗi=%s", (servings, bad) => {
      expect(find(validateDish(m1({ servings: servings as number }), ctx()), "servings").length > 0).toBe(bad);
    });

  it("không có dòng nguyên liệu", () => {
    expect(find(validateDish(m1({ ingredients: [] }), ctx()), "ingredients")).toHaveLength(1);
  });

  it("dòng thiếu nguyên liệu -> lỗi theo dòng", () => {
    const errs = validateDish(m1({ ingredients: row("r2", { sku_ref: null })(m1()) }), ctx());
    expect(find(errs, "sku_ref", "r2")).toHaveLength(1);
    expect(find(errs, "sku_ref", "r1")).toHaveLength(0);
  });

  it.each([["", true], ["0", true], ["-5", true], ["1.2345", true], ["abc", true], ["1.234", false], ["0.5", false]])(
    "lượng %j -> lỗi=%s", (quantity, bad) => {
      const errs = validateDish(m1({ ingredients: row("r1", { quantity })(m1()) }), ctx());
      expect(find(errs, "quantity", "r1").length > 0).toBe(bad);
    });

  it.each([["0", true], ["101", true], ["", true], ["1", false], ["100", false], ["70", false]])(
    "yield_pct %j (hao hụt = 100 - yield) -> lỗi=%s", (yield_pct, bad) => {
      const errs = validateDish(m1({ ingredients: row("r1", { yield_pct })(m1()) }), ctx());
      expect(find(errs, "yield_pct", "r1").length > 0).toBe(bad);
    });

  it("trùng nguyên liệu -> lỗi ở dòng sau", () => {
    const errs = validateDish(m1({ ingredients: row("r3", { sku_ref: "sku-rau" })(m1()) }), ctx());
    expect(find(errs, "sku_ref", "r3")).toHaveLength(1);
    expect(find(errs, "sku_ref", "r2")).toHaveLength(0);
  });

  it("không có gia vị không-bỏ -> đúng câu BR-18", () => {
    const msg = "Món cần ít nhất một gói gia vị không được bỏ";
    for (const seasonings of [[], [{ row: "g1", slot: "GIA_VI_THEM" as const, package_ref: "pkg-gvxao", removable: true }]]) {
      const errs = validateDish(m1({ seasonings }), ctx());
      expect(errs.some((e) => e.message === msg)).toBe(true);
    }
  });

  it("COT không được bỏ", () => {
    const seasonings = [
      { row: "g1", slot: "GIA_VI_THEM" as const, package_ref: "pkg-gvxao", removable: false },
      { row: "g2", slot: "COT" as const, package_ref: "pkg-cot", removable: true },
    ];
    expect(find(validateDish(m1({ seasonings }), ctx()), "removable", "g2")).toHaveLength(1);
  });

  it("gói gia vị không có công thức ACTIVE / chưa chọn gói", () => {
    const noRecipe = validateDish(m1(), ctx({ packagesWithRecipe: [] }));
    expect(find(noRecipe, "package_ref", "g1")).toHaveLength(1);
    const none = validateDish(m1({ seasonings: [{ row: "g1", slot: "GIA_VI_THEM", package_ref: null, removable: false }] }), ctx());
    expect(find(none, "package_ref", "g1")).toHaveLength(1);
  });

  it("tổng ô 2..6 (ô nguyên liệu sau xếp ngăn + ô gia vị)", () => {
    const onlyRau = m1({ ingredients: [m1().ingredients[1]], seasonings: [] });
    expect(find(validateDish(onlyRau, ctx()), "slots")).toHaveLength(1);
    const two = m1({ ingredients: [m1().ingredients[1], m1().ingredients[2]] });
    expect(find(validateDish(two, ctx()), "slots")).toHaveLength(0);
    const full = m1({
      ingredients: [...m1().ingredients, { row: "r4", sku_ref: "sku-gao", quantity: "80", uom: "G", yield_pct: "100" }],
      seasonings: [
        { row: "g1", slot: "GIA_VI_THEM", package_ref: "pkg-gvxao", removable: false },
        { row: "g2", slot: "COT", package_ref: "pkg-cot", removable: false },
        { row: "g3", slot: "NUOC_CHAM", package_ref: "pkg-cham", removable: true },
      ],
    });
    expect(validateDish(full, ctx())).toEqual([]);
  });

  it("REVISION: lý do 1..300", () => {
    const c = ctx({ kind: "REVISION", source_journey: "DONE" });
    for (const reason of [null, "", "x".repeat(301)]) expect(find(validateDish(m1({ reason }), c), "reason")).toHaveLength(1);
    expect(validateDish(m1({ reason: "x".repeat(300) }), c)).toEqual([]);
    expect(find(validateDish(m1({ reason: null }), ctx()), "reason")).toHaveLength(0);
  });

  it("REVISION trên biến thể đang bán -> lỗi (E9); Nháp/Đã hoàn tất thì được", () => {
    const content = m1({ reason: "đổi rau" });
    expect(find(validateDish(content, ctx({ kind: "REVISION", source_journey: "SELLING" })), "base")).toHaveLength(1);
    for (const j of ["DRAFT", "DONE"] as const) {
      expect(validateDish(content, ctx({ kind: "REVISION", source_journey: j }))).toEqual([]);
    }
  });

  it("VARIANT trùng khẩu phần -> lỗi kèm biến thể có sẵn", () => {
    const existingVariants = [{ servings: 2, set_ref: "set-m1", variant_label: "2 người" }];
    const errs = validateDish(m1({ servings: 2 }), ctx({ kind: "VARIANT", existingVariants }));
    const e = find(errs, "servings")[0];
    expect(e).toBeDefined();
    expect(e.existing).toEqual({ set_ref: "set-m1", variant_label: "2 người" });
    expect(validateDish(m1({ servings: 4 }), ctx({ kind: "VARIANT", existingVariants }))).toEqual([]);
    expect(find(validateDish(m1({ servings: 2 }), ctx({ kind: "COPY", existingVariants })), "servings")).toHaveLength(0);
  });
});
