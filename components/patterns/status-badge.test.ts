import { describe, expect, it } from "vitest";
import { statusTone } from "./status-badge";

describe("statusTone", () => {
  it.each([
    ["neutral", ["DRAFT", "PLANNED", "NEW", "CANCELLED", "UNKNOWN_CODE"]],
    ["warning", ["PENDING", "CONFIRMED", "IN_PROGRESS", "IN_TRANSIT", "DELIVERING", "PACKED", "AWAITING_PAYMENT", "WAITING_PRICE_APPROVAL", "SUSPENDED"]],
    ["success", ["COMPLETED", "RECEIVED", "DELIVERED", "PUBLISHED", "QC_PASSED", "PASS", "CONSUMED", "ACTIVE"]],
    ["danger", ["FAILED", "QC_FAILED", "REJECTED", "DELIVERY_FAILED", "REVOKED"]],
  ] as const)("maps to %s", (tone, codes) => {
    for (const code of codes) expect(statusTone(code)).toBe(tone);
  });
});
