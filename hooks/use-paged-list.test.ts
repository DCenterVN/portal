import { expect, it, vi } from "vitest";
import { usePagedList } from "./use-paged-list";

const harness = vi.hoisted(() => ({ cursor: 0, slots: [] as unknown[], effects: [] as Array<{ deps: unknown[]; run: () => void }>, ran: [] as unknown[][] }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const slot = (initial: unknown) => { const index = harness.cursor++; if (!(index in harness.slots)) harness.slots[index] = initial; return index; };
  return { ...actual,
    useState: (initial: unknown) => { const index = slot(initial); return [harness.slots[index], (value: unknown) => { harness.slots[index] = value; }]; },
    useReducer: (reducer: (state: unknown, action: unknown) => unknown, initial: unknown) => { const index = slot(initial); return [harness.slots[index], (action: unknown) => { harness.slots[index] = reducer(harness.slots[index], action); }]; },
    useRef: (initial: unknown) => harness.slots[slot({ current: initial })],
    useEffect: (run: () => void, deps: unknown[]) => harness.effects.push({ deps, run }),
  };
});

const page = { items: [1], next_cursor: "c1" };
function render(load: (cursor: string, filter: string) => Promise<typeof page>, scope: string) {
  harness.cursor = 0; harness.effects = [];
  const state = usePagedList(load, scope);
  for (const { deps, run } of harness.effects) {
    if (harness.ran.some(previous => previous.length === deps.length && previous.every((value, i) => Object.is(value, deps[i])))) continue;
    harness.ran.push(deps); run();
  }
  return state;
}

it("đổi chi nhánh hoặc bộ lọc thì quay về trang đầu, bỏ cursor cũ", async () => {
  const load = vi.fn(async () => page);
  render(load, "a:1"); await Promise.resolve(); await Promise.resolve();
  render(load, "a:1").next();
  expect(render(load, "a:1").hasPrevious).toBe(true);
  expect(load).toHaveBeenLastCalledWith("c1", "");
  const reset = render(load, "b:1");
  expect(reset.hasPrevious).toBe(false);
  expect(load).toHaveBeenLastCalledWith("", "");
  reset.setFilter("DRAFT"); await Promise.resolve();
  render(load, "b:1");
  expect(load).toHaveBeenLastCalledWith("", "DRAFT");
});
