import { describe, expect, it, vi } from "vitest";
import { prepareComplete, type PrepareDeps, type ServerDraft } from "./prepare-complete";
import type { DishDetail, Variant } from "./dish-detail";

// Hợp đồng S14c: prepareComplete(draft: ServerDraft, deps: PrepareDeps): Promise<Prepared>
//   ServerDraft = DishDraft(complete-dish) & { source_product_ref: string | null; source_set_ref: string | null }
//   PrepareDeps = { loadDetail(productRef: string): Promise<DishDetail> }
//   Prepared = { ok: true; draft: DishDraft; sourceJourney?: Journey; existingVariants: { servings: number; set_ref: string; variant_label: string }[] }
//            | { ok: false; status: 409; message: string }
// Nguồn tin cậy: chỉ draft.source_product_ref/source_set_ref + chi tiết server; content.base của client chỉ để hiển thị, bị ghi đè bằng toBase(variant, source_product_ref).
const ID = "01960000-0000-7000-8000-00000000abcd";
const T_SERVER = "2026-10-21T00:00:00Z";
const L = (sku_ref: string, quantity: string) => ({ sku_ref, quantity, uom: "G", yield_pct: "100" });
const variant = (over: Partial<Variant> = {}): Variant => ({
  set_ref: "set-A", variant_label: "2 người", servings: 2, journey: "DONE", updated_at: T_SERVER, packs: [{ slot: "DAM", package_ref: "pkg-dam-A", package_name: "Đạm", lines: [L("sku-trau", "150")] }], seasonings: [], ...over,
});
const detail = (variants: Variant[]): DishDetail => ({ product: { id: "prod-A", name: "A", slug: "a", category_ref: null, status: "ACTIVE" }, variants, open_drafts: [], revision_history: [] });
const tamperedBase = { product_ref: "prod-A", set_ref: "set-B", set_updated_at: "2099-01-01T00:00:00Z", slots: { DAM: { package_ref: "pkg-dam-B", lines: [L("sku-bo", "999")] } } };
const content = (base: unknown = tamperedBase) => ({
  schema_version: 1 as const, name: "A", category_ref: "cat", tags: ["a", "b", "c"], servings: 2, ingredients: [], seasonings: [], reason: "đổi", base,
});
const draft = (over: Partial<ServerDraft> = {}): ServerDraft =>
  ({ id: ID, kind: "REVISION", revision: 3, content: content(), progress: {}, source_product_ref: "prod-A", source_set_ref: "set-A", source_set_updated_at: T_SERVER, ...over }) as ServerDraft;
const deps = (d: DishDetail): PrepareDeps & { loadDetail: ReturnType<typeof vi.fn> } => ({ loadDetail: vi.fn(async () => d) });

describe("prepareComplete (nguồn tin cậy)", () => {
  it("REVISION: content.base bị sửa trỏ set khác -> base dựng lại từ chi tiết server theo source_set_ref", async () => {
    const d = deps(detail([variant(), variant({ set_ref: "set-B", updated_at: "2026-10-22T00:00:00Z" })]));
    const r = await prepareComplete(draft(), d);
    expect(d.loadDetail).toHaveBeenCalledTimes(1);
    expect(d.loadDetail).toHaveBeenCalledWith("prod-A");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.content.base).toEqual({ product_ref: "prod-A", set_ref: "set-A", set_updated_at: T_SERVER, slots: { DAM: { package_ref: "pkg-dam-A", lines: [L("sku-trau", "150")] } } });
  });

  it("product_ref giả trong base không được dùng để tải chi tiết", async () => {
    const d = deps(detail([variant()]));
    await prepareComplete(draft({ content: content({ ...tamperedBase, product_ref: "prod-EVIL" }) }), d);
    expect(d.loadDetail).toHaveBeenCalledTimes(1);
    expect(d.loadDetail).toHaveBeenCalledWith("prod-A");
  });

  it("không tìm thấy set nguồn trong chi tiết server -> 409, không đi tiếp", async () => {
    const d = deps(detail([variant({ set_ref: "set-khac" })]));
    const r = await prepareComplete(draft(), d);
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect((r as { message: string }).message).toMatch(/\S/);
  });

  it("nháp không có source_set_ref (VARIANT/REVISION/COPY) -> 409", async () => {
    const d = deps(detail([variant()]));
    expect(await prepareComplete(draft({ source_set_ref: null }), d)).toMatchObject({ ok: false, status: 409 });
    expect(await prepareComplete(draft({ source_product_ref: null }), d)).toMatchObject({ ok: false, status: 409 });
  });

  it("E9: trả sourceJourney của biến thể nguồn từ server (SELLING)", async () => {
    const r = await prepareComplete(draft(), deps(detail([variant({ journey: "SELLING" })])));
    expect(r).toMatchObject({ ok: true, sourceJourney: "SELLING" });
  });

  it("CREATE: bỏ base client gửi, không tải chi tiết, không có khẩu phần trùng", async () => {
    const d = deps(detail([variant()]));
    const r = await prepareComplete(draft({ kind: "CREATE", source_product_ref: null, source_set_ref: null }), d);
    expect(d.loadDetail).not.toHaveBeenCalled();
    expect(r).toMatchObject({ ok: true, existingVariants: [] });
    if (r.ok) expect(r.draft.content.base).toBeNull();
  });

  it("VARIANT: existingVariants lấy từ chi tiết server (servings, set_ref, variant_label)", async () => {
    const d = deps(detail([variant(), variant({ set_ref: "set-4", variant_label: "4 người", servings: 4 }), variant({ set_ref: "set-x", variant_label: "tuỳ chọn", servings: null })]));
    const r = await prepareComplete(draft({ kind: "VARIANT" }), d);
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.existingVariants).toEqual([{ servings: 2, set_ref: "set-A", variant_label: "2 người" }, { servings: 4, set_ref: "set-4", variant_label: "4 người" }]);
  });

  it("đã claim (chạy lại): bỏ kiểm khẩu phần trùng", async () => {
    const d = deps(detail([variant(), variant({ set_ref: "set-4", variant_label: "4 người", servings: 4 })]));
    const r = await prepareComplete(draft({ kind: "VARIANT", progress: { claim: "r3", set: "set-4" } }), d);
    expect(r).toMatchObject({ ok: true, existingVariants: [] });
  });

  it("COPY: base dựng từ set nguồn server (dùng lại gói), không từ content.base", async () => {
    const r = await prepareComplete(draft({ kind: "COPY" }), deps(detail([variant()])));
    expect(r.ok && r.draft.content.base?.set_ref).toBe("set-A");
  });

  it("loadDetail lỗi -> lan lỗi ra ngoài (route trả lỗi), không nuốt", async () => {
    const d = { loadDetail: vi.fn(async () => { throw Object.assign(new Error("down"), { status: 503 }); }) };
    await expect(prepareComplete(draft(), d)).rejects.toMatchObject({ status: 503 });
  });
});

// S15c (R2-C1): mốc chống ghi đè = draft.source_set_updated_at do sales lưu lúc tạo nháp, bất biến.
describe("prepareComplete (mốc nguồn bất biến)", () => {
  const T0 = "2026-10-20T00:00:00Z";
  const T1 = "2026-10-22T00:00:00Z";
  const withMark = (over: Partial<ServerDraft> = {}, ...m: [(string | null | undefined)?]) => ({ ...draft(over), source_set_updated_at: m.length ? m[0] : T0 }) as unknown as ServerDraft;
  const sourced = ["COPY", "VARIANT", "REVISION"] as const;

  it.each(sourced)("%s: base.set_updated_at = mốc server t0, không lấy timestamp GET mới (t1) cũng không lấy content.base (2099)", async kind => {
    const d = deps(detail([variant({ updated_at: T1 })]));
    const r = await prepareComplete(withMark({ kind }), d);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.draft.content.base as { set_updated_at: string }).set_updated_at).toBe(T0);
  });

  it("chạy lại (đã claim) vẫn dùng t0 dù set đã đổi sang t1", async () => {
    const r = await prepareComplete(withMark({ progress: { claim: "r3" } }), deps(detail([variant({ updated_at: T1 })])));
    expect(r.ok && (r.draft.content.base as { set_updated_at: string }).set_updated_at).toBe(T0);
  });

  it.each(sourced.flatMap(kind => [[kind, null], [kind, undefined]] as const))("%s: nháp có nguồn mà mốc = %s -> 409, không fallback sang GET mới", async (kind, mark) => {
    const r = await prepareComplete(withMark({ kind }, mark), deps(detail([variant({ updated_at: T1 })])));
    expect(r).toMatchObject({ ok: false, status: 409 });
  });

  it("CREATE: mốc null vẫn hợp lệ", async () => {
    const r = await prepareComplete(withMark({ kind: "CREATE", source_product_ref: null, source_set_ref: null }, null), deps(detail([variant()])));
    expect(r).toMatchObject({ ok: true });
  });
});
