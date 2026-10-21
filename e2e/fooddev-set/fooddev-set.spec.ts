import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { z } from "zod";
import { decodePlatform, roleMatrixSchema } from "../../lib/api/platform-contract";
import messages from "../../messages/vi.json" with { type: "json" };

const matrixPath = "/api/org/company/role-matrix";
const permission = "production:material_requirement:read";
const identity = z.object({ id: z.string().uuid(), status: z.string() });
const component = z.object({ sku_ref: z.string().uuid(), quantity: z.union([z.string(), z.number()]).transform(String), uom: z.string() });
const planSchema = z.object({
  id: z.string().uuid(), revision: z.number().int().positive(), servings_per_set: z.number(),
  planned_quantity: z.union([z.string(), z.number()]).transform(String), components: z.array(component),
}).passthrough();
const material = z.object({ id: z.string().uuid(), name: z.string(), selectable: z.boolean(), uom_code: z.string() });
const catalog = z.object({ items: z.array(material), next_cursor: z.string() });
const line = z.object({ sku_ref: z.string().uuid(), quantity: z.string(), uom: z.string() });
const requirements = z.object({
  all_lines: z.array(line), lines: z.array(line), total: z.number(), hidden_count: z.number(), plan_revisions: z.record(z.number()),
});

function accountsFromFile() {
  const file = (process.env.QA_ROLE_ENV ?? `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  let source: string;
  try { source = readFileSync(file, "utf8"); }
  catch { throw new Error("Cần QA_ROLE_ENV và stack QA thật."); }
  const values: Record<string, string> = {};
  for (const text of source.split(/\r?\n/)) {
    const match = text.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  for (const [key, value] of Object.entries(process.env)) if (value !== undefined) values[key] = value;
  return values;
}
async function login(page: Page, accounts: Record<string, string>, role: "ADMIN" | "FOOD_DEV" | "WAREHOUSE") {
  const email = accounts[`ROLE_${role}_EMAIL`], password = accounts[`ROLE_${role}_PASSWORD`];
  if (!email || !password) throw new Error(`Thiếu tài khoản QA ${role}.`);
  await page.goto("/staff/login");
  await page.getByLabel(messages.employeeAuth.identifier, { exact: true }).fill(email);
  await page.getByLabel(messages.employeeAuth.password, { exact: true }).fill(password)
    .catch(() => { throw new Error("Không nhập được mật khẩu QA."); });
  const logged = page.waitForResponse(r => r.url().endsWith("/api/auth/staff/login") && r.request().method() === "POST");
  await page.getByRole("button", { name: messages.employeeAuth.login, exact: true }).click();
  expect((await logged).status(), `Đăng nhập ${role}`).toBe(200);
  await page.waitForURL(/\/(console|platform(?:\/role-matrix)?)$/);
}
async function warehouseGrants(request: APIRequestContext) {
  const result = await request.get(matrixPath);
  expect(result.status()).toBe(200);
  const matrix = decodePlatform(await result.json(), roleMatrixSchema);
  expect(matrix.WAREHOUSE, "Baseline phải có WAREHOUSE").toBeDefined();
  return matrix.WAREHOUSE;
}
async function readPlan(request: APIRequestContext, path: string) {
  const result = await request.get(path);
  expect(result.status()).toBe(200);
  return decodePlatform(await result.json(), planSchema);
}
// Oracle uses integer thousandths independently of production decimal code.
function quantityFor(portions: bigint) {
  const thousandths = 333n * portions;
  return `${thousandths / 1000n}.${String(thousandths % 1000n).padStart(3, "0")}`;
}

test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("FOODDEV-SET E1 QA thật", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });
  test("FOOD_DEV tạo và sửa set; kho chỉ đọc; revoke có hiệu lực ngay và restore đúng snapshot", async ({ browser, baseURL, page }) => {
    const accounts = accountsFromFile();
    const warehouse = await browser.newContext({ baseURL });
    const admin = await browser.newContext({ baseURL });
    const warehousePage = await warehouse.newPage(), adminPage = await admin.newPage();
    let snapshot: string[] | undefined;
    let requirementPath: string | undefined;
    let grantsChanged = false;
    try {
      await login(page, accounts, "FOOD_DEV");
      await login(warehousePage, accounts, "WAREHOUSE");
      await login(adminPage, accounts, "ADMIN");
      snapshot = [...await warehouseGrants(admin.request)];
      expect(snapshot).toContain(permission);
      const tag = randomUUID(), name = `E1 product ${tag}`, title = `E1 target ${tag}`, setCode = `E1-${tag}`;
      await page.goto("/production/targets");
      // PageHeader renders before the optional EmptyState action with the same name.
      await page.getByRole("button", { name: "Tạo chỉ tiêu", exact: true }).first().click();
      await page.getByLabel("Tên sản phẩm", { exact: true }).fill(name);
      await page.getByLabel("Slug sản phẩm", { exact: true }).fill(`e1-${tag}`);
      const productCreated = page.waitForResponse(r => r.url().endsWith("/api/sales/products") && r.request().method() === "POST");
      await page.getByRole("button", { name: "Tạo product DRAFT", exact: true }).click();
      const productResponse = await productCreated;
      expect(productResponse.status()).toBe(201);
      const product = decodePlatform(await productResponse.json(), z.object({ product: identity })).product;
      expect(product.status).toBe("DRAFT");
      await expect(page.getByRole("combobox", { name: "Sản phẩm", exact: true })).toHaveValue(name);
      await page.getByLabel("Tiêu đề", { exact: true }).fill(title);
      await page.getByLabel("Từ ngày", { exact: true }).fill("2026-10-20");
      await page.getByLabel("Đến ngày", { exact: true }).fill("2026-10-21");
      await page.getByLabel("Tổng suất chỉ tiêu", { exact: true }).fill("8");
      const targetCreated = page.waitForResponse(r => r.url().endsWith("/api/production/targets") && r.request().method() === "POST");
      await page.getByRole("button", { name: "Lưu chỉ tiêu", exact: true }).click();
      const targetResponse = await targetCreated;
      expect(targetResponse.status()).toBe(201);
      const target = decodePlatform(await targetResponse.json(), identity);
      expect(target.status).toBe("APPROVED");
      const targetRow = page.getByRole("row").filter({ has: page.getByText(title, { exact: true }) });
      await targetRow.getByRole("link", { name: "Tạo set", exact: true }).click();
      const catalogLoaded = page.waitForResponse(r => new URL(r.url()).pathname === "/api/sales/skus" && r.request().method() === "GET");
      // Header button precedes the EmptyState button with the same name.
      await page.getByRole("button", { name: "Tạo set", exact: true }).first().click();
      const catalogResponse = await catalogLoaded;
      expect(catalogResponse.status()).toBe(200);
      const candidates = decodePlatform(await catalogResponse.json(), catalog).items.filter(m => m.selectable && m.uom_code === "KG").slice(0, 3);
      expect(candidates, "Trang picker cần ít nhất 3 nguyên liệu KG để kiểm oracle").toHaveLength(3);
      await page.getByLabel("Mã set", { exact: true }).fill(setCode);
      await page.getByLabel("Khẩu phần", { exact: true }).fill(`Khẩu phần ${tag}`);
      for (const item of candidates) await page.getByRole("button", { name: `Chọn ${item.name}`, exact: true }).click();
      for (let i = 1; i <= 3; i++) await page.getByLabel(`Định lượng ${i}`, { exact: true }).fill("0.333");
      const picker = page.getByRole("region", { name: "Chọn nguyên liệu", exact: true });
      const category = picker.getByRole("combobox", { name: "Danh mục", exact: true }); // getByLabel text would include the option texts
      await expect.poll(() => category.locator("option").count(), { timeout: 20000 }).toBeGreaterThan(1);
      const categorySlug = await category.locator("option").nth(1).getAttribute("value");
      expect(categorySlug, "Catalog có danh mục thật").toBeTruthy();
      if (!categorySlug) throw new Error("Thiếu danh mục catalog QA.");
      await category.selectOption(categorySlug);
      const categoryFiltered = page.waitForResponse(r => new URL(r.url()).pathname === "/api/sales/skus" && new URL(r.url()).searchParams.get("category_slug") === categorySlug);
      await picker.getByRole("button", { name: "Lọc nguyên liệu", exact: true }).click();
      expect((await categoryFiltered).status()).toBe(200);
      await expect(page.getByLabel("Định lượng 3", { exact: true })).toHaveValue("0.333");
      const created = page.waitForResponse(r => r.url().endsWith(`/api/production/targets/${target.id}/food-plans`) && r.request().method() === "POST");
      await page.getByRole("button", { name: "Lưu set", exact: true }).click();
      const createdResponse = await created;
      expect(createdResponse.status()).toBe(201);
      const original = decodePlatform(await createdResponse.json(), planSchema);
      expect(original.revision).toBe(1);
      expect(original.servings_per_set).toBe(4);
      const planPath = `/api/production/food-plans/${original.id}`;
      requirementPath = `/api/production/targets/${target.id}/material-requirements`;
      await page.reload();
      const setRow = page.getByRole("row").filter({ has: page.getByText(setCode, { exact: true }) });
      await expect(setRow.getByRole("cell", { name: String(original.revision), exact: true })).toBeVisible();
      await setRow.getByRole("button", { name: "Sửa set", exact: true }).click();
      await page.getByLabel("Số kit", { exact: true }).fill("2");
      const updated = page.waitForResponse(r => r.url().endsWith(planPath) && r.request().method() === "PUT");
      await page.getByRole("button", { name: "Lưu set", exact: true }).click();
      const updateResponse = await updated;
      expect(updateResponse.status()).toBe(200);
      expect(z.object({ expected_revision: z.number() }).parse(updateResponse.request().postDataJSON()).expected_revision).toBe(original.revision);
      const saved = decodePlatform(await updateResponse.json(), planSchema);
      expect(saved.revision).toBe(original.revision + 1);
      expect(saved.planned_quantity).toBe("8.000");
      await page.reload();
      await expect(setRow.getByRole("cell", { name: String(saved.revision), exact: true })).toBeVisible();
      expect(await readPlan(page.request, planPath)).toEqual(saved);
      await warehousePage.goto(`/production/material-requirements?target_id=${target.id}`);
      await expect(warehousePage.getByRole("heading", { name: "Nhu cầu nguyên liệu", exact: true })).toBeVisible();
      for (const item of candidates) {
        const row = warehousePage.getByRole("row").filter({ hasText: item.name }).first();
        await expect(row.getByRole("cell", { name: `${quantityFor(8n)} KG`, exact: true })).toBeVisible();
      }
      const before = await warehouse.request.get(requirementPath);
      expect(before.status()).toBe(200);
      const full = decodePlatform(await before.json(), requirements);
      expect(full.total).toBe(3);
      expect(full.plan_revisions[original.id]).toBe(saved.revision);
      for (const row of full.all_lines) expect(row.quantity).toBe(quantityFor(8n));
      await warehousePage.getByLabel("Tháng", { exact: true }).selectOption("1");
      await warehousePage.getByLabel("Bao gồm nguyên liệu chưa biết mùa", { exact: true }).uncheck();
      await warehousePage.getByLabel("Giá từ", { exact: true }).fill("1");
      const filtered = warehousePage.waitForResponse(r => r.url().includes(`${requirementPath}?`) && r.request().method() === "GET");
      await warehousePage.getByRole("button", { name: "Lọc nguyên liệu", exact: true }).click();
      const filteredResponse = await filtered;
      expect(filteredResponse.status()).toBe(200);
      const view = decodePlatform(await filteredResponse.json(), requirements);
      expect(view.all_lines).toEqual(full.all_lines);
      expect(view.hidden_count + view.lines.length).toBe(full.total);
      for (const [method, path, data] of [
        ["POST", "/api/production/targets", { title, lines: [{ product_ref: product.id, target_quantity: "4", uom: "EA" }] }],
        ["POST", `/api/production/targets/${target.id}/food-plans`, { product_ref: product.id }],
        ["PUT", planPath, { expected_revision: saved.revision, planned_quantity: "12", servings_per_set: 4, components: saved.components }],
        ...["review", "publish", "resume-handoff"].map((action): [string, string, unknown] => ["POST", `${planPath}/${action}`, {}]),
      ] satisfies Array<[string, string, unknown]>) {
        const denied = await warehouse.request.fetch(path, { method, data });
        expect(denied.status(), `${method} ${path}`).toBe(403);
        expect(await readPlan(page.request, planPath)).toEqual(saved);
      }
      grantsChanged = true;
      const revoked = await admin.request.put(`${matrixPath}/roles/WAREHOUSE`, { data: { actions: snapshot.filter(key => key !== permission) } });
      expect(revoked.status()).toBe(200);
      expect((await warehouse.request.get(requirementPath)).status(), "Request kế tiếp sau revoke").toBe(403);
    } finally {
      try {
        if (snapshot && grantsChanged) {
          let restored = await admin.request.put(`${matrixPath}/roles/WAREHOUSE`, { data: { actions: snapshot } });
          if (restored.status() === 401) {
            await login(adminPage, accounts, "ADMIN");
            restored = await admin.request.put(`${matrixPath}/roles/WAREHOUSE`, { data: { actions: snapshot } });
          }
          expect(restored.status(), "Restore grants phải thành công").toBe(200);
          expect([...(await warehouseGrants(admin.request))].sort()).toEqual([...snapshot].sort());
          if (requirementPath) expect((await warehouse.request.get(requirementPath)).status(), "Kho đọc lại sau restore").toBe(200);
        }
      } finally {
        await warehouse.close();
        await admin.close();
      }
    }
  });
});
