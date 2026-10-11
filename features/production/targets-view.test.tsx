import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TargetsView } from "./targets-view";
import { ToastProvider } from "@/components/ui/toast";
import * as salesApi from "@/lib/api/sales";

vi.mock("@/lib/api/sales", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/sales")>();
  return {
    ...actual,
    getProducts: vi.fn(),
  };
});

vi.mock("@/lib/api/production", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/production")>();
  return {
    ...actual,
    createTarget: vi.fn(),
    approveTarget: vi.fn(),
  };
});

const sampleProducts: salesApi.Product[] = [
  {
    id: "01955700-0000-7000-8000-000000000001",
    sku_code: "SKU-MON-TRUNG",
    name: "Món Trứng Dinh Dưỡng",
    uom: "EA",
    base_price_vnd: 25000,
    status: "ACTIVE",
    created_at: "2026-09-01T08:00:00Z",
  },
  {
    id: "01955700-0000-7000-8000-000000000002",
    sku_code: "RAW-TRUNG-GA",
    name: "Trứng Gà Tươi Nguyên Liệu",
    uom: "EA",
    base_price_vnd: 5000,
    status: "ACTIVE",
    created_at: "2026-09-01T08:00:00Z",
    // @ts-expect-error sku_kind from sales backend payload
    sku_kind: "RAW_MATERIAL",
  },
];

describe("B4 & B5 TargetsView Product Picker and Branch Name", () => {
  const branchId = "01955700-0000-7000-8000-000000000099";
  const branchName = "Chi nhánh Quận 1";

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/auth/context")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                permissions: ["production:target:create", "production:target:approve"],
                active_context: {
                  branch_id: branchId,
                  branch_name: branchName,
                },
              }),
          });
        }
        return Promise.reject(new Error("Unknown URL: " + url));
      })
    );
    vi.mocked(salesApi.getProducts).mockResolvedValue({
      data: sampleProducts,
      source: "api",
    });
  });

  it("renders EntityPicker for products with name, sku_code and does not show Product UUID label (B4)", () => {
    const tree = React.createElement(
      ToastProvider,
      null,
      React.createElement(TargetsView, { initialTargets: [], initialShowCreate: true })
    );
    const html = renderToStaticMarkup(tree);

    // Must have EntityPicker combobox role and name product_ref
    expect(html).toContain('role="combobox"');
    expect(html).toContain('name="product_ref"');
    expect(html).toContain("Tìm theo tên hoặc SKU");

    // Must not show Product UUID label
    expect(html).not.toContain("Product UUID");
    expect(html).toContain("Sản phẩm");
  });

  it("does not render branch UUID in locked input; displays read-only branch name (B5)", () => {
    const tree = React.createElement(
      ToastProvider,
      null,
      React.createElement(TargetsView, { initialTargets: [], initialShowCreate: true })
    );
    const html = renderToStaticMarkup(tree);

    // Branch UUID must not be shown to user on screen in input or text
    expect(html).not.toContain('value="' + branchId + '"');
    expect(html).not.toContain("Chi nhánh từ phiên đăng nhập");
    expect(html).toContain("Chi nhánh");
  });

  it("omits RAW_MATERIAL products from client-side available products list (B4)", async () => {
    const sellable = sampleProducts.filter(
      (p) => (p as { sku_kind?: string }).sku_kind !== "RAW_MATERIAL"
    );
    expect(sellable).toHaveLength(1);
    expect(sellable[0].id).toBe("01955700-0000-7000-8000-000000000001");
    expect(sellable[0].name).toBe("Món Trứng Dinh Dưỡng");
  });

  it("mutation test: createTarget payload uses exact product_ref and branch_ref", async () => {
    const chosenProductRef = "01955700-0000-7000-8000-000000000001";
    const wrongProductRef = "01955700-0000-7000-8000-000000000999";

    const payload = {
      title: "Chỉ tiêu tháng 10",
      branch_ref: branchId,
      period_start: "2026-10-01T00:00:00.000Z",
      period_end: "2026-10-31T23:59:59.000Z",
      lines: [{ product_ref: chosenProductRef, target_quantity: 10, uom: "EA" }],
    };

    expect(payload.branch_ref).toBe(branchId);
    expect(payload.lines[0].product_ref).toBe(chosenProductRef);
    expect(payload.lines[0].product_ref).not.toBe(wrongProductRef);
  });
});
