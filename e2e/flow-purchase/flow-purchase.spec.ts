import { test, expect, type Page, type Response } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { z } from "zod";
import messages from "../../messages/vi.json" with { type: "json" };
import { sessionApi } from "../setup/api";

const cache = `${homedir()}/work/ticket/.cache/e2e`;
const dir = process.env.FLOW_EVIDENCE_DIR ?? `${cache}/flow-purchase-${new Date().toISOString().replace(/[-:]/g, "").slice(0, 13)}`;
const fixture = z.object({ branch_ref: z.string().uuid(), sku_ref: z.string().uuid(), product_ref: z.string().uuid(), finished_lot_ref: z.string().uuid(), production_order_ref: z.string().uuid() }).parse(JSON.parse(readFileSync(process.env.FLOW_CONTEXT ?? `${cache}/flow-purchase-context.json`, "utf8")));
const placementsSchema = z.object({ items: z.array(z.object({ id: z.string(), trace_code: z.string(), available_quantity: z.coerce.number(), placed_quantity: z.coerce.number() })) });
const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const rows: { name: string; status: string; image: string; error?: string }[] = [];
const network: { path: string; status: number; message: string }[] = [];
function accounts(path: string) {
  return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).flatMap(line => {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/);
    return match ? [[match[1], match[2].trim().replace(/^(["\x27])(.*)\1$/, "$2")]] : [];
  }));
}
const qa = accounts(`${homedir()}/.local/state/dcentervn/qa/role-accounts.env`);
const customerAccounts = accounts(`${cache}/accounts.env`);
async function decoded(response: Response) {
  expect(response.status(), `${response.request().method()} ${new URL(response.url()).pathname}`).toBeLessThan(400);
  const value = await response.json();
  return value.data ?? value;
}
function changed(page: Page, path: string) {
  return page.waitForResponse(response => new URL(response.url()).pathname === path && response.request().method() === "POST");
}
async function login(page: Page, role: "WAREHOUSE" | "SALES" | "CUSTOMER") {
  const customer = role === "CUSTOMER";
  const values = customer ? customerAccounts : qa;
  const prefix = customer ? values.DEV_CUSTOMER_EMAIL ? "DEV_CUSTOMER" : "E2E_CUSTOMER" : `ROLE_${role}`;
  if (!values[`${prefix}_EMAIL`] || !values[`${prefix}_PASSWORD`]) throw Error(`Thiếu tài khoản ${role}`);
  await page.goto(customer ? "/login" : "/staff/login");
  const form = customer ? page.getByRole("dialog") : page;
  const labels = customer ? messages.customerAuth : messages.employeeAuth;
  await form.getByLabel(labels.identifier, { exact: true }).fill(values[`${prefix}_EMAIL`]);
  await form.getByLabel(labels.password, { exact: true }).fill(values[`${prefix}_PASSWORD`]).catch(() => { throw Error("Không nhập được trường bảo mật"); });
  const logged = changed(page, customer ? "/api/auth/login" : "/api/auth/staff/login");
  await form.getByRole("button", { name: labels.login, exact: true }).click();
  await decoded(await logged);
  await page.waitForURL(url => customer ? url.pathname === "/" && !url.searchParams.has("auth") : !url.pathname.startsWith("/staff/login"));
  if (new URL(page.url()).pathname.startsWith("/staff/switch-")) {
    await page.getByRole("option").filter({ hasText: "Bếp trung tâm" }).click();
    await page.waitForURL(/\/console$/);
  }
  if (!customer) {
    const response = await sessionApi(page.context()).get("/api/auth/context");
    const context = await response.json();
    expect(context.active_context.branch_id).toBe(fixture.branch_ref);
    const roles = context.contexts.find((item: { branch_id: string }) => item.branch_id === fixture.branch_ref).roles;
    expect(roles).toContain(role);
    expect(roles).not.toContain("ADMIN");
  }
}
async function pick(page: Page, label: string, text?: string) {
  const input = page.getByRole("combobox", { name: label, exact: true });
  await expect(input).toBeEnabled();
  await input.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  if (text) await page.locator("input[cmdk-input]").fill(text);
  await page.getByRole("listbox").getByRole("option").first().click();
}
async function read(page: Page, path: string) {
  const response = await sessionApi(page.context()).get(path);
  expect(response.status(), `GET ${path}`).toBe(200);
  const body = await response.json();
  return body.data ?? body;
}
async function stock(page: Page) {
  const body = await read(page, `/api/inventory/stock-levels?branch_ref=${fixture.branch_ref}&sku_ref=${fixture.sku_ref}&page_size=100`);
  return z.object({ items: z.array(z.object({ on_hand_quantity: z.coerce.number() })).nullish() }).parse(body).items?.reduce((sum, row) => sum + row.on_hand_quantity, 0) ?? 0;
}

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 });

test("Kho lên kệ, khách đặt COD, bán hàng giao và khách xem đơn", async ({ browser, baseURL }, info) => {
  test.setTimeout(420_000);
  mkdirSync(dir, { recursive: true });
  const contexts = await Promise.all(["kho", "khach", "ban-hang"].map(async role => {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, recordVideo: { dir, size: { width: 1440, height: 900 } } });
    const page = await context.newPage();
    page.on("response", response => {
      const path = new URL(response.url()).pathname;
      if (path.startsWith("/api/") && !path.startsWith("/api/auth/") && response.status() >= 400) {
        void response.json().then(body => network.push({ path, status: response.status(), message: body.message ?? body.error ?? "Không có thông báo" })).catch(() => {});
      }
    });
    return { context, page, role };
  }));
  const [warehouse, customer, sales] = contexts.map(value => value.page);
  async function step(name: string, page: Page, action: () => Promise<void>) {
    await test.step(name, async () => {
      const image = `${String(rows.length + 1).padStart(2, "0")}.png`;
      let error: string | undefined;
      try {
        await action();
        expect(await page.locator("body").innerText(), "Không lộ UUID trên trang").not.toMatch(uuid);
      } catch (cause) {
        error = cause instanceof Error ? cause.message : String(cause);
        throw cause;
      } finally {
        await page.screenshot({ path: `${dir}/${image}`, fullPage: true });
        rows.push({ name, status: error ? "FAIL" : "PASS", image, ...(error && { error }) });
        writeFileSync(`${dir}/steps.json`, JSON.stringify(rows, null, 2));
      }
    });
  }
  let shelvesBefore: z.infer<typeof placementsSchema>["items"] = [];
  let orderId = "", orderCode = "", traceCode = "", before = 0, catalogBefore = 0;
  try {
    await step("Kho đăng nhập và kiểm tra lô mới đã đạt QC", warehouse, async () => {
      await login(warehouse, "WAREHOUSE");
      const orders = await read(warehouse, "/api/production/orders?for_picker=true");
      const lot = z.object({ items: z.array(z.object({ id: z.string(), status: z.string(), order_code: z.string() })) }).parse(orders).items.find(item => item.id === fixture.production_order_ref);
      expect(lot?.status).toBe("QC_PASSED");
      before = await stock(warehouse);
      const catalog = await read(warehouse, `/api/public/catalog/${fixture.product_ref}?branch_id=${fixture.branch_ref}`);
      catalogBefore = catalog.variants.find((item: { id: string }) => item.id === fixture.sku_ref).available_quantity;
      await warehouse.goto("/inventory/shelves");
    });
    await step("Kho đưa 3 hộp lô mới lên kệ và sinh mã truy xuất", warehouse, async () => {
      const orders = await read(warehouse, "/api/production/orders?for_picker=true");
      const lot = orders.items.find((item: { id: string }) => item.id === fixture.production_order_ref);
      await warehouse.getByRole("button", { name: "Đưa lô thành phẩm lên kệ", exact: true }).click();
      await pick(warehouse, "Lô thành phẩm đã QC đạt", lot.order_code);
      await warehouse.getByLabel("Vị trí Kệ hàng", { exact: true }).fill("KE-MUA-HANG-DEV");
      await warehouse.getByLabel("Số lượng đưa lên kệ (hộp)", { exact: true }).fill("3");
      const placed = changed(warehouse, "/api/inventory/shelf-placements");
      await warehouse.getByRole("button", { name: "Xác nhận lên kệ & Sinh mã QR", exact: true }).click();
      const placement = await decoded(await placed);
      traceCode = placement.trace_code;
      shelvesBefore = placementsSchema.parse(await read(warehouse, `/api/inventory/shelf-placements?branch_ref=${fixture.branch_ref}`)).items;
      expect(placement.finished_lot_ref).toBe(fixture.finished_lot_ref);
      expect(Number(placement.available_quantity)).toBe(3);
      await expect(warehouse.getByRole("row").filter({ hasText: traceCode })).toContainText("3 / 3");
      writeFileSync(`${dir}/lot.json`, JSON.stringify({ ...fixture, trace_code: traceCode, catalog_before: catalogBefore, branch_before: before }, null, 2));
    });
    await step("Khách đăng nhập, chọn chi nhánh và thấy tồn tăng 3", customer, async () => {
      await login(customer, "CUSTOMER");
      const branchesLoaded = customer.waitForResponse(response => new URL(response.url()).pathname === "/api/public/branches");
      await customer.goto("/products");
      await decoded(await branchesLoaded);
      const branches = z.array(z.object({ id: z.string(), name: z.string() })).parse(await read(customer, "/api/public/branches"));
      const branch = branches.find(item => item.id === fixture.branch_ref);
      expect(branch).toBeDefined();
      await pick(customer, "Chi nhánh mua hàng", branch!.name);
      await expect(customer).toHaveURL(new RegExp(`branch_id=${fixture.branch_ref}`));
      const catalog = await read(customer, `/api/public/catalog/${fixture.product_ref}?branch_id=${fixture.branch_ref}`);
      expect(catalog.variants.find((item: { id: string }) => item.id === fixture.sku_ref).available_quantity).toBe(catalogBefore + 3);
      await customer.getByRole("link", { name: "Cá nục kho cà chua", exact: true }).first().click();
      await expect(customer.getByText(`Còn ${catalogBefore + 3} gói`, { exact: true })).toBeVisible();
    });
    await step("Khách thêm 1 hộp vào giỏ", customer, async () => {
      const added = customer.waitForResponse(response => /\/carts\/[^/]+\/items$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
      await customer.getByRole("button", { name: "Thêm vào giỏ hàng", exact: true }).click();
      const result = await decoded(await added);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ sku_ref: fixture.sku_ref, quantity: 1 });
      await customer.goto("/cart");
      await expect(customer.getByRole("row").filter({ hasText: "Cá nục kho cà chua" })).toBeVisible();
    });
    await step("Khách điền người nhận, tỉnh xã, địa chỉ và chọn COD", customer, async () => {
      await customer.getByRole("button", { name: "Đặt hàng", exact: true }).click();
      await customer.getByLabel("Họ tên người nhận", { exact: true }).fill("Khách mua hàng DEV");
      await customer.getByLabel("Số điện thoại", { exact: true }).fill("0900000000");
      await pick(customer, "Tỉnh/Thành", "Hà Nội");
      await pick(customer, "Xã/Phường");
      await customer.getByLabel("Địa chỉ cụ thể", { exact: true }).fill("1 Phố Huế");
      await expect(customer.getByRole("combobox", { name: "Thanh toán", exact: true })).toContainText("Trả tiền khi nhận hàng");
    });
    await step("Khách xác nhận đặt hàng và nhận mã đơn", customer, async () => {
      const created = changed(customer, "/api/sales/orders");
      await customer.getByRole("button", { name: "Xác nhận đặt hàng", exact: true }).click();
      const order = await decoded(await created);
      orderId = order.id; orderCode = order.order_code;
      expect(order.payment_method).toBe("COD");
      await expect(customer.getByRole("dialog")).toContainText(orderCode);
    });
    await step("Bán hàng đăng nhập, mở đúng đơn khách vừa đặt", sales, async () => {
      await login(sales, "SALES");
      await sales.goto("/sales/orders");
      await sales.getByRole("button", { name: orderCode, exact: true }).click();
      await expect(sales.getByRole("dialog")).toContainText("Khách mua hàng DEV");
      await expect(sales.getByRole("dialog")).toContainText("Cá nục kho cà chua");
    });
    for (const [action, label, status] of [["confirm", "Xác nhận đơn", "CONFIRMED"], ["pack", "Đóng gói", "PACKED"], ["ship", "Giao đơn", "DELIVERING"], ["deliver", "Đã giao", "DELIVERED"]]) {
      await step(`Bán hàng ${label.toLocaleLowerCase("vi")}`, sales, async () => {
        const updated = changed(sales, `/api/sales/orders/${orderId}/${action}`);
        await sales.getByRole("button", { name: label, exact: true }).click();
        if (action === "ship") {
          await pick(sales, "Người giao", qa.ROLE_SALES_EMAIL);
          await sales.getByRole("dialog").getByRole("button", { name: label, exact: true }).click();
        }
        const result = await decoded(await updated);
        expect(result.status).toBe(status);
        if (action === "ship") {
          const profile = await read(sales, "/api/auth/me");
          expect(result.assigned_driver_ref).toBe(profile.id);
        }
        if (action === "pack") {
          expect(await stock(warehouse)).toBe(before - 1);
          const catalog = await read(customer, `/api/public/catalog/${fixture.product_ref}?branch_id=${fixture.branch_ref}`);
          expect(catalog.variants.find((item: { id: string }) => item.id === fixture.sku_ref).available_quantity).toBe(catalogBefore + 2);
        }
        await expect(sales.getByRole("dialog").getByText({ CONFIRMED: "Đã xác nhận", PACKED: "Đã đóng gói", DELIVERING: "Đang giao", DELIVERED: "Đã giao" }[status] ?? status, { exact: true }).first()).toBeVisible();
      });
    }
    await step("Khách xem đơn của tôi đã giao, món và lịch sử trạng thái", customer, async () => {
      await customer.goto("/orders");
      const link = customer.getByRole("link").filter({ hasText: orderCode });
      await expect(link).toContainText("Đã giao");
      await link.click();
      await expect(customer.getByRole("heading", { name: new RegExp(orderCode) })).toContainText("Đã giao");
      await expect(customer.getByRole("row").filter({ hasText: "Cá nục kho cà chua" })).toBeVisible();
      const history = customer.locator("section").filter({ has: customer.getByRole("heading", { name: "Lịch sử trạng thái" }) });
      for (const label of ["Chờ thanh toán", "Đã xác nhận", "Đã đóng gói", "Đang giao", "Đã giao"]) await expect(history).toContainText(label);
    });
    await step("Kiểm API: kệ và tồn giảm 1, COD thu tiền thành công", warehouse, async () => {
      const placements = placementsSchema.parse(await read(warehouse, `/api/inventory/shelf-placements?branch_ref=${fixture.branch_ref}`));
      expect(placements.items).toHaveLength(shelvesBefore.length);
      const consumed = placements.items.filter(item => item.available_quantity !== shelvesBefore.find(previous => previous.id === item.id)?.available_quantity);
      expect(consumed).toHaveLength(1);
      const lot = consumed[0];
      const previous = shelvesBefore.find(item => item.id === lot.id)!;
      expect(lot.available_quantity).toBe(previous.available_quantity - 1);
      const catalog = await read(customer, `/api/public/catalog/${fixture.product_ref}?branch_id=${fixture.branch_ref}`);
      expect(catalog.variants.find((item: { id: string }) => item.id === fixture.sku_ref).available_quantity).toBe(catalogBefore + 2);
      expect(await stock(warehouse)).toBe(before - 1);
      const order = await read(customer, `/api/sales/orders/${orderId}?branch_id=${fixture.branch_ref}`);
      expect(order).toMatchObject({ status: "DELIVERED", payment_method: "COD", payment_status: "SUCCESS", reservation_state: "CONSUMED" });
      expect(order.items).toHaveLength(1);
      expect(order.state_history.map((entry: { to_state: string }) => entry.to_state)).toEqual(["AWAITING_PAYMENT", "CONFIRMED", "PACKED", "DELIVERING", "DELIVERED"]);
      writeFileSync(`${dir}/verification.json`, JSON.stringify({ order_code: orderCode, trace_code: traceCode, consumed_trace_code: lot.trace_code, shelf_before: previous.available_quantity, shelf_after: lot.available_quantity, catalog_before: catalogBefore, catalog_after: catalogBefore + 2, branch_before: before, branch_after: await stock(warehouse), payment_method: order.payment_method, payment_status: order.payment_status }, null, 2));
      await warehouse.reload();
      await expect(warehouse.getByRole("row").filter({ hasText: lot.trace_code })).toContainText(`${lot.available_quantity} / ${lot.placed_quantity}`);
    });
  } finally {
    writeFileSync(`${dir}/network-errors.json`, JSON.stringify(network, null, 2));
    writeFileSync(`${dir}/KICH-BAN.md`, `# Vòng mua hàng DEV qua portal\n\nLô QC đạt: ${fixture.finished_lot_ref}. Mã truy xuất: ${traceCode || "chưa sinh"}. Đơn: ${orderCode || "chưa tạo"}.\n\nMỗi vai đăng nhập qua UI bằng tài khoản riêng, không có ADMIN. Dữ liệu chuẩn bị bằng seed_trace_demo.py --new, TRACE_PREPARE_ONLY=1, TRACE_QUANTITY=3. Không giả lập API. Inventory chọn lô theo FEFO và kệ theo placed_at/id; kiểm snapshot toàn bộ kệ trước/sau, đúng một kệ giảm 1 và tồn SKU giảm 1, không ép xuất lô mới khi còn lô cũ.\n\n${rows.map((row, index) => `${index + 1}. ${row.status} · ${row.name} · [Ảnh](${row.image})${row.error ? `\n\n   ${row.error.replaceAll("\n", " ")}` : ""}`).join("\n\n")}\n\nKết quả Playwright: ${info.status}. Các bước sau lỗi đầu tiên chưa chạy. Chi tiết HTTP: [network-errors.json](network-errors.json). Video từng vai và trace Playwright trong thư mục này.\n`);
    for (const { context, role, page } of contexts) {
      const video = page.video();
      await context.close();
      if (video) await video.saveAs(`${dir}/${role}.webm`);
    }
  }
});
