import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicTraceability, parsePublicTraceability, type PublicTraceability } from "@/lib/api/production";

const { apiFetch, redirect, state } = vi.hoisted(() => ({
  apiFetch: vi.fn(), redirect: vi.fn((url: string) => { throw new Error(url); }),
  state: { trace: null, loading: false, error: false, retry: vi.fn() },
}));
vi.mock("@/lib/fetcher", () => ({ apiFetch }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), redirect }));
vi.mock("./use-trace", async importOriginal => ({ ...await importOriginal<typeof import("./use-trace")>(), useTrace: () => state }));
import LookupPage from "@/app/(store)/traceability/page";
import { TraceView } from "./trace-view";
import { loadPublicTrace } from "./use-trace";
import { STORE_NAV } from "@/mocks/store";

const trace: PublicTraceability = {
  trace_code: "TRC-TEST", product_name: "Cá kho", variant_name: "Một suất",
  produced_at: "2026-11-10", expires_at: "2026-11-12", qc_status: "PASSED",
  production_branch_name: "Bếp Sunny",
  ingredients: [{ material_name: "Cá", supplier_name: "Hải sản Bình Minh", received_at: "2026-11-05", expires_at: "2026-11-15", inbound_qc: { decision: "PASS", inspected_at: "2026-11-06T02:00:00Z" } }],
  timeline: [{ stage: "COOKING", title: "Nấu", timestamp: "2026-11-10T01:00:00Z", passed: true }, { stage: "QC", title: "QC", timestamp: "2026-11-10T02:00:00Z", passed: true }],
};

describe("Customer traceability", () => {
  beforeEach(() => { apiFetch.mockReset(); state.error = false; state.loading = false; });

  it("provides the lookup field and three explanatory steps at the menu destination", async () => {
    const html = renderToStaticMarkup(await LookupPage({ searchParams: Promise.resolve({}) }));
    for (const label of ["Mã in trên tem hộp món", "Nguyên liệu", "Bếp sản xuất", "Kiểm tra chất lượng", "Tra cứu"]) expect(html).toContain(label);
    expect(html).toContain('name="code"');
    expect(html).toContain('placeholder="Ví dụ: TRC-20260901-DEMO"');
    expect(html).not.toContain("Nhập mã trên tem hộp món");
    expect(STORE_NAV.find(item => item.label === "Truy xuất nguồn gốc")?.href).toBe("/traceability");
  });

  it("redirects QR query codes with whitespace trimmed and route delimiters encoded", async () => {
    await expect(LookupPage({ searchParams: Promise.resolve({ code: " TRC/A?B " }) })).rejects.toThrow("/traceability/TRC%2FA%3FB");
  });

  it("renders chronological stages, supplier, local dates and translated quality", () => {
    const html = renderToStaticMarkup(<TraceView trace={trace} />);
    expect(html.indexOf("Lô nguyên liệu")).toBeLessThan(html.indexOf(">Bếp sản xuất</h3>"));
    expect(html.indexOf("Bếp sản xuất")).toBeLessThan(html.indexOf("Kiểm tra chất lượng thành phẩm"));
    for (const label of ["Bếp sản xuất: Bếp Sunny", "Hải sản Bình Minh", "05/11/2026", "15/11/2026", "06/11/2026 09:00", "QC đầu vào", "Ngày kiểm", "10/11/2026", "Đạt kiểm tra chất lượng"]) expect(html).toContain(label);
    expect(html).not.toContain("PASSED");
    expect(html).not.toContain("Chưa có thông tin trong hồ sơ công khai");
  });

  it.each(["KHO-001", "SEED-NCC-01", "01a1bc1d-3a2b-7e23-aac2-a774570dc00e"])("hides internal identifiers %s in all public names", value => {
    const html = renderToStaticMarkup(<TraceView trace={{ ...trace, production_branch_name: value, product_name: value, variant_name: value, ingredients: [{ ...trace.ingredients[0], material_name: value, supplier_name: value }], timeline: [{ stage: "UNKNOWN", title: value, timestamp: "", passed: false }] }} />);
    expect(html).not.toMatch(/KHO-|SEED-|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(html).toContain("Chưa có thông tin");
  });

  it("renders shelf placement as the fourth step after finished product QC with only its local timestamp", () => {
    const shelf = { stage: "SHELF_PLACEMENT", title: "Kệ A · Vị trí B · KHO-001", timestamp: "2026-11-10T07:04:37.492274Z", passed: true };
    const html = renderToStaticMarkup(<TraceView trace={{ ...trace, timeline: [...trace.timeline, shelf] }} />);
    expect(html.match(/<li /g)).toHaveLength(4);
    expect(html.indexOf("Kiểm tra chất lượng thành phẩm")).toBeLessThan(html.indexOf("Lên kệ phân phối"));
    const shelfHtml = html.slice(html.lastIndexOf("<li "), html.lastIndexOf("</li>"));
    expect(shelfHtml).toContain(">4</span>");
    expect(shelfHtml).toContain("Lên kệ phân phối");
    expect(shelfHtml).toContain("10/11/2026 14:04");
    expect(html).not.toContain(shelf.title);
    expect(html).not.toMatch(/Kệ A|Vị trí B|KHO-001|SHELF_PLACEMENT/);
  });

  it("omits the fourth step when the timeline has no shelf placement", () => {
    const html = renderToStaticMarkup(<TraceView trace={trace} />);
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html).not.toContain("Lên kệ phân phối");
    expect(html).not.toContain(">4</span>");
  });

  it.each<"PASS" | "FAIL" | null>(["PASS", "FAIL", null])("renders inbound QC %s with an independent inspection date", decision => {
    const ingredient = { ...trace.ingredients[0], inbound_qc: { decision, inspected_at: "2026-11-06T02:00:00Z" } };
    const html = renderToStaticMarkup(<TraceView trace={{ ...trace, ingredients: [ingredient] }} />);
    expect(html).toContain(`QC đầu vào: ${decision === "PASS" ? "Đạt" : decision === "FAIL" ? "Không đạt" : "Chưa có thông tin"}`);
    expect(html).toContain("06/11/2026 09:00");
    expect(html).not.toMatch(/PASS|FAIL/);
  });

  it.each([null, undefined])("supports null or missing legacy fields (%s) without falling back to codes", async value => {
    const payload = { ...trace, production_branch_name: value, ingredients: [{ material_name: "Cá", supplier_name: value, supplier_code: "KHO-SEED-01", received_at: value, expires_at: value, inbound_qc: value }] };
    apiFetch.mockResolvedValueOnce(Response.json({ data: payload }));
    const parsed = await loadPublicTrace("TRC-TEST");
    expect(parsed).not.toBeNull();
    if (!parsed) throw new Error("Missing trace");
    const html = renderToStaticMarkup(<TraceView trace={parsed} />);
    for (const label of ["Bếp sản xuất", "Nhà cung cấp", "Ngày nhập", "Hạn dùng", "QC đầu vào", "Ngày kiểm"]) expect(html).toContain(`${label}: Chưa có thông tin`);
    expect(html).not.toMatch(/KHO-|SEED-/);
    expect(parsed?.ingredients[0]).not.toHaveProperty("supplier_code");
  });

  it("parses the full contract through both public loaders and rejects malformed ingredients", async () => {
    apiFetch.mockResolvedValueOnce(Response.json({ data: trace }));
    expect(await getPublicTraceability("TRC-TEST")).toEqual(trace);
    expect(() => parsePublicTraceability({ ...trace, ingredients: "invalid" })).toThrow();
    const html = renderToStaticMarkup(<TraceView trace={{ ...trace, ingredients: [] }} />);
    expect(html).toContain("Chưa có thông tin nguyên liệu.");
  });

  it("offers code re-entry on not found and a retry on server failure", () => {
    const missing = renderToStaticMarkup(<TraceView code="MISSING" />);
    expect(missing).toContain("Chưa tìm thấy mã truy xuất");
    expect(missing).toContain('name="code"');
    state.error = true;
    const failed = renderToStaticMarkup(<TraceView code="MISSING" />);
    expect(failed).toContain("Chưa thể tra cứu lúc này");
    expect(failed).toContain("Thử lại");
  });

  it("treats only HTTP 404 as not found and preserves service failure", async () => {
    apiFetch.mockResolvedValueOnce(new Response("{}", { status: 404 }));
    expect(await loadPublicTrace("TRC/A")).toBeNull();
    expect(apiFetch).toHaveBeenCalledWith("/api/public/traceability/TRC%2FA");
    apiFetch.mockResolvedValueOnce(new Response("{}", { status: 503 }));
    await expect(loadPublicTrace("TRC-A")).rejects.toThrow("Không thể tải");
    apiFetch.mockResolvedValueOnce(Response.json({ data: trace }));
    expect(await loadPublicTrace("TRC-TEST")).toEqual(trace);
  });
});
