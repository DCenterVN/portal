import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { formatVND, type Product } from "@/lib/api/sales";
import { CatalogView } from "./catalog-view";
import { applyCatalogFilters } from "./catalog-filters";

vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: { error: vi.fn(), success: vi.fn() } }), ToastProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), usePathname: () => "/products", useSearchParams: () => new URLSearchParams() }));

const BRANCH = "0198fd55-3f46-7a01-9e52-f4c0de000020";
const id = (n: number) => `0198fd55-3f46-7a01-9e52-f4c0de0001${String(n).padStart(2, "0")}`;
const make = (n: number, name: string, price: number, extra: Partial<Product> = {}): Product => ({
  id: id(n), sku_ref: id(n + 50), sku_code: `MON-${n}`, name, uom: "suất", base_price_vnd: price, status: "ACTIVE",
  created_at: "2026-10-20T08:00:00Z", branch_ref: BRANCH, ...extra,
} as Product);
const products = [
  make(1, "Bún bò Huế", 120000, { image_urls: ["https://cdn.example.test/bun-bo.jpg"] }),
  make(2, "Cá hồi áp chảo", 300000),
  make(3, "Gà nướng mật ong", 180000, { image_urls: [] }),
];
const render = (props: Partial<React.ComponentProps<typeof CatalogView>> = {}) => renderToStaticMarkup(
  <NextIntlClientProvider locale="vi" messages={messages}><CatalogView products={products} {...props} /></NextIntlClientProvider>,
);
const visible = (html: string) => {
  const attrs = html.match(/\s(?:alt|title|placeholder|aria-label|label)="[^"]*"/g) ?? [];
  return [html.replace(/<[^>]*>/g, " "), ...attrs].join(" ");
};

describe("AC-1 catalog khách không lộ điều khiển quản trị", () => {
  it("không có nút tạo, kích hoạt, cột/nhãn SKU, barcode, DRAFT", () => {
    const out = visible(render());
    expect(out).not.toMatch(/Tạo sản phẩm|Kích hoạt|\bSKU\b|[Bb]arcode|[Mm]ã vạch|DRAFT|Bản nháp/);
    expect(render()).not.toMatch(/<table|<th\b/);
  });
  it("AC-1 mỗi món có card: tên, giá VND, liên kết tới chi tiết", () => {
    const out = render();
    for (const p of products) {
      expect(out).toContain(p.name);
      expect(out).toContain(formatVND(p.base_price_vnd));
      expect(out).toContain(`href="/products/${p.id}"`);
    }
  });
  it("AC-1 ghi rõ số món đã tải", () => {
    expect(visible(render())).toContain("3 món đã tải");
  });
  it("AC-8 ảnh thật dùng image_urls, món thiếu ảnh hiện khung Chưa có ảnh", () => {
    const out = render();
    expect(out.includes("https://cdn.example.test/bun-bo.jpg") || out.includes(encodeURIComponent("https://cdn.example.test/bun-bo.jpg"))).toBe(true);
    expect((out.match(/Chưa có ảnh/g) ?? []).length).toBe(2);
    expect(out).toMatch(/alt="Bún bò Huế"/);
  });
  it("AC-8 không UUID trong nội dung/nhãn người dùng", () => {
    expect(visible(render())).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });
  it("AC-8 không tim yêu thích, khuyến mãi, đánh giá, thời gian nấu giả (OD-1)", () => {
    const out = render();
    expect(out).not.toMatch(/yêu thích|wishlist|favorite|Khuyến mãi|Đánh giá|đã bán|phút/i);
    expect(out).not.toMatch(/aria-pressed/);
  });
  it("AC-5 nút thêm giỏ chỉ có khi món có sku_ref và branch_ref thật", () => {
    const out = render({ products: [make(1, "Bún bò Huế", 120000), make(2, "Cá hồi áp chảo", 300000, { sku_ref: undefined })] });
    expect((out.match(/Thêm vào giỏ/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(out).toContain("Bún bò Huế");
  });
});

describe("AC-6 trạng thái loading / empty / error / success khác nhau", () => {
  const loading = render({ loading: true, products: [] });
  const empty = render({ products: [] });
  const error = render({ products: [], error: "Sales API trả về 503" });
  const success = render();
  it("loading có aria-busy và không dựng card", () => {
    expect(loading).toMatch(/aria-busy="true"/);
    expect(loading).not.toContain('href="/products/');
  });
  it("error có role alert kèm thông báo, không dựng card", () => {
    expect(error).toContain('role="alert"');
    expect(error).toContain("503");
    expect(error).not.toContain('href="/products/');
  });
  it("empty không phải lỗi cũng không phải loading", () => {
    expect(empty).not.toContain('role="alert"');
    expect(empty).not.toMatch(/aria-busy="true"/);
    expect(empty).not.toContain('href="/products/');
    expect(visible(empty).replace(/\s+/g, "")).not.toBe("");
  });
  it("bốn trạng thái cho bốn HTML khác nhau", () => {
    expect(new Set([loading, empty, error, success]).size).toBe(4);
  });
  it("next_cursor hiện Xem thêm, không có cursor thì không", () => {
    expect(visible(render({ nextCursor: "c2" }))).toContain("Xem thêm");
    expect(visible(render())).not.toContain("Xem thêm");
  });
  it("AC-6 có nút mở bộ lọc cho mobile và đủ ô lọc tên, giá, sắp xếp", () => {
    const out = render();
    expect(out).toMatch(/<button[^>]*>[^<]*(?:<[^>]+>)*[^<]*Bộ lọc/);
    expect(visible(out)).toMatch(/Sắp xếp/);
    expect(visible(out)).toMatch(/Giá/);
    expect(out).toMatch(/<input[^>]*type="(?:search|text)"/);
  });
});

describe("AC-1 lọc và sắp xếp trên tập đã tải (OD-2)", () => {
  const names = (list: Product[]) => list.map(p => p.name);
  it("lọc tên không phân biệt hoa thường và dấu cách thừa", () => {
    expect(names(applyCatalogFilters(products, { query: "  CÁ hồi " }))).toEqual(["Cá hồi áp chảo"]);
  });
  it("lọc khoảng giá gồm hai đầu mút", () => {
    expect(names(applyCatalogFilters(products, { minPrice: 120000, maxPrice: 180000 }))).toEqual(["Bún bò Huế", "Gà nướng mật ong"]);
    expect(names(applyCatalogFilters(products, { minPrice: 200000 }))).toEqual(["Cá hồi áp chảo"]);
    expect(names(applyCatalogFilters(products, { maxPrice: 100000 }))).toEqual([]);
  });
  it("sắp xếp giá tăng/giảm và giữ thứ tự gốc khi mặc định, không đổi mảng đầu vào", () => {
    const original = names(products);
    expect(names(applyCatalogFilters(products, { sort: "price-asc" }))).toEqual(["Bún bò Huế", "Gà nướng mật ong", "Cá hồi áp chảo"]);
    expect(names(applyCatalogFilters(products, { sort: "price-desc" }))).toEqual(["Cá hồi áp chảo", "Gà nướng mật ong", "Bún bò Huế"]);
    expect(names(applyCatalogFilters(products, {}))).toEqual(original);
    expect(names(products)).toEqual(original);
  });
  it("kết hợp tên + giá + sắp xếp", () => {
    expect(names(applyCatalogFilters(products, { query: "h", maxPrice: 300000, sort: "price-desc" }))).toEqual(["Cá hồi áp chảo", "Bún bò Huế"]);
  });
});

describe("AC-7 module filter-motion dùng chung", () => {
  const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
  const MODULE = "filter-motion.module.css";

  it("module dùng chung tồn tại, là style effect duy nhất trong features/products", () => {
    expect(existsSync(fileURLToPath(new URL(MODULE, import.meta.url)))).toBe(true);
    const css = readdirSync(fileURLToPath(new URL(".", import.meta.url))).filter(f => f.endsWith(".css"));
    expect(css).toEqual([MODULE]);
  });
  it("module giữ transition 350ms/300ms ease, animation 250ms/450ms spring và reduced-motion tắt trượt/scale", () => {
    const css = read(MODULE);
    expect(css).toMatch(/\.filter\s*\{[^}]*background-color 350ms ease[^}]*color 300ms ease/s);
    expect(css).toMatch(/\.filter > svg\s*\{[^}]*checkFade 250ms ease[^}]*checkSlide 450ms cubic-bezier\(\.34,\s*1\.45,\s*\.64,\s*1\)/s);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*\.filter\s*\{\s*transition: none;\s*\}[^@]*\.filter > svg\s*\{\s*animation: none;\s*\}/s);
    expect(css).not.toMatch(/transition:[^;]*\b(all|padding|width)\b/);
  });
});

describe("AC-7 console ProductsView giữ #019 và sửa wrap / căn giữa icon", () => {
  const source = readFileSync(new URL("products-view.tsx", import.meta.url), "utf8");
  it("nhập đúng module filter-motion và gắn lên cả 3 nút lọc trạng thái", () => {
    expect(source).toMatch(/import\s+\w+\s+from\s+["']\.\/filter-motion\.module\.css["']/);
    expect((source.match(/className=\{\w+\.filter\}/g) ?? [])).toHaveLength(3);
    expect((source.match(/aria-pressed=\{statusFilter ===/g) ?? [])).toHaveLength(3);
  });
  it("hàng actions và hàng nút lọc cho phép wrap, không vượt chiều rộng", () => {
    expect((source.match(/className="flex max-w-full flex-wrap items-center gap-(?:1\.5|2\.5)/g) ?? [])).toHaveLength(2);
  });
  it("icon Search căn giữa dọc theo ô nhập", () => {
    expect(source).toMatch(/<Search className="[^"]*top-1\/2 -translate-y-1\/2[^"]*"/);
    expect(source).not.toMatch(/<Search className="[^"]*top-2\.5/);
  });
  it("không tạo style effect thứ hai trong console", () => {
    expect(source).not.toMatch(/@keyframes|checkFade|checkSlide|\.module\.css["'];[\s\S]*\.module\.css["']/);
  });
});
