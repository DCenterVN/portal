import { beforeEach, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0, effects: [] as (() => void)[] }));
vi.mock("./use-contract-materials", () => ({ useContractMaterials: () => ({ materials: [], failed: false, retry: () => {} }) }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual, useRef: (initial: unknown) => ({ current: initial }), useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], (next: unknown) => { hooks.values[index] = typeof next === "function" ? (next as (value: unknown) => unknown)(hooks.values[index]) : next; }];
  }, useEffect: (effect: () => void) => { hooks.effects.push(effect); } };
});
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => false }) }));
vi.mock("@/lib/cursor-pages", () => ({ useCursorPages: () => ({ cursor: "", reset: vi.fn() }) }));
import { useSupplierAgreements } from "./use-supplier-agreements";

beforeEach(() => { hooks.values = []; hooks.cursor = 0; hooks.effects = []; });

it("mở từ liên kết Thêm bảng giá thì form mới vẫn mở sau khi các hiệu ứng khởi động chạy", () => {
  useSupplierAgreements({ supplierId: "s1", startNew: true });
  hooks.effects.forEach(run => run());
  hooks.cursor = 0;
  expect(useSupplierAgreements({ supplierId: "s1", startNew: true }).editor).toEqual({ kind: "new" });
});
