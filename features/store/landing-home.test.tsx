import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/api/sales";
import { Landing } from "./landing";
import { Home } from "./home";
import { FeaturedDishesGrid } from "./featured-dishes";

const IMAGES = [
  "/images/landing/hero-meal-kit.webp",
  "/images/landing/trace-coldchain.webp",
  "/images/landing/cat-mealkit.webp",
  "/images/landing/cat-prepped.webp",
  "/images/landing/cat-soup.webp",
  "/images/landing/cat-veggies.webp",
];

describe("Landing và Home storefront imagery", () => {
  it("Landing hiển thị ảnh hero, chuỗi lạnh, thẻ vai trò và fallback preview", () => {
    const html = renderToStaticMarkup(React.createElement(Landing));
    for (const src of [
      "/images/landing/hero-meal-kit.webp",
      "/images/landing/trace-coldchain.webp",
      "/images/landing/cat-mealkit.webp",
      "/images/landing/cat-prepped.webp",
      "/images/landing/cat-veggies.webp",
    ]) expect(html).toContain(src);
    expect(html).toContain("Thực đơn nổi bật tuần này");
    expect(html).toContain("alt=\"Bộ nguyên liệu bữa ăn Việt đã sơ chế sẵn kèm món cá nục kho cà chua\"");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it("Home hiển thị đủ ảnh nhóm món, hero, hướng dẫn và lời chào người dùng", () => {
    const html = renderToStaticMarkup(React.createElement(Home, { name: "Lan" }));
    expect(html).toContain("Chào Lan, bữa tối 20 phút nhé?");
    for (const src of IMAGES) expect(html).toContain(src);
    expect(html).toContain("Bán chạy tuần này");
    expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it("FeaturedDishesGrid dựng đúng trạng thái tải, dữ liệu thật và fallback rỗng", () => {
    const loadingHtml = renderToStaticMarkup(React.createElement(FeaturedDishesGrid, { products: [], loading: true, limit: 4 }));
    expect(loadingHtml).toContain('aria-busy="true"');

    const realProduct: Product = {
      id: "01a1bc1a-9219-7676-8b44-6b4ef26c1d34",
      sku_code: "MON-01",
      name: "Cá nục kho cà chua",
      uom: "EA",
      portion_count: 2,
      base_price_vnd: 95000,
      status: "ACTIVE",
      created_at: "2026-11-08T17:00:20Z",
      image_urls: ["https://cdn.example.test/ca-nuc.jpg"],
    };
    const noImageProduct: Product = {
      id: "01a1bc1d-3d03-7037-a25a-8133d3e789a1",
      sku_code: "MON-02",
      name: "Canh bầu nấu tôm",
      uom: "EA",
      base_price_vnd: 68000,
      status: "ACTIVE",
      created_at: "2026-11-08T17:00:20Z",
    };
    const populatedHtml = renderToStaticMarkup(
      React.createElement(FeaturedDishesGrid, { products: [realProduct, noImageProduct], limit: 4 }),
    );
    expect(populatedHtml).toContain('src="https://cdn.example.test/ca-nuc.jpg"');
    expect(populatedHtml).toContain("Cá nục kho cà chua");
    expect(populatedHtml).toContain("2 người");
    expect(populatedHtml).toContain("95.000");
    expect(populatedHtml).toContain("Canh bầu nấu tôm");

    const fallbackHtml = renderToStaticMarkup(
      React.createElement(FeaturedDishesGrid, {
        products: [],
        fallbackCards: [
          {
            title: "Canh & món nóng gia đình",
            subtitle: "Nước dùng thanh, rau củ giữ trọn vị tươi.",
            image: "/images/landing/cat-soup.webp",
            alt: "Món canh nóng",
            href: "/products",
          },
        ],
      }),
    );
    expect(fallbackHtml).toContain("/images/landing/cat-soup.webp");
    expect(fallbackHtml).toContain("Canh &amp; món nóng gia đình");

    const emptyHtml = renderToStaticMarkup(React.createElement(FeaturedDishesGrid, { products: [] }));
    expect(emptyHtml).toContain("Thực đơn đang được cập nhật");
  });
});
