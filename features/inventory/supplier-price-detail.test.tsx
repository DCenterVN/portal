import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it, vi } from "vitest";
import messages from "@/messages/vi.json";
import { AccessProvider } from "@/lib/access-boundary";
import { supplier, supplierID } from "@/mocks/supplier-contract";
import { SupplierProfileProvider } from "./supplier-profile-context";
import { SupplierPriceDetail } from "./supplier-price-detail";

const version = (n: number, status: "ACTIVE" | "SUSPENDED") => ({ agreement_id: supplierID, version_id: `${supplierID.slice(0, -1)}${n}`, version: n, code: "BG-GAO", status, valid_from: "2026-10-01", valid_to: "2026-12-31", created_at: "2026-10-0" + n + "T00:00:00Z", lines: [] });
vi.mock("./use-supplier-price-versions", () => ({ useSupplierPriceVersions: () => ({ versions: [version(2, "SUSPENDED"), version(1, "ACTIVE")], error: undefined, reload: () => {} }) }));
vi.mock("./use-contract-materials", () => ({ useContractMaterials: () => ({ materials: [] }) }));

it("trang một bảng giá liệt kê các phiên bản, mới nhất đứng đầu", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}>
    <SupplierProfileProvider value={{ supplier, photoUrl: "", canUpdate: false, reload: () => {}, setSupplier: () => {} }}><SupplierPriceDetail agreementId={supplierID} /></SupplierProfileProvider></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Bảng giá BG-GAO");
  expect(html.indexOf("Phiên bản 2")).toBeGreaterThan(0);
  expect(html.indexOf("Phiên bản 2")).toBeLessThan(html.indexOf("Phiên bản 1"));
  expect(html).not.toContain("Thêm phiên bản");
});
