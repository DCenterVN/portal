import { describe, it, expect } from "vitest";
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
