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
    expect(d.spies.getActiveRecipe).not.toHaveBeenCalledWith("pkg-gv");

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
