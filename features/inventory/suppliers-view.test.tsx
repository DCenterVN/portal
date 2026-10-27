import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SuppliersContainer as SuppliersView } from "./suppliers-container";
import { supplier } from "@/mocks/supplier-contract";
it("bảng NCC hiển thị tên/mã, mở bảng giá đúng NCC, không lộ UUID", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:create"]) }}><SuppliersView initialPage={{ items: [supplier], next_cursor: "" }} /></AccessProvider>);
  expect(html).toContain("Gạo An Bình"); expect(html).toContain("NCC-GAO"); expect(html).toContain("Bảng giá");
  expect(html.replace(/<[^>]*>/g, " ")).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
it("không có provider thì đóng quyền, không hiện nút tạo", () => {
  const html = renderToStaticMarkup(<SuppliersView />);
  expect(html).toContain('role="alert"'); expect(html).not.toContain(">Thêm nhà cung cấp<");
});
it("toolbar có slot co giãn riêng và nhãn bảng giá tham chiếu", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SuppliersView initialPage={{ items: [supplier], next_cursor: "" }} /></AccessProvider>);
  expect(html).toContain("lg:flex-nowrap");
  expect(html).toContain("min-w-0 flex-1");
  expect(html).toContain("lg:w-48");
  expect(html).toContain("Hồ sơ, bảng giá tham chiếu và các lần nhập hàng.");
  expect(html).not.toContain("Hợp đồng");
  expect(html).not.toContain(">Thêm nhà cung cấp<");
});

const hooks = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0, effects: [] as Array<() => (() => void) | undefined> }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual, useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], (next: unknown) => { hooks.values[index] = typeof next === "function" ? (next as (value: unknown) => unknown)(hooks.values[index]) : next; }];
  }, useEffect: (effect: () => (() => void) | undefined) => { hooks.effects.push(effect); } };
});
vi.mock("@/lib/api/suppliers", async original => ({ ...await original<typeof import("@/lib/api/suppliers")>(), getSuppliers: vi.fn() }));
import { getSuppliers } from "@/lib/api/suppliers";

beforeEach(() => { hooks.values = []; hooks.cursor = 0; hooks.effects = []; vi.mocked(getSuppliers).mockReset(); });
afterEach(() => { vi.useRealTimers(); });
it("tìm 250ms và bỏ response của lần tải đã hủy", async () => {
  vi.useFakeTimers();
  let resolveOld!: (page: Awaited<ReturnType<typeof getSuppliers>>) => void;
  vi.mocked(getSuppliers).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce({ items: [], next_cursor: "" });
  const render = () => { hooks.cursor = 0; return renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SuppliersView initialPage={{ items: [supplier], next_cursor: "next" }} /></AccessProvider>); };
  render(); const cleanup = hooks.effects[0]();
  await vi.advanceTimersByTimeAsync(249); expect(getSuppliers).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); expect(getSuppliers).toHaveBeenCalledTimes(1);
  cleanup?.();
  hooks.effects = []; render(); hooks.effects[0]();
  await vi.advanceTimersByTimeAsync(250);
  resolveOld({ items: [supplier], next_cursor: "stale" }); await Promise.resolve();
  expect(render()).toContain("Chưa có nhà cung cấp phù hợp");
  expect(render()).not.toContain("Gạo An Bình</a>");
});

it("list has six columns, contact and ACTIVE default without fake counts", () => {
 const html=renderToStaticMarkup(<AccessProvider value={{plane:"company",root:"",actions:new Set(["inventory:supplier:read"])}}><SuppliersView initialPage={{items:[supplier],next_cursor:""}} /></AccessProvider>);
 expect(html.match(/<th /g)).toHaveLength(6);
 expect(html).toContain("Nhóm NL cha");
 expect(html).toContain("Nguyễn An");
 expect(html).toContain('href="tel:0901234567"');
 expect(html).toContain('value="ACTIVE" selected');
 expect(html).not.toContain("Bảng giá (0)");
});
it("filtered empty state offers clear filters, not a misleading create prompt", () => {
 const html=renderToStaticMarkup(<AccessProvider value={{plane:"company",root:"",actions:new Set(["inventory:supplier:read"])}}><SuppliersView initialPage={{items:[],next_cursor:""}} /></AccessProvider>);
 expect(html).toContain("Xoá lọc");
 expect(html).not.toContain(">Thêm nhà cung cấp<");
});
