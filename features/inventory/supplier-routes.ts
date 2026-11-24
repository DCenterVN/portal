import type { Route } from "next";

export type SupplierTab = "agreements" | "receipts" | "overview";
export type SupplierLegacyQuery = { tab?: string; edit?: string; new?: string };

const root = "/inventory/suppliers";
const base = (id: string) => `${root}/${encodeURIComponent(id)}`;
const tabPaths = { agreements: "", receipts: "/receipts", overview: "/info" } as const;

export const supplierHref = {
  list: root as Route,
  overview: `${root}/overview` as Route,
  filtered: (status: "ACTIVE" | "SUSPENDED") => `${root}?f.status=${status}` as Route,
  create: `${root}/new` as Route,
  tab: (id: string, tab: SupplierTab) => `${base(id)}${tabPaths[tab]}` as Route,
  edit: (id: string) => `${base(id)}/edit` as Route,
  receive: (id: string) => `/inventory/goods-receipts/new?supplier=${encodeURIComponent(id)}` as Route,
  newPrice: (id: string) => `${base(id)}/prices/new` as Route,
  price: (id: string, agreementId: string) => `${base(id)}/prices/${encodeURIComponent(agreementId)}` as Route,
};

export function legacySupplierPath(id: string, { tab, edit, new: add }: SupplierLegacyQuery): Route | null {
  if (edit === "1") return supplierHref.edit(id);
  if (add === "1") return supplierHref.newPrice(id);
  if (tab === "receipts" || tab === "overview") return supplierHref.tab(id, tab);
  if (tab === "agreements") return supplierHref.tab(id, "agreements");
  return null;
}

export function supplierSection(pathname: string | null, id: string): { tab: SupplierTab | null; label: string } {
  const rest = (pathname ?? "").slice(base(id).length).replace(/\/$/, "");
  if (rest === "/receipts") return { tab: "receipts", label: "Lịch sử nhập" };
  if (rest === "/info") return { tab: "overview", label: "Thông tin" };
  if (rest === "/edit") return { tab: "overview", label: "Sửa thông tin" };
  if (rest === "/prices/new") return { tab: "agreements", label: "Thêm bảng giá" };
  if (rest.startsWith("/prices/")) return { tab: "agreements", label: "Bảng giá" };
  return { tab: "agreements", label: "Nguyên liệu và giá" };
}
