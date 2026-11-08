import { describe, expect, it } from "vitest";
import { completeDish } from "./complete-dish";
import { tree, T, skuGroups, L, ing, content, draft, base, fake } from "./complete-dish.fixtures";
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

  function server(current: { updated_at: string; set: RSet }, forceConflict = false) {
    const f = fake();
    const puts: { setRef: string; input: Record<string, unknown>; key: string }[] = [];
    const reads: string[] = [];
    f.deps.replaceSlots = async (setRef, input, key) => {
      puts.push({ setRef, input: clone(input) as Record<string, unknown>, key });
      f.log.push("slots");
      if (forceConflict || (input as { expected_updated_at?: string }).expected_updated_at !== current.updated_at) throw Object.assign(new Error("stale"), { status: 409 });
      current.set = { slots: clone(input.slots) as RSlot[], tags: [...((input as { tags?: string[] }).tags ?? [])] };
      return { updated_at: current.updated_at };
    };
    Object.assign(f.deps, {
      readSlots: async (ref: string) => { reads.push(ref); return clone(current.set.slots); },
      readSet: async (ref: string) => { reads.push(ref); return { ...clone(current.set), updated_at: current.updated_at }; },
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
        const result = await put(setRef, input, key);
        s.current.updated_at = T1;
        if (!lost) { lost = true; throw Object.assign(new Error("mất phản hồi"), { status: 500 }); }
        return result;
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
        const result = await put(setRef, input, key);
        s.current.updated_at = T1;
        if (mode === modes[0] && !failedOnce) { failedOnce = true; throw Object.assign(new Error("mất phản hồi"), { status: 500 }); }
        return result;
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


