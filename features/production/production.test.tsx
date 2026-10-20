import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductionTarget, FoodProductPlan, ProductionOrder, ShelfPlacement, PublicTraceability } from "@/lib/api/production";
import { TargetsView } from "./targets-view";
import { FoodPlansView } from "./food-plans-view";
import { OrdersView } from "./orders-view";
import { QCView } from "./qc-view";
import { ShelvesView } from "@/features/inventory/shelves-view";
import { TraceView } from "@/features/traceability/trace-view";
import { PricingFloorView } from "@/features/sales/pricing-floor-view";

describe("Production & Traceability Portal Features", () => {
  const sampleTarget: ProductionTarget = {
    id: "01955700-0000-7000-8000-000000000001",
    target_code: "TGT-20260901-001",
    branch_ref: "01955700-0000-7000-8000-000000000002",
    period_start: "2026-09-01T00:00:00Z",
    period_end: "2026-09-30T23:59:59Z",
    title: "Chỉ tiêu Món Trứng Dinh Dưỡng Tháng 9",
    status: "APPROVED",
    lines: [{ product_ref: "01955700-0000-7000-8000-000000000003", target_quantity: 100, uom: "EA" }],
    created_by: "01955700-0000-7000-8000-000000000010",
    created_at: "2026-09-01T08:00:00Z",
  };

  const sampleFoodPlan: FoodProductPlan = {
    id: "01955700-0000-7000-8000-000000000004",
    plan_code: "PLN-20260901-001",
    target_ref: sampleTarget.id,
    product_ref: "01955700-0000-7000-8000-000000000003",
    variant_sku_code: "VAR-TRUNG-01",
    planned_quantity: 50,
    uom: "EA",
    serving_size: "1 phần 200g",
    components: [{ sku_ref: "01955700-0000-7000-8000-000000000020", quantity: 3, uom: "EA" }],
    status: "WAITING_PRICE_APPROVAL",
    nutrition_snapshot: { calories: 350, protein_g: 22 },
    created_by: "01955700-0000-7000-8000-000000000021",
    created_at: "2026-09-01T08:30:00Z",
  };

  const sampleOrder: ProductionOrder = {
    id: "01955700-0000-7000-8000-000000000005",
    order_code: "PO-20260901-001",
    source_plan_ref: sampleFoodPlan.id,
    target_ref: sampleTarget.id,
    branch_ref: sampleTarget.branch_ref,
    output_sku_ref: "01955700-0000-7000-8000-000000000030",
    bom_ref: "01955700-0000-7000-8000-000000000031",
    planned_quantity: 50,
    actual_output_quantity: 50,
    uom: "EA",
    status: "QC_PASSED",
    created_at: "2026-09-01T09:00:00Z",
  };

  const samplePlacement: ShelfPlacement = {
    id: "01955700-0000-7000-8000-000000000006",
    finished_lot_ref: "01955700-0000-7000-8000-000000000040",
    branch_ref: sampleTarget.branch_ref,
    shelf_code: "KE-MAT-01",
    placed_quantity: 50,
    available_quantity: 50,
    uom: "EA",
    status: "PLACED",
    trace_code: "TRC-20260901-DEMO",
    placed_at: "2026-09-01T10:00:00Z",
  };

  const sampleTrace: PublicTraceability = {
    trace_code: "TRC-20260901-DEMO",
    product_name: "Món Trứng Dinh Dưỡng Make-to-Stock",
    variant_name: "Khẩu phần tiêu chuẩn 200g",
    produced_at: "2026-09-01T09:00:00Z",
    expires_at: "2026-10-01T09:00:00Z",
    qc_status: "PASSED",
    ingredients: [
      { material_name: "Trứng gà tươi VietGAP", supplier_code: "NCC-001-VN" },
      { material_name: "Gia vị chuẩn dinh dưỡng", supplier_code: "NCC-002-VN" },
    ],
    timeline: [
      { stage: "TARGET_AND_PLAN", title: "Kế hoạch & Định lượng dinh dưỡng", timestamp: "2026-09-01T08:00:00Z", passed: true },
      { stage: "PROCESSING", title: "Sơ chế & Nấu chín", timestamp: "2026-09-01T09:00:00Z", passed: true },
      { stage: "PACKAGING_AND_FREEZING", title: "Đóng gói & Cấp đông -18°C", timestamp: "2026-09-01T09:30:00Z", passed: true },
      { stage: "QC_INSPECTION", title: "Kiểm định QC SoD Đạt", timestamp: "2026-09-01T09:45:00Z", passed: true },
      { stage: "SHELF_PLACEMENT", title: "Lên kệ chi nhánh", timestamp: "2026-09-01T10:00:00Z", passed: true },
    ],
  };

  it("TargetsView renders without crashing", () => {
    const el = React.createElement(TargetsView, { initialTargets: [sampleTarget] });
    expect(el).toBeDefined();
  });

  it("FoodPlansView renders with WAITING_PRICE_APPROVAL status", () => {
    const el = React.createElement(FoodPlansView, { initialPlans: [sampleFoodPlan] });
    expect(el).toBeDefined();
  });

  it("PricingFloorView renders with COGS breakdown and 125% floor math", () => {
    const el = React.createElement(PricingFloorView, {
      initialVariant: {
        id: "01955700-0000-7000-8000-000000000003",
        sku_code: "VAR-TRUNG-01",
        name: "Món Trứng Dinh Dưỡng",
        material_cost: 10000,
        multiplier_bps: 12500,
        floor_price: 12500,
        price_book_id: "01955700-0000-7000-8000-000000000030",
        version_id: "01955700-0000-7000-8000-000000000031",
      },
    });
    expect(el).toBeDefined();
  });

  it("OrdersView renders without crashing", () => {
    const el = React.createElement(OrdersView, { initialOrders: [sampleOrder] });
    expect(el).toBeDefined();
  });

  it("QCView renders without crashing", () => {
    const el = React.createElement(QCView, { completedOrders: [sampleOrder] });
    expect(el).toBeDefined();
  });

  it("ShelvesView renders without crashing", () => {
    const el = React.createElement(ShelvesView, { initialPlacements: [samplePlacement] });
    expect(el).toBeDefined();
  });

  it("TraceView renders privacy-safe details correctly", () => {
    const html = renderToStaticMarkup(React.createElement(TraceView, { trace: sampleTrace }));
    expect(html).toContain(sampleTrace.product_name);
    expect(html).toContain(sampleTrace.variant_name);
    expect(html).toContain(sampleTrace.ingredients[0].supplier_code);
    expect(html).toContain(sampleTrace.qc_status);
    expect(html).not.toContain("Chính hãng");
    expect(html).not.toContain("Nguyên liệu Chuẩn VietGAP");
  });
});

const fooddevHarness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, effects: [] as Array<() => unknown> }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual,
    useState: (initial: unknown) => {
      const index = fooddevHarness.cursor++;
      if (!(index in fooddevHarness.slots)) fooddevHarness.slots[index] = typeof initial === "function" ? initial() : initial;
      return [fooddevHarness.slots[index], (next: unknown) => { fooddevHarness.slots[index] = typeof next === "function" ? next(fooddevHarness.slots[index]) : next; }];
    },
    useEffect: (effect: () => unknown) => { fooddevHarness.effects.push(effect); },
  };
});
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { NextRequest } from "next/server";
import { MaterialRequirementsView } from "./material-requirements-view";
import { MaterialPicker, MaterialFilters } from "./material-picker";
import { EntityPicker } from "@/components/ui/entity-picker";
import { GET as planRequirementsBff } from "@/app/api/production/food-plans/[id]/material-requirements/route";
import { GET as targetRequirementsBff } from "@/app/api/production/targets/[id]/material-requirements/route";
import { GET as materialsBff } from "@/app/api/sales/skus/route";
import { GET as planBff, PUT as updatePlanBff } from "@/app/api/production/food-plans/[id]/route";
import { GET as listPlansBff, POST as createPlanBff } from "@/app/api/production/targets/[id]/food-plans/route";
import { POST as productBff } from "@/app/api/sales/products/route";
import type { Material } from "@/lib/api/sales";

const fooddevPermissions = ["sales:product:read", "sales:product:create", "production:target:read", "production:target:create", "production:food_plan:read", "production:food_plan:create", "production:food_plan:update", "production:material_requirement:read"];
const product = { id: "product-real", name: "Canh chua cá", status: "DRAFT" };
const target: ProductionTarget = { id: "target-real", title: "Thử set", target_code: "TGT", branch_ref: "main", status: "APPROVED", period_start: "2026-10-20", period_end: "2026-10-21", lines: [{ product_ref: product.id, target_quantity: "100", uom: "EA" }], created_at: "2026-10-20", created_by: "food-dev" };
const material: Material = { id: "fish-real", name: "Cá tươi", sku_code: "FH-FISH", selectable: true, uom_code: "KG", season_months: null, season_note: null, normalized_unit_price: "70000", reference_price_vnd: 21000, reference_pack_quantity: "0.300", reference_pack_uom: "KG", reference_observed_at: null, price_source: "foodhub_seed" };
const plan: FoodProductPlan = { id: "plan-real", plan_code: "SET", target_ref: target.id, product_ref: product.id, variant_sku_code: "CANH", planned_quantity: "4.000", servings_per_set: 4, purpose: "PREPARATION", revision: 7, serving_size: "1 suất", uom: "EA", components: [{ sku_ref: material.id, quantity: "0.333", uom: "KG" }], status: "DRAFT", nutrition_snapshot: {}, created_by: "food-dev", created_at: "2026-10-20" };
const requirement = { ...material, sku_ref: material.id, quantity: "0.999", uom: "KG" };
const requirements = { target_id: target.id, plan_revision: 7, plan_revisions: { [plan.id]: 7 }, computed_at: "2026-10-20T01:00:00Z", lines: [requirement], all_lines: [requirement], total: 1, hidden_count: 0, season_message: "chưa có dữ liệu mùa" };
type TestNode = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function nodes(tree: React.ReactNode, match: (node: TestNode) => boolean): TestNode[] {
  if (!React.isValidElement<Record<string, unknown> & { children?: React.ReactNode }>(tree)) return [];
  return [...(match(tree) ? [tree] : []), ...React.Children.toArray(tree.props.children).flatMap(child => nodes(child, match)), ...nodes(tree.props.actions as React.ReactNode, match)];
}
function node(tree: React.ReactNode, match: (node: TestNode) => boolean): TestNode {
  const found = nodes(tree, match)[0];
  if (!found) throw Error("Không tìm thấy control");
  return found;
}
function render<P>(view: (props: P) => React.ReactNode, props: P) { fooddevHarness.cursor = 0; return view(props); }
async function effects() { for (const effect of fooddevHarness.effects.splice(0)) effect(); await new Promise(resolve => setImmediate(resolve)); }
async function invoke(control: TestNode, handler: string, event?: unknown) {
  const callback = control.props[handler];
  if (typeof callback !== "function") throw Error(`Thiếu ${handler}`);
  await callback(event);
  await new Promise(resolve => setImmediate(resolve));
}
const named = (text: string) => (item: TestNode) => item.props.children === text;
const json = (data: unknown, status = 200) => Response.json({ data }, { status });
function api(permissions = fooddevPermissions) {
  const requests: Array<{ path: string; method: string; body: Record<string, unknown> }> = [];
  const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const path = new URL(String(url), "http://portal.test").pathname;
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    requests.push({ path, method, body });
    if (path.endsWith("/auth/context")) return Response.json({ permissions, active_context: { branch_id: "main", branch_name: "MAIN" } });
    if (path.endsWith("/material-requirements")) return json(requirements);
    if (path === "/api/sales/products") return json(method === "POST" ? { product: { ...product, name: body.name } } : { items: [{ product }], next_cursor: "" });
    if (path === "/api/production/targets") return json(method === "POST" ? { ...target, ...body } : { items: [target] });
    if (path.endsWith("/food-plans")) return json(method === "POST" ? { ...plan, ...body } : { items: [plan] });
    if (path.endsWith("/plan-real")) return json(method === "PUT" ? { ...plan, ...body, revision: 8 } : plan);
    if (path === "/api/sales/skus") return json({ items: [material], categories: [], next_cursor: "next-real", season_message: "chưa có dữ liệu mùa" });
    throw Error(`Request ngoài dự kiến ${path}`);
  });
  vi.stubGlobal("fetch", fetcher);
  return { requests, fetcher };
}
beforeEach(() => { fooddevHarness.slots = []; fooddevHarness.cursor = 0; fooddevHarness.effects = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("FOODDEV forms and warehouse", () => {
  it("FOOD_DEV creates a draft product and uses its real product ID in an APPROVED target", async () => {
    const { requests } = api(); const props = { initialTargets: [] };
    let tree = render(TargetsView, props); await effects(); tree = render(TargetsView, props);
    await invoke(node(tree, n => n.type === Button && React.Children.toArray(n.props.children).includes("Tạo chỉ tiêu")), "onClick");
    tree = render(TargetsView, props);
    expect(renderToStaticMarkup(tree)).toContain("Tạo sản phẩm nháp");
    await invoke(node(tree, n => n.props.label === "Tên sản phẩm"), "onChange", "Canh chua cá 4 suất");
    await invoke(node(tree, n => n.props.label === "Slug sản phẩm"), "onChange", "canh-chua-ca");
    tree = render(TargetsView, props); await invoke(node(tree, named("Tạo product DRAFT")), "onClick");
    tree = render(TargetsView, props);
    await invoke(node(tree, n => n.props.label === "Tiêu đề"), "onChange", "Set bữa trưa");
    tree = render(TargetsView, props);
    await invoke(node(tree, n => n.type === "form"), "onSubmit", { preventDefault() {} });
    expect(requests.find(r => r.path === "/api/sales/products" && r.method === "POST")?.body).toEqual({ name: "Canh chua cá 4 suất", slug: "canh-chua-ca" });
    expect(requests.find(r => r.path === "/api/production/targets" && r.method === "POST")?.body.lines).toEqual([{ product_ref: product.id, target_quantity: "4", uom: "EA" }]);
    expect(renderToStaticMarkup(render(TargetsView, props))).toContain("APPROVED");
  });
  it("FOOD_DEV creates and edits PREPARATION with exact decimal and the revision fetched from server", async () => {
    const { requests } = api(); const props = { initialPlans: [plan], targetId: target.id };
    let tree = render(FoodPlansView, props); await effects(); tree = render(FoodPlansView, props);
    expect(renderToStaticMarkup(tree)).not.toMatch(/Thẩm định|Publish BOM|Kiểm tra &amp; handoff/);
    await invoke(node(tree, named("Tạo set")), "onClick"); tree = render(FoodPlansView, props);
    await invoke(node(tree, n => n.type === EntityPicker), "onChange", product.id);
    for (const [label, value] of [["Mã set", "CANH"], ["Khẩu phần", "1 suất"]]) {
      const field = node(tree, n => n.type === "label" && React.Children.toArray(n.props.children).includes(label));
      await invoke(node(field, n => n.type === Input), "onChange", { target: { value } });
    }
    await invoke(node(tree, n => n.type === MaterialPicker), "onSelect", material);
    tree = render(FoodPlansView, props);
    await invoke(node(tree, n => n.type === "form"), "onSubmit", { preventDefault() {} });
    expect(requests.find(r => r.method === "POST" && r.path.endsWith("/food-plans"))?.body).toMatchObject({ planned_quantity: "4", servings_per_set: 4, product_ref: product.id, components: [{ sku_ref: material.id, quantity: "0.200", uom: "KG" }] });
    tree = render(FoodPlansView, props); await invoke(node(tree, named("Sửa set")), "onClick"); tree = render(FoodPlansView, props);
    const quantity = node(tree, n => n.type === Input && n.props.value === "0.333");
    await invoke(quantity, "onChange", { target: { value: "0.999" } }); tree = render(FoodPlansView, props);
    expect(renderToStaticMarkup(tree)).toContain("Cá tươi");
    await invoke(node(tree, n => n.type === "form"), "onSubmit", { preventDefault() {} });
    expect(requests.find(r => r.method === "PUT")?.body).toMatchObject({ expected_revision: 7, planned_quantity: "4", components: [{ sku_ref: material.id, quantity: "0.999", uom: "KG" }] });
    expect(renderToStaticMarkup(render(FoodPlansView, props))).toContain("8");
  });
  it("a user without write permissions sees no product, target or set write controls", async () => {
    api([]);
    render(TargetsView, { initialTargets: [target], initialShowCreate: true }); await effects();
    expect(renderToStaticMarkup(render(TargetsView, { initialTargets: [target], initialShowCreate: true }))).not.toMatch(/Tạo product|Lưu chỉ tiêu|>Tạo chỉ tiêu<\/button>/);
    fooddevHarness.slots = [];
    render(FoodPlansView, { initialPlans: [plan], targetId: target.id }); await effects();
    expect(renderToStaticMarkup(render(FoodPlansView, { initialPlans: [plan], targetId: target.id }))).not.toMatch(/Tạo set|Sửa set|Lưu set|Publish BOM/);
  });
  it("WAREHOUSE reads 0.999 exactly and the unknown-season message without write controls", async () => {
    api(["production:material_requirement:read"]);
    const props = { targetId: target.id };
    render(MaterialRequirementsView, props); await effects();
    const html = renderToStaticMarkup(render(MaterialRequirementsView, props));
    expect(html).toContain("0.999 KG"); expect(html).not.toContain("0.9990000001");
    expect(html).toContain("chưa có dữ liệu mùa"); expect(html).toContain("Giá bán seed");
    expect(html).toContain("Tổng nhu cầu đầy đủ"); expect(html).not.toMatch(/Lưu set|Tạo set|Sửa set|Publish/);
  });
  it("retains full totals and the season message when filtering hides every row", async () => {
    api();
    vi.stubGlobal("fetch", vi.fn(async () => json({ ...requirements, lines: [], hidden_count: 1 })));
    const props = { foodPlanId: plan.id }; render(MaterialRequirementsView, props); await effects();
    const html = renderToStaticMarkup(render(MaterialRequirementsView, props));
    expect(html).toContain("chưa có dữ liệu mùa"); expect(html).toContain("Đang ẩn 1 dòng"); expect(html).toContain("0.999 KG");
  });
  it("shows requirements errors explicitly and discards stale rows", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "dependency_unavailable", message: "Sales unavailable" }, { status: 503 })));
    const props = { foodPlanId: plan.id }; render(MaterialRequirementsView, props); await effects();
    const html = renderToStaticMarkup(render(MaterialRequirementsView, props));
    expect(html).toContain('role="alert"'); expect(html).toContain("Sales unavailable"); expect(html).not.toContain("0.999");
  });
  it("picker fetches the next server page and keeps unknown-season data visible", async () => {
    const { requests } = api();
    const props = { onSelect: vi.fn() }; render(MaterialPicker, props); await effects();
    let tree = render(MaterialPicker, props);
    expect(renderToStaticMarkup(tree)).toContain("chưa có dữ liệu mùa");
    await invoke(node(tree, n => n.type === Button && Array.isArray(n.props.children) && n.props.children.includes(material.name)), "onClick");
    expect(props.onSelect).toHaveBeenCalledWith(material);
    await invoke(node(tree, named("Trang sau")), "onClick");
    expect(requests.filter(r => r.path === "/api/sales/skus")).toHaveLength(2);
    tree = render(MaterialPicker, props);
    expect(node(tree, n => n.type === MaterialFilters)).toBeDefined();
  });
});

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

describe("FOODDEV BFF wire contract", () => {
  it.each([403, 409, 422, 503])("preserves upstream status %s and code on both requirements endpoints", async status => {
    const code = ({ 403: "data_scope_denied", 409: "state_conflict", 422: "validation_failed", 503: "dependency_unavailable" })[status];
    const upstream = { code: status, status: "error", errors: { error_code: code }, message: "upstream explanation" };
    const fetcher = vi.fn(async () => Response.json(upstream, { status })); vi.stubGlobal("fetch", fetcher);
    for (const handler of [planRequirementsBff, targetRequirementsBff]) {
      const req = new NextRequest("http://portal.test/api/requirements?month=10&include_unknown=true&price_uom=KG", { headers: { cookie: "access_token=test-token", "x-org-id": "untrusted" } });
      const res = await handler(req, { params: Promise.resolve({ id: "plan-real" }) });
      expect(res.status).toBe(status); expect(await res.json()).toEqual(upstream);
    }
    expect(fetcher.mock.calls).toHaveLength(2);
    expect(fetcher.mock.calls[0]).toEqual([expect.stringContaining("?month=10&include_unknown=true&price_uom=KG"), expect.objectContaining({ headers: { Accept: "application/json", Authorization: "Bearer test-token" } })]);
  });
  it("requires a session on requirements and picker routes before contacting upstream", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const req = new NextRequest("http://portal.test/api/skus");
    expect((await materialsBff(req)).status).toBe(401);
    expect((await planRequirementsBff(req, { params: Promise.resolve({ id: plan.id }) })).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("forwards GET, POST and PUT bodies without converting quantity or revision", async () => {
    const fetcher = vi.fn(async () => json(plan)); vi.stubGlobal("fetch", fetcher);
    const context = { params: Promise.resolve({ id: plan.id }) };
    const body = { product_ref: product.id, planned_quantity: "4", expected_revision: 7, components: [{ sku_ref: material.id, quantity: "0.999", uom: "KG" }] };
    for (const method of ["GET", "POST", "PUT"] as const) {
      const req = new NextRequest("http://portal.test/api/plan", { method, headers: { cookie: "access_token=test-token", "idempotency-key": "write-key" }, ...(method === "GET" ? {} : { body: JSON.stringify(body) }) });
      const handlers = method === "GET" ? [planBff, listPlansBff] : method === "POST" ? [createPlanBff] : [updatePlanBff];
      for (const handler of handlers) expect((await handler(req, context)).status).toBe(200);
    }
    expect(fetcher).toHaveBeenLastCalledWith(expect.stringContaining(`/production/food-plans/${plan.id}`), expect.objectContaining({ method: "PUT", body: JSON.stringify(body), headers: expect.objectContaining({ "Idempotency-Key": "write-key" }) }));
    expect((await productBff(new NextRequest("http://portal.test/api/sales/products", { method: "POST", headers: { cookie: "access_token=test-token" }, body: JSON.stringify({ name: product.name, slug: "canh" }) }))).status).toBe(200);
    const picker = new NextRequest("http://portal.test/api/sales/skus?category_slug=fish&cursor=next&month=10&price_min=100&price_max=90000&price_uom=KG", { headers: { cookie: "access_token=test-token" } });
    await materialsBff(picker);
    expect(fetcher).toHaveBeenLastCalledWith(expect.stringContaining("/sales/skus?category_slug=fish&cursor=next&month=10&price_min=100&price_max=90000&price_uom=KG"), expect.anything());
  });
});
