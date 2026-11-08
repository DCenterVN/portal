import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Product } from "@/lib/api/sales";
import { useActivateProduct } from "./use-activate-product";
import { ProductsView } from "./products-view";

const hooks = vi.hoisted(() => ({ active: false, cursor: 0, slots: [] as unknown[], price: true, selection: "", loading: false,
  detail: { product: { id: "product", status: "DRAFT", version: 4 }, variants: [
    { id: "serving", name: "Bún bò", variant_label: "2 người", status: "DRAFT", version: 7, sku_kind: "PRODUCED_VARIANT", sellable: true },
    { id: "config-set", name: "Cấu hình", status: "ACTIVE", version: 3, sku_kind: "COMMERCIAL_SET", sellable: false },
  ] },
}));
vi.mock("swr", () => ({ default: (key: string[] | null) => !key ? {} : hooks.loading ? { isLoading: true } : { data: key[0] === "product-lifecycle" ? hooks.detail : hooks.price } }));
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ scope: { userId: "u", orgId: "o", branchId: "b" } }) }));
vi.mock("react-hook-form", () => ({ useForm: () => ({ watch: () => hooks.selection, reset: () => { hooks.selection = ""; }, setValue: (_: string, value: string) => { hooks.selection = value; } }) }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual,
    useState: (initial: unknown) => {
      if (!hooks.active) return actual.useState(initial);
      const i = hooks.cursor++;
      if (!(i in hooks.slots)) hooks.slots[i] = initial;
      return [hooks.slots[i], (value: unknown) => { hooks.slots[i] = value; }];
    },
    useRef: (initial: unknown) => {
      if (!hooks.active) return actual.useRef(initial);
      const i = hooks.cursor++;
      if (!(i in hooks.slots)) hooks.slots[i] = { current: initial };
      return hooks.slots[i];
    },
  };
});

const id = "0198fd55-3f46-7a01-9e52-f4c0de000003";
const product: Product = { id, name: "Bún bò nháp", sku_code: "", uom: "", status: "DRAFT", created_at: "2026-11-08T00:00:00Z" };
const reload = vi.fn().mockResolvedValue(undefined);
const fetchMock = vi.fn<typeof fetch>();
const state = (allowed = true, status: Product["status"] = "DRAFT") => {
  hooks.active = true;
  hooks.cursor = 0;
  return useActivateProduct({ ...product, status }, allowed, reload);
};
beforeEach(() => { hooks.slots = []; hooks.price = true; hooks.selection = ""; hooks.loading = false; hooks.detail.variants[0].status = "DRAFT"; reload.mockReset().mockResolvedValue(undefined); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => { hooks.active = false; fetchMock.mockReset(); vi.unstubAllGlobals(); });

it.each([
  [true, "DRAFT", true], [false, "DRAFT", false],
  [true, "ACTIVE", false], [true, "SUSPENDED", false],
] as const)("nút mở bán theo quyền %s và trạng thái %s", async (allowed, status, visible) => {
  hooks.active = false;
  const html = renderToStaticMarkup(<ProductsView initialProducts={[{ ...product, status }]} canActivate={allowed} onActivated={reload} />);
  expect(html.includes(">Mở bán</button>")).toBe(visible);
  const action = state(allowed, status);
  expect(action.canActivate).toBe(visible);
  action.changeOpen(true);
  if (!visible) await state(allowed, status).activate();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("dòng và bộ đếm theo dữ liệu revalidate, mã sinh từ món không lộ UUID", () => {
  hooks.active = false;
  const props = { canActivate: true, onActivated: reload };
  const draft = { ...product, sku_code: `D-${id}-DAM` };
  const before = renderToStaticMarkup(<ProductsView {...props} initialProducts={[draft]} />);
  expect(before).toContain("Bản nháp (1)");
  expect(before).toContain("Đang mở bán (0)");
  expect(before).not.toContain(id);
  const after = renderToStaticMarkup(<ProductsView {...props} initialProducts={[{ ...draft, status: "ACTIVE" }]} />);
  expect(after).toContain("Bản nháp (0)");
  expect(after).toContain("Đang mở bán (1)");
  expect(after).not.toContain(">Mở bán</button>");
});

it("chờ xác nhận, bỏ cấu hình set, gọi READY rồi ACTIVE và revalidate", async () => {
  fetchMock.mockImplementation(async () => Response.json({ data: { state: "ACTIVE" } }));
  await state().activate();
  expect(fetchMock).not.toHaveBeenCalled();
  state().changeOpen(true);
  const action = state();
  expect(action.variants.map(variant => variant.id)).toEqual(["serving"]);
  await Promise.all([action.activate(), action.activate()]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(String(fetchMock.mock.calls[0][0])).toContain(`/products/${id}/variants/serving/lifecycle`);
  expect(String(fetchMock.mock.calls[1][0])).toContain(`/products/${id}/lifecycle`);
  const bodies = fetchMock.mock.calls.map(call => JSON.parse(String(call[1]?.body)));
  expect(bodies[0]).toMatchObject({ expected_version: 7, to_state: "READY", reason: "Chuẩn bị suất bán" });
  expect(bodies[1]).toMatchObject({ expected_version: 4, to_state: "ACTIVE", activate_variant_refs: ["serving"] });
  for (let i = 0; i < 2; i++) expect(new Headers(fetchMock.mock.calls[i][1]?.headers).get("Idempotency-Key")).toBe(bodies[i].operation_id);
  expect(bodies[0].operation_id).not.toBe(bodies[1].operation_id);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(state()).toMatchObject({ open: false, submitting: false, error: "" });
});

it.each([0, 1])("retry bước lỗi %s giữ nguyên operation_id, version và payload", async failed => {
  const ok = () => Response.json({ data: { state: "READY" } });
  if (failed === 1) fetchMock.mockResolvedValueOnce(ok());
  fetchMock.mockRejectedValueOnce(new Error("network lost")).mockImplementation(async () => ok());
  state().changeOpen(true);
  await state().activate();
  expect(state()).toMatchObject({ open: true, submitting: false });
  await state().activate();
  const first = fetchMock.mock.calls[failed];
  const retry = fetchMock.mock.calls[failed + 1];
  expect(String(retry[0])).toBe(String(first[0]));
  expect(retry[1]).toEqual(first[1]);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(reload).toHaveBeenCalledTimes(1);
});

it("READY bỏ qua bước chuẩn bị", async () => {
  hooks.detail.variants[0].status = "READY";
  fetchMock.mockResolvedValue(Response.json({ data: {} }));
  state().changeOpen(true);
  await state().activate();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(String(fetchMock.mock.calls[0][0])).toContain(`/products/${id}/lifecycle`);
});

it.each([
  [409, "price_not_active", "missing", "Chưa có giá bán đã duyệt"],
  [409, "price_floor_violation", "low", "Giá bán thấp hơn giá sàn"],
  [422, "validation_failed", "complete serving configuration, BOM and cost confirmation required", "Chưa chuẩn bị định giá"],
  [409, "state_conflict", "version conflict", "Dữ liệu vừa thay đổi"],
  [503, "service_unavailable", "down", "Hệ thống tạm bận"],
  [422, "validation_failed", `Sản phẩm ${id} thiếu danh mục`, "thiếu danh mục"],
])("lỗi %s %s giữ dialog và không lộ UUID", async (status, code, message, expected) => {
  fetchMock.mockImplementation(async () => Response.json({ error: code, message }, { status }));
  state().changeOpen(true);
  await state().activate();
  expect(state()).toMatchObject({ open: true, submitting: false });
  expect(state().error).toContain(expected);
  expect(state().error).not.toContain(id);
  expect(reload).not.toHaveBeenCalled();
});

it("thiếu giá đã duyệt thì không gửi và cung cấp trạng thái dẫn sang màn giá", async () => {
  hooks.price = false;
  state().changeOpen(true);
  expect(state()).toMatchObject({ needsPrice: true, canSubmit: false });
  await state().activate();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("đang tải thì không gửi", async () => {
  hooks.loading = true;
  state().changeOpen(true);
  expect(state().canSubmit).toBe(false);
  await state().activate();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("revalidate lỗi thì retry không gửi lifecycle lần nữa", async () => {
  fetchMock.mockImplementation(async () => Response.json({ data: {} }));
  reload.mockRejectedValueOnce(new Error("reload failed")).mockResolvedValue(undefined);
  state().changeOpen(true);
  await state().activate();
  await state().activate();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(state().open).toBe(false);
});

it("phản hồi ACTIVE bị mất, SWR thấy ACTIVE thì vẫn replay đúng request cũ", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ data: {} })).mockRejectedValueOnce(new Error("lost response"))
    .mockResolvedValueOnce(Response.json({ data: {} }));
  state().changeOpen(true);
  await state().activate();
  hooks.detail.variants[0].status = "ACTIVE";
  expect(state().canSubmit).toBe(true);
  await state().activate();
  expect(fetchMock.mock.calls[2][1]).toEqual(fetchMock.mock.calls[1][1]);
  expect(state().open).toBe(false);
});
