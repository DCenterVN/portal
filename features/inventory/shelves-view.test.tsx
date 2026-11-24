import { beforeEach, afterEach, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShelvesView } from "./shelves-view";

const harness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, effects: [] as (() => unknown)[], mounted: false }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState(initial: unknown) {
    const index = harness.cursor++;
    if (!(index in harness.slots)) harness.slots[index] = initial;
    return [harness.slots[index], (next: unknown) => { harness.slots[index] = typeof next === "function" ? next(harness.slots[index]) : next; }];
  },
  useReducer(reducer: (state: unknown, action: unknown) => unknown, initial: unknown) {
    const index = harness.cursor++;
    if (!(index in harness.slots)) harness.slots[index] = initial;
    return [harness.slots[index], (action: unknown) => { harness.slots[index] = reducer(harness.slots[index], action); }];
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
const nameLookup = vi.hoisted(() => vi.fn());
const skuStatus = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("./transfers/use-transfer-lookups", () => ({ useMaterialNames: (...args: unknown[]) => { nameLookup(...args); return Object.assign((_sku: string, _at?: number) => "Món chưa rõ tên", { status: () => skuStatus.value }); } }));
vi.mock("@/components/ui/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
const lotId = "0192f3a4-5b6c-7d8e-9f00-112233445577";
const pendingLot = { lot_id: lotId, sku_ref: uuid, supplier_lot_code: "LOT-FG-1", uom: "EA", remaining_quantity: 3, pending_quantity: 3, inspection_quantity: 0, expires_at: "2026-12-10T10:00:00Z", origin: "TRANSFER", source_code: "CK-261115-0001" };
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
const pendingCalls = () => fetchMock.mock.calls.filter(([input]) => String(input).includes("shelf-pending-lots"));
async function mount(items: unknown[] = [pendingLot], placeStatus = 201, code = "insufficient_stock") {
  fetchMock.mockImplementation(async (input, init) => {
    if (init?.method === "POST") return placeStatus === 201 ? Response.json(envelope({ id: uuid, trace_code: "QR-1", shelf_code: "KE-MAT-01" })) : Response.json({ code: placeStatus, status: "error", message: "chữ thô của backend", errors: { error_code: code } }, { status: placeStatus });
    if (String(input).includes("shelf-pending-lots")) return Response.json(envelope({ items, total: items.length, page: 1, limit: 20 }));
    return Response.json(envelope({ items: [] }));
  });
  view(); harness.mounted = true;
  harness.effects.forEach((effect) => effect());
  await vi.waitFor(() => expect(pendingCalls()).toHaveLength(1));
  await new Promise((resolve) => setTimeout(resolve, 0));
}
const pendingRevision = () => (harness.slots.filter((slot): slot is { revision: number } => Boolean(slot) && typeof slot === "object" && "revision" in (slot as object))[1]).revision;
const chooseButton = () => nodes(view(), (node) => node.props.children === "Xếp lên kệ")[0];
beforeEach(() => { skuStatus.value = undefined; harness.slots = []; harness.cursor = 0; harness.effects = []; harness.mounted = false; fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.unstubAllGlobals());

it("shelves_pending_list: mỗi dòng có tên món, số lô, hạn dùng, lượng chờ, nguồn và mã phiếu, không lộ UUID", async () => {
  await mount();
  const text = userFacingContent(renderToStaticMarkup(view()));
  expect(text).toContain("Món chưa rõ tên");
  for (const part of ["LOT-FG-1", "10/12/2026", "3 cái", "Chuyển kho", "Phiếu chuyển CK-261115-0001"]) expect(text).toContain(part);
  expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  expect(String(pendingCalls()[0][0])).toContain(`branch_ref=${uuid}`);
});

it("shelves_pending_names: tra tên thành phẩm theo mã hàng của các dòng chờ lên kệ", async () => {
  await mount();
  view();
  expect(nameLookup.mock.calls.some(([, refs]) => Array.isArray(refs) && refs.includes(uuid))).toBe(true);
});

it("shelves_pending_return: hàng giao hỏng quay về hiện nhãn cần kiểm, lượng kiểm và mã đơn", async () => {
  await mount([{ ...pendingLot, origin: "DELIVERY_RETURN", source_code: "DH-261115-00008", pending_quantity: 4, inspection_quantity: 2 }]);
  const text = userFacingContent(renderToStaticMarkup(view()));
  expect(text).toContain("Hàng giao hỏng quay về, cần kiểm");
  expect(text).toContain("Cần kiểm 2 cái");
  expect(text).toContain("Đơn DH-261115-00008");
});

it("shelves_pending_empty: không còn hàng chờ thì báo trống", async () => {
  await mount([]);
  expect(renderToStaticMarkup(view())).toContain("Không có hàng nào đang chờ lên kệ");
});

it("shelves_place_from_list: chọn dòng, gửi đúng lô và số lượng, rồi tải lại danh sách chờ", async () => {
  await mount();
  invoke(chooseButton(), "onClick");
  expect(userFacingContent(renderToStaticMarkup(view()))).toContain("Xếp lô");
  await invoke(nodes(view(), (node) => node.type === "form")[0], "onSubmit", { preventDefault() {} });
  const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
  expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({ finished_lot_ref: lotId, branch_ref: uuid, shelf_code: "KE-MAT-01", placed_quantity: 3, uom: "EA" });
  expect(renderToStaticMarkup(view())).not.toContain("Xếp lô");
  expect(pendingRevision()).toBe(1);
});

async function submitPlacement() {
  invoke(chooseButton(), "onClick");
  await invoke(nodes(view(), (node) => node.type === "form")[0], "onSubmit", { preventDefault() {} });
}

it("shelves_place_over: insufficient_stock giữ câu vượt lượng chờ, form còn nguyên, danh sách chờ được tải lại", async () => {
  await mount([pendingLot], 409);
  await submitPlacement();
  const html = renderToStaticMarkup(view());
  expect(html).toContain("Số lượng vượt quá lượng đang chờ lên kệ của lô này");
  expect(html).not.toContain("chữ thô");
  expect(html).toContain("Xếp lô");
  expect(pendingRevision()).toBe(1);
});

it("shelves_place_state_conflict: state_conflict báo lô chưa duyệt hoặc vừa đổi trạng thái, không nói vượt số lượng", async () => {
  await mount([pendingLot], 409, "state_conflict");
  await submitPlacement();
  const html = renderToStaticMarkup(view());
  expect(html).toContain("chưa được duyệt");
  expect(html).not.toContain("vượt quá");
  expect(html).not.toContain("chữ thô");
  expect(pendingRevision()).toBe(1);
});

const returnedLot = { ...pendingLot, origin: "DELIVERY_RETURN", source_code: "DH-261115-00010", pending_quantity: 1, remaining_quantity: 1, inspection_quantity: 1 };
const postCalls = () => fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");
const checkbox = () => nodes(view(), (node) => node.props.id === "shelf-inspected")[0];

it("shelves_returned_needs_inspection: hàng giao hỏng chưa đánh dấu đã kiểm thì không gửi được, đánh dấu rồi mới gửi", async () => {
  await mount([returnedLot]);
  invoke(chooseButton(), "onClick");
  const html = renderToStaticMarkup(view());
  expect(html).toContain("Đã kiểm, hàng còn dùng được");
  expect(html).toContain("đánh dấu đã kiểm");
  await invoke(nodes(view(), (node) => node.type === "form")[0], "onSubmit", { preventDefault() {} });
  expect(postCalls()).toHaveLength(0);
  invoke(checkbox(), "onCheckedChange", true);
  expect(renderToStaticMarkup(view())).not.toContain("đánh dấu đã kiểm");
  await invoke(nodes(view(), (node) => node.type === "form")[0], "onSubmit", { preventDefault() {} });
  expect(postCalls()).toHaveLength(1);
});

it("shelves_other_source_no_checkbox: hàng không phải giao hỏng không có ô đã kiểm", async () => {
  await mount();
  invoke(chooseButton(), "onClick");
  expect(renderToStaticMarkup(view())).not.toContain("Đã kiểm, hàng còn dùng được");
});

it("shelves_unit_label: nhãn ô số lượng theo đơn vị của dòng đang chọn", async () => {
  await mount([{ ...pendingLot, uom: "KG" }]);
  invoke(chooseButton(), "onClick");
  const text = userFacingContent(renderToStaticMarkup(view()));
  expect(text).toContain("Số lượng đưa lên kệ (kg)");
  expect(text).not.toContain("hộp");
});

it("shelves_suspended_note: hàng tạm ngưng bán hiện nhãn trạng thái cạnh tên", async () => {
  skuStatus.value = "SUSPENDED";
  await mount();
  expect(renderToStaticMarkup(view())).toContain("Tạm ngưng bán");
});

async function mountUnseeded(placements: Response) {
  fetchMock.mockImplementation(async (input) => String(input).includes("shelf-placements") ? placements : Response.json(envelope({ items: [], total: 0, page: 1, limit: 20 })));
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

it("shelves_list_paged: có nút trang kế khi server còn trang", async () => {
  const html = await mountUnseeded(Response.json(envelope({ items: [{ id: uuid, shelf_code: "KE-MAT-01", trace_code: "QR-BUN-21", status: "PLACED", available_quantity: 5, placed_quantity: 5, uom: "EA" }], next_cursor: "trang-2" })));
  expect(html).toContain('aria-label="Phân trang kệ hàng"');
});

it("shelves_pending_forbidden: danh sách chờ lên kệ bị 403 hiện câu tiếng Việt, không lộ câu thô của backend", async () => {
  fetchMock.mockImplementation(async (input) => String(input).includes("shelf-pending-lots")
    ? Response.json({ code: 403, status: "error", message: "missing permission inventory:shelf_pending:read" }, { status: 403 })
    : Response.json(envelope({ items: [] })));
  view(); harness.mounted = true;
  harness.effects.forEach((effect) => effect());
  await vi.waitFor(() => expect(pendingCalls()).toHaveLength(1));
  await new Promise((resolve) => setTimeout(resolve, 0));
  const html = renderToStaticMarkup(view());
  expect(html).toContain("chưa có quyền");
  expect(html).not.toContain("missing permission");
});
