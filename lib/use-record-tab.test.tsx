import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { useRecordTab } from "./use-record-tab";

const state = vi.hoisted(() => ({
  query: "org_id=company&tab=security", path: "/account", replace: vi.fn(),
  target: { current: { element: null as HTMLDivElement | null, pending: null as string | null } },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.query),
  usePathname: () => state.path,
  useRouter: () => ({ replace: state.replace }),
}));
vi.mock("react", async (original) => ({
  ...await original<typeof React>(),
  useRef: () => state.target,
}));

const focus = vi.fn();
const querySelector = vi.fn(() => ({ focus }));
const element = { querySelector } as unknown as HTMLDivElement;
let tab: ReturnType<typeof useRecordTab>;
function Probe({ values }: { values: string[] }) {
  tab = useRecordTab(values);
  return null;
}
function render(values: string[], mount = true) {
  renderToStaticMarkup(<Probe values={values} />);
  if (mount) tab.editTarget(element);
}
beforeEach(() => {
  state.target.current = { element: null, pending: null };
  state.replace.mockClear();
  querySelector.mockClear();
  focus.mockClear();
});

it.each([
  { path: "/account", initial: "security", edit: "info", values: ["info", "roles", "security"] },
  { path: "/memberships/person", initial: "info", edit: "assignments", values: ["assignments", "info"] },
])("$path edit switches tab before focusing and only focuses when already selected", ({ path, initial, edit, values }) => {
  state.path = path;
  state.query = `org_id=company&tab=${initial}`;
  render(values, false);
  expect(focus).not.toHaveBeenCalled();
  tab.edit(edit);
  expect(state.replace).toHaveBeenCalledWith(`${path}?org_id=company&tab=${edit}`, { scroll: false });
  expect(focus).not.toHaveBeenCalled();
  state.query = `org_id=company&tab=${edit}`;
  render(values, false);
  expect(focus).not.toHaveBeenCalled();
  tab.editTarget(element);
  expect(focus).toHaveBeenCalledTimes(1);
  state.replace.mockClear();
  tab.edit(edit);
  expect(focus).toHaveBeenCalledTimes(2);
  expect(state.replace).not.toHaveBeenCalled();
  render(values);
  expect(focus).toHaveBeenCalledTimes(2);
});
