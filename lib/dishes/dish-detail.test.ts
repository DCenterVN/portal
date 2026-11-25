import { describe, expect, it, vi } from "vitest";
import { buildDishDetail, loadDishDetail, toBase, type DetailDeps } from "./dish-detail";

const T = "2026-10-21T00:00:00Z";
const T2 = "2026-10-22T00:00:00Z";
const L = (sku_ref: string, quantity: string, yield_pct = "100") => ({ sku_ref, quantity, uom: "G", yield_pct });
const product = { id: "prod-m1", name: "Thịt trâu xào rau muống", slug: "m1-abc", category_ref: "cat-1", category_name: "Món xào", status: "ACTIVE" };
const sets = [
  {
    id: "set-2", code: "S2", name: "M1 · 2 người", variant_label: "2 người", status: "ACTIVE", sellable: false, net_weight_g: 720, updated_at: T,
    slots: [
      { slot: "DAM", swappable: false, removable: false, options: [{ sku_ref: "pkg-dam", quantity: 1, is_default: true }] },
      { slot: "RAU", swappable: false, removable: false, options: [{ sku_ref: "pkg-rau", quantity: 1, is_default: true }] },
      { slot: "GIA_VI_THEM", swappable: false, removable: true, options: [{ sku_ref: "pkg-gv", quantity: 1, is_default: true }] },
    ],
  },
  {
    id: "set-4", code: "S4", name: "M1 · 4 người", variant_label: "4 người", status: "ACTIVE", sellable: true, net_weight_g: 1440, updated_at: T2,
    slots: [{ slot: "DAM", swappable: false, removable: false, options: [{ sku_ref: "pkg-dam", quantity: 1, is_default: true }] }],
  },
  { id: "set-6", code: "S6", name: "M1 · 6 người", variant_label: "6 người", status: "DRAFT", sellable: false, net_weight_g: 2160, updated_at: T, slots: [] },
  { id: "set-3", code: "S3", name: "M1 · 3 người", variant_label: "3 người", status: "RETIRED", sellable: false, net_weight_g: 1080, updated_at: T, slots: [] },
];
const names: Record<string, string> = { "pkg-dam": "M1 · Đạm", "pkg-rau": "M1 · Rau", "pkg-gv": "Gia vị xào" };
const recipes: Record<string, { components: ReturnType<typeof L>[] } | null> = {
  "pkg-dam": { components: [L("sku-trau", "150")] },
  "pkg-rau": { components: [L("sku-rau", "200"), L("sku-toi", "10", "90")] },
};
const openDrafts = [{ id: "d-1", kind: "VARIANT", title: "M1", status: "OPEN", revision: 2, updated_by: "An", updated_at: T }];
const history = [
  { id: "d-9", kind: "REVISION", status: "COMPLETED", updated_by: "Bình", updated_at: T2, completed_at: T2, reason: "đổi tỏi sang hành" },
];

function deps(): DetailDeps & { spies: Record<string, ReturnType<typeof vi.fn>> } {
  const spies = {
    getProduct: vi.fn(async () => product),
    listVariants: vi.fn(async () => sets),
    getPackage: vi.fn(async (id: string) => ({ id, name: names[id] })),
    getActiveRecipe: vi.fn(async (id: string) => recipes[id] ?? null),
    listDrafts: vi.fn(async (q: { status: string; kind?: string }) => (q.status === "OPEN" ? openDrafts : history)),
  };
  return { ...spies, spies } as never;
}

describe("loadDishDetail", () => {
  it("gộp product + biến thể + ô + công thức + nháp OPEN + lịch sử REVISION", async () => {
    const d = deps();
    const r = await loadDishDetail("prod-m1", d);
    expect(r.product).toMatchObject({ id: "prod-m1", name: "Thịt trâu xào rau muống", category_name: "Món xào" });
    expect(r.variants).toHaveLength(4);

    const v2 = r.variants.find((v) => v.set_ref === "set-2")!;
    expect(v2).toMatchObject({ variant_label: "2 người", servings: 2, journey: "DONE", updated_at: T });
    expect(v2.packs.find((p) => p.slot === "DAM")).toEqual({
      slot: "DAM", package_ref: "pkg-dam", package_name: "M1 · Đạm", lines: [L("sku-trau", "150")],
    });
    expect(v2.packs.find((p) => p.slot === "RAU")?.lines).toEqual([L("sku-rau", "200"), L("sku-toi", "10", "90")]);
    expect(v2.seasonings).toEqual([{ slot: "GIA_VI_THEM", package_ref: "pkg-gv", package_name: "Gia vị xào", removable: true }]);
    expect(d.spies.getActiveRecipe).toHaveBeenCalledWith("pkg-gv");

    expect(r.open_drafts).toMatchObject([{ id: "d-1", kind: "VARIANT" }]);
    expect(r.revision_history).toEqual([{ id: "d-9", completed_at: T2, updated_by: "Bình", reason: "đổi tỏi sang hành" }]);
    expect(d.spies.listDrafts).toHaveBeenCalledWith(expect.objectContaining({ product_ref: "prod-m1", status: "OPEN" }));
    expect(d.spies.listDrafts).toHaveBeenCalledWith(expect.objectContaining({ product_ref: "prod-m1", status: "COMPLETED", kind: "REVISION" }));
  });

  it("journey: DRAFT / DONE / SELLING / STOPPED", async () => {
    const r = await loadDishDetail("prod-m1", deps());
    const j = Object.fromEntries(r.variants.map((v) => [v.set_ref, v.journey]));
    expect(j).toEqual({ "set-2": "DONE", "set-4": "SELLING", "set-6": "DRAFT", "set-3": "STOPPED" });
  });

  it("gói không có công thức ACTIVE -> lines rỗng, không vỡ", async () => {
    const d = deps();
    d.spies.getActiveRecipe.mockResolvedValue(null);
    const r = await loadDishDetail("prod-m1", d);
    expect(r.variants.find((v) => v.set_ref === "set-2")!.packs.every((p) => p.lines.length === 0)).toBe(true);
  });

  it("buildDishDetail là bản thuần của loadDishDetail", async () => {
    const d = deps();
    const viaLoad = await loadDishDetail("prod-m1", d);
    const recipesByPkg = { "pkg-dam": recipes["pkg-dam"], "pkg-rau": recipes["pkg-rau"] };
    const built = buildDishDetail({
      product, variants: sets, packageNames: names, recipes: recipesByPkg, openDrafts, revisions: history,
    });
    expect(built).toEqual(viaLoad);
  });

  it("bung gia vị và cốt bắt buộc kèm chuẩn hoá kg sang g và đọc 1 suất", async () => {
    const phoSets = [{
      id: "set-pho", name: "Phở bò", variant_label: "1 suất", status: "ACTIVE", sellable: false, updated_at: T,
      slots: [
        { slot: "DAM", swappable: false, removable: false, options: [{ sku_ref: "pkg-dam", quantity: 1, is_default: true }] },
        { slot: "COT", swappable: false, removable: false, options: [{ sku_ref: "pkg-cot", quantity: 1, is_default: true }] },
        { slot: "GIA_VI_THEM", swappable: false, removable: false, options: [{ sku_ref: "pkg-gv-mon", quantity: 1, is_default: true }] },
      ],
    }];
    const d = deps();
    d.spies.listVariants.mockResolvedValue(phoSets);
    d.spies.getPackage.mockImplementation(async (id: string) => ({ id, name: id }));
    d.spies.getActiveRecipe.mockImplementation(async (id: string) => {
      if (id === "pkg-dam") return { components: [{ sku_ref: "sku-dau", quantity: "0.150", uom: "KG", yield_pct: "100" }] };
      if (id === "pkg-cot") return { components: [{ sku_ref: "sku-bo", quantity: "0.100", uom: "KG", yield_pct: "80" }] };
      if (id === "pkg-gv-mon") return { components: [{ sku_ref: "sku-la-lot", quantity: "20", uom: "G", yield_pct: "100" }] };
      return null;
    });
    const detail = await loadDishDetail("prod-m1", d);
    const v = detail.variants[0];
    expect(v.servings).toBe(1);
    expect(v.name).toBe("Phở bò");
    expect(v.seasonings).toEqual([]);
    expect(v.packs.map(p => [p.slot, p.lines])).toEqual([
      ["DAM", [{ sku_ref: "sku-dau", quantity: "150", uom: "G", yield_pct: "100" }]],
      ["COT", [{ sku_ref: "sku-bo", quantity: "100", uom: "G", yield_pct: "80" }]],
      ["GIA_VI_THEM", [{ sku_ref: "sku-la-lot", quantity: "20", uom: "G", yield_pct: "100" }]],
    ]);
  });

  it("phân loại BTP-* và DO_CHUA vào seasonings kèm components và tách variant_note", () => {
    const detail = buildDishDetail({
      product: { id: "prod-bun", name: "Bún bò", slug: "bun-bo", category_ref: null, status: "ACTIVE" },
      variants: [{
        id: "set-btp",
        variant_label: "2 suất · Cốt bò truyền thống",
        status: "ACTIVE",
        sellable: true,
        updated_at: T,
        slots: [
          { slot: "TINH_BOT", removable: false, options: [{ sku_ref: "pkg-bun", is_default: true }] },
          { slot: "COT", removable: false, options: [{ sku_ref: "pkg-cot", is_default: true }] },
          { slot: "DO_CHUA", removable: true, options: [{ sku_ref: "pkg-chua", is_default: true }] },
        ],
      }],
      packageNames: { "pkg-bun": "Bún", "pkg-cot": "Cốt bò", "pkg-chua": "Kim chi cải thảo" },
      packageCodes: { "pkg-bun": "D-TINH_BOT-1", "pkg-cot": "BTP-COT-BO", "pkg-chua": "BTP-CHUA-KC" },
      recipes: {
        "pkg-bun": { components: [L("sku-bun", "200")] },
        "pkg-cot": { components: [L("sku-xuong", "300")] },
        "pkg-chua": { components: [{ ...L("sku-caithao", "60"), prep_note: "cắt khúc" }] },
      },
      openDrafts: [],
      revisions: [],
    });
    const v = detail.variants[0];
    expect(v.servings).toBe(2);
    expect(v.variant_note).toBe("Cốt bò truyền thống");
    expect(v.packs).toHaveLength(1);
    expect(v.packs[0].slot).toBe("TINH_BOT");
    expect(v.seasonings).toEqual([
      { slot: "COT", package_ref: "pkg-cot", package_name: "Cốt bò", removable: false, components: [L("sku-xuong", "300")] },
      { slot: "DO_CHUA", package_ref: "pkg-chua", package_name: "Kim chi cải thảo", removable: true, components: [{ ...L("sku-caithao", "60"), prep_note: "cắt khúc" }] },
    ]);
  });
});

describe("toBase", () => {
  it("dựng base §2 từ biến thể (chỉ ô nguyên liệu, lines không có row)", async () => {
    const r = await loadDishDetail("prod-m1", deps());
    const v2 = r.variants.find((v) => v.set_ref === "set-2")!;
    expect(toBase(v2, "prod-m1")).toEqual({
      product_ref: "prod-m1", set_ref: "set-2", set_updated_at: T,
      slots: {
        DAM: { package_ref: "pkg-dam", lines: [L("sku-trau", "150")] },
        RAU: { package_ref: "pkg-rau", lines: [L("sku-rau", "200"), L("sku-toi", "10", "90")] },
      },
    });
  });
});
