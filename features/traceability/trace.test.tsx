import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicTraceability } from "@/lib/api/production";

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
  ingredients: [{ material_name: "Cá", supplier_code: "NCC-01" }],
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
    expect(html.indexOf("Lô nguyên liệu")).toBeLessThan(html.indexOf("Bếp sản xuất"));
    expect(html.indexOf("Bếp sản xuất")).toBeLessThan(html.indexOf("Kiểm tra chất lượng thành phẩm"));
    for (const label of ["NCC-01", "10/11/2026", "Đạt kiểm tra chất lượng", "Chưa có thông tin trong hồ sơ công khai"]) expect(html).toContain(label);
    expect(html).not.toContain("PASSED");
  });

  it("hides UUIDs in public fields and untrusted timeline titles", () => {
    const uuid = "01a1bc1d-3a2b-7e23-aac2-a774570dc00e";
    const html = renderToStaticMarkup(<TraceView trace={{ ...trace, product_name: uuid, variant_name: uuid, trace_code: `TRC-${uuid}`, ingredients: [{ material_name: uuid, supplier_code: uuid }], timeline: [{ stage: "UNKNOWN", title: uuid, timestamp: "", passed: false }] }} />);
    expect(html).not.toContain(uuid);
    expect(html).toContain("Chưa có thông tin");
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
