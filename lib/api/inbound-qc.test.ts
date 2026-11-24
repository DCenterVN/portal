import { afterEach, expect, it, vi } from "vitest";
import { envelope, supplierID, documentID } from "@/mocks/supplier-contract";
import { consoleNavFor } from "@/lib/navigation";
import { assignStorageLocation, completeInspection, declareAllergens, decideLot, getInboundLot, getInboundLots, getInspectionProgress, saveShelfLife, saveTemperature, takeSamples } from "./inbound-qc";

afterEach(() => vi.unstubAllGlobals());
const stub = (data: unknown) => { const fetch = vi.fn().mockImplementation(() => Promise.resolve(Response.json(envelope(data)))); vi.stubGlobal("fetch", fetch); return fetch; };
const call = (fetch: ReturnType<typeof vi.fn>) => { const [url, init] = fetch.mock.calls[0]; return { path: new URL(url, "http://127.0.0.1:3000").pathname, query: new URL(url, "http://127.0.0.1:3000").searchParams, method: init?.method ?? "GET", body: init?.body ? JSON.parse(init.body) : undefined, key: new Headers(init?.headers).get("Idempotency-Key") }; };
const lot = { id: supplierID, goods_receipt_ref: documentID, goods_receipt_line_id: documentID, sku_ref: supplierID, supplier_lot_code: "LO-01", storage_location_code: "", initial_quantity: 2.5, uom: "KG", expires_at: "2026-12-01T00:00:00Z", status: "RECEIVED" };

it("danh sách lô gửi trang, số dòng, trạng thái, mã lô và đọc dị nguyên server trả dạng base64", async () => {
  const fetch = stub({ total: 18, items: [{ ...lot, allergen_snapshot: btoa('["EGGS","MILK"]') }, { ...lot, allergen_snapshot: null }], pagination: { total_items: 18, total_pages: 2, current_page: 2, limit: 10 } });
  const page = await getInboundLots({ status: "RECEIVED", q: "LO-01", page: 2, limit: 10 });
  const { path, query } = call(fetch);
  expect(path).toBe("/api/inventory/inventory-lots");
  expect([query.get("status"), query.get("q"), query.get("page"), query.get("limit"), query.get("cursor")]).toEqual(["RECEIVED", "LO-01", "2", "10", null]);
  expect(page.items.map(item => item.allergen_snapshot)).toEqual([["EGGS", "MILK"], []]);
  expect(page.pagination?.total_pages).toBe(2);
});

it("mở một lô đọc thẳng chi tiết lô, kèm mã phiếu kiểm", async () => {
  const fetch = stub({ ...lot, allergen_snapshot: null, inbound_qc_inspection_id: documentID });
  const found = await getInboundLot(supplierID);
  expect(call(fetch).path).toBe(`/api/inventory/inventory-lots/${supplierID}`);
  expect(found.inbound_qc_inspection_id).toBe(documentID);
});

it("lô chưa có phiếu kiểm thì mã phiếu rỗng", async () => {
  stub({ ...lot, allergen_snapshot: null, inbound_qc_inspection_id: null });
  expect((await getInboundLot(supplierID)).inbound_qc_inspection_id).toBeNull();
});

it("tiến độ phiếu kiểm đọc đúng các tiêu chí đã xong", async () => {
  const fetch = stub({ id: documentID, status: "TESTING", decision: null, sample_taken: true, sensory_checked: true, temperature_checked: false, shelf_life_checked: true });
  expect(await getInspectionProgress(documentID)).toMatchObject({ sample_taken: true, sensory_checked: true, temperature_checked: false, shelf_life_checked: true, decision: null });
  expect(call(fetch).path).toBe(`/api/inventory/inbound-qc-inspections/${documentID}`);
});

it.each([
  ["dị nguyên", `inventory-lots/${supplierID}/allergens`, "PUT", { allergen_snapshot: ["EGGS"] }, () => declareAllergens(supplierID, ["EGGS"], "k")],
  ["vị trí kho", `inventory-lots/${supplierID}/storage-location`, "PUT", { storage_location_code: "KHO-01" }, () => assignStorageLocation(supplierID, "KHO-01", "k")],
  ["lấy mẫu", `inbound-qc-inspections/${documentID}/samples`, "POST", { target_lot_ref: supplierID, sample_plan: { note: "mẫu" } }, () => takeSamples(documentID, supplierID, "mẫu", "k")],
  ["nhiệt độ", `inbound-qc-inspections/${documentID}/temperature-result`, "PUT", { core_temperature_celsius: -2.5, qc_metrics: { temperature_result: "FAIL", failure_reason: "quá nóng" }, evidence_refs: [documentID] }, () => saveTemperature(documentID, -2.5, { result: "FAIL", failure_reason: "quá nóng", evidence_refs: [documentID] }, "k")],
  ["hạn dùng", `inbound-qc-inspections/${documentID}/shelf-life-result`, "PUT", { expiry_date: "2026-12-01T00:00:00+07:00", qc_metrics: { shelf_life_result: "PASS" }, evidence_refs: [] }, () => saveShelfLife(documentID, "2026-12-01T00:00:00+07:00", { result: "PASS", evidence_refs: [] }, "k")],
  ["hoàn tất", `inbound-qc-inspections/${documentID}/complete`, "POST", { decision: "PASS", failure_reason: null, evidence_refs: [] }, () => completeInspection(documentID, { result: "PASS", evidence_refs: [] }, "k")],
  ["từ chối lô", `inventory-lots/${supplierID}/qc-decisions`, "POST", { decision: "REJECT", reason: "hỏng", evidence_refs: [documentID] }, () => decideLot(supplierID, { decision: "REJECT", reason: "hỏng", evidence_refs: [documentID] }, "k")],
] as const)("%s gửi đúng đường dẫn, phương thức và body", async (_name, path, method, body, run) => {
  const fetch = stub({});
  await run();
  expect(call(fetch)).toMatchObject({ path: `/api/inventory/${path}`, method, body, key: "k" });
});

it("mục menu Kiểm đầu vào chỉ hiện khi có quyền kiểm", () => {
  const labels = (actions: string[]) => consoleNavFor(new Set(actions)).flatMap(group => group.items.map(item => item.label));
  expect(labels(["inventory:qc:update"])).toContain("Kiểm đầu vào");
  expect(labels(["inventory:lot:read"])).not.toContain("Kiểm đầu vào");
});
