import { expect, it } from "vitest";
import { realRoles } from "@/mocks/role-catalog";
import type { Branch } from "@/lib/api/branches-client";
import { roleChoices } from "./assignment-row";

const branch = (type: Branch["type"]) => ({ type }) as Branch;
const codes = (options: { code: string }[]) => options.map((option) => option.code);

it("store: only SALES and WAREHOUSE", () => {
  expect(codes(roleChoices(realRoles, branch("STORE"), [], true))).toEqual(["SALES", "WAREHOUSE"]);
});

it("kitchen: every role for an ADMIN viewer, without ADMIN for anyone else", () => {
  expect(codes(roleChoices(realRoles, branch("CENTRAL_KITCHEN"), [], true))).toEqual(["ADMIN", "FOOD_DEV", "PROCESSING_STAFF", "SALES", "WAREHOUSE"]);
  expect(codes(roleChoices(realRoles, branch("CENTRAL_KITCHEN"), [], false))).toEqual(["FOOD_DEV", "PROCESSING_STAFF", "SALES", "WAREHOUSE"]);
});

it("an ADMIN who already holds the role stays visible to a non-admin viewer", () => {
  expect(codes(roleChoices(realRoles, branch("CENTRAL_KITCHEN"), ["ADMIN"], false))).toContain("ADMIN");
});
