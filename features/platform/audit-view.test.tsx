import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuditLog } from "./audit-view";
import * as useSupport from "./use-support";
import * as useAuditModule from "./use-audit";

vi.mock("./use-support", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./use-support")>();
  return {
    ...actual,
    useCompanyOptions: vi.fn(),
  };
});

vi.mock("./use-audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./use-audit")>();
  return {
    ...actual,
    useAudit: vi.fn(),
  };
});

const sampleCompanies = [
  { root_branch_id: "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e01", name: "Công ty Rau Sạch Đà Lạt", code: "RSD-01" },
  { root_branch_id: "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e02", name: "Bếp Trung Tâm Sài Gòn", code: "BT-SG" },
];

describe("B2 AuditView Company Picker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useAuditModule.useAudit).mockReturnValue({
      data: { items: [], limit: 20 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useAuditModule.useAudit>);
  });

  it("renders EntityPicker for company with name, code and hidden root_branch_id, without UUID labels", () => {
    vi.mocked(useSupport.useCompanyOptions).mockReturnValue({
      data: { items: sampleCompanies, limit: 100, page: 1, total: 2 },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSupport.useCompanyOptions>);

    const html = renderToStaticMarkup(<AuditLog source="platform" />);

    // Must use EntityPicker combobox role and hidden input for root_branch_id
    expect(html).toContain('role="combobox"');
    expect(html).toContain('name="root_branch_id"');
    expect(html).toContain('type="hidden"');
    expect(html).toContain("Tìm theo tên hoặc mã công ty");

    // Must not show UUID placeholder or UUID label to the user
    expect(html).not.toContain('placeholder="UUID"');
    expect(html).not.toContain("Công ty (MAIN)");
    expect(html).toContain("Công ty");
  });

  it("shows loading state when companies are loading", () => {
    vi.mocked(useSupport.useCompanyOptions).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSupport.useCompanyOptions>);

    const html = renderToStaticMarkup(<AuditLog source="platform" />);
    expect(html).toContain("Đang tải…");
  });

  it("shows error state with retry button when company list fails to load", () => {
    vi.mocked(useSupport.useCompanyOptions).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Mất kết nối service org"),
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSupport.useCompanyOptions>);

    const html = renderToStaticMarkup(<AuditLog source="platform" />);
    expect(html).toContain("Không tải được danh sách nên chưa chọn được.");
    expect(html).toContain("Thử lại");
  });

  it("shows empty state when company list has no items", () => {
    vi.mocked(useSupport.useCompanyOptions).mockReturnValue({
      data: { items: [], limit: 100, page: 1, total: 0 },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSupport.useCompanyOptions>);

    const html = renderToStaticMarkup(<AuditLog source="platform" />);
    expect(html).toContain("Chưa có công ty nào");
  });

  it("does not render company picker when source is company", () => {
    vi.mocked(useSupport.useCompanyOptions).mockReturnValue({
      data: { items: sampleCompanies, limit: 100, page: 1, total: 2 },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSupport.useCompanyOptions>);

    const html = renderToStaticMarkup(<AuditLog source="company" root="0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e01" />);
    expect(html).not.toContain('name="root_branch_id"');
    expect(html).not.toContain('role="combobox"');
  });

  it("submitting form with picked company sends exact root_branch_id in filters (mutation test)", () => {
    const pickedCompanyId = "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e01";
    const otherCompanyId = "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e02";

    const formData = new FormData();
    formData.set("root_branch_id", pickedCompanyId);

    const { filters } = useAuditModule.readAuditFilters(formData, true);
    expect(filters?.root_branch_id).toBe(pickedCompanyId);
    expect(filters?.root_branch_id).not.toBe(otherCompanyId);
  });
});
