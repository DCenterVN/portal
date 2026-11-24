import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { AccessProvider } from "@/lib/access-boundary";
import { RetryableError } from "@/lib/api/production-http";
import { failOrder, planProductionFromSet, type FoodProductPlan, type ProductionOrder, type ProductionTarget } from "@/lib/api/production";
import { POST as sellableVariantBff } from "@/app/api/production/sets/[id]/sellable-variant/route";
import { POST as productionPlanBff } from "@/app/api/production/targets/[id]/production-plans/route";
import { POST as failureBff } from "@/app/api/production/orders/[id]/failure/route";
import { FoodPlansTable } from "./food-plans-table";
import type { FoodPlansState } from "./use-food-plans";
import { TargetsView } from "./targets-view";
import { OrdersView } from "./orders-view";

vi.mock("@/hooks/use-paged-list", () => ({ usePagedList: (_load: unknown, _key: string, items: unknown[]) => ({ items, setItems: vi.fn(), loading: false, error: "", reload: vi.fn(), hasNext: false, hasPrevious: false, next: vi.fn(), previous: vi.fn() }) }));

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks(); });

const set = { id: "set-1", updated_at: "2026-11-12T01:02:03Z" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const calls = () => vi.mocked(global.fetch).mock.calls.map(([url, init]) => ({ url: String(url), body: JSON.parse(String(init?.body ?? "null")) }));

describe("từ chỉ tiêu tới kế hoạch sản xuất", () => {
  it("gọi sellable-variant rồi production-plans nối tiếp với đúng thân yêu cầu", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(json(200, { data: { product_ref: "p", sku_ref: "sku-9", bom_ref: "b", bom_version: 1, cost_snapshot_ref: "c" } }))
      .mockResolvedValueOnce(json(201, { data: { id: "plan-1", plan_code: "PP-1" } }));
    const plan = await planProductionFromSet("target-1", set, 4, 40);
    expect(plan.plan_code).toBe("PP-1");
    expect(calls()).toEqual([
      { url: expect.stringContaining("/api/production/sets/set-1/sellable-variant"), body: { expected_updated_at: set.updated_at, portion_count: 4 } },
      { url: expect.stringContaining("/api/production/targets/target-1/production-plans"), body: { serving_sku_ref: "sku-9", set_ref: "set-1", source_revision: set.updated_at, planned_quantity: 40 } },
    ]);
  });

  it("hiện đúng lời server khi 409 price_not_active và không tạo kế hoạch khi bước đầu hỏng", async () => {
    global.fetch = vi.fn().mockResolvedValue(json(409, { code: "price_not_active", message: "Biến thể chưa có giá đang hiệu lực" }));
    await expect(planProductionFromSet("t", set, 4, 40)).rejects.toThrow("Biến thể chưa có giá đang hiệu lực");
    expect(calls()).toHaveLength(1);
  });

  it("503 báo bán hàng đang lỗi và cho thử lại", async () => {
    global.fetch = vi.fn().mockResolvedValue(json(503, { error: "dependency_unavailable" }));
    const error = await planProductionFromSet("t", set, 4, 40).catch(e => e);
    expect(error).toBeInstanceOf(RetryableError);
    expect(error.message).toBe("Bán hàng đang lỗi, thử lại sau");
  });
});

describe("hỏng mẻ", () => {
  it("gửi lý do tới /failure và hiện lời server khi bị từ chối", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(json(200, { data: { id: "o1", status: "FAILED" } })).mockResolvedValueOnce(json(409, { message: "Lệnh đã nấu xong, không báo hỏng được" }));
    await failOrder("o1", "Cháy nồi");
    expect(calls()[0]).toEqual({ url: expect.stringContaining("/api/production/orders/o1/failure"), body: { failure_reason: "Cháy nồi" } });
    await expect(failOrder("o1", "x")).rejects.toThrow("Lệnh đã nấu xong, không báo hỏng được");
  });
});

describe("route trung gian mới", () => {
  const request = (path: string) => new NextRequest(`http://localhost:3000${path}`, { method: "POST", headers: { cookie: "access_token=jwt", "content-type": "application/json" }, body: "{}" });
  it.each([
    ["sellable-variant", sellableVariantBff, "/api/production/sets/s1/sellable-variant", "/production/sets/s1/sellable-variant"],
    ["production-plans", productionPlanBff, "/api/production/targets/s1/production-plans", "/production/targets/s1/production-plans"],
    ["failure", failureBff, "/api/production/orders/s1/failure", "/production/orders/s1/failure"],
  ] as const)("chuyển tiếp %s", async (_name, handler, path, upstream) => {
    global.fetch = vi.fn().mockResolvedValue(json(200, { data: {} }));
    const response = await handler(request(path), { params: Promise.resolve({ id: "s1" }) });
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(upstream), expect.objectContaining({ method: "POST" }));
  });
});

const scope = { userId: "nguoi-lap", orgId: "o", branchId: "b", branchName: "Chi nhánh", roles: [] };
const withAccess = (actions: string[], child: React.ReactNode) => React.createElement(AccessProvider, { value: { plane: "company", root: "", actions: new Set(actions), scope }, children: child });
const target = (status: ProductionTarget["status"], created_by = "nguoi-khac"): ProductionTarget => ({ id: `t-${status}`, target_code: `TGT-${status}`, branch_ref: "b", period_start: "2026-11-01", period_end: "2026-11-30", title: "Chỉ tiêu", status, lines: [], created_by, created_at: "2026-11-01" });

describe("bảng chỉ tiêu", () => {
  const html = (targets: ProductionTarget[], actions = ["production:target:create", "production:target_approval:create"]) =>
    renderToStaticMarkup(withAccess(actions, React.createElement(TargetsView, { initialTargets: targets })));
  it("hiện Nháp bằng chữ Việt, Duyệt cho người khác và ẩn với chính người lập", () => {
    expect(html([target("DRAFT")])).toMatch(/Nháp[\s\S]*Duyệt/);
    const own = html([target("DRAFT", "nguoi-lap")]);
    expect(own).toContain("Nháp");
    expect(own).not.toContain(">Duyệt<");
    expect(own).toContain("Thao tác cho TGT-DRAFT");
  });
  it("nút Tạo kế hoạch theo trạng thái", () => {
    expect(html([target("APPROVED")])).toContain(">Tạo kế hoạch<");
    expect(html([target("IN_PLANNING")])).toContain(">Tạo kế hoạch<");
    expect(html([target("HANDED_OFF")])).toContain(">Tạo kế hoạch thay thế<");
    expect(html([target("IN_PRODUCTION")])).toContain(">Tạo kế hoạch thay thế<");
    const done = html([target("COMPLETED")]);
    expect(done).not.toContain("Tạo kế hoạch");
    expect(done).not.toContain("Tạo set");
    expect(html([target("DRAFT")])).not.toContain("Tạo kế hoạch");
  });
});

describe("bảng kế hoạch", () => {
  const plan = (status: FoodProductPlan["status"]) => ({ id: status, plan_code: status, target_ref: "t", product_ref: "p", variant_sku_code: "CANH", planned_quantity: 40, purpose: "PRODUCTION", uom: "EA", serving_size: "4 người", components: [], status, nutrition_snapshot: {}, created_by: "u", created_at: "" }) as FoodProductPlan;
  const html = (status: FoodProductPlan["status"]) => renderToStaticMarkup(React.createElement(FoodPlansTable, { s: { plans: [plan(status)], busy: false, can: () => true, canUpdate: true, canCreate: true, products: [], ready: true, error: "" } as unknown as FoodPlansState }));
  it.each([
    ["DRAFT", "Nháp", "Thẩm định"], ["REVIEWED", "Đã thẩm định", "Công bố"], ["WAITING_PRICE_APPROVAL", "Chờ duyệt giá", "Kiểm tra giá và bàn giao"],
  ] as const)("%s có nút đúng", (status, label, button) => {
    const out = html(status);
    expect(out).toContain(label);
    expect(out).toContain(`>${button}<`);
  });
  it("đã công bố thì xem lệnh, không còn nút bước", () => {
    const out = html("PUBLISHED");
    expect(out).toContain("Xem lệnh sản xuất");
    expect(out).not.toMatch(/Thẩm định|>Công bố<|Kiểm tra giá/);
  });
});

describe("màn lệnh sản xuất", () => {
  const order = (status: ProductionOrder["status"]): ProductionOrder => ({ id: status, order_code: `PO-${status}`, source_plan_ref: "p", target_ref: "t", branch_ref: "b", output_sku_ref: "s", bom_ref: "b", planned_quantity: 4, actual_output_quantity: 0, uom: "EA", status, created_at: "" });
  const html = (status: ProductionOrder["status"]) => renderToStaticMarkup(withAccess(["production:order:update"], React.createElement(OrdersView, { initialOrders: [order(status)] })));
  it.each(["HANDED_OFF", "ACCEPTED", "SCHEDULED", "ALLOCATED", "IN_PROGRESS"] as const)("%s có nút Hỏng mẻ", status => expect(html(status)).toContain("Hỏng mẻ</button>"));
  it.each(["COMPLETED", "QC_PASSED", "FAILED"] as const)("%s không có nút Hỏng mẻ", status => expect(html(status)).not.toContain("Hỏng mẻ</button>"));
});
