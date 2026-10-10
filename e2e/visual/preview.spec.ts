import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";

// VISUAL_BASELINE=1 shoots the token swatch from Main.dc.html (file://) into e2e/visual/baseline/tokens-*.png;
// the normal run shoots the app and only reads the committed baseline.
const BASELINE = process.env.VISUAL_BASELINE === "1";
const PREVIEW_DIR = process.env.PREVIEW_DIR || join(homedir(), "dawn-dotfiles/brain/inbox/portal-ui-preview");
const preview = (file: string) => pathToFileURL(join(PREVIEW_DIR, file)).href;

// 23 light tokens of Main.dc.html (`[data-theme]{…}`); dark overrides 20 of them, --p/--p-hover inherit.
const COLOR_TOKENS = [
  "l0", "l1", "l1-2", "line", "line-strong", "fg", "fg-2", "fg-3", "p", "p-hover", "p-text", "p-soft",
  "ok", "ok-soft", "warn", "warn-soft", "err", "err-soft", "glass-l2", "glass-l3", "glass-edge", "scrim",
];
const panel = (theme: string) =>
  `<div data-theme="${theme}" style="display:grid;grid-template-columns:repeat(6,40px);gap:8px;padding:20px;width:320px;background:var(--l0)">` +
  COLOR_TOKENS.map((t) => `<div style="height:40px;background:var(--${t})"></div>`).join("") +
  `<div style="height:40px;background:var(--l1);box-shadow:var(--shadow-l3)"></div></div>`;
const SWATCH = `<div id="swatch" style="display:flex;flex-direction:column;width:320px">${panel("light")}${panel("dark")}</div>`;
const SWATCH_CSS = "body>*:not(#swatch){display:none!important}#swatch,#swatch *{box-sizing:border-box;margin:0;border:0}";

async function settle(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => document.fonts.ready);
}

test("tokens", async ({ page }) => {
  await page.goto(BASELINE ? preview("Main.dc.html") : "/staff/login");
  await page.evaluate(([html, css]) => {
    document.body.insertAdjacentHTML("beforeend", html);
    const style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
  }, [SWATCH, SWATCH_CSS]);
  await settle(page);
  // Strict, not OD-2's 0.02: one cell is ~1.1% of the image, so the screen bar would let a 1-token change through.
  await expect(page.locator("#swatch")).toHaveScreenshot("tokens.png", { maxDiffPixels: 0, threshold: 0 });
});

// A screen turns itself on once its canvas baseline (OD-1, shot from the published canvas in slice U) sits at
// e2e/visual/baseline/screens/<name>-<project>.png; the spec itself never changes (frame-locked in K7).
// Routes: plan UX + slices U1–U10 (OD-3: `/` = Landing logged out, Home logged in). `demo` ids come from mocks/ in U.
// `preview` = the canvas artboard the baseline is shot from.
const SCREENS = [
  { name: "Main", preview: "Main.dc.html", route: null, project: "desktop" },
  { name: "Landing", preview: "Landing.dc.html", route: "/", project: "desktop" },
  { name: "LandingMobile", preview: "LandingMobile.dc.html", route: "/", project: "mobile" },
  { name: "StoreHome", preview: "StoreHome.dc.html", route: "/", project: "desktop" },
  { name: "StoreHomeMobile", preview: "StoreHomeMobile.dc.html", route: "/", project: "mobile" },
  { name: "StoreCatalog", preview: "StoreCatalog.dc.html", route: "/products", project: "desktop" },
  { name: "StoreCatalogMobile", preview: "StoreCatalogMobile.dc.html", route: "/products", project: "mobile" },
  { name: "StoreProduct", preview: "StoreProduct.dc.html", route: "/products/demo", project: "desktop" },
  { name: "StoreProductMobile", preview: "StoreProductMobile.dc.html", route: "/products/demo", project: "mobile" },
  { name: "StoreCheckout", preview: "StoreCheckout.dc.html", route: "/cart", project: "desktop" },
  { name: "StoreCheckoutMobile", preview: "StoreCheckoutMobile.dc.html", route: "/cart", project: "mobile" },
  { name: "StoreAuth", preview: "StoreAuth.dc.html", route: "/cart", project: "desktop" },
  { name: "StoreAuthMobile", preview: "StoreAuthMobile.dc.html", route: "/cart", project: "mobile" },
  { name: "ConsoleDashboard", preview: "ConsoleDashboard.dc.html", route: "/console", project: "desktop" },
  { name: "ConsoleTable", preview: "ConsoleTable.dc.html", route: "/sales/orders", project: "desktop" },
  { name: "ConsoleRecord", preview: "ConsoleRecord.dc.html", route: "/sales/orders/demo", project: "desktop" },
  { name: "ConsoleForm", preview: "ConsoleForm.dc.html", route: "/sales/products/new", project: "desktop" },
  { name: "ConsoleLogin", preview: "ConsoleLogin.dc.html", route: "/staff/login", project: "desktop" },
  { name: "States", preview: "States.dc.html", route: "/states-preview", project: "desktop" },
  { name: "StatesMobile", preview: "StatesMobile.dc.html", route: "/states-preview", project: "mobile" },
] as const;

for (const screen of SCREENS) {
  test(screen.name, async ({ page }, info) => {
    test.skip(info.project.name !== screen.project, `chỉ chụp ở ${screen.project}`);
    test.skip(BASELINE, "VISUAL_BASELINE chỉ sinh baseline token; ảnh màn lấy từ canvas");
    test.skip(!screen.route, "Main là trang token, đã so qua test tokens");
    const file = join(info.project.testDir, "visual/baseline/screens", `${screen.name}-${screen.project}.png`);
    test.skip(!existsSync(file), `chưa có baseline canvas: ${file}`);
    await page.goto(screen.route ?? "/");
    await settle(page);
    await expect(page).toHaveScreenshot(["screens", `${screen.name}.png`], { fullPage: true });
  });
}
