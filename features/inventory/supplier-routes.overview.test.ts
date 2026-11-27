import { existsSync } from "node:fs";
import { expect, it } from "vitest";
import { supplierHref } from "./supplier-routes";

it("đường tổng quan là trang riêng, đứng trước hồ sơ theo mã", () => {
  expect(existsSync("app/(console)/inventory/suppliers/overview/page.tsx")).toBe(true);
  expect(supplierHref.overview).toBe("/inventory/suppliers/overview");
  expect(supplierHref.filtered("ACTIVE")).toBe("/inventory/suppliers?f.status=ACTIVE");
});
