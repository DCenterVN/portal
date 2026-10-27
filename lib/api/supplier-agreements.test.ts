import { afterEach, expect, it, vi } from "vitest";
import { agreementSchema, getAgreements, getAllAgreements, createAgreement, saveAgreementVersion, agreementInput, resolveAgreementPrice, resolveReceiptReferencePrice } from "./supplier-agreements";
import { agreement, agreementID, envelope, supplierID, materialID } from "@/mocks/supplier-contract";
afterEach(() => vi.unstubAllGlobals());
it("ngừng dùng chỉ gửi dataset_mode cấp gốc, bỏ metadata khỏi dòng giá", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope(agreement, 201)));
  vi.stubGlobal("fetch", fetch);
  const source = { ...agreement, lines: agreement.lines.map(line => ({ ...line, dataset_mode: "DEMO" as const, price_line_ref: materialID })) };
  await saveAgreementVersion(supplierID, agreementID, 1, agreementInput(source, "SUSPENDED", "Ngừng dùng"));
  const payload = JSON.parse(fetch.mock.calls[0][1].body);
  expect(payload.dataset_mode).toBe("DEMO");
  expect(payload.status).toBe("SUSPENDED");
  for (const line of payload.lines) {
    expect(line).not.toHaveProperty("dataset_mode");
    expect(line).not.toHaveProperty("price_line_ref");
  }
  expect(payload.lines).toEqual(source.lines.map(({ dataset_mode: _mode, price_line_ref: _ref, ...line }) => line));
});
it("document_ref chuẩn hoá nil UUID thành null và giữ UUID chứng từ thật", () => {
  expect(agreementSchema.parse({ ...agreement, document_ref: "00000000-0000-0000-0000-000000000000" }).document_ref).toBeNull();
  expect(agreementSchema.parse({ ...agreement, document_ref: supplierID }).document_ref).toBe(supplierID);
});
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

it("preview phiếu phân biệt không coverage và giá mơ hồ",()=>{
  const input={sku:materialID,uom:"KG",date:"2026-11-01"};
  const active={...agreement,status:"ACTIVE" as const,effective_status:"ACTIVE"};
  expect(resolveReceiptReferencePrice([],input)).toEqual({found:false});
  expect(resolveReceiptReferencePrice([active],input)).toMatchObject({found:true,price:{unit_price_vnd:25000}});
  expect(resolveReceiptReferencePrice([{...active,document_ref:null}],input)).toMatchObject({found:true,price:{unit_price_vnd:25000}});
  expect(()=>resolveReceiptReferencePrice([active,active],input)).toThrow();
});
it("outage tải bảng giá không thành không có candidate",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({errors:{error_code:"UNAVAILABLE",message:"Chưa tải được bảng giá"}},{status:503})));
  await expect(getAllAgreements(supplierID)).rejects.toMatchObject({status:503});
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

it("giữ metadata chứng từ bổ sung, null và fixture cũ", () => {
  expect(agreementSchema.parse({ ...agreement, primary_document_ref: supplierID, document_attached_at: "2026-10-27T00:00:00Z" })).toMatchObject({ primary_document_ref: supplierID, document_attached_at: "2026-10-27T00:00:00Z" });
  expect(agreementSchema.parse({ ...agreement, primary_document_ref: null, document_attached_at: null })).toMatchObject({ primary_document_ref: null, document_attached_at: null });
  expect(agreementSchema.parse(agreement)).not.toHaveProperty("primary_document_ref");
});
