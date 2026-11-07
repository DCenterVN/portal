import { expect, it } from "vitest";
import { oneRole, realRoles, thirtyRoles, twoRoles } from "@/mocks/role-catalog";
import { keepFitting, roleOptionsFor } from "./role-catalog";

const codes = (options: { code: string }[]) => options.map((option) => option.code);

it("shows every role at the kitchen and only SALES and WAREHOUSE at a store", () => {
  expect(codes(roleOptionsFor(realRoles, "CENTRAL_KITCHEN"))).toEqual(["ADMIN", "FOOD_DEV", "PROCESSING_STAFF", "SALES", "WAREHOUSE"]);
  expect(codes(roleOptionsFor(realRoles, "STORE"))).toEqual(["SALES", "WAREHOUSE"]);
});

it("offers nothing until the branch type is known, and keeps held roles so they can be removed", () => {
  expect(roleOptionsFor(realRoles, undefined)).toEqual([]);
  expect(codes(roleOptionsFor(realRoles, "STORE", ["FOOD_DEV"]))).toEqual(["FOOD_DEV", "SALES", "WAREHOUSE"]);
});

it("carries the Vietnamese name from the catalog and a job line only for known roles", () => {
  const [sales] = roleOptionsFor(oneRole, "STORE");
  expect(sales).toMatchObject({ code: "SALES", name: "Bán hàng" });
  expect(sales.job).toContain("bảng giá");
  expect(roleOptionsFor(thirtyRoles, "STORE")[0].job).toBeUndefined();
});

it("handles 1, 2 and 30 roles", () => {
  expect(roleOptionsFor(oneRole, "STORE")).toHaveLength(1);
  expect(roleOptionsFor(twoRoles, "STORE")).toHaveLength(2);
  expect(roleOptionsFor(thirtyRoles, "CENTRAL_KITCHEN")).toHaveLength(30);
});

it("drops selected roles that do not fit the new branch type", () => {
  expect(keepFitting(realRoles, "STORE", ["FOOD_DEV", "SALES", "WAREHOUSE"])).toEqual(["SALES", "WAREHOUSE"]);
  expect(keepFitting(realRoles, "CENTRAL_KITCHEN", ["FOOD_DEV", "SALES"])).toEqual(["FOOD_DEV", "SALES"]);
  expect(keepFitting(realRoles, "STORE", ["UNKNOWN"])).toEqual([]);
});
