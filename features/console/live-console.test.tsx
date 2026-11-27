import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import * as swr from "swr";
import * as dishesApi from "@/lib/api/dishes";
import * as inboundQcApi from "@/lib/api/inbound-qc";
import * as materialCatalogApi from "@/lib/api/material-catalog";
import * as supplierOverviewApi from "@/lib/api/supplier-overview";
import { LiveConsole } from "./live-console";

const harness = vi.hoisted(() => ({ enabled: false, slots: [] as unknown[], cursor: 0, effects: [] as (() => void | (() => void))[] }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState: <T,>(initial: T | (() => T)) => {
      if (!harness.enabled) return actual.useState(initial);
      const slot = harness.cursor++;
      if (!(slot in harness.slots)) harness.slots[slot] = typeof initial === "function" ? (initial as () => T)() : initial;
      return [harness.slots[slot] as T, (next: T | ((previous: T) => T)) => { harness.slots[slot] = typeof next === "function" ? (next as (previous: T) => T)(harness.slots[slot] as T) : next; }] as const;
    },
    useEffect: (effect: () => void | (() => void), deps?: unknown[]) => {
      if (!harness.enabled) return actual.useEffect(effect, deps);
      const slot = harness.cursor++;
      const previous = harness.slots[slot] as unknown[] | undefined;
      if (!previous || !deps || deps.some((value, index) => value !== previous[index])) {
        harness.slots[slot] = deps;
        harness.effects.push(effect);
      }
    },
  };
});

vi.mock("swr", () => ({ default: vi.fn() }));
afterEach(() => {
  harness.enabled = false;
  harness.slots = [];
  harness.cursor = 0;
  harness.effects = [];
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
const data = {
  user: { id: uuid, display_name: "", email: "" },
  active_context: { org_id: uuid, branch_id: uuid },
  contexts: [
    { org_id: uuid, org_name: "Sunny", branch_id: uuid, branch_name: "Sunny", branch_type: "CENTRAL_KITCHEN", roles: ["ADMIN"] },
    { org_id: uuid, org_name: "Sunny", branch_id: "b", branch_name: "Cửa hàng Cầu Giấy", branch_type: "STORE", roles: ["ADMIN", "SALES"] },
  ],
  permissions: ["sales:product:read", "inventory:transfer_receipt:create", "org:branch:update"],
};

const settle = async () => {
  for (let index = 0; index < 8; index++) await Promise.resolve();
};

it("shows role names, no raw role code, no technical wording and no UUID", () => {
  vi.mocked(swr.default).mockReturnValue({ data, error: undefined, isLoading: false, mutate: vi.fn() } as never);
  const text = renderToStaticMarkup(<LiveConsole />).replace(/<[^>]*>/g, " ");
  expect(text).toContain("Quản trị hệ thống, Bán hàng");
  expect(text).toContain("Sunny · Bếp trung tâm");
  expect(text).toContain("Sunny · Cửa hàng Cầu Giấy");
  expect(text).not.toContain("Sunny · Sunny");
  expect(text).not.toMatch(/\bADMIN\b|action key|backend|Backend|phân giải|\b[a-z_]+:[a-z_]+:[a-z_]+\b/);
  expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});

it("renders loading skeleton when session is loading", () => {
  vi.mocked(swr.default).mockReturnValue({ data: undefined, error: undefined, isLoading: true, mutate: vi.fn() } as never);
  const html = renderToStaticMarkup(<LiveConsole />);
  expect(html).toContain('data-slot="skeleton"');
  expect(html).not.toContain('role="alert"');
});

it("renders error state with retry button when session fails", () => {
  vi.mocked(swr.default).mockReturnValue({ data: undefined, error: new Error("fail"), isLoading: false, mutate: vi.fn() } as never);
  const html = renderToStaticMarkup(<LiveConsole />);
  expect(html).toContain('role="alert"');
  expect(html).toContain("Không tải được trang tổng quan");
  expect(html).toContain("Thử lại");
});

it("shows actionable KPI cards for granted permissions without debug permission counts", () => {
  vi.mocked(swr.default).mockReturnValue({
    data: { ...data, permissions: ["sales:product:read", "inventory:qc:update"] },
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  } as never);
  const html = renderToStaticMarkup(<LiveConsole />);
  const text = html.replace(/<[^>]*>/g, " ");
  expect(text).toContain("Tổng quan");
  expect(text).toContain("Nháp món đang soạn");
  expect(text).toContain("Nguyên liệu nháp");
  expect(text).toContain("Lô chờ kiểm đầu vào");
  expect(text).not.toContain("việc được phép làm");
  expect(html).toContain('href="/production/dishes?tab=drafts"');
  expect(html).toContain('href="/inventory/inbound-qc"');
});

it("active_context chooses the matching branch rather than falling back to contexts[0]", () => {
  vi.mocked(swr.default).mockReturnValue({
    data: { ...data, active_context: { org_id: uuid, branch_id: "b" }, permissions: ["sales:order:read"] },
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  } as never);
  const text = renderToStaticMarkup(<LiveConsole />).replace(/<[^>]*>/g, " ");
  expect(text).toContain("Sunny · Cửa hàng Cầu Giấy — Quản trị hệ thống, Bán hàng");
  expect(text).toContain("Đơn hàng chờ xử lý");
});

it("STORE branch does not call getSupplierOverview even when permission is present", async () => {
  harness.enabled = true;
  const supplierSpy = vi.spyOn(supplierOverviewApi, "getSupplierOverview").mockResolvedValue({} as never);
  const inboundSpy = vi.spyOn(inboundQcApi, "getInboundLots").mockResolvedValue({ items: [], total: 0 } as never);
  vi.mocked(swr.default).mockReturnValue({
    data: { ...data, active_context: { org_id: uuid, branch_id: "b" }, permissions: ["inventory:supplier:read", "inventory:qc:update"] },
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  } as never);
  harness.cursor = 0;
  renderToStaticMarkup(<LiveConsole />);
  for (const effect of harness.effects.splice(0)) effect();
  await settle();
  harness.cursor = 0;
  const text = renderToStaticMarkup(<LiveConsole />).replace(/<[^>]*>/g, " ");
  expect(supplierSpy).not.toHaveBeenCalled();
  expect(inboundSpy).toHaveBeenCalledTimes(1);
  expect(text).not.toContain("Nhà cung cấp chưa có giá");
  expect(text).toContain("Lô chờ kiểm đầu vào");
});

it("shows em-dash instead of 0 when a KPI source fails", async () => {
  harness.enabled = true;
  vi.spyOn(supplierOverviewApi, "getSupplierOverview").mockRejectedValue(new Error("boom"));
  vi.mocked(swr.default).mockReturnValue({
    data: { ...data, permissions: ["inventory:supplier:read"] },
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  } as never);
  harness.cursor = 0;
  renderToStaticMarkup(<LiveConsole />);
  for (const effect of harness.effects.splice(0)) effect();
  await settle();
  harness.cursor = 0;
  const text = renderToStaticMarkup(<LiveConsole />).replace(/<[^>]*>/g, " ");
  expect(text).toContain("Nhà cung cấp chưa có giá");
  expect(text).toContain("—");
  expect(text).toContain("Một số đầu việc chưa tải được.");
  expect(text).not.toContain("Không còn việc tồn");
});

it("renders material distribution bars and dish donut SVG with chart tokens", async () => {
  harness.enabled = true;
  vi.spyOn(dishesApi, "listDishDrafts").mockResolvedValue({ items: [{ id: "d1", kind: "CREATE", status: "OPEN", title: "Cơm gà", updated_by: "Bếp trưởng", updated_at: "2026-11-01T08:00:00Z" }], next_cursor: null });
  vi.spyOn(materialCatalogApi, "catalogRequest").mockResolvedValue({ items: [], next_cursor: null } as never);
  vi.spyOn(materialCatalogApi, "getMaterialTree").mockResolvedValue([
    { code: "thit", label: "Thịt", active: true, groups: [{ code: "thit_bo", label: "Thịt bò", active: true }] },
    { code: "rau_cu", label: "Rau củ", active: true, groups: [{ code: "rau_la", label: "Rau lá", active: true }] },
  ]);
  vi.spyOn(materialCatalogApi, "listMaterials").mockImplementation(async status =>
    status === "ACTIVE"
      ? [{ id: "m1", name: "Thịt bò", category: "thit", group: "thit_bo", imageUrl: null, status: "ACTIVE", unit: "KG" }]
      : [{ id: "m2", name: "Cải ngọt", category: "rau_cu", group: "rau_la", imageUrl: null, status: "DRAFT", unit: "KG" }]
  );
  vi.spyOn(dishesApi, "listAllDishes").mockResolvedValue([
    { product: { id: "p1", name: "Phở bò", category_ref: null, category_name: "Món nước" }, variants: [], counts: { DRAFT: 0, DONE: 0, SELLING: 1, STOPPED: 0 }, open_revision_drafts: 0 },
    { product: { id: "p2", name: "Bún chả", category_ref: null, category_name: "Món khô" }, variants: [], counts: { DRAFT: 0, DONE: 1, SELLING: 0, STOPPED: 0 }, open_revision_drafts: 0 },
  ]);
  vi.mocked(swr.default).mockReturnValue({
    data: { ...data, permissions: ["sales:product:read"] },
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  } as never);
  harness.cursor = 0;
  renderToStaticMarkup(<LiveConsole />);
  for (const effect of harness.effects.splice(0)) effect();
  await settle();
  harness.cursor = 0;
  const html = renderToStaticMarkup(<LiveConsole />);
  expect(html).toContain("Phân bổ nguyên liệu theo nhóm");
  expect(html).toContain("Tiến độ món ăn &amp; mở bán");
  expect(html).toContain('role="img"');
  expect(html).toContain("var(--chart-1)");
  expect(html).toContain("var(--chart-2)");
  expect(html).toContain("var(--chart-5)");
  expect(html).toContain("/production/materials?loai=thit");
});

it("renders supplier price coverage donut SVG with chart tokens and footer", async () => {
  harness.enabled = true;
  vi.spyOn(supplierOverviewApi, "getSupplierOverview").mockResolvedValue({
    as_of: "2026-11-24",
    suppliers: { active: 5, suspended: 1 },
    price_coverage: { suppliers_with_active_price: 4, suppliers_without_active_price: 1, materials_priced: 24 },
    agreements: { draft: 0, expiring_within_14_days: 1 },
    receipts: { last_30_days: 9, last_received_at: null },
    attention: { expiring: [], without_price: [] },
  });
  vi.mocked(swr.default).mockReturnValue({
    data: { ...data, permissions: ["inventory:supplier:read"] },
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  } as never);
  harness.cursor = 0;
  renderToStaticMarkup(<LiveConsole />);
  for (const effect of harness.effects.splice(0)) effect();
  await settle();
  harness.cursor = 0;
  const html = renderToStaticMarkup(<LiveConsole />);
  expect(html).toContain("Độ phủ bảng giá nhà cung cấp");
  expect(html).toContain('role="img"');
  expect(html).toContain("var(--chart-1)");
  expect(html).toContain("var(--chart-3)");
  expect(html).toContain("var(--chart-4)");
  expect(html).toContain("var(--chart-5)");
  expect(html).toContain("24 nguyên liệu đã có giá · 9 phiếu nhập 30 ngày qua");
});
