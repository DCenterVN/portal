import { beforeEach, expect, it, vi } from "vitest";
import { agreement, supplierID, materialID } from "@/mocks/supplier-contract";
import { draftStorageKey, readAgreementDraft, writeAgreementDraft, nextAgreementCommand, clearOtherDrafts, type AgreementDraftValues } from "./use-supplier-agreement-draft";

const values: AgreementDraftValues = { code: "BG-GAO", from: agreement.valid_from, to: agreement.valid_to, lines: agreement.lines, needsFile: true };
const key = draftStorageKey("actor", "org", "branch", supplierID, "new");
let entries: Map<string, string>;
const storage = { getItem: (id: string) => entries.get(id) ?? null, setItem: (id: string, value: string) => { entries.set(id, value); }, removeItem: (id: string) => { entries.delete(id); } };
beforeEach(() => { entries = new Map(); });
it("nháp máy chỉ lưu text/date/line, không lưu file/URL/token hoặc metadata server", () => {
  const extra = { ...values, file: { name: "private.pdf" }, token: "secret", signedUrl: "https://private.invalid", lines: [{ ...agreement.lines[0], price_source_evidence: { url: "https://private.invalid", sha256: "hash", quote: "secret", observed_at: "now" } }] };
  expect(writeAgreementDraft(storage, key, 1, extra, 1000)).toBe(true);
  expect(readAgreementDraft(storage, key, 1, 2000)).toMatchObject({ kind: "restored", values: { code: "BG-GAO", needsFile: true } });
  expect(entries.get(key)).not.toMatch(/private|token|secret|price_line_ref|price_source_evidence|document_ref/);
});
it("nháp base version cũ giữ server làm authority, không restore đè", () => {
  writeAgreementDraft(storage, key, 1, values, 1000);
  expect(readAgreementDraft(storage, key, 2, 2000)).toEqual({ kind: "conflict" });
});
it("hết 24h hoặc JSON hỏng thì xóa, không khôi phục", () => {
  writeAgreementDraft(storage, key, null, values, 1000);
  expect(readAgreementDraft(storage, key, null, 1000 + 86400000)).toEqual({ kind: "empty" });
  expect(entries.has(key)).toBe(false);
  entries.set(key, "broken");
  expect(readAgreementDraft(storage, key, null, 2000)).toEqual({ kind: "empty" });
});
it("storage bị chặn báo unavailable, không giả đã lưu", () => {
  const blocked = { ...storage, getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("blocked"); } };
  expect(writeAgreementDraft(blocked, key, null, values, 1000)).toBe(false);
  expect(readAgreementDraft(blocked, key, null, 2000)).toEqual({ kind: "unavailable" });
});
it("key phân biệt actor/org/branch/NCC/bảng giá", () => {
  expect(new Set([
    key, draftStorageKey("actor2", "org", "branch", supplierID, "new"),
    draftStorageKey("actor", "org2", "branch", supplierID, "new"),
    draftStorageKey("actor", "org", "branch2", supplierID, "new"),
    draftStorageKey("actor", "org", "branch", materialID, "new"),
    draftStorageKey("actor", "org", "branch", supplierID, agreement.agreement_id),
  ]).size).toBe(6);
});
it("giá rỗng khác giá 0 sau lưu/khôi phục", () => {
  for (const price of [Number.NaN, 0]) {
    writeAgreementDraft(storage, key, null, { ...values, lines: [{ ...agreement.lines[0], unit_price_vnd: price }] }, 1000);
    const result = readAgreementDraft(storage, key, null, 2000);
    expect(result.kind).toBe("restored");
    if (result.kind === "restored") expect(result.values.lines[0].unit_price_vnd).toBe(price);
  }
});
it("retry cùng payload giữ key; đổi payload hoặc trạng thái cấp key mới", () => {
  const uuid = vi.fn().mockReturnValueOnce("first").mockReturnValueOnce("second");
  const command = nextAgreementCommand({ body: "", key: "" }, '{"status":"DRAFT"}', uuid);
  expect(nextAgreementCommand(command, '{"status":"DRAFT"}', uuid)).toBe(command);
  expect(nextAgreementCommand(command, '{"status":"ACTIVE"}', uuid).key).toBe("second");
  expect(uuid).toHaveBeenCalledTimes(2);
});

it("đổi context chỉ giữ nháp đúng scope; đăng xuất xóa cả namespace, giữ dữ liệu khác", () => {
  const foreign = draftStorageKey("other", "org", "branch", supplierID, "new");
  entries.set(key, "draft"); entries.set(foreign, "foreign"); entries.set("other-app", "keep");
  const scoped = { ...storage, get length() { return entries.size; }, key: (index: number) => [...entries.keys()][index] ?? null };
  clearOtherDrafts(scoped as Storage, key);
  expect(entries.has(key)).toBe(true); expect(entries.has(foreign)).toBe(false);
  clearOtherDrafts(scoped as Storage, "");
  expect([...entries.keys()]).toEqual(["other-app"]);
});

const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, effects: [] as Array<() => unknown>, allowed: true }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual,
    useState: (initial: unknown) => {
      const index = hooks.cursor++;
      if (!(index in hooks.slots)) hooks.slots[index] = typeof initial === "function" ? (initial as () => unknown)() : initial;
      return [hooks.slots[index], (next: unknown) => { hooks.slots[index] = typeof next === "function" ? (next as (previous: unknown) => unknown)(hooks.slots[index]) : next; }];
    },
    useRef: (initial: unknown) => {
      const index = hooks.cursor++;
      if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
      return hooks.slots[index];
    },
    useEffect: (effect: () => unknown) => { hooks.effects.push(effect); },
  };
});
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => hooks.allowed }) }));
vi.mock("@/lib/api/supplier-agreements", async original => ({
  ...await original<typeof import("@/lib/api/supplier-agreements")>(),
  getContractMaterials: vi.fn(), createAgreement: vi.fn(), saveAgreementVersion: vi.fn(),
}));
import { useSupplierAgreement } from "./use-supplier-agreement";
import { getContractMaterials, saveAgreementVersion } from "@/lib/api/supplier-agreements";
import { material } from "@/mocks/supplier-contract";
import { FetchError } from "@/lib/fetcher";

const saved = vi.fn();
const conflict = vi.fn();
function editor() {
  hooks.cursor = 0;
  const state = useSupplierAgreement({ supplierId: supplierID, agreement, onClose: vi.fn(), onSaved: saved, onConflict: conflict });
  state.form.current = { reportValidity: () => true } as HTMLFormElement;
  return state;
}
async function readyEditor() {
  hooks.slots = []; hooks.effects = []; hooks.allowed = true;
  vi.mocked(getContractMaterials).mockResolvedValue([material]);
  saved.mockClear(); conflict.mockClear(); vi.mocked(saveAgreementVersion).mockReset();
  editor(); hooks.effects[0](); await Promise.resolve();
  return editor();
}
it("double submit chỉ gửi một POST DRAFT, không tự áp dụng", async () => {
  const state = await readyEditor();
  vi.mocked(saveAgreementVersion).mockResolvedValue(agreement);
  await Promise.all([state.save("DRAFT"), state.save("DRAFT")]);
  expect(saveAgreementVersion).toHaveBeenCalledTimes(1);
  expect(vi.mocked(saveAgreementVersion).mock.calls[0][3].status).toBe("DRAFT");
  expect(saved).toHaveBeenCalledTimes(1);
});
it("retry sau lỗi mạng giữ key/body; 409 giữ dữ liệu và không ghi đè", async () => {
  let state = await readyEditor();
  vi.mocked(saveAgreementVersion).mockRejectedValueOnce(Error("network")).mockRejectedValueOnce(new FetchError("stale", 409));
  await state.save("DRAFT");
  state = editor(); await state.save("DRAFT");
  const calls = vi.mocked(saveAgreementVersion).mock.calls;
  expect(calls).toHaveLength(2); expect(calls[0]).toEqual(calls[1]);
  state = editor();
  expect(state.lines).toEqual(agreement.lines); expect(state.code).toBe(agreement.code);
  expect(state.error).toContain("Dữ liệu nhập được giữ");
  expect(conflict).toHaveBeenCalledTimes(1); expect(saved).not.toHaveBeenCalled();
});
it("dirty hoặc mất quyền không thể áp dụng kể cả gọi thẳng handler", async () => {
  let state = await readyEditor();
  state.setDirty(true); state = editor(); await state.save("ACTIVE");
  hooks.allowed = false; state = editor(); await state.save("DRAFT");
  expect(saveAgreementVersion).not.toHaveBeenCalled();
});
