import { afterEach, describe, expect, it, vi } from "vitest";
import { FetchError } from "@/lib/fetcher";
import { materialNutritionFormSchema, nutritionDefaults } from "@/lib/nutrition";
import { getMaterialNutrition, materialNutritionRequest, nutritionErrorMessage } from "./material-nutrition";

const envelope = (data: unknown) => Response.json({ code: 200, status: "success", message: "Success", data });

afterEach(() => vi.unstubAllGlobals());
describe("material nutrition API", () => {
  it("reads and replaces material facts through authenticated BFF", async () => {
    const input = nutritionDefaults();
    input.nutrients.kcal = { value: "20.0", source: { dataset: "VN2007", food_code: "4005", url: "https://example.com/table" } };
    const facts = materialNutritionFormSchema.parse(input);
    const fetch = vi.fn().mockResolvedValueOnce(envelope({ items: [{ id: "material", nutrition_facts: facts }], next_cursor: null })).mockResolvedValueOnce(envelope({ nutrition_facts: facts }));
    vi.stubGlobal("fetch", fetch);
    expect(await getMaterialNutrition("material", "Cà chua")).toEqual(facts);
    expect(await materialNutritionRequest("material", facts)).toEqual(facts);
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/sales/skus");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ kind: "RAW_MATERIAL", q: "Cà chua", include_unknown: "true" });
    expect(fetch.mock.calls[1][1]).toMatchObject({ method: "PATCH", body: JSON.stringify(facts) });
  });
  it("distinguishes null nutrition from a failed list request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(envelope({ items: [{ id: "material", nutrition_facts: null }] })).mockResolvedValueOnce(Response.json({ error: "resource_not_found" }, { status: 404 })));
    expect(await getMaterialNutrition("material", "Cà chua")).toBeNull();
    await expect(getMaterialNutrition("material", "Cà chua")).rejects.toMatchObject({ status: 404 });
  });
  it("matches the exact id across pages instead of taking another material's facts", async () => {
    const facts = materialNutritionFormSchema.parse(nutritionDefaults());
    const fetch = vi.fn().mockResolvedValueOnce(envelope({ items: [{ id: "other", nutrition_facts: null }], next_cursor: "other" })).mockResolvedValueOnce(envelope({ items: [{ id: "material", nutrition_facts: facts }] }));
    vi.stubGlobal("fetch", fetch);
    expect(await getMaterialNutrition("material", "Cà chua")).toEqual(facts);
    expect(new URL(String(fetch.mock.calls[1][0])).searchParams.get("cursor")).toBe("other");
  });
  it("does not treat a missing material or absent facts as empty nutrition", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(envelope({ items: [{ id: "other", nutrition_facts: null }] })).mockResolvedValueOnce(envelope({ items: [{ id: "material" }] })));
    await expect(getMaterialNutrition("material", "Cà chua")).rejects.toMatchObject({ status: 404 });
    await expect(getMaterialNutrition("material", "Cà chua")).rejects.toThrow();
  });
  it.each([
    [403, "data_scope_denied", "chưa có quyền"], [422, "validation_failed", "Kiểm tra các ô"],
    [409, "state_conflict", "người khác sửa"], [503, "UNAVAILABLE", "tạm bận"],
    [404, "resource_not_found", "chọn lại"],
  ])("maps %s/%s to actionable Vietnamese", (status, error, expected) => {
    expect(nutritionErrorMessage(new FetchError("raw", Number(status), { error }))).toContain(expected);
  });
  it("reads the platform error code from errors.error_code", () => {
    expect(nutritionErrorMessage(new FetchError("raw", 400, { errors: { error_code: "validation_failed" } }))).toContain("Kiểm tra các ô");
  });
});
