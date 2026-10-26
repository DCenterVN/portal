import { afterEach, expect, it, vi } from "vitest";
import { getAgreements, createAgreement, saveAgreementVersion, agreementInput, resolveAgreementPrice } from "./supplier-agreements";
import { agreement, agreementID, envelope, supplierID, materialID } from "@/mocks/supplier-contract";
afterEach(() => vi.unstubAllGlobals());
it("versions chuyển đúng API, If-Match và không tự đổi trạng thái", async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json(envelope(agreement, 201))).mockResolvedValueOnce(Response.json(envelope({ items: [agreement], next_cursor: "" })));
  vi.stubGlobal("fetch", fetch);
  expect((await getAgreements(supplierID)).items).toHaveLength(1);
  await createAgreement(supplierID, agreementInput(agreement, "DRAFT"));
  await saveAgreementVersion(supplierID, agreementID, 1, agreementInput(agreement, "ACTIVE"));
  const [url, init] = fetch.mock.calls[2];
  expect(String(url)).toContain(`/agreements/${agreementID}/versions`);
  expect(init.headers["If-Match"]).toBe("1");
  expect(JSON.parse(init.body).status).toBe("ACTIVE");
});
it("preview chỉ ACTIVE phủ SKU/UOM/ngày VN, không lấy giá nháp hoặc giá tham khảo", () => {
  const input = { sku: materialID, uom: "KG", date: "2026-11-01" };
  expect(resolveAgreementPrice([agreement], input)).toBeNull();
  const active = { ...agreement, status: "ACTIVE" as const, effective_status: "ACTIVE" };
  expect(resolveAgreementPrice([active], input)?.unit_price_vnd).toBe(25000);
  expect(resolveAgreementPrice([active], { ...input, date: "2026-12-01" })).toBeNull();
  expect(resolveAgreementPrice([active, active], input)).toBeNull();
  expect(resolveAgreementPrice([{ ...active, effective_status: "SUSPENDED" }], input)).toBeNull();
});
