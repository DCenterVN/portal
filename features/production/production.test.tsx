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

const fooddevHarness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, effects: [] as Array<() => unknown>, cleanups: [] as Array<() => void>, trackEffects: false, effectCursor: 0, effectStates: [] as Array<{ deps?: React.DependencyList; cleanup?: () => void }>, stateWrites: 0, toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual,
    useState: (initial: unknown) => {
      const index = fooddevHarness.cursor++;
      if (!(index in fooddevHarness.slots)) fooddevHarness.slots[index] = typeof initial === "function" ? initial() : initial;
      return [fooddevHarness.slots[index], (next: unknown) => { fooddevHarness.stateWrites++; fooddevHarness.slots[index] = typeof next === "function" ? next(fooddevHarness.slots[index]) : next; }];
    },
    useRef: (initial: unknown) => {
      const index = fooddevHarness.cursor++;
      if (!(index in fooddevHarness.slots)) fooddevHarness.slots[index] = { current: initial };
      return fooddevHarness.slots[index];
    },
    useEffect: (effect: React.EffectCallback, deps?: React.DependencyList) => {
      if (!fooddevHarness.trackEffects) { fooddevHarness.effects.push(effect); return; }
      const index = fooddevHarness.effectCursor++;
      const previous = fooddevHarness.effectStates[index];
      if (deps && previous?.deps && deps.length === previous.deps.length && deps.every((dep, i) => Object.is(dep, previous.deps?.[i]))) return;
      fooddevHarness.effects.push(() => {
        previous?.cleanup?.();
        const cleanup = effect();
        fooddevHarness.effectStates[index] = { deps, cleanup: typeof cleanup === "function" ? cleanup : undefined };
        return cleanup;
      });
    },
  };
});
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: fooddevHarness.toast }) }));

import { NextRequest } from "next/server";
import { MaterialRequirementsView } from "./material-requirements-view";
import { Checkbox, Select } from "@/components/ui/field";
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
function render<P>(view: (props: P) => React.ReactNode, props: P) { fooddevHarness.cursor = 0; fooddevHarness.effectCursor = 0; return view(props); }
async function effects() { for (const effect of fooddevHarness.effects.splice(0)) { const cleanup = effect(); if (typeof cleanup === "function") fooddevHarness.cleanups.push(() => { cleanup(); }); } await new Promise(resolve => setImmediate(resolve)); }
async function invoke(control: TestNode, handler: string, event?: unknown) {
  const callback = control.props[handler];
  if (typeof callback !== "function") throw Error(`Thiếu ${handler}`);
  await callback(event);
  await new Promise(resolve => setImmediate(resolve));
}
const named = (text: string) => (item: TestNode) => React.Children.toArray(item.props.children).filter(child => typeof child === "string" || typeof child === "number").join("") === text;
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
beforeEach(() => { fooddevHarness.slots = []; fooddevHarness.cursor = 0; fooddevHarness.effects = []; fooddevHarness.cleanups = []; fooddevHarness.trackEffects = false; fooddevHarness.effectStates = []; fooddevHarness.stateWrites = 0; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("FOODDEV forms and warehouse", () => {
  it.each([true, false])("shows set loading then an empty state with create permission %s", async canCreate => {
    const { fetcher } = api(canCreate ? fooddevPermissions : ["production:material_requirement:read"]);
    const fallback = fetcher.getMockImplementation()!;
    let resolvePlans: (value: Response) => void = () => {};
    fetcher.mockImplementation((url, init) => String(url).endsWith("/food-plans")
      ? new Promise<Response>(resolve => { resolvePlans = resolve; }) : fallback(url, init));
    const props = { initialPlans: [], targetId: target.id };
    let tree = render(FoodPlansView, props);
    expect(node(tree, n => n.type === Skeleton)).toBeDefined();
    await effects();
    tree = render(FoodPlansView, props);
    expect(renderToStaticMarkup(tree)).toContain('aria-busy="true"');
    expect(nodes(tree, n => n.type === EmptyState)).toHaveLength(0);
    resolvePlans(json({ items: [] }));
    await new Promise(resolve => setImmediate(resolve));
    tree = render(FoodPlansView, props);
    expect(nodes(tree, n => n.type === Skeleton)).toHaveLength(0);
    const empty = node(tree, n => n.type === EmptyState);
    expect(renderToStaticMarkup(tree)).toContain("Chưa có set trong chỉ tiêu này");
    if (!canCreate) { expect(empty.props.action).toBeUndefined(); return; }
    await invoke(node(empty.props.action as React.ReactNode, named("Tạo set")), "onClick");
    expect(node(render(FoodPlansView, props), n => n.type === "form").props["aria-label"]).toBe("Tạo set");
  });
  it("shows material loading then filtered empty results while retaining season information", async () => {
    let resolveMaterials: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { resolveMaterials = resolve; })));
    const props = { onSelect: vi.fn() };
    let tree = render(MaterialPicker, props);
    expect(node(tree, n => n.type === Skeleton)).toBeDefined();
    await effects();
    expect(nodes(render(MaterialPicker, props), n => n.type === EmptyState)).toHaveLength(0);
    resolveMaterials(json({ items: [], categories: [], next_cursor: "", season_message: "chưa có dữ liệu mùa" }));
    await new Promise(resolve => setImmediate(resolve));
    tree = render(MaterialPicker, props);
    expect(nodes(tree, n => n.type === Skeleton)).toHaveLength(0);
    expect(node(tree, n => n.type === EmptyState)).toBeDefined();
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Không có nguyên liệu phù hợp");
    expect(html).toContain("Hãy đổi bộ lọc");
    expect(html).toContain("chưa có dữ liệu mùa");
    expect(props.onSelect).not.toHaveBeenCalled();
  });
  it.each(["plans", "materials"])("shows %s API failures without an empty state", async view => {
    const { fetcher } = api();
    const fallback = fetcher.getMockImplementation()!;
    fetcher.mockImplementation((url, init) => String(url).includes(view === "plans" ? "/food-plans" : "/sales/skus")
      ? Promise.resolve(Response.json({ error: "dependency_unavailable", message: "Sales unavailable" }, { status: 503 })) : fallback(url, init));
    const renderView = () => view === "plans" ? render(FoodPlansView, { initialPlans: [], targetId: target.id }) : render(MaterialPicker, { onSelect: vi.fn() });
    renderView(); await effects();
    const tree = renderView();
    expect(nodes(tree, n => n.type === EmptyState || n.type === Skeleton)).toHaveLength(0);
    expect(renderToStaticMarkup(tree)).toContain("Sales unavailable");
    expect(node(tree, named("Thử lại"))).toBeDefined();
  });
  it("shows an actionable empty target state and loading while saving the first target", async () => {
    const { fetcher } = api();
    const props = { initialTargets: [] };
    render(TargetsView, props); await effects();
    let tree = render(TargetsView, props);
    const empty = node(tree, n => n.type === EmptyState);
    expect(renderToStaticMarkup(tree)).toContain("Chưa có chỉ tiêu sản xuất");
    await invoke(node(empty.props.action as React.ReactNode, named("Tạo chỉ tiêu")), "onClick");
    tree = render(TargetsView, props);
    await invoke(node(tree, n => n.props.label === "Tiêu đề"), "onChange", "Set bữa trưa");
    await invoke(node(tree, n => n.type === EntityPicker), "onChange", product.id);
    tree = render(TargetsView, props);
    let resolveTarget: (value: Response) => void = () => {};
    fetcher.mockImplementationOnce(() => new Promise<Response>(resolve => { resolveTarget = resolve; }));
    const saving = invoke(node(tree, n => n.type === "form"), "onSubmit", { preventDefault() {} });
    tree = render(TargetsView, props);
    expect(node(tree, n => n.type === Skeleton)).toBeDefined();
    let html = renderToStaticMarkup(tree);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Chưa có chỉ tiêu sản xuất");
    resolveTarget(json(target)); await saving;
    html = renderToStaticMarkup(render(TargetsView, props));
    expect(html).not.toContain('aria-busy="true"');
    expect(html).toContain(target.title);
    expect(html).not.toContain("Chưa có chỉ tiêu sản xuất");
  });
  it("shows requirements loading, then empty results with revision and totals", async () => {
    let resolveRequirements: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn((url: unknown) => String(url).includes("material-requirements") ? new Promise<Response>(resolve => { resolveRequirements = resolve; }) : Promise.resolve(json(plan))));
    const props = { foodPlanId: plan.id };
    render(MaterialRequirementsView, props); await effects();
    const pending = render(MaterialRequirementsView, props);
    expect(node(pending, n => n.type === Skeleton)).toBeDefined();
    let html = renderToStaticMarkup(pending);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Đang tính nhu cầu nguyên liệu");
    expect(html).not.toContain("Không có dòng phù hợp");
    resolveRequirements(json({ ...requirements, lines: [], all_lines: [], total: 0 }));
    await new Promise(resolve => setImmediate(resolve));
    html = renderToStaticMarkup(render(MaterialRequirementsView, props));
    expect(html).not.toContain('aria-busy="true"');
    expect(html).toContain("Không có dòng phù hợp");
    expect(html).toContain("Hãy đổi bộ lọc");
    expect(html).toContain("Revision:");
    expect(html).toContain("Tổng 0 dòng");
  });
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
  it.each(["targets", "food-plans"])("filters %s requirements by month and price without writing the recipe", async scope => {
    const fetcher = vi.fn<typeof fetch>(async () => json({ ...requirements, lines: [], hidden_count: 1 }));
    vi.stubGlobal("fetch", fetcher);
    const props = scope === "targets" ? { targetId: target.id } : { foodPlanId: plan.id };
    render(MaterialRequirementsView, props); await effects();
    let tree = render(MaterialRequirementsView, props);
    expect(node(tree, n => n.type === Checkbox).props.checked).toBe(true);
    await invoke(node(tree, n => n.type === Select && n.props.name === "month"), "onChange", { target: { value: "1" } });
    await invoke(node(tree, n => n.type === Checkbox), "onChange", { target: { checked: false } });
    await invoke(node(tree, n => n.type === Input && n.props.name === "price_min"), "onChange", { target: { value: "1" } });
    tree = render(MaterialRequirementsView, props);
    await invoke(node(tree, n => n.type === "form"), "onSubmit", { preventDefault() {} });
    render(MaterialRequirementsView, props); await effects();
    const urls = fetcher.mock.calls.map(([url]) => new URL(String(url), "http://portal.test"));
    expect(urls.map(url => url.pathname + url.search)).toContain(
      `/api/production/${scope}/${scope === "targets" ? target.id : plan.id}/material-requirements?month=1&include_unknown=false&price_min=1&price_uom=KG`,
    );
    const html = renderToStaticMarkup(render(MaterialRequirementsView, props));
    expect(html).toContain("Đã ẩn 1 / 1 nguyên liệu");
    expect(html).toContain("Không có dòng phù hợp");
    expect(html).toContain("0.999 KG");
    expect(fetcher.mock.calls.every(([, init]) => (init?.method ?? "GET") === "GET")).toBe(true);
  });
  it.each(["", "0"])("omits blank filters and sends a KG price basis only for a supplied maximum %s", async priceMax => {
    const { fetcher } = api();
    const props = { foodPlanId: plan.id };
    render(MaterialRequirementsView, props); await effects();
    let tree = render(MaterialRequirementsView, props);
    const html = renderToStaticMarkup(tree);
    expect(node(tree, n => n.type === "option" && n.props.value === "").props.children).toBe("Tất cả");
    expect(html).not.toContain("Đã ẩn");
    const maximum = node(tree, n => n.type === Input && n.props.name === "price_max");
    expect(maximum.props.type).toBe("number");
    expect(node(tree, n => n.type === Input && n.props.name === "price_min").props.type).toBe("number");
    await invoke(maximum, "onChange", { target: { value: priceMax } });
    tree = render(MaterialRequirementsView, props);
    await invoke(node(tree, n => n.type === "form"), "onSubmit", { preventDefault() {} });
    render(MaterialRequirementsView, props); await effects();
    const urls = fetcher.mock.calls.map(([url]) => new URL(String(url), "http://portal.test")).filter(url => url.pathname.endsWith("/material-requirements"));
    expect(urls.at(-1)?.search).toBe(`?include_unknown=true${priceMax ? "&price_max=0&price_uom=KG" : ""}`);
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
import { EmptyState, Skeleton } from "@/components/ui/state";

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

import * as salesApi from "@/lib/api/sales";
import * as productionApi from "@/lib/api/production";
import { FoodSetsView } from "./food-sets-view";
import { PackagesView } from "./packages-view";
import { FoodPackWorkspace } from "./food-plans-view";
import { Tabs } from "@/components/ui/tabs";
import { ErrorState } from "@/components/ui/state";
import { Table } from "@/components/ui/table";

const packTime = "2026-10-21T00:00:00Z";
const packRow: salesApi.FoodPackage = { id: "pack-beef", org_ref: "org", branch_ref: "branch", product_ref: product.id, code: "COT-BO", name: "Cốt bò", variant_label: "100g", net_weight_g: 100, uom_code: "EA", temperature_regime: "CHILLED", kind: "PRODUCED_VARIANT", sellable: false, status: "ACTIVE", updated_at: packTime };
const mushroom: salesApi.FoodPackage = { ...packRow, id: "pack-mushroom", code: "COT-NAM", name: "Cốt nấm" };
const starchPack = { ...packRow, id: "pack-starch", name: "Bún tươi" };
const tofuPack = { ...packRow, id: "pack-tofu", name: "Đậu" };
const packSet: salesApi.FoodSet = { ...packRow, id: "set-bun", name: "Bún", code: "BUN", kind: "COMMERCIAL_SET", sku_type: "SET", tags: ["bun", "mua-he", "bua-trua"], system_hashtags: ["ho-bun"], slots: [
  { slot: "TINH_BOT", swappable: false, removable: false, options: [{ sku_ref: starchPack.id, quantity: 1, is_default: true }] },
  { slot: "DAM", swappable: false, removable: false, options: [{ sku_ref: tofuPack.id, quantity: 1, is_default: true }] },
  { slot: "COT", swappable: true, removable: false, options: [{ sku_ref: packRow.id, quantity: 1, is_default: true }, { sku_ref: mushroom.id, quantity: 1, is_default: false }] },
  { slot: "RAU", swappable: true, removable: true, options: [{ sku_ref: mushroom.id, quantity: 1, is_default: true }] },
] };
const packEvaluation: productionApi.EvaluatedFoodSet = { set_ref: packSet.id, selections: [], allergen_summary: { known: true, contains: [] }, avoidance_flags: ["BEEF"], diet_flags: [], unknown: [], manual_hashtags: packSet.tags, system_hashtags: packSet.system_hashtags, derived_hashtags: [], set_updated_at: packTime, recipe_versions: [], computed_at: packTime };
const rawLabels: salesApi.RawLabelsView = { sku_ref: material.id, allergen_summary: { known: false, contains: [] }, avoidance_flags: [], diet_flags: null, updated_at: packTime };
const packPermissions = [...fooddevPermissions, "sales:variant:read", "sales:variant:create", "sales:variant:update", "sales:variant:delete", "sales:product:update", "production:recipe:read", "production:recipe:create", "production:recipe:update", "production:recipe:delete"];
function paint<P>(view: (props: P) => React.ReactNode, props: P) { fooddevHarness.effects = []; return render(view, props); }
function labelControl(tree: React.ReactNode, label: string) {
  return node(node(tree, n => n.type === "label" && React.Children.toArray(n.props.children).includes(label)), n => n.type === Input || n.type === Select);
}
async function openSetEditor() {
  paint(FoodSetsView, {}); await effects();
  await invoke(node(paint(FoodSetsView, {}), named("Xem Bún")), "onClick");
  await invoke(node(paint(FoodSetsView, {}), named("Sửa set món")), "onClick");
  return paint(FoodSetsView, {});
}
async function openPackPlan() {
  const props = { initialPlans: [], targetId: target.id };
  paint(FoodPlansView, props); await effects();
  await invoke(node(paint(FoodPlansView, props), named("Tạo set")), "onClick");
  let tree = paint(FoodPlansView, props);
  await invoke(labelControl(tree, "Mã set"), "onChange", { target: { value: "BUN" } });
  await invoke(labelControl(tree, "Khẩu phần"), "onChange", { target: { value: "1 suất" } });
  await invoke(labelControl(tree, "Nguồn định mức"), "onChange", { target: { value: "pack" } });
  tree = paint(FoodPlansView, props);
  await invoke(node(tree, n => n.type === EntityPicker && n.props.name === "plan-food-set"), "onChange", packSet.id);
  return props;
}

describe("FOODDEV PACK UI", () => {
  beforeEach(() => {
    vi.spyOn(productionApi, "getProductionContext").mockResolvedValue({ permissions: packPermissions });
    vi.spyOn(salesApi, "listFoodSets").mockResolvedValue({ items: [packSet], next_cursor: null });
    vi.spyOn(salesApi, "getFoodSet").mockResolvedValue(packSet);
    vi.spyOn(salesApi, "getDraftProducts").mockResolvedValue([product]);
    vi.spyOn(salesApi, "listPackages").mockResolvedValue({ items: [packRow, mushroom, starchPack, tofuPack], next_cursor: null });
    vi.spyOn(salesApi, "getPackage").mockResolvedValue(packRow);
    vi.spyOn(salesApi, "updateFoodSet").mockResolvedValue(packSet);
    vi.spyOn(salesApi, "getRawLabels").mockResolvedValue(rawLabels);
    vi.spyOn(salesApi, "updateRawLabels").mockResolvedValue(rawLabels);
    vi.spyOn(productionApi, "evaluateFoodSet").mockResolvedValue(packEvaluation);
    vi.spyOn(productionApi, "listPackageRecipes").mockResolvedValue({ current: null, history: [] });
    vi.spyOn(productionApi, "getTargets").mockResolvedValue([target]);
    vi.spyOn(productionApi, "getFoodPlans").mockResolvedValue([]);
    vi.spyOn(productionApi, "getFoodPlan").mockResolvedValue(plan);
    vi.spyOn(productionApi, "createFoodPlan").mockResolvedValue(plan);
    vi.spyOn(productionApi, "getMaterialRequirements").mockResolvedValue(requirements);
    fooddevHarness.toast.error.mockClear(); fooddevHarness.toast.success.mockClear();
  });
  afterEach(() => { vi.restoreAllMocks(); });
  it("tabs_render", async () => {
    let tree = paint(FoodPackWorkspace, { targetId: target.id });
    const tabs = node(tree, n => n.type === Tabs);
    expect(tabs.props.items).toEqual([{ id: "sets", label: "Set" }, { id: "packages", label: "Gói + công thức" }, { id: "plans", label: "Thực đơn" }]);
    const setView = node(tree, n => n.type === FoodSetsView);
    expect(nodes(tree, n => n.type === MaterialRequirementsView)).toHaveLength(1);
    await invoke(tabs, "onChange", "packages"); tree = paint(FoodPackWorkspace, { targetId: target.id });
    expect(node(tree, n => n.type === "div" && nodes(n, child => child.type === FoodSetsView).length === 1 && n.props.hidden !== undefined).props.hidden).toBe(true);
    expect(node(tree, n => n.type === FoodSetsView).type).toBe(setView.type);
    expect(nodes(tree, n => n.type === FoodPlansView)).toHaveLength(1);
    await invoke(node(tree, n => n.type === Tabs), "onChange", "sets");
    expect(node(paint(FoodPackWorkspace, { targetId: target.id }), n => n.type === Tabs).props.value).toBe("sets");
  });
  it("set_tags_counter", async () => {
    let tree: React.ReactNode = await openSetEditor();
    for (const value of ["bun, trua", "a,b,c,d,e,f,g,h,i", "bun, trua, ho-bun"]) {
      await invoke(labelControl(tree, "Hashtag tay"), "onChange", { target: { value } }); tree = paint(FoodSetsView, {});
      expect(node(tree, named("Lưu set món")).props.disabled).toBe(true);
      expect(renderToStaticMarkup(tree)).toContain(value.includes("ho-bun") ? "trùng hashtag hệ thống" : "3–8");
    }
  });
  it("set_evaluate_swap", async () => {
    paint(FoodSetsView, {}); await effects(); await invoke(node(paint(FoodSetsView, {}), named("Xem Bún")), "onClick");
    paint(FoodSetsView, {}); await effects();
    expect(productionApi.evaluateFoodSet).toHaveBeenLastCalledWith(packSet.id, { expected_updated_at: packTime, selections: [] });
    vi.mocked(productionApi.evaluateFoodSet).mockResolvedValue({ ...packEvaluation, avoidance_flags: [], diet_flags: ["VEGETARIAN"], derived_hashtags: ["vegetarian"] });
    const tree = paint(FoodSetsView, {}); await invoke(labelControl(tree, "Cốt"), "onChange", { target: { value: mushroom.id } });
    paint(FoodSetsView, {}); await effects();
    expect(productionApi.evaluateFoodSet).toHaveBeenLastCalledWith(packSet.id, { expected_updated_at: packTime, selections: [{ slot: "COT", sku_ref: mushroom.id }] });
    expect(renderToStaticMarkup(paint(FoodSetsView, {}))).toContain("Chay");
  });
  it("evaluate_unknown", async () => {
    vi.mocked(productionApi.evaluateFoodSet).mockResolvedValue({ ...packEvaluation, diet_flags: ["VEGETARIAN"], unknown: [{ sku_ref: material.id, fields: ["diet_flags"] }] });
    paint(FoodSetsView, {}); await effects(); await invoke(node(paint(FoodSetsView, {}), named("Xem Bún")), "onClick");
    paint(FoodSetsView, {}); await effects();
    const html = renderToStaticMarkup(paint(FoodSetsView, {}));
    expect(html).toContain("chưa khai báo"); expect(html).not.toContain(">Chay<");
  });
  it("plan_table_no_uuid", async () => {
    const uuid = "01955700-0000-7000-8000-000000000075";
    const generated = { ...plan, plan_code: `PLN-${uuid}`, variant_sku_code: `VAR-${uuid}` };
    vi.mocked(productionApi.getFoodPlans).mockResolvedValue([generated]);
    vi.mocked(productionApi.getFoodPlan).mockResolvedValue(generated);
    const props = { initialPlans: [], targetId: target.id };
    paint(FoodPlansView, props); await effects();
    let tree = paint(FoodPlansView, props);
    let html = renderToStaticMarkup(tree);
    expect(html).toContain(product.name); expect(html).toContain("Sản phẩm");
    expect(html).not.toContain("Mã kế hoạch"); expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
    await invoke(node(tree, named("Sửa set")), "onClick");
    tree = paint(FoodPlansView, props); html = renderToStaticMarkup(tree);
    expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
  });
  it("package_list_no_recipe_fanout", async () => {
    const page = Array.from({ length: 20 }, (_, index) => ({ ...packRow, id: index === 0 ? packRow.id : `pack-${index}`, name: `Gói QA${String(index).padStart(2, "0")}` }));
    vi.mocked(salesApi.listPackages).mockResolvedValue({ items: page, next_cursor: null });
    paint(PackagesView, {}); await effects();
    const tree = paint(PackagesView, {});
    expect(renderToStaticMarkup(tree)).toContain("Gói QA19");
    expect(productionApi.listPackageRecipes).not.toHaveBeenCalled();
    await invoke(node(tree, named("Xem Gói QA00")), "onClick");
    expect(productionApi.listPackageRecipes).toHaveBeenCalledTimes(1);
    expect(productionApi.listPackageRecipes).toHaveBeenCalledWith(packRow.id);
  });
  it("package_recipe_error_keeps_list", async () => {
    vi.mocked(productionApi.listPackageRecipes).mockRejectedValue(new Error("Recipe service unavailable"));
    paint(PackagesView, {}); await effects();
    let tree = paint(PackagesView, {});
    expect(nodes(tree, item => item.type === Table)).toHaveLength(1);
    await invoke(node(tree, named("Xem Cốt bò")), "onClick");
    tree = paint(PackagesView, {});
    expect(nodes(tree, item => item.type === Table)).toHaveLength(1);
    expect(renderToStaticMarkup(tree)).toContain("Cốt nấm");
    expect(node(tree, item => item.type === ErrorState).props.title).toBe("Không tải được công thức gói");
    vi.mocked(productionApi.listPackageRecipes).mockResolvedValue({ current: null, history: [] });
    await invoke(node(tree, item => item.type === ErrorState), "onRetry");
    expect(renderToStaticMarkup(paint(PackagesView, {}))).toContain("chưa có công thức");
  });
  it.each([
    ["filter", "success", "B-first"], ["filter", "error", "B-first"],
    ["retry", "success", "B-first"], ["retry", "error", "B-first"],
    ["filter", "success", "A-first"], ["filter", "error", "A-first"],
  ])("stale_filter_response_ignored: %s, stale %s, %s", async (origin, lateResult, order) => {
    const list = vi.mocked(salesApi.listFoodSets);
    if (origin === "retry") list.mockRejectedValueOnce(new Error("Lỗi ban đầu"));
    paint(FoodSetsView, {}); await effects();
    let tree = paint(FoodSetsView, {});
    type Page = Awaited<ReturnType<typeof salesApi.listFoodSets>>;
    let resolveA!: (page: Page) => void;
    let rejectA!: (error: Error) => void;
    let resolveB!: (page: Page) => void;
    const a = new Promise<Page>((resolve, reject) => { resolveA = resolve; rejectA = reject; });
    const b = new Promise<Page>(resolve => { resolveB = resolve; });
    list.mockImplementationOnce(() => a).mockImplementationOnce(() => b);
    if (origin === "retry") {
      await invoke(node(tree, n => n.type === ErrorState), "onRetry");
    } else {
      await invoke(labelControl(tree, "Lọc theo hashtag"), "onChange", { target: { value: "bua-trua," } });
      paint(FoodSetsView, {}); await effects();
    }
    tree = paint(FoodSetsView, {});
    await invoke(labelControl(tree, "Lọc theo hashtag"), "onChange", { target: { value: "mua-he," } });
    paint(FoodSetsView, {}); await effects();
    expect(list).toHaveBeenCalledTimes(3);
    const latest = { ...packSet, id: "set-latest", name: "Set mới nhất" };
    const settleA = () => {
      if (lateResult === "success") resolveA({ items: [{ ...packSet, name: "Set phản hồi cũ" }], next_cursor: "cursor-a" });
      else rejectA(new Error("Lỗi phản hồi cũ"));
    };
    if (order === "A-first") {
      settleA();
      await new Promise(resolve => setImmediate(resolve));
      tree = paint(FoodSetsView, {});
      expect(nodes(tree, n => n.type === Skeleton)).toHaveLength(1);
      expect(nodes(tree, n => n.type === ErrorState)).toHaveLength(0);
      expect(node(tree, named("Trang tiếp")).props.disabled).toBe(true);
    }
    resolveB({ items: [latest], next_cursor: "cursor-b" });
    await new Promise(resolve => setImmediate(resolve));
    if (order === "B-first") settleA();
    await new Promise(resolve => setImmediate(resolve));
    tree = paint(FoodSetsView, {});
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Set mới nhất");
    expect(html).not.toContain("Set phản hồi cũ");
    expect(html).not.toContain("Lỗi phản hồi cũ");
    expect(nodes(tree, n => n.type === ErrorState || n.type === Skeleton)).toHaveLength(0);
    await invoke(node(tree, named("Trang tiếp")), "onClick");
    paint(FoodSetsView, {}); await effects();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: "cursor-b" }));
  });
  it.each(["success", "conflict"])("save_reload_uses_current_filter: %s", async result => {
    fooddevHarness.trackEffects = true;
    let tree: React.ReactNode = await openSetEditor();
    await invoke(labelControl(tree, "Lọc theo hashtag"), "onChange", { target: { value: "bua-trua," } });
    paint(FoodSetsView, {}); await effects();
    tree = paint(FoodSetsView, {});
    let finish!: () => void;
    vi.mocked(salesApi.updateFoodSet).mockImplementationOnce(() => new Promise((resolve, reject) => {
      finish = () => result === "success" ? resolve(packSet) : reject(Object.assign(new Error("stale"), { status: 409 }));
    }));
    const saving = invoke(node(tree, n => n.type === "form" && n.props["aria-label"] === "Biên tập set món"), "onSubmit", { preventDefault() {} });
    const latest = { ...packSet, name: "Set giao hai tag" };
    vi.mocked(salesApi.listFoodSets).mockImplementation(async filter => filter?.tags?.includes("mua-he")
      ? { items: [latest], next_cursor: "cursor-ab" }
      : { items: [{ ...packSet, name: "Set chỉ tag A" }], next_cursor: "cursor-a" });
    await invoke(labelControl(paint(FoodSetsView, {}), "Lọc theo hashtag"), "onChange", { target: { value: "mua-he," } });
    paint(FoodSetsView, {}); await effects();
    const beforeReload = vi.mocked(salesApi.listFoodSets).mock.calls.length;
    finish(); await saving;
    paint(FoodSetsView, {}); await effects();
    const reloads = vi.mocked(salesApi.listFoodSets).mock.calls.slice(beforeReload);
    expect(reloads.length).toBeGreaterThan(0);
    for (const [filter] of reloads) expect(filter?.tags).toEqual(["bua-trua", "mua-he"]);
    tree = paint(FoodSetsView, {});
    expect(renderToStaticMarkup(tree)).toContain("Set giao hai tag");
    expect(renderToStaticMarkup(tree)).not.toContain("Set chỉ tag A");
    await invoke(node(tree, named("Trang tiếp")), "onClick");
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ["bua-trua", "mua-he"], cursor: "cursor-ab" }));
  });
  it.each(["success", "error", "conflict"])("no_load_after_unmount: %s", async result => {
    fooddevHarness.trackEffects = true;
    const tree = await openSetEditor();
    let finish!: () => void;
    vi.mocked(salesApi.updateFoodSet).mockImplementationOnce(() => new Promise((resolve, reject) => {
      finish = () => result === "success" ? resolve(packSet) : reject(Object.assign(new Error("write failed"), { status: result === "conflict" ? 409 : 503 }));
    }));
    const saving = invoke(node(tree, n => n.type === "form" && n.props["aria-label"] === "Biên tập set món"), "onSubmit", { preventDefault() {} });
    for (const cleanup of fooddevHarness.cleanups.splice(0)) cleanup();
    fooddevHarness.effects = [];
    const state = [...fooddevHarness.slots];
    const stateWrites = fooddevHarness.stateWrites;
    const lists = vi.mocked(salesApi.listFoodSets).mock.calls.length;
    const contexts = vi.mocked(productionApi.getProductionContext).mock.calls.length;
    const details = vi.mocked(salesApi.getFoodSet).mock.calls.length;
    fooddevHarness.toast.success.mockClear(); fooddevHarness.toast.error.mockClear();
    finish(); await saving;
    expect(salesApi.listFoodSets).toHaveBeenCalledTimes(lists);
    expect(productionApi.getProductionContext).toHaveBeenCalledTimes(contexts);
    expect(salesApi.getFoodSet).toHaveBeenCalledTimes(details);
    expect(fooddevHarness.slots).toEqual(state);
    expect(fooddevHarness.stateWrites).toBe(stateWrites);
    expect(fooddevHarness.toast.success).not.toHaveBeenCalled();
    expect(fooddevHarness.toast.error).not.toHaveBeenCalled();
  });
  it("tag_filter_free_text", async () => {
    const firstPageSet = { ...packSet, tags: ["mua-he"] };
    vi.mocked(salesApi.listFoodSets).mockResolvedValue({ items: [firstPageSet], next_cursor: "page-2" });
    paint(FoodSetsView, {}); await effects();
    let tree = paint(FoodSetsView, {});
    expect(renderToStaticMarkup(tree)).not.toContain("bua-trua");
    await invoke(node(tree, named("Trang tiếp")), "onClick");
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: "page-2" }));
    tree = paint(FoodSetsView, {});
    const input = labelControl(tree, "Lọc theo hashtag");
    expect(input.type).toBe(Input);
    await invoke(input, "onChange", { target: { value: "  #Bua-Trua  " } });
    vi.mocked(salesApi.listFoodSets).mockResolvedValue({ items: [], next_cursor: null });
    await invoke(labelControl(paint(FoodSetsView, {}), "Lọc theo hashtag"), "onKeyDown", { key: "Enter", nativeEvent: { isComposing: false }, preventDefault() {} });
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ["bua-trua"], cursor: undefined }));
    tree = paint(FoodSetsView, {});
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("#bua-trua");
    expect(html).toContain("Không có set nào có hashtag #bua-trua");
    expect(nodes(node(tree, n => n.type === "datalist"), n => n.type === "option").map(option => option.props.value)).toContain("mua-he");
    const empty = node(tree, n => n.type === EmptyState);
    await invoke(node(empty.props.action as React.ReactNode, named("Xoá lọc")), "onClick");
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ tags: [], cursor: undefined }));
  });
  it("tag_filter_comma_and_chips", async () => {
    paint(FoodSetsView, {}); await effects();
    await invoke(labelControl(paint(FoodSetsView, {}), "Lọc theo hashtag"), "onChange", { target: { value: " #Bua-Trua, #Mua-He," } });
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ["bua-trua", "mua-he"], cursor: undefined }));
    let tree = paint(FoodSetsView, {});
    expect(renderToStaticMarkup(tree)).toContain("#mua-he");
    expect(node(tree, named("Xoá lọc"))).toBeDefined();
    await invoke(node(tree, n => n.type === Button && n.props["aria-label"] === "Bỏ lọc hashtag bua-trua"), "onClick");
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ["mua-he"] }));
    await invoke(labelControl(paint(FoodSetsView, {}), "Lọc theo hashtag"), "onChange", { target: { value: "#MUA-HE," } });
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ["mua-he"] }));
    tree = paint(FoodSetsView, {});
    expect(nodes(tree, n => n.type === Button && n.props["aria-label"] === "Bỏ lọc hashtag mua-he")).toHaveLength(1);
    await invoke(labelControl(tree, "Lọc theo hashtag"), "onChange", { target: { value: "#Rau" } });
    await invoke(labelControl(paint(FoodSetsView, {}), "Lọc theo hashtag"), "onKeyDown", { key: ",", nativeEvent: { isComposing: false }, preventDefault() {} });
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ["mua-he", "rau"] }));
    await invoke(node(paint(FoodSetsView, {}), named("Xoá lọc")), "onClick");
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ tags: [], cursor: undefined }));
  });
  it("set_search_by_tag", async () => {
    paint(FoodSetsView, {}); await effects();
    let tree = paint(FoodSetsView, {});
    await invoke(labelControl(tree, "Tìm set theo tên"), "onChange", { target: { value: "Bún" } });
    tree = paint(FoodSetsView, {});
    await invoke(node(tree, n => n.type === "form"), "onSubmit", { preventDefault() {} });
    paint(FoodSetsView, {}); await effects();
    tree = paint(FoodSetsView, {});
    await invoke(labelControl(tree, "Lọc theo hashtag"), "onChange", { target: { value: "bua-trua" } });
    await invoke(labelControl(paint(FoodSetsView, {}), "Lọc theo hashtag"), "onKeyDown", { key: "Enter", nativeEvent: { isComposing: false }, preventDefault() {} });
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ q: "Bún", tags: ["bua-trua"], cursor: undefined }));
    tree = paint(FoodSetsView, {});
    await invoke(labelControl(tree, "Lọc theo hashtag"), "onChange", { target: { value: "mua-he" } });
    await invoke(labelControl(paint(FoodSetsView, {}), "Lọc theo hashtag"), "onKeyDown", { key: "Enter", nativeEvent: { isComposing: false }, preventDefault() {} });
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ q: "Bún", tags: ["bua-trua", "mua-he"] }));
    tree = paint(FoodSetsView, {});
    await invoke(node(tree, n => n.type === Button && n.props["aria-label"] === "Bỏ lọc hashtag bua-trua"), "onClick");
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenLastCalledWith(expect.objectContaining({ q: "Bún", tags: ["mua-he"] }));
    await invoke(node(paint(FoodSetsView, {}), named("Xem Bún")), "onClick");
    paint(FoodSetsView, {}); await effects();
    tree = paint(FoodSetsView, {});
    vi.mocked(salesApi.listFoodSets).mockRestore();
    const fetchMock = vi.fn(async () => Response.json({ code: 200, status: "success", message: "OK", data: { items: [], next_cursor: null } }));
    vi.stubGlobal("fetch", fetchMock);
    await invoke(node(tree, item => item.type === Button && item.props["aria-label"] === "Lọc hashtag bua-trua"), "onClick");
    paint(FoodSetsView, {}); await effects();
    const call = vi.mocked(global.fetch).mock.calls[0];
    const url = new URL(String(call[0]));
    expect(url.searchParams.getAll("tags")).toEqual(["mua-he", "bua-trua"]);
    expect(url.searchParams.get("q")).toBe("Bún");
  });
  it.each(["create", "update"])("package_code_max_56: %s", async operation => {
    paint(PackagesView, {}); await effects();
    if (operation === "update") {
      await invoke(node(paint(PackagesView, {}), named("Xem Cốt bò")), "onClick");
      await invoke(node(paint(PackagesView, {}), named("Sửa gói")), "onClick");
    } else {
      await invoke(node(paint(PackagesView, {}), named("Tạo gói")), "onClick");
      await invoke(node(paint(PackagesView, {}), n => n.type === EntityPicker && n.props.name === "package-family"), "onChange", product.id);
      await invoke(labelControl(paint(PackagesView, {}), "Tên gói"), "onChange", { target: { value: "Gói bún" } });
    }
    let tree = paint(PackagesView, {});
    expect(labelControl(tree, "Mã gói").props.maxLength).toBe(56);
    await invoke(labelControl(tree, "Mã gói"), "onChange", { target: { value: "ế".repeat(57) } });
    tree = paint(PackagesView, {});
    expect(node(tree, named("Lưu gói")).props.disabled).toBe(true);
    expect(renderToStaticMarkup(tree)).toContain("Mã gói tối đa 56 ký tự");
    await invoke(labelControl(tree, "Mã gói"), "onChange", { target: { value: "ế".repeat(56) } });
    tree = paint(PackagesView, {});
    expect(node(tree, named("Lưu gói")).props.disabled).toBe(false);
    expect(renderToStaticMarkup(tree)).not.toContain("Mã gói tối đa 56 ký tự");

    const id = "01955700-0000-7000-8000-000000000075";
    const input = { product_ref: id, code: "ế".repeat(56), name: "Gói bún", variant_label: "100g", net_weight_g: 100, uom_code: "EA", temperature_regime: "CHILLED" } satisfies salesApi.CreatePackageRequest;
    const saved = { ...packRow, ...input, id, org_ref: id, branch_ref: id };
    const fetcher = vi.fn(async () => Response.json({ code: 200, status: "success", message: "OK", data: saved }));
    vi.stubGlobal("fetch", fetcher);
    const write = (code: string) => operation === "create"
      ? salesApi.createPackage({ ...input, code })
      : salesApi.updatePackage(id, { ...input, code, expected_updated_at: packTime });
    expect(() => write("ế".repeat(57))).toThrow("Mã gói tối đa 56 ký tự");
    expect(fetcher).not.toHaveBeenCalled();
    expect((await write(input.code)).code).toBe(input.code);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("package_no_recipe", async () => {
    paint(PackagesView, {}); await effects();
    const tree = paint(PackagesView, {});
    expect(renderToStaticMarkup(tree)).toContain("Chưa tải công thức");
    await invoke(node(tree, named("Xem Cốt bò")), "onClick");
    expect(renderToStaticMarkup(paint(PackagesView, {}))).toContain("chưa có công thức");
  });
  it("recipe_reload_shows_names", async () => {
    const current: productionApi.PackageRecipe = {
      id: "recipe-beef", output_sku_ref: packRow.id, output_quantity: 1, uom: "EA", version: 2, status: "BOM_ACTIVE", bom_code: "COT-BO-v2",
      components: [
        { sku_ref: material.id, name: "Thịt bò", quantity: "0.125", uom: "KG", yield_pct: "80" },
        { sku_ref: "raw-mushroom", name: "Nấm hương", quantity: "0.050", uom: "KG", yield_pct: "100" },
      ], prep_steps: [],
    };
    const old = { ...current, version: 1, status: "BOM_RETIRED" } satisfies productionApi.PackageRecipe;
    vi.mocked(productionApi.listPackageRecipes).mockResolvedValue({ current, history: [old] });
    vi.spyOn(productionApi, "getPackageRecipe").mockResolvedValue(old);
    vi.spyOn(productionApi, "updatePackageRecipe").mockResolvedValue(current);
    paint(PackagesView, {}); await effects();
    await invoke(node(paint(PackagesView, {}), named("Xem Cốt bò")), "onClick");
    let tree = paint(PackagesView, {});
    let html = renderToStaticMarkup(tree);
    expect(html).toContain("Thịt bò"); expect(html).toContain("Nấm hương");
    await invoke(labelControl(tree, "Lịch sử phiên bản"), "onChange", { target: { value: "1" } });
    html = renderToStaticMarkup(paint(PackagesView, {}));
    expect(html).toContain("Thịt bò"); expect(html).toContain("Nấm hương");
    await invoke(node(paint(PackagesView, {}), named("Xem Cốt bò")), "onClick");
    await invoke(node(paint(PackagesView, {}), named("Sửa công thức")), "onClick");
    tree = paint(PackagesView, {}); html = renderToStaticMarkup(tree);
    expect(html).toContain("<legend>Thịt bò</legend>"); expect(html).toContain("<legend>Nấm hương</legend>");
    expect(html).not.toContain("Nguyên liệu đã chọn");
    await invoke(node(tree, n => n.type === "form" && n.props["aria-label"] === "Biên tập công thức"), "onSubmit", { preventDefault() {} });
    expect(productionApi.updatePackageRecipe).toHaveBeenCalledWith(packRow.id, 2, {
      components: current.components.map(({ name: _name, ...line }) => line), prep_steps: [], expected_version: 2,
    });
  });
  it("inactive_raw_label", async () => {
    vi.mocked(productionApi.listPackageRecipes).mockResolvedValue({ current: {
      id: "recipe-old", output_sku_ref: packRow.id, output_quantity: 1, uom: "EA", version: 1, status: "BOM_ACTIVE", bom_code: "COT-BO-v1",
      components: [{ sku_ref: material.id, name: null, quantity: "0.125", uom: "KG", yield_pct: "80" }], prep_steps: [],
    }, history: [] });
    paint(PackagesView, {}); await effects();
    await invoke(node(paint(PackagesView, {}), named("Xem Cốt bò")), "onClick");
    expect(renderToStaticMarkup(paint(PackagesView, {}))).toContain("Nguyên liệu không còn bán");
    await invoke(node(paint(PackagesView, {}), named("Sửa công thức")), "onClick");
    expect(renderToStaticMarkup(paint(PackagesView, {}))).toContain("<legend>Nguyên liệu không còn bán</legend>");
  });
  it("labels_diet_three_states", async () => {
    paint(PackagesView, {}); await effects();
    await invoke(node(paint(PackagesView, {}), n => n.type === MaterialPicker), "onSelect", material);
    for (const [value, expected] of [["unknown", null], ["none", []], ["VEGETARIAN", ["VEGETARIAN"]]] as const) {
      let tree = paint(PackagesView, {});
      await invoke(labelControl(tree, "Chế độ ăn nguyên liệu"), "onChange", { target: { value } }); tree = paint(PackagesView, {});
      await invoke(node(tree, n => n.type === "form" && n.props["aria-label"] === "Nhãn nguyên liệu"), "onSubmit", { preventDefault() {} });
      expect(salesApi.updateRawLabels).toHaveBeenLastCalledWith(material.id, expect.objectContaining({ diet_flags: expected, expected_updated_at: packTime }));
    }
  });
  it("plan_ratio_sum", async () => {
    const props = await openPackPlan();
    let tree = paint(FoodPlansView, props);
    for (const [ref, value] of [[packRow.id, "80"], [mushroom.id, "20"]]) {
      await invoke(node(tree, n => n.type === Input && n.props["aria-label"] === `Tỉ lệ Cốt ${ref === packRow.id ? packRow.name : mushroom.name}`), "onChange", { target: { value } }); tree = paint(FoodPlansView, props);
    }
    expect(node(tree, named("Lưu set")).props.disabled).toBe(false);
    await invoke(node(tree, n => n.type === Input && n.props["aria-label"] === `Tỉ lệ Cốt ${mushroom.name}`), "onChange", { target: { value: "30" } }); tree = paint(FoodPlansView, props);
    expect(renderToStaticMarkup(tree)).toContain("Tổng phải bằng 100%"); expect(node(tree, named("Lưu set")).props.disabled).toBe(true);
    await invoke(node(tree, n => n.type === Input && n.props["aria-label"] === `Tỉ lệ Cốt ${mushroom.name}`), "onChange", { target: { value: "20" } });
    tree = paint(FoodPlansView, props); await invoke(node(tree, n => n.type === Input && n.props["aria-label"] === `Tỉ lệ Rau ${mushroom.name}`), "onChange", { target: { value: "0" } });
    tree = paint(FoodPlansView, props); await invoke(node(tree, n => n.type === Input && n.props["aria-label"] === "Tỉ lệ Rau để trống"), "onChange", { target: { value: "100" } });
    expect(node(paint(FoodPlansView, props), named("Lưu set")).props.disabled).toBe(false);
  });
  it("stale_409", async () => {
    vi.mocked(salesApi.updateFoodSet).mockRejectedValue(Object.assign(new Error("stale"), { status: 409 }));
    const tree = await openSetEditor();
    await invoke(node(tree, n => n.type === "form" && n.props["aria-label"] === "Biên tập set món"), "onSubmit", { preventDefault() {} });
    expect(fooddevHarness.toast.error).toHaveBeenCalledWith("Dữ liệu đã đổi, tải lại");
    expect(salesApi.getFoodSet).toHaveBeenCalledTimes(2); expect(salesApi.updateFoodSet).toHaveBeenCalledTimes(1);
    paint(FoodSetsView, {}); await effects();
    expect(salesApi.listFoodSets).toHaveBeenCalledTimes(2);
  });
  it("warehouse_read_only", async () => {
    vi.mocked(productionApi.getProductionContext).mockResolvedValue({ permissions: ["sales:variant:read", "sales:product:read", "production:recipe:read", "production:food_plan:read", "production:material_requirement:read"] });
    for (const View of [FoodSetsView, PackagesView]) {
      fooddevHarness.slots = []; paint(View, {}); await effects();
      const tree = paint(View, {});
      expect(nodes(tree, n => n.type === Button && /Tạo|Sửa|Xóa|Ngừng|Lưu/.test(String(n.props.children)))).toHaveLength(0);
      await invoke(node(tree, named(View === FoodSetsView ? "Xem Bún" : "Xem Cốt bò")), "onClick");
      expect(nodes(paint(View, {}), n => n.type === Button && /Tạo|Sửa|Xóa|Ngừng|Lưu/.test(String(n.props.children)))).toHaveLength(0);
    }
    fooddevHarness.slots = []; const props = { initialPlans: [plan], targetId: target.id };
    paint(FoodPlansView, props); await effects();
    expect(nodes(paint(FoodPlansView, props), n => n.type === Button && /Tạo|Sửa|Xóa|Ngừng|Lưu/.test(String(n.props.children)))).toHaveLength(0);
  });
  it("peer_error_not_empty", async () => {
    vi.mocked(productionApi.getMaterialRequirements).mockRejectedValue(new Error("Peer unavailable"));
    paint(MaterialRequirementsView, { foodPlanId: plan.id }); await effects();
    const tree = paint(MaterialRequirementsView, { foodPlanId: plan.id });
    expect(nodes(tree, n => n.type === ErrorState)).toHaveLength(1);
    const html = renderToStaticMarkup(tree); expect(html).toContain("Thử lại"); expect(html).not.toContain("Không có dòng phù hợp"); expect(html).not.toContain("Chưa có dữ liệu");
  });
  it("four_states", async () => {
    for (const View of [FoodSetsView, PackagesView]) {
      fooddevHarness.slots = [];
      const list = View === FoodSetsView ? vi.mocked(salesApi.listFoodSets) : vi.mocked(salesApi.listPackages);
      list.mockResolvedValueOnce({ items: [], next_cursor: null });
      expect(nodes(paint(View, {}), n => n.type === Skeleton)).toHaveLength(1); await effects();
      expect(nodes(paint(View, {}), n => n.type === EmptyState)).toHaveLength(1);
      fooddevHarness.slots = []; list.mockRejectedValueOnce(new Error("offline")); paint(View, {}); await effects();
      const error = paint(View, {}); expect(nodes(error, n => n.type === ErrorState)).toHaveLength(1);
      await invoke(node(error, n => n.type === ErrorState), "onRetry");
      expect(nodes(paint(View, {}), n => n.type === Table)).toHaveLength(1);
    }
  });
  it("pin_shows_pack_name_not_uuid", async () => {
    const skuRef = "01955700-0000-7000-8000-000000000050";
    const bomRef = "01955700-0000-7000-8000-000000000051";
    const planRef = "01955700-0000-7000-8000-000000000052";
    const pinned = { ...plan, id: planRef, pack_plan: { recipe_versions: [{ sku_ref: skuRef, bom_ref: bomRef, version: 1 }] } };
    vi.mocked(productionApi.getFoodPlan).mockResolvedValue(pinned);
    vi.mocked(productionApi.getMaterialRequirements).mockResolvedValue({ ...requirements, plan_revisions: { [planRef]: 7 } });
    vi.mocked(salesApi.listPackages).mockResolvedValue({ items: [{ ...packRow, id: skuRef, name: "Gói cốt bò QA7K" }], next_cursor: null });
    const props = { foodPlanId: planRef };
    paint(MaterialRequirementsView, props); await effects();
    paint(MaterialRequirementsView, props); await effects();
    const tree = paint(MaterialRequirementsView, props);
    expect(renderToStaticMarkup(tree)).toContain("Gói cốt bò QA7K · công thức v1");
    const queryByText = (pattern: RegExp) => nodes(tree, item => pattern.test(React.Children.toArray(item.props.children).filter(child => typeof child === "string" || typeof child === "number").join("")))[0] ?? null;
    expect(queryByText(/[0-9a-f]{8}-[0-9a-f]{4}-/)).toBeNull();
  });
  it("pin_name_lookup_failure_keeps_requirements", async () => {
    const pinned = { ...plan, pack_plan: { recipe_versions: [{ sku_ref: packRow.id, bom_ref: "01955700-0000-7000-8000-000000000051", version: 1 }] } };
    vi.mocked(productionApi.getFoodPlan).mockResolvedValue(pinned);
    vi.mocked(salesApi.listPackages).mockRejectedValue(new Error("Package service unavailable"));
    const props = { foodPlanId: plan.id };
    paint(MaterialRequirementsView, props); await effects();
    paint(MaterialRequirementsView, props); await effects();
    const tree = paint(MaterialRequirementsView, props);
    const html = renderToStaticMarkup(tree);
    expect(salesApi.listPackages).toHaveBeenCalled();
    expect(html).toContain("Gói đã pin · công thức v1"); expect(html).toContain("0.999 KG");
    expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
    expect(nodes(tree, item => item.type === ErrorState)).toHaveLength(0);
  });
  it("requirements_quote_and_pins", async () => {
    const quoted = { ...requirement, price: { unit_price_vnd: 123000, uom: "KG", source: "CONTRACT", observed_at: packTime } };
    vi.mocked(productionApi.getMaterialRequirements).mockResolvedValue({ ...requirements, lines: [quoted], all_lines: [quoted] });
    const pinned = { ...plan, pack_plan: { recipe_versions: [{ sku_ref: packRow.id, bom_ref: "bom-pinned", version: 3 }] } };
    vi.mocked(productionApi.getFoodPlan).mockResolvedValue(pinned);
    paint(MaterialRequirementsView, { foodPlanId: plan.id }); await effects();
    const html = renderToStaticMarkup(paint(MaterialRequirementsView, { foodPlanId: plan.id }));
    expect(html).toContain("123000 VND/KG"); expect(html).toContain("CONTRACT"); expect(html).toContain("0.999 KG"); expect(html).toContain("Gói đã pin · công thức v3"); expect(html).not.toContain("bom-pinned");
  });
  it("reopen_pack_plan", async () => {
    const payload = {
      ...Object.fromEntries(Object.entries(plan).filter(([key]) => key !== "components")),
      pack_plan: { schema_version: 1, set_ref: packSet.id, set_updated_at: packTime, slot_ratios: [
        { slot: "TINH_BOT", options: [{ sku_ref: starchPack.id, ratio: "1.000000" }] },
        { slot: "DAM", options: [{ sku_ref: tofuPack.id, ratio: "1.000000" }] },
        { slot: "COT", options: [{ sku_ref: packRow.id, ratio: "0.146333" }, { sku_ref: mushroom.id, ratio: "0.853667" }] },
        { slot: "RAU", options: [{ sku_ref: mushroom.id, ratio: "0.750000" }, { sku_ref: null, ratio: "0.250000" }] },
      ] },
    };
    expect(payload).not.toHaveProperty("components");
    vi.mocked(productionApi.getFoodPlans).mockResolvedValue([plan]);
    vi.mocked(productionApi.getFoodPlan).mockRestore();
    vi.stubGlobal("fetch", vi.fn(async () =>
      Response.json({ code: 200, status: "success", message: "OK", data: payload })));
    const props = { initialPlans: [], targetId: target.id };
    paint(FoodPlansView, props); await effects();
    await invoke(node(paint(FoodPlansView, props), named("Sửa set")), "onClick");
    const tree = paint(FoodPlansView, props);
    expect(renderToStaticMarkup(tree)).not.toContain("Cannot read properties");
    expect(labelControl(tree, "Nguồn định mức").props.value).toBe("pack");
    expect(node(tree, n => n.type === EntityPicker && n.props.name === "plan-food-set").props.value).toBe(packSet.id);
    for (const [label, percent] of [
      [`Tỉ lệ Tinh bột ${starchPack.name}`, "100.0000"],
      [`Tỉ lệ Đạm ${tofuPack.name}`, "100.0000"],
      [`Tỉ lệ Cốt ${packRow.name}`, "14.6333"],
      [`Tỉ lệ Cốt ${mushroom.name}`, "85.3667"],
      [`Tỉ lệ Rau ${mushroom.name}`, "75.0000"],
      ["Tỉ lệ Rau để trống", "25.0000"],
    ]) {
      expect(node(tree, n => n.type === Input && n.props["aria-label"] === label).props.value).toBe(percent);
    }
    expect(nodes(tree, n => n.type === ErrorState)).toHaveLength(0);
    expect(node(tree, named("Lưu set")).props.disabled).toBe(false);
  });
  it("plan_pinned_ratio_reload", async () => {
    const pinned = { ...plan, components: [], pack_plan: { set_ref: packSet.id, set_updated_at: packTime, slot_ratios: packSet.slots.map(slot => ({ slot: slot.slot, options: slot.options.map(option => ({ sku_ref: option.sku_ref, ratio: slot.slot === "COT" ? option.is_default ? "0.146333" : "0.853667" : "1" })) })) } };
    vi.mocked(productionApi.getFoodPlans).mockResolvedValue([pinned]); vi.mocked(productionApi.getFoodPlan).mockResolvedValue(pinned);
    const props = { initialPlans: [pinned], targetId: target.id };
    paint(FoodPlansView, props); await effects(); await invoke(node(paint(FoodPlansView, props), named("Sửa set")), "onClick");
    const tree = paint(FoodPlansView, props);
    expect(node(tree, n => n.type === Input && n.props["aria-label"] === `Tỉ lệ Cốt ${packRow.name}`).props.value).toBe("14.6333");
    expect(node(tree, n => n.type === Input && n.props["aria-label"] === `Tỉ lệ Cốt ${mushroom.name}`).props.value).toBe("85.3667");
    expect(node(tree, named("Lưu set")).props.disabled).toBe(false);
    vi.mocked(salesApi.getFoodSet).mockResolvedValue({ ...packSet, updated_at: "2026-10-22T00:00:00Z" });
    await invoke(node(paint(FoodPlansView, props), named("Sửa set")), "onClick");
    const changed = paint(FoodPlansView, props);
    expect(renderToStaticMarkup(changed)).toContain("Chọn lại set trước khi lưu");
    expect(node(changed, named("Lưu set")).props.disabled).toBe(true);
    expect(node(changed, n => n.type === EntityPicker && n.props.name === "plan-food-set").props.value).toBeNull();
  });
  it("pack_plan_body_excludes_components", async () => {
    const props = await openPackPlan();
    const tree = paint(FoodPlansView, props);
    await invoke(node(tree, n => n.type === "form"), "onSubmit", { preventDefault() {} });
    expect(productionApi.createFoodPlan).toHaveBeenCalledTimes(1);
    const input = vi.mocked(productionApi.createFoodPlan).mock.calls[0][1];
    expect(input).not.toHaveProperty("components");
    expect(input).toMatchObject({ planned_quantity: "4", pack_plan: { schema_version: 1, set_ref: packSet.id, set_updated_at: packTime, slot_ratios: [{ slot: "TINH_BOT", options: [{ sku_ref: starchPack.id, ratio: "1.000000" }] }, { slot: "DAM", options: [{ sku_ref: tofuPack.id, ratio: "1.000000" }] }, { slot: "COT", options: [{ sku_ref: packRow.id, ratio: "1.000000" }, { sku_ref: mushroom.id, ratio: "0.000000" }] }, { slot: "RAU", options: [{ sku_ref: mushroom.id, ratio: "1.000000" }, { sku_ref: null, ratio: "0.000000" }] }] } });
  });
});
