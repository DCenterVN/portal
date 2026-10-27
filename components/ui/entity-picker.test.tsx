import { beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Node has no DOM: components run as plain functions, useState lives in slots so a handler call + re-render shows the next state.
const harness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0 }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = harness.cursor++;
      if (!(index in harness.slots)) harness.slots[index] = typeof initial === "function" ? (initial as () => unknown)() : initial;
      return [harness.slots[index], (next: unknown) => {
        harness.slots[index] = typeof next === "function" ? (next as (prev: unknown) => unknown)(harness.slots[index]) : next;
      }];
    },
  };
});

import { EntityPicker, type EntityPickerProps } from "./entity-picker";
import { Segmented, type SegmentedProps } from "./segmented";

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };
type Node = React.ReactElement<AnyProps>;
interface Company { id: string; name: string; code: string }
interface Product { id: string; sku_code: string; name: string; temperature_regime: string }

const COMPANIES: Company[] = [
  { id: "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e01", name: "Công ty Đà Lạt Xanh", code: "DLX" },
  { id: "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e02", name: "Bếp Sài Gòn", code: "BSG-01" },
  { id: "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e03", name: "Nông trại Hữu Cơ", code: "NTHC" },
];

function findAll(tree: React.ReactNode, match: (node: Node) => boolean): Node[] {
  if (!React.isValidElement(tree)) return [];
  const node = tree as Node;
  const own = match(node) ? [node] : [];
  return own.concat(React.Children.toArray(node.props.children).flatMap((child) => findAll(child, match)));
}

let props: EntityPickerProps<Company>;
let onChange: ReturnType<typeof vi.fn<(id: string | null) => void>>;
let onRetry: ReturnType<typeof vi.fn<() => void>>;

function view() {
  harness.cursor = 0;
  const tree = (EntityPicker as (p: EntityPickerProps<Company>) => React.ReactNode)(props) as Node;
  const html = renderToStaticMarkup(tree);
  const box = findAll(tree, (node) => node.props.role === "combobox")[0];
  const options = findAll(tree, (node) => node.props.role === "option");
  return { tree, html, box, options };
}
const call = (node: Node, handler: string, event: object = {}) => (node.props[handler] as (e: unknown) => void)(event);
const type = (value: string) => call(view().box, "onChange", { target: { value }, currentTarget: { value } });
const key = (name: string) => {
  const preventDefault = vi.fn();
  call(view().box, "onKeyDown", { key: name, preventDefault });
  return preventDefault;
};
const optionLabels = () => view().options.map((option) => renderToStaticMarkup(option));
const hiddenValue = (html: string) => html.match(/<input type="hidden"[^>]*value="([^"]*)"/)?.[1];
const visibleText = (html: string) => html.replace(/<[^>]*>/g, " ");

beforeEach(() => {
  harness.slots = [];
  harness.cursor = 0;
  onChange = vi.fn();
  onRetry = vi.fn();
  props = {
    label: "Công ty", name: "root_branch_id", items: COMPANIES, status: "ready",
    getId: (company) => company.id, getLabel: (company) => company.name, getMeta: (company) => company.code,
    onChange, onRetry, required: true, placeholder: "Tìm theo tên hoặc mã công ty",
  };
});

describe("EntityPicker filter (FR-12)", () => {
  it.each([
    ["da lat", "Công ty Đà Lạt Xanh"],
    ["ĐÀ LẠT", "Công ty Đà Lạt Xanh"],
    ["huu co", "Nông trại Hữu Cơ"],
    ["bep sai", "Bếp Sài Gòn"],
    ["bsg-01", "Bếp Sài Gòn"],
    ["dlx", "Công ty Đà Lạt Xanh"],
  ])("query %s matches only %s (accent and case blind, name or code)", (query, match) => {
    type(query);
    const options = optionLabels();
    expect(options).toHaveLength(1);
    expect(options[0]).toContain(match);
  });

  it("shows the code as secondary text next to the name", () => {
    type("bsg");
    expect(optionLabels()[0]).toMatch(/Bếp Sài Gòn.*BSG-01/);
  });

  it("no match says so in one sentence and offers nothing", () => {
    type("zzz");
    const { html, options } = view();
    expect(options).toHaveLength(0);
    expect(html).toContain("Không tìm thấy");
    expect(view().box.props["aria-expanded"]).toBe(true);
  });

  it("a custom filter replaces the default one", () => {
    props = { ...props, filter: (company, query) => company.code === query };
    type("NTHC");
    expect(optionLabels()).toHaveLength(1);
    type("nông");
    expect(optionLabels()).toHaveLength(0);
  });
});

describe("EntityPicker selection sends the id, shows the name", () => {
  it("mouse: pressing an option keeps focus, clicking picks it", () => {
    type("bếp");
    const preventDefault = vi.fn();
    call(view().options[0], "onMouseDown", { preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    call(view().options[0], "onClick");
    expect(onChange).toHaveBeenCalledWith(COMPANIES[1].id);
    const { html, box } = view();
    expect(hiddenValue(html)).toBe(COMPANIES[1].id);
    expect(box.props.value).toBe("Bếp Sài Gòn");
    expect(box.props["aria-expanded"]).toBe(false);
  });

  it("keyboard: ArrowDown opens on the first option, ArrowDown again, Enter picks the second", () => {
    key("ArrowDown");
    expect(view().box.props["aria-expanded"]).toBe(true);
    expect(view().box.props["aria-activedescendant"]).toBe(view().options[0].props.id);
    key("ArrowDown");
    const { box, options } = view();
    expect(box.props["aria-activedescendant"]).toBe(options[1].props.id);
    expect(options[1].props["aria-selected"]).toBe(true);
    expect(options[0].props["aria-selected"]).toBe(false);
    expect(key("Enter")).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(COMPANIES[1].id);
    expect(hiddenValue(view().html)).toBe(COMPANIES[1].id);
  });

  it("ArrowUp wraps to the last option; Home and End jump", () => {
    key("ArrowDown");
    key("ArrowUp");
    expect(view().box.props["aria-activedescendant"]).toBe(view().options[2].props.id);
    key("Home");
    expect(view().box.props["aria-activedescendant"]).toBe(view().options[0].props.id);
    key("End");
    expect(view().box.props["aria-activedescendant"]).toBe(view().options[2].props.id);
  });

  it("Esc closes the list without picking", () => {
    type("n");
    expect(view().box.props["aria-expanded"]).toBe(true);
    key("Escape");
    expect(view().box.props["aria-expanded"]).toBe(false);
    expect(view().options).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ARIA 1.2 combobox wiring: aria-controls names the listbox", () => {
    type("n");
    const { tree, box } = view();
    const listbox = findAll(tree, (node) => node.props.role === "listbox")[0];
    expect(box.props["aria-controls"]).toBe(listbox.props.id);
    expect(box.props["aria-autocomplete"]).toBe("list");
    expect(String(listbox.props.className).split(" ")).toEqual(expect.arrayContaining(["bg-glass-l3", "glass-blur-l3", "shadow-l3"]));
  });

  it("a controlled value shows its name and clearing the text clears the id", () => {
    props = { ...props, value: COMPANIES[2].id };
    expect(view().box.props.value).toBe("Nông trại Hữu Cơ");
    type("");
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("product case: SKU · temperature as meta, product_ref carries the id", () => {
    const products: Product[] = [
      { id: "0192f0a1-0000-7000-8000-00000000aa01", sku_code: "SKU-RAU-01", name: "Rau muống", temperature_regime: "CHILLED" },
      { id: "0192f0a1-0000-7000-8000-00000000aa02", sku_code: "SKU-THIT-02", name: "Thịt bò", temperature_regime: "FROZEN" },
    ];
    const pick = vi.fn();
    const productProps: EntityPickerProps<Product> = {
      label: "Sản phẩm", name: "product_ref", items: products, status: "ready", onChange: pick,
      getId: (p) => p.id, getLabel: (p) => p.name, getMeta: (p) => `${p.sku_code} · ${p.temperature_regime}`,
    };
    const render = () => { harness.cursor = 0; return (EntityPicker as (p: EntityPickerProps<Product>) => React.ReactNode)(productProps) as Node; };
    const box = () => findAll(render(), (node) => node.props.role === "combobox")[0];
    call(box(), "onChange", { target: { value: "thit-02" } });
    const options = findAll(render(), (node) => node.props.role === "option");
    expect(options).toHaveLength(1);
    expect(renderToStaticMarkup(options[0])).toContain("SKU-THIT-02 · FROZEN");
    call(options[0], "onClick");
    expect(pick).toHaveBeenCalledWith(products[1].id);
    expect(renderToStaticMarkup(render())).toMatch(new RegExp(`<input type="hidden" name="product_ref" value="${products[1].id}"`));
  });
});

describe("EntityPicker states fail closed", () => {
  it("loading announces Đang tải… and offers nothing to pick", () => {
    props = { ...props, status: "loading", items: undefined };
    type("da");
    const { html, options, box } = view();
    expect(html).toContain("Đang tải…");
    expect(options).toHaveLength(0);
    expect(box.props["aria-expanded"]).toBe(false);
    key("Enter");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("empty list shows emptyText and offers nothing", () => {
    props = { ...props, items: [], emptyText: "Chưa có công ty nào." };
    type("a");
    const { html, options } = view();
    expect(html).toContain("Chưa có công ty nào.");
    expect(options).toHaveLength(0);
  });

  it("error never offers the stale list, Enter picks nothing, Thử lại calls onRetry", () => {
    props = { ...props, status: "error" };
    type("da lat");
    key("ArrowDown");
    expect(key("Enter")).toHaveBeenCalled();
    const { html, tree, options } = view();
    expect(options).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
    expect(html).toContain('role="alert"');
    const retry = findAll(tree, (node) => node.props.children === "Thử lại")[0];
    call(retry, "onClick");
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("EntityPicker required + no raw id on screen", () => {
  it("blur with nothing picked marks the field invalid with a message at the field", () => {
    expect(view().html).not.toContain("aria-invalid");
    call(view().box, "onBlur", { currentTarget: { value: "" } });
    const { html } = view();
    expect(html).toMatch(/<input[^>]*role="combobox"[^>]*aria-invalid="true"|<input[^>]*aria-invalid="true"[^>]*role="combobox"/);
    expect(html).toMatch(/<p id="root_branch_id-picker-error"[^>]*role="alert"[^>]*>[^<]+<\/p>/);
  });

  it("a blocked submit (invalid event) shows the same message", () => {
    call(view().box, "onInvalid", { preventDefault: vi.fn() });
    expect(view().html).toContain('aria-invalid="true"');
  });

  it("blur after a pick is valid; a server error still wins", () => {
    props = { ...props, value: COMPANIES[0].id };
    call(view().box, "onBlur", { currentTarget: { value: "x" } });
    expect(view().html).not.toContain("aria-invalid");
    props = { ...props, error: "Công ty đã ngừng hoạt động" };
    expect(view().html).toContain(">Công ty đã ngừng hoạt động</p>");
  });

  it("the id rides only in the hidden input; nothing visible shows it", () => {
    props = { ...props, value: COMPANIES[0].id };
    call(view().box, "onFocus");
    const { html } = view();
    const ids = COMPANIES.map((company) => company.id);
    for (const id of ids) expect(visibleText(html)).not.toContain(id);
    expect(html.match(/value="0192[^"]*"/g)).toEqual([`value="${COMPANIES[0].id}"`]);
    expect(html).toMatch(/<input type="hidden" name="root_branch_id" value="/);
    const combobox = html.match(/<input[^>]*role="combobox"[^>]*>/)?.[0] ?? "";
    expect(combobox).not.toMatch(/\bname=/);
    const shown = [...combobox.matchAll(/(?:placeholder|value)="([^"]*)"/g)].map((match) => match[1]);
    expect(shown).toEqual(["Tìm theo tên hoặc mã công ty", "Công ty Đà Lạt Xanh"]);
    for (const text of shown) expect(text).not.toMatch(/UUID|\bID\b|\bref\b/i);
  });
});


describe("picker UX click and validation", () => {
  it("focus and click open the complete list without required errors", () => {
    call(view().box, "onFocus");
    expect(view().options).toHaveLength(3);
    expect(view().html).not.toContain('aria-invalid="true"');
    key("Escape");
    call(view().box, "onClick");
    expect(view().options).toHaveLength(3);
  });

  it("chevron opens without submitting or blurring the field", () => {
    const toggle = findAll(view().tree, node => node.props["aria-haspopup"] === "listbox")[0];
    expect(toggle).toBeDefined();
    expect(toggle.props.type).toBe("button");
    const preventDefault = vi.fn();
    call(toggle, "onMouseDown", { preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    call(toggle, "onClick");
    expect(view().options).toHaveLength(3);
    expect(view().html).not.toContain('aria-invalid="true"');
  });

  it("editing a selection invalidates its ID immediately, including controlled state", () => {
    props = { ...props, value: COMPANIES[0].id };
    type("bep");
    expect(onChange).toHaveBeenCalledWith(null);
    expect(hiddenValue(view().html)).toBe("");
    key("Escape");
    expect(view().box.props.value).not.toBe(COMPANIES[0].name);
  });

  it("Tab closes without picking and Enter never submits free text", () => {
    type("zzz");
    expect(key("Enter")).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    key("Tab");
    expect(view().box.props["aria-expanded"]).toBe(false);
  });

  it("stale data cannot be selected after the status changes", () => {
    type("bep");
    const stale = view().options[0];
    props = { ...props, status: "error" };
    expect(view().options).toHaveLength(0);
    key("Enter");
    expect(onChange).not.toHaveBeenCalled();
    expect(stale).toBeDefined();
  });

  it("serializeValue=false omits the hidden ID input", () => {
    props = { ...props, serializeValue: false, value: COMPANIES[0].id };
    expect(hiddenValue(view().html)).toBeUndefined();
  });
});

describe("Segmented (FR-4)", () => {
  type View = "day" | "week" | "month";
  const items = [{ id: "day", label: "Ngày" }, { id: "week", label: "Tuần" }, { id: "month", label: "Tháng" }] as const;
  const segmented = (value: View, change = vi.fn()) => (Segmented as (p: SegmentedProps<View>) => React.ReactNode)({ label: "Khoảng thời gian", items, value, onChange: change }) as Node;

  it("is a radiogroup of radios with a roving tabindex", () => {
    const html = renderToStaticMarkup(segmented("week"));
    expect(html).toMatch(/role="radiogroup"[^>]*aria-label="Khoảng thời gian"|aria-label="Khoảng thời gian"[^>]*role="radiogroup"/);
    const radios = html.match(/<button[^>]*role="radio"[^>]*>/g) ?? [];
    expect(radios).toHaveLength(3);
    expect(radios.map((radio) => radio.match(/aria-checked="(\w+)"/)?.[1])).toEqual(["false", "true", "false"]);
    expect(radios.map((radio) => radio.match(/tabindex="(-?\d)"/i)?.[1])).toEqual(["-1", "0", "-1"]);
  });

  it.each([
    ["ArrowRight", "week", "month"], ["ArrowDown", "week", "month"], ["ArrowLeft", "day", "month"],
    ["ArrowUp", "week", "day"], ["Home", "month", "day"], ["End", "day", "month"],
  ] as const)("%s from %s selects and focuses %s", (name, from, to) => {
    const change = vi.fn();
    const focus = items.map(() => vi.fn());
    const preventDefault = vi.fn();
    const currentTarget = { querySelectorAll: () => focus.map((spy) => ({ focus: spy })) };
    call(segmented(from, change), "onKeyDown", { key: name, preventDefault, currentTarget });
    expect(change).toHaveBeenCalledWith(to);
    expect(preventDefault).toHaveBeenCalled();
    expect(focus[items.findIndex((item) => item.id === to)]).toHaveBeenCalled();
  });

  it("ignores other keys and picks on click", () => {
    const change = vi.fn();
    const tree = segmented("day", change);
    call(tree, "onKeyDown", { key: "a", preventDefault: vi.fn(), currentTarget: { querySelectorAll: () => [] } });
    expect(change).not.toHaveBeenCalled();
    call(findAll(tree, (node) => node.props.role === "radio")[2], "onClick");
    expect(change).toHaveBeenCalledWith("month");
  });

  it("radius on the scale and tap target 32px desktop, 44px mobile", () => {
    const html = renderToStaticMarkup(segmented("day"));
    expect(html).toMatch(/role="radiogroup"[^>]*class="[^"]*\brounded-lg\b/);
    const radio = html.match(/<button[^>]*role="radio"[^>]*class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(radio).toEqual(expect.arrayContaining(["min-h-8", "max-md:min-h-11", "rounded-sm"]));
  });
});
