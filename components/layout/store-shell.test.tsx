import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StoreShell } from "./store-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/products" }));

const nav = [
  { href: "/", label: "Cửa hàng", match: "/" },
  { href: "/products", label: "Sản phẩm", match: "/products" },
];
const footer = {
  columns: [
    { title: "Khám phá", links: [{ href: "/products", label: "Sản phẩm" }] },
    { title: "Hỗ trợ", links: [{ href: "/help", label: "Trợ giúp" }] },
    { title: "Cửa hàng", links: [{ href: "/orders", label: "Đơn hàng" }] },
    { title: "Kết nối", links: [{ href: "/contact", label: "Liên hệ" }] },
  ],
  legal: ["© Việt Sạch", "Chính sách bảo mật"],
};

describe("StoreShell", () => {
  it("renders the landing shell, active navigation, and footer columns", () => {
    const html = renderToStaticMarkup(
      <StoreShell nav={nav} user={null} cartHref="/cart" loginHref="/login" footer={footer}>
        <p>Store content</p>
      </StoreShell>
    );

    expect(html).toContain('data-surface="store"');
    expect((html.match(/<main\b/g) ?? []).length).toBe(1);
    expect(html).toContain('<main id="main"');
    expect((html.match(/<header\b/g) ?? []).length).toBe(1);
    expect((html.match(/<footer\b/g) ?? []).length).toBe(1);
    expect((html.match(/<h2\b/g) ?? []).length).toBe(4);
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain("backdrop");
    expect(html).toContain('href="/login"');
  });

  it("renders the signed-in account name", () => {
    const html = renderToStaticMarkup(
      <StoreShell nav={nav} user={{ name: "Nguyễn An" }} cartHref="/cart" loginHref="/login" footer={footer}>
        <p>Store content</p>
      </StoreShell>
    );

    expect(html).toContain("Nguyễn An");
  });
});
