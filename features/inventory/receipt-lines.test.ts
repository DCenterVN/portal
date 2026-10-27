import { describe, expect, it } from "vitest";
import { lineAmount, receiptTotal, validQuantity, priceDeviation } from "./receipt-lines";

describe("receipt preview amounts", () => {
 it("totals each line in dong, without summing unlike units", () => {
  expect(receiptTotal([lineAmount(2.5, 25000), lineAmount(1, 10000)])).toBe(72500);
 });
 it("rounds half a dong per line before summing", () => {
  expect(lineAmount(.001, 500)).toBe(1);
  expect(receiptTotal([lineAmount(.001, 500), lineAmount(.001, 500)])).toBe(2);
 });
 it("distinguishes missing price from zero", () => {
  expect(lineAmount(1, undefined)).toBeNull();
  expect(receiptTotal([25000, null])).toBeNull();
  expect(lineAmount(2, 0)).toBe(0);
 });
 it.each([0, -1, NaN, Infinity, .0001, 1.2345])("rejects invalid quantity %s", quantity => {
  expect(validQuantity(quantity)).toBe(false);
  expect(lineAmount(quantity, 1000)).toBeNull();
 });
 it("rejects invalid price and unsafe sum/product", () => {
  for (const price of [-1, NaN, Infinity]) expect(lineAmount(1, price)).toBeNull();
  expect(lineAmount(Number.MAX_SAFE_INTEGER, 100)).toBeNull();
  expect(receiptTotal([Number.MAX_SAFE_INTEGER, 1])).toBeNull();
  expect(receiptTotal([])).toBeNull();
 });
});

it("tính lệch giá tham chiếu, không chia cho giá 0 hoặc thiếu giá", () => {
  expect(priceDeviation(120, 100)).toBe(20);
  expect(priceDeviation(80, 100)).toBe(-20);
  expect(priceDeviation(100, 100)).toBe(0);
  expect(priceDeviation(100, 0)).toBeNull();
  expect(priceDeviation(undefined, 100)).toBeNull();
  expect(lineAmount(2.5, 101)).toBe(253);
});
