import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CostPreview, DishContent } from "@/lib/dishes/types";

const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effectCursor: 0,
  effectStates: [] as Array<{ deps?: React.DependencyList; cleanup?: () => void }>,
  effects: [] as Array<() => void>,
  active: false,
  queued: false,
  onRerender: null as null | (() => void),
}));

function depsEqual(a?: React.DependencyList, b?: React.DependencyList) {
  return Boolean(a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index])));
}

vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const schedule = () => {
    if (!harness.active || harness.queued) return;
    harness.queued = true;
    queueMicrotask(() => {
      harness.queued = false;
      if (harness.active) harness.onRerender?.();
    });
  };
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = harness.cursor++;
      if (!(index in harness.slots)) harness.slots[index] = typeof initial === "function" ? initial() : initial;
      return [
        harness.slots[index],
        (next: unknown) => {
          const nextValue = typeof next === "function" ? (next as (prev: unknown) => unknown)(harness.slots[index]) : next;
          if (!Object.is(harness.slots[index], nextValue)) {
            harness.slots[index] = nextValue;
            schedule();
          }
        },
      ];
    },
    useRef: (initial: unknown) => {
      const index = harness.cursor++;
      if (!(index in harness.slots)) harness.slots[index] = { current: initial };
      return harness.slots[index];
    },
    useMemo: (factory: () => unknown, deps?: React.DependencyList) => {
      const index = harness.cursor++;
      const prev = harness.slots[index] as { value: unknown; deps?: React.DependencyList } | undefined;
      if (prev && depsEqual(deps, prev.deps)) return prev.value;
      const value = factory();
      harness.slots[index] = { value, deps };
      return value;
    },
    useCallback: (fn: unknown, deps?: React.DependencyList) => {
      const index = harness.cursor++;
      const prev = harness.slots[index] as { fn: unknown; deps?: React.DependencyList } | undefined;
      if (prev && depsEqual(deps, prev.deps)) return prev.fn;
      harness.slots[index] = { fn, deps };
      return fn;
    },
    useEffect: (effect: React.EffectCallback, deps?: React.DependencyList) => {
      const index = harness.effectCursor++;
      const prev = harness.effectStates[index];
      if (deps && prev && depsEqual(deps, prev.deps)) return;
      harness.effects.push(() => {
        prev?.cleanup?.();
        const cleanup = effect();
        harness.effectStates[index] = { deps, cleanup: typeof cleanup === "function" ? cleanup : undefined };
      });
    },
  };
});

const catalogData = vi.hoisted(() => ({
  tree: [{ code: "thit", label: "Thịt", active: true, groups: [{ code: "thit_bo", label: "Thịt bò", active: true }] }],
  items: [{ id: "sku-1", name: "Bắp bò", category: "thit", group: "thit_bo", imageUrl: null, status: "ACTIVE" as const, unit: "KG" }],
}));

vi.mock("swr", () => ({
  default: (key: string | null) => ({
    data: key === "dish-catalog" ? catalogData : undefined,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
  }),
}));

vi.mock("@/lib/access-boundary", () => ({
  useAccess: () => ({ can: () => true }),
}));

import { useDishData } from "./use-dish-data";

type HookDeps = Parameters<typeof useDishData>[1];
type HookResult = ReturnType<typeof useDishData>;

function makeContent(overrides: Partial<DishContent> = {}): DishContent {
  return {
    schema_version: 1,
    name: "Bún bò Huế",
    category_ref: null,
    tags: ["bún", "bò"],
    servings: 2,
    ingredients: [{ row: "row-1", sku_ref: "sku-1", quantity: "200", uom: "G", yield_pct: "100" }],
    seasonings: [],
    reason: null,
    base: null,
    ...overrides,
  };
}

function makeCost(total = 50000): CostPreview {
  return {
    complete: true,
    total_vnd: total,
    per_serving_vnd: total / 2,
    lines: [{ sku_ref: "sku-1", name: "Bắp bò", quantity: "200", uom: "G", cost_vnd: total, missing: null }],
  };
}

function makeDeps(previewCost: HookDeps["previewCost"]): HookDeps {
  return {
    previewCost,
    safeMessage: value => value,
    getRawLabels: vi.fn(async () => ({
      sku_ref: "00000000-0000-4000-8000-000000000001",
      allergen_summary: { known: true, contains: [] },
      avoidance_flags: [],
      diet_flags: null,
      updated_at: "2026-01-01T00:00:00Z",
    })),
    getMaterialTree: vi.fn(async () => []),
    listMaterials: vi.fn(async () => []),
  };
}

function createRenderer(initialContent: DishContent | null, deps: HookDeps) {
  let latestContent = initialContent;
  let latestResult: HookResult;
  const paint = () => {
    harness.cursor = 0;
    harness.effectCursor = 0;
    harness.effects = [];
    latestResult = useDishData(latestContent, deps);
    for (const run of harness.effects.splice(0)) run();
    return latestResult;
  };
  harness.active = true;
  harness.onRerender = () => {
    paint();
  };
  paint();
  return {
    rerender: (nextContent: DishContent | null) => {
      latestContent = nextContent;
      return paint();
    },
    current: () => latestResult,
  };
}

describe("useDishData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    harness.slots = [];
    harness.effectStates = [];
    harness.cursor = 0;
    harness.effectCursor = 0;
    harness.effects = [];
    harness.active = false;
    harness.queued = false;
    harness.onRerender = null;
  });

  afterEach(() => {
    harness.active = false;
    for (const state of harness.effectStates) state.cleanup?.();
    vi.useRealTimers();
  });

  it("calls previewCost only once when retiredSwr.data is undefined", async () => {
    const expectedCost = makeCost(64000);
    const previewCost = vi.fn(async () => expectedCost);
    const deps = makeDeps(previewCost);
    const content = makeContent();
    const view = createRenderer(content, deps);

    await vi.advanceTimersByTimeAsync(600);
    expect(previewCost).toHaveBeenCalledTimes(1);
    expect(view.current().cost).toEqual(expectedCost);
    expect(view.current().costLoading).toBe(false);

    view.rerender(content);
    await vi.advanceTimersByTimeAsync(2000);
    expect(previewCost).toHaveBeenCalledTimes(1);
    expect(view.current().cost).toEqual(expectedCost);
    expect(view.current().costLoading).toBe(false);
  });

  it("does not re-run previewCost when name, tags, or reason change", async () => {
    const expectedCost = makeCost(42000);
    const previewCost = vi.fn(async () => expectedCost);
    const deps = makeDeps(previewCost);
    const initial = makeContent();
    const view = createRenderer(initial, deps);

    await vi.advanceTimersByTimeAsync(600);
    expect(previewCost).toHaveBeenCalledTimes(1);

    view.rerender({
      ...initial,
      name: "Bún bò đặc biệt",
      tags: ["bún", "đặc biệt"],
      reason: "Cập nhật mô tả",
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(previewCost).toHaveBeenCalledTimes(1);
    expect(view.current().costLoading).toBe(false);
  });

  it("calls previewCost again when ingredient quantity changes", async () => {
    const firstCost = makeCost(50000);
    const secondCost = makeCost(75000);
    const previewCost = vi.fn<HookDeps["previewCost"]>()
      .mockResolvedValueOnce(firstCost)
      .mockResolvedValueOnce(secondCost);
    const deps = makeDeps(previewCost);
    const initial = makeContent();
    const view = createRenderer(initial, deps);

    await vi.advanceTimersByTimeAsync(600);
    expect(previewCost).toHaveBeenCalledTimes(1);
    expect(view.current().cost).toEqual(firstCost);

    view.rerender({
      ...initial,
      ingredients: [{ row: "row-1", sku_ref: "sku-1", quantity: "300", uom: "G", yield_pct: "100" }],
    });

    await vi.advanceTimersByTimeAsync(600);
    expect(previewCost).toHaveBeenCalledTimes(2);
    expect(view.current().cost).toEqual(secondCost);
    expect(view.current().costLoading).toBe(false);
  });
});
