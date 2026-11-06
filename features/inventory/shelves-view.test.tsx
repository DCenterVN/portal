import { beforeEach, afterEach, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShelvesView } from "./shelves-view";
import { EntityPicker, entityMatcher, filterEntities, type EntityPickerProps } from "@/components/patterns/entity-picker";
import type { ProductionOrder } from "@/lib/api/production";

const harness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, effects: [] as (() => unknown)[], mounted: false }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState(initial: unknown) {
    const index = harness.cursor++;
    if (!(index in harness.slots)) harness.slots[index] = initial;
    return [harness.slots[index], (next: unknown) => { harness.slots[index] = typeof next === "function" ? next(harness.slots[index]) : next; }];
  },
  useRef(initial: unknown) {
    const index = harness.cursor++;
    if (!(index in harness.slots)) harness.slots[index] = { current: initial };
    return harness.slots[index];
  },
  useCallback(callback: unknown) { return callback; },
  useEffect(effect: () => unknown) { if (!harness.mounted) harness.effects.push(effect); },
}));
vi.mock("@/lib/access-boundary", () => ({
  useAccess: () => ({ root: "", can: (action: string) => action === "inventory:shelf_placement:create", scope: { userId: "u", orgId: "o", branchId: "0192f3a4-5b6c-7d8e-9f00-112233445566", branchName: "B", roles: [] } }),
}));
vi.mock("@/components/ui/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
const lot = { source_plan_ref: uuid, target_ref: uuid, branch_ref: uuid, output_sku_ref: uuid, bom_ref: uuid, planned_quantity: 20, actual_output_quantity: 20, uom: "EA", created_at: "2026-10-21T07:05:00Z", id: uuid, finished_lot_ref: uuid, order_code: "LSX-BUN-21", status: "QC_PASSED", finished_lot_expires_at: "2026-10-25T10:00:00Z" };
const envelope = (data: unknown) => ({ code: 200, status: "success", message: "OK", data });
const fetchMock = vi.fn<typeof fetch>();
type Props = { children?: React.ReactNode; [key: string]: unknown };
function nodes(tree: React.ReactNode, predicate: (node: React.ReactElement<Props>) => boolean): React.ReactElement<Props>[] {
  if (!React.isValidElement<Props>(tree)) return [];
  return [...(predicate(tree) ? [tree] : []), ...React.Children.toArray(tree.props.children).flatMap((child) => nodes(child, predicate)), ...nodes(React.isValidElement(tree.props.actions) ? tree.props.actions : null, predicate)];
}
function view() { harness.cursor = 0; return ShelvesView({ initialPlacements: [] }); }
function invoke(node: React.ReactElement<Props>, handler: string, event: unknown = {}) {
  const callback = node.props[handler];
  if (typeof callback !== "function") throw Error(`Missing ${handler}`);
  return callback(event);
}
async function mount(items: unknown[] = [lot], error = false) {
  fetchMock.mockImplementation(async (_input, init) => {
    if (init?.method === "POST") return Response.json(envelope({ id: uuid, trace_code: "QR-BUN-21", shelf_code: "KE-MAT-01" }));
    return error ? Response.json(envelope(null), { status: 503 }) : Response.json(envelope({ items, total: items.length }));
  });
  view(); harness.mounted = true;
  harness.effects.forEach((effect) => effect());
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve, 0));
  invoke(nodes(view(), (node) => node.type === "button" || typeof node.props.onClick === "function")[0], "onClick");
}
beforeEach(() => { harness.slots = []; harness.cursor = 0; harness.effects = []; harness.mounted = false; fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.unstubAllGlobals());

it("shelves_pick_lot", async () => {
  await mount([lot, { ...lot, id: "0192f3a4-5b6c-7d8e-9f00-112233445567", finished_lot_ref: "0192f3a4-5b6c-7d8e-9f00-112233445567", order_code: "LSX-KHAC" }, { ...lot, order_code: "CHUA-QC", status: "COMPLETED" }, { ...lot, order_code: "THIEU-LO", finished_lot_ref: undefined }]);
  const pickerNode = nodes(view(), (node) => node.type === EntityPicker)[0];
  const props = pickerNode.props as unknown as EntityPickerProps<ProductionOrder>;
  expect(props.items).toHaveLength(2);
  const options = filterEntities(props.items!, "BUN", props.filter ?? entityMatcher(props.getLabel, props.getMeta));
  expect(options).toHaveLength(1);
  expect(props.getMeta?.(options[0])).toContain("25/10/2026");
  invoke(pickerNode, "onChange", props.getId(options[0]));
  expect(userFacingContent(renderToStaticMarkup(view()))).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  await invoke(nodes(view(), (node) => node.type === "form")[0], "onSubmit", { preventDefault() {} });
  const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
  expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({ finished_lot_ref: uuid });
  expect(fetchMock.mock.calls.filter(([input, init]) => String(input).includes("production/orders") && !init?.method)).toHaveLength(1);
  expect(userFacingContent(renderToStaticMarkup(view()))).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});

it("shelves_lot_list_error", async () => {
  await mount([], true);
  const tree = view();
  const html = renderToStaticMarkup(tree);
  expect(html).toContain('role="alert"');
  expect(html).toContain("Không tải được danh sách nên chưa chọn được.");
  expect(html).not.toContain("UUID");
  expect(html).not.toContain('name="finished_lot_ref"');
  expect(nodes(tree, (node) => node.props.type === "submit")[0].props.disabled).toBe(true);
  await invoke(nodes(tree, (node) => node.type === "form")[0], "onSubmit", { preventDefault() {} });
  expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
});

it("shelves_lot_list_empty", async () => {
  await mount([]);
  expect(renderToStaticMarkup(view())).toContain("Chưa có lô thành phẩm đã QC đạt để chọn");
  expect(nodes(view(), (node) => node.props.type === "submit")[0].props.disabled).toBe(true);
});

async function mountUnseeded(placements: Response) {
  fetchMock.mockImplementation(async (input) => String(input).includes("shelf-placements") ? placements : Response.json(envelope({ items: [] })));
  const render = () => { harness.cursor = 0; return renderToStaticMarkup(ShelvesView({})); };
  expect(render()).toContain("Đang tải kệ hàng");
  harness.mounted = true;
  harness.effects.forEach((effect) => effect());
  await vi.waitFor(() => expect(fetchMock.mock.calls.some(([input]) => String(input).includes("shelf-placements"))).toBe(true));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return render();
}

it("shelves_list_loaded_from_api: server page no longer seeds the list", async () => {
  const html = await mountUnseeded(Response.json(envelope({ items: [{ id: uuid, shelf_code: "KE-MAT-01", trace_code: "QR-BUN-21", status: "PLACED", available_quantity: 5, placed_quantity: 5, uom: "EA" }] })));
  expect(html).toContain("QR-BUN-21");
  expect(html).not.toContain('role="alert"');
});

it("shelves_list_error: a failed list is an alert, not an empty table", async () => {
  const html = await mountUnseeded(Response.json(envelope(null), { status: 503 }));
  expect(html).toContain('role="alert"');
});

function userFacingContent(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ");
  const labels = html.match(/\s(?:label|placeholder|title|aria-[\w-]+)="[^"]*"/g) ?? [];
  const values = (html.match(/<input\b[^>]*>/g) ?? [])
    .filter((input) => !input.includes('type="hidden"'))
    .flatMap((input) => input.match(/\svalue="[^"]*"/g) ?? []);
  return [text, ...labels, ...values].join(" ");
}
