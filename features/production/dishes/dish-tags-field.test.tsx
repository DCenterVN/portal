import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { suggestTags } from "@/lib/dishes/tags";

const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effectCursor: 0,
  effectStates: [] as Array<{ deps?: React.DependencyList }>,
  effects: [] as Array<() => void>,
}));

vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = harness.cursor++;
      if (!(index in harness.slots)) harness.slots[index] = typeof initial === "function" ? initial() : initial;
      return [harness.slots[index], (next: unknown) => { harness.slots[index] = typeof next === "function" ? next(harness.slots[index]) : next; }];
    },
    useRef: (initial: unknown) => {
      const index = harness.cursor++;
      if (!(index in harness.slots)) harness.slots[index] = { current: initial };
      return harness.slots[index];
    },
    useEffect: (effect: React.EffectCallback, deps?: React.DependencyList) => {
      const index = harness.effectCursor++;
      const prev = harness.effectStates[index];
      if (deps && prev?.deps && deps.length === prev.deps.length && deps.every((d, i) => Object.is(d, prev.deps?.[i]))) return;
      harness.effects.push(() => {
        harness.effectStates[index] = { deps };
        effect();
      });
    },
  };
});

import { DishTagsField } from "./dish-tags-field";

function paint(props: React.ComponentProps<typeof DishTagsField>) {
  harness.cursor = 0;
  harness.effectCursor = 0;
  harness.effects = [];
  const tree = DishTagsField(props);
  for (const run of harness.effects.splice(0)) run();
  return tree;
}

type Elem = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function findButtons(tree: React.ReactNode): Elem[] {
  if (!React.isValidElement<Record<string, unknown> & { children?: React.ReactNode }>(tree)) return [];
  return [
    ...(typeof tree.props.onClick === "function" ? [tree] : []),
    ...React.Children.toArray(tree.props.children).flatMap(findButtons),
  ];
}

describe("DishTagsField", () => {
  beforeEach(() => {
    harness.slots = [];
    harness.effectStates = [];
    harness.cursor = 0;
    harness.effectCursor = 0;
    harness.effects = [];
  });

  it("resumes auto-sync on reopened draft whose tags match suggestions", () => {
    const onChange = vi.fn();
    const tags = suggestTags("Bún bò Huế", ["Bắp bò"]);
    paint({ name: "Bún bò Huế", ingredientNames: ["Bắp bò"], tags, readOnly: false, catalogReady: true, error: "", onChange });
    expect(onChange).not.toHaveBeenCalled();

    paint({ name: "Phở bò", ingredientNames: ["Thăn bò"], tags, readOnly: false, catalogReady: true, error: "", onChange });
    expect(onChange).toHaveBeenCalledWith(suggestTags("Phở bò", ["Thăn bò"]));
  });

  it("keeps manual tags untouched after user edits a tag", () => {
    const onChange = vi.fn();
    const initial = suggestTags("Bún bò", ["Bắp bò"]);
    const tree = paint({ name: "Bún bò", ingredientNames: ["Bắp bò"], tags: initial, readOnly: false, catalogReady: true, error: "", onChange });
    const removeBtn = findButtons(tree)[0];
    (removeBtn.props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledTimes(1);
    const edited = onChange.mock.calls[0][0] as string[];
    onChange.mockClear();

    paint({ name: "Phở gà", ingredientNames: ["Thịt gà"], tags: edited, readOnly: false, catalogReady: true, error: "", onChange });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("starts syncing on COPY draft with empty tags once catalog is ready", () => {
    const onChange = vi.fn();
    paint({ name: "Bún bò (bản sao)", ingredientNames: ["Bắp bò"], tags: [], readOnly: false, catalogReady: false, error: "", onChange });
    expect(onChange).not.toHaveBeenCalled();

    paint({ name: "Phở bò", ingredientNames: ["Bắp bò"], tags: [], readOnly: false, catalogReady: true, error: "", onChange });
    expect(onChange).toHaveBeenCalledWith(suggestTags("Phở bò", ["Bắp bò"]));
  });
});
