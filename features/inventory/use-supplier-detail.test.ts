import { beforeEach, expect, it, vi } from "vitest";
import { supplier, supplierID } from "@/mocks/supplier-contract";

const hooks = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0 }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual, useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], (next: unknown) => { hooks.values[index] = typeof next === "function" ? (next as (value: unknown) => unknown)(hooks.values[index]) : next; }];
  }, useEffect: () => undefined };
});
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => true }) }));
vi.mock("@/components/ui/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/suppliers", async original => ({ ...await original<typeof import("@/lib/api/suppliers")>(), suspendSupplier: vi.fn() }));
import { toast } from "@/components/ui/toast";
import { suspendSupplier } from "@/lib/api/suppliers";
import { useSupplierDetail } from "./use-supplier-detail";

const render = (status: "ACTIVE" | "SUSPENDED") => { hooks.cursor = 0; return useSupplierDetail({ supplierId: supplierID, initialSupplier: { ...supplier, status } }); };
beforeEach(() => { hooks.values = []; vi.mocked(toast.success).mockReset(); vi.mocked(toast.error).mockReset(); vi.mocked(suspendSupplier).mockReset(); });

it("ngừng hợp tác thành công thì báo đúng việc và tên", async () => {
  vi.mocked(suspendSupplier).mockResolvedValue({ ...supplier, status: "SUSPENDED" });
  render("ACTIVE").setReasonCode("QUALITY");
  await render("ACTIVE").change();
  expect(toast.success).toHaveBeenCalledWith("Đã ngừng hợp tác với Gạo An Bình");
});
it("hợp tác lại thành công thì báo đúng việc và tên", async () => {
  vi.mocked(suspendSupplier).mockResolvedValue(supplier);
  render("SUSPENDED").setReason("Đã khắc phục");
  await render("SUSPENDED").change();
  expect(toast.success).toHaveBeenCalledWith("Đã hợp tác lại với Gạo An Bình");
});
it("lỗi khi hộp thoại còn mở chỉ hiện trong hộp thoại, không báo thêm", async () => {
  vi.mocked(suspendSupplier).mockRejectedValue(new Error("x"));
  render("SUSPENDED").setReason("Đã khắc phục");
  await render("SUSPENDED").change();
  expect(render("SUSPENDED").statusError).not.toBe(""); expect(toast.error).not.toHaveBeenCalled(); expect(toast.success).not.toHaveBeenCalled();
});
