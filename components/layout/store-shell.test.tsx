import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme-provider";
import { STORE_ACCOUNT, STORE_CART_ITEMS, STORE_FAVORITES_COUNT } from "@/mocks/store";
import { StoreShell } from "./store-shell";
import { StoreHeader } from "./store-header";
import { MiniCart } from "./mini-cart";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/products", useRouter: () => router }));

// Node has no DOM: with `open` set, every `useState(false)` starts true so popover panels show in the SSR markup.
const flags = vi.hoisted(() => ({ open: false }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return { ...actual, useState: (initial: unknown) => actual.useState(flags.open && initial === false ? true : initial) };
});

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

type Props = React.ComponentProps<typeof StoreShell>;
const shell = (props: Partial<Props> = {}) => renderToStaticMarkup(
  <ThemeProvider>
    <StoreShell nav={nav} user={null} cartHref="/cart" loginHref="/login" footer={footer} {...props}>
      <p>Store content</p>
    </StoreShell>
  </ThemeProvider>
);

type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function find(tree: React.ReactNode, match: (node: Node) => boolean): Node | undefined {
  if (Array.isArray(tree)) return tree.map((child) => find(child, match)).find(Boolean);
  if (!React.isValidElement(tree)) return undefined;
  const node = tree as Node;
  return match(node) ? node : find(node.props.children, match);
}

const tagWith = (html: string, tag: string) => html.match(new RegExp(`<${tag}\\b[^>]*>`))?.[0] ?? "";

beforeEach(() => {
  flags.open = false;
  router.push.mockReset();
});

describe("StoreShell", () => {
  it("renders one header, main and footer landmark with active navigation", () => {
    const html = shell();
    expect(html).toContain('data-surface="store"');
    expect((html.match(/<main\b/g) ?? []).length).toBe(1);
    expect(html).toContain('<main id="main"');
    expect((html.match(/<header\b/g) ?? []).length).toBe(1);
    expect((html.match(/<footer\b/g) ?? []).length).toBe(1);
    expect((html.match(/<h2\b/g) ?? []).length).toBe(4);
    expect(html).toContain('aria-current="page"');
  });

  it("keeps the header sticky on glass L2 and the content at 1440 with 16/40 gutters", () => {
    const html = shell();
    const header = tagWith(html, "header");
    for (const name of ["sticky", "top-0", "border-glass-edge"]) expect(header).toContain(name);
    const glass = html.slice(html.indexOf("<header"), html.indexOf("</header>")).match(/<span aria-hidden="true" class="[^"]*"/)?.[0] ?? "";
    for (const name of ["absolute", "inset-0", "bg-glass-l2", "glass-blur-l2"]) expect(glass).toContain(name);
    const main = tagWith(html, "main");
    for (const name of ["max-w-360", "px-4", "md:px-10"]) expect(main).toContain(name);
  });

  it("signed out: shows a Đăng nhập button that calls onLoginClick and no account avatar", () => {
    const onLoginClick = vi.fn();
    const html = shell({ onLoginClick });
    expect(html).toContain("Đăng nhập");
    expect(html).not.toContain("Tài khoản của");

    const tree = StoreHeader({ nav, pathname: "/", user: null, cartHref: "/cart", cartItems: [], favoritesCount: 0, loginHref: "/login", onLoginClick, menuOpen: false, onMenuToggle: () => {} });
    const login = find(tree, (node) => node.props["aria-label"] === "Đăng nhập");
    (login?.props.onClick as () => void)();
    expect(onLoginClick).toHaveBeenCalledOnce();
  });

  it("signed out without onLoginClick: falls back to the login route", () => {
    const tree = StoreHeader({ nav, pathname: "/", user: null, cartHref: "/cart", cartItems: [], favoritesCount: 0, loginHref: "/login", menuOpen: false, onMenuToggle: () => {} });
    const login = find(tree, (node) => node.props["aria-label"] === "Đăng nhập");
    (login?.props.onClick as () => void)();
    expect(router.push).toHaveBeenCalledWith("/login");
  });

  it("signed in: avatar menu lists account, orders, favourites with count, and logout", () => {
    flags.open = true;
    const html = shell({ user: STORE_ACCOUNT, favoritesCount: STORE_FAVORITES_COUNT, onLogout: () => {} });
    expect(html).toContain(`aria-label="Tài khoản của ${STORE_ACCOUNT.name}"`);
    expect(html).toContain('role="menu"');
    for (const label of ["Tài khoản", "Đơn hàng", `Yêu thích (${STORE_FAVORITES_COUNT})`, "Đăng xuất"]) expect(html).toContain(label);
    expect(html).not.toContain('aria-label="Đăng nhập"');
  });

  it("search submits q to /products and the mobile trigger is a 44px icon button", () => {
    flags.open = true;
    const html = shell();
    const form = tagWith(html, "form");
    expect(form).toContain('action="/products"');
    expect(form).toContain('role="search"');
    expect(html).toMatch(/<input[^>]*name="q"/);
    expect(html).toContain("Tìm sản phẩm");
    const trigger = html.match(/<button[^>]*aria-label="Tìm sản phẩm"[^>]*>/)?.[0] ?? "";
    expect(trigger).toContain("size-11");
  });
});

describe("MiniCart", () => {
  it("5 items: badge total quantity, newest 3 rows, +2 món khác, subtotal, both links to /cart", () => {
    flags.open = true;
    const html = renderToStaticMarkup(<MiniCart items={STORE_CART_ITEMS} cartHref="/cart" />);
    const count = STORE_CART_ITEMS.reduce((sum, item) => sum + item.quantity, 0);
    expect(html).toContain(`aria-label="Giỏ hàng, ${count} món"`);
    expect((html.match(/<li\b/g) ?? []).length).toBe(3);
    const [newest] = STORE_CART_ITEMS.slice(-1);
    expect(html.indexOf(newest.name)).toBeLessThan(html.indexOf(STORE_CART_ITEMS[2].name));
    expect(html).not.toContain(STORE_CART_ITEMS[0].name);
    expect(html).toContain("+2 món khác");
    const total = STORE_CART_ITEMS.reduce((sum, item) => sum + item.quantity * item.priceVnd, 0);
    expect(html).toContain(`${new Intl.NumberFormat("vi-VN").format(total)} ₫`);
    expect(html).toMatch(/<a[^>]*href="\/cart"[^>]*>Xem giỏ<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/cart"[^>]*>Thanh toán<\/a>/);
  });

  it("3 items: no '+N món khác'", () => {
    flags.open = true;
    const html = renderToStaticMarkup(<MiniCart items={STORE_CART_ITEMS.slice(0, 3)} cartHref="/cart" />);
    expect((html.match(/<li\b/g) ?? []).length).toBe(3);
    expect(html).not.toContain("món khác");
  });

  it("empty: Giỏ hàng trống with a shopping link and no badge", () => {
    flags.open = true;
    const html = renderToStaticMarkup(<MiniCart items={[]} cartHref="/cart" />);
    expect(html).toContain("Giỏ hàng trống");
    expect(html).toMatch(/<a[^>]*href="\/products"/);
    expect(html).not.toContain("Thanh toán");
    expect(html).toContain('aria-label="Giỏ hàng, 0 món"');
  });
});
