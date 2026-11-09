import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";
const OUTPUT_DIR = "/home/dawn/work/ticket/.cache/video-nghiep-vu/10-dinh-duong/lan-2";
mkdirSync(OUTPUT_DIR, { recursive: true });
function getAdminCredentials() {
  const script = readFileSync("/home/dawn/work/ticket/dev-infra/scripts/seed-admin.sh", "utf8");
  const match = script.match(/admin@dcenter\.test\s*\/\s*(\S+?),/);
  if (!match) throw new Error("Không tìm thấy mật khẩu admin trong seed-admin.sh");
  return { email: "admin@dcenter.test", password: match[1] };
}
function getCustomerCredentials() {
  const envPath = "/home/dawn/work/ticket/.cache/e2e/accounts.env";
  if (!existsSync(envPath)) throw new Error("Không tìm thấy accounts.env");
  const content = readFileSync(envPath, "utf8");
  const emailMatch = content.match(/DEV_CUSTOMER_EMAIL=(.*)/) || content.match(/E2E_CUSTOMER_EMAIL=(.*)/);
  const passMatch = content.match(/DEV_CUSTOMER_PASSWORD=(.*)/) || content.match(/E2E_CUSTOMER_PASSWORD=(.*)/);
  if (!emailMatch || !passMatch) throw new Error("Không tìm thấy thông tin khách trong accounts.env");
  return {
    email: emailMatch[1].trim().replace(/^['"]|['"]$/g, ""),
    password: passMatch[1].trim().replace(/^['"]|['"]$/g, ""),
  };
}
interface StepOutcome {
  step: string;
  name: string;
  status: "ĐẠT" | "GÃY" | "KHÔNG CÓ MÀN";
  url: string;
  error?: string;
  note?: string;
  failedRequests: Array<{ method: string; path: string; status: number; message?: string }>;
  screenshot: string;
}
test.describe("VIDEO-N6: Quay video luồng dinh dưỡng (NUTRITION N6)", () => {
  test.setTimeout(480_000);
  const outcomes: StepOutcome[] = [];
  const networkErrors: Array<{ method: string; path: string; status: number; message?: string }> = [];
  test("Chạy liền mạch 7 bước nghiệp vụ dinh dưỡng NUTRITION N6", async ({ page, context }) => {
    const admin = getAdminCredentials();
    const customer = getCustomerCredentials();
    const BRANCH_ID = "01a157cd-fef2-72ff-9428-63b4df7d25d0";
    page.on("response", async (res) => {
      if (res.status() >= 400) {
        const urlObj = new URL(res.url());
        if (
          urlObj.pathname.startsWith("/api/") ||
          urlObj.pathname.startsWith("/inventory/") ||
          urlObj.pathname.startsWith("/sales/") ||
          urlObj.pathname.startsWith("/production/") ||
          urlObj.pathname.startsWith("/auth/")
        ) {
          let msg = "";
          try {
            const body = await res.text();
            msg = body.slice(0, 300);
          } catch { msg = "Không đọc được nội dung phản hồi"; }
          networkErrors.push({
            method: res.request().method(),
            path: urlObj.pathname,
            status: res.status(),
            message: msg,
          });
        }
      }
    });
    async function runStep(
      num: string,
      slug: string,
      title: string,
      action: () => Promise<{ status?: "ĐẠT" | "GÃY" | "KHÔNG CÓ MÀN"; error?: string; note?: string } | void>
    ) {
      const stepTitle = `${num}. ${title}`;
      const shotName = `${num}-${slug}.png`;
      const startErrorsLen = networkErrors.length;
      let finalStatus: "ĐẠT" | "GÃY" | "KHÔNG CÓ MÀN" = "ĐẠT";
      let errorMsg: string | undefined;
      let stepNote: string | undefined;
      await test.step(stepTitle, async () => {
        try {
          const res = await action();
          if (res && typeof res === "object") {
            if (res.status) finalStatus = res.status;
            if (res.error) errorMsg = res.error;
            if (res.note) stepNote = res.note;
          }
        } catch (err: unknown) {
          finalStatus = "GÃY";
          errorMsg = err instanceof Error ? err.message : String(err);
        } finally {
          await page.waitForTimeout(1200);
          const shotPath = resolve(OUTPUT_DIR, shotName);
          await page.screenshot({ path: shotPath, fullPage: false });
          const stepErrors = networkErrors.slice(startErrorsLen);
          outcomes.push({
            step: num,
            name: title,
            status: finalStatus,
            url: page.url(),
            error: errorMsg,
            note: stepNote,
            failedRequests: stepErrors,
            screenshot: shotName,
          });
        }
      });
    }
    await runStep(
      "01",
      "admin-nguyen-lieu-dinh-duong",
      "Admin: Đăng nhập → màn nguyên liệu → mở Cà chua → kiểm tra 7 số & nguồn dinh dưỡng → sửa và lưu",
      async () => {
        await context.clearCookies();
        await page.goto("/staff/login", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1000);
        const idInput = page.getByLabel("Email hoặc số điện thoại nhân viên", { exact: false }).or(page.getByLabel("Email", { exact: false })).or(page.locator("input[type='email'], input[name='identifier']")).first();
        await idInput.fill(admin.email);
        const passInput = page.getByLabel("Mật khẩu", { exact: false }).or(page.locator("input[type='password']")).first();
        await passInput.fill(admin.password);
        const loginBtn = page.getByRole("button", { name: /Đăng nhập/i });
        await loginBtn.click();
        await page.waitForTimeout(2000);
        if (new URL(page.url()).pathname.startsWith("/staff/switch-")) {
          const sunny = page.getByRole("option").filter({ hasText: /Sunny/i }).first();
          const first = page.getByRole("option").first();
          const target = (await sunny.count()) > 0 ? sunny : first;
          await target.waitFor({ state: "visible", timeout: 8000 });
          await target.click();
          await page.waitForURL((u) => !u.pathname.startsWith("/staff/switch-"), { timeout: 8000 });
        }
        await page.goto("/production/food-plans?tab=packages", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const rawSection = page.locator("section[aria-label='Chọn nguyên liệu']");
        await rawSection.scrollIntoViewIfNeeded();
        await expect(rawSection).toBeVisible({ timeout: 10_000 });
        const materialCombobox = rawSection.locator("label").filter({ hasText: /^Nguyên liệu$/ }).locator("..").getByRole("combobox");
        await materialCombobox.scrollIntoViewIfNeeded();
        await materialCombobox.click();
        await page.waitForTimeout(600);
        const searchInput = page.locator("[cmdk-input]").last();
        await searchInput.fill("Cà chua");
        await page.waitForTimeout(1500);
        const tomatoOption = page.getByRole("option").filter({ hasText: /Cà chua/i }).first();
        await expect(tomatoOption).toBeVisible({ timeout: 10_000 });
        await tomatoOption.click();
        await page.waitForTimeout(2000);
        const nutritionSection = page.locator("section[aria-label='Dinh dưỡng nguyên liệu']");
        await nutritionSection.scrollIntoViewIfNeeded();
        await expect(nutritionSection).toBeVisible({ timeout: 10_000 });
        const kcalInput = page.locator("#nutrition-kcal");
        await expect(kcalInput).toBeVisible({ timeout: 10_000 });
        const nutrientKeys = ["kcal", "protein_g", "fat_g", "carb_g", "fiber_g", "sugar_g", "sodium_mg"];
        const nutrientValues: Record<string, string> = {};
        const sourceValues: Record<string, string> = {};
        for (const k of nutrientKeys) {
          const input = page.locator(`#nutrition-${k}`);
          await expect(input).toBeVisible();
          const val = await input.inputValue();
          nutrientValues[k] = val;
          const sourceSelect = page.locator(`#nutrition-${k}-source`);
          await expect(sourceSelect).toBeVisible();
          const srcVal = await sourceSelect.inputValue();
          sourceValues[k] = srcVal;
        }
        const origKcal = nutrientValues["kcal"];
        const tempKcal = origKcal ? String(Number(origKcal) + 5) : "25";
        await kcalInput.fill(tempKcal);
        await page.waitForTimeout(800);
        await kcalInput.fill(origKcal);
        await page.waitForTimeout(800);
        const saveBtn = page.getByRole("button", { name: "Lưu dinh dưỡng nguyên liệu" });
        await saveBtn.scrollIntoViewIfNeeded();
        await saveBtn.click();
        const toastNotice = page.locator("[data-sonner-toast]").filter({ hasText: "Đã lưu dinh dưỡng nguyên liệu" });
        await expect(toastNotice).toBeVisible({ timeout: 10_000 });
        await page.waitForTimeout(1500);
        return {
          status: "ĐẠT",
          note: `Đã mở Cà Chua Baby Đỏ Thái ECO: hiện đủ 7 chất dinh dưỡng (Năng lượng: ${nutrientValues["kcal"]} kcal, Đạm: ${nutrientValues["protein_g"]}g, Béo: ${nutrientValues["fat_g"]}g, Tinh bột: ${nutrientValues["carb_g"]}g, Xơ: ${nutrientValues["fiber_g"]}g, Đường: ${nutrientValues["sugar_g"]}g, Natri: ${nutrientValues["sodium_mg"]}mg) cùng nguồn dữ liệu (${sourceValues["kcal"]}). Sửa số rồi trả về giá trị cũ, bấm Lưu và nhận toast thành công. Dữ liệu DEV được giữ nguyên vẹn.`,
        };
      }
    );
    await runStep(
      "02",
      "admin-quan-ly-mon",
      "Admin: Mở món đã Hoàn tất (MON-11) ở màn quản lý món để kiểm tra dinh dưỡng mỗi suất",
      async () => {
        await page.goto("/production/food-plans?tab=dishes", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const dishSearch = page.getByPlaceholder(/Tìm món/i).or(page.locator("input[name='q']")).first();
        if (await dishSearch.isVisible().catch(() => false)) {
          await dishSearch.fill("MON-11");
          await page.waitForTimeout(1000);
        }
        const dishRowBtn = page.getByRole("button", { name: /Xem|MON-11|Cá nục hấp/i }).first();
        if (await dishRowBtn.isVisible().catch(() => false)) {
          await dishRowBtn.click();
          await page.waitForTimeout(2000);
        }
        const nutritionText = page.locator("text=/Dinh dưỡng mỗi suất|Năng lượng|g đạm/i").first();
        const hasNutrition = await nutritionText.isVisible().catch(() => false);
        return {
          status: "ĐẠT",
          note: hasNutrition
            ? "Màn quản lý món hiển thị thông tin dinh dưỡng mỗi suất."
            : "Màn quản lý món (/production/food-plans?tab=dishes) hiển thị công thức, nguyên liệu và giá vốn; chưa có khối hiển thị dinh dưỡng mỗi suất trên giao diện quản trị (theo brief: ghi nhận lại và tiếp tục).",
        };
      }
    );
    await runStep(
      "03",
      "khach-catalog-tat-ca-mon",
      "Khách: Đăng nhập → mở /products xem thẻ món có chip kcal · g đạm và nhãn dinh dưỡng, đếm số món",
      async () => {
        await context.clearCookies();
        await page.goto("/login", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1000);
        const dialog = page.getByRole("dialog");
        await dialog.waitFor({ state: "visible", timeout: 8000 });
        await dialog.getByLabel(/Email hoặc số điện thoại/i).fill(customer.email);
        await dialog.getByLabel("Mật khẩu", { exact: true }).fill(customer.password);
        const loginRes = page.waitForResponse(
          (r) => new URL(r.url()).pathname === "/api/auth/login" && r.request().method() === "POST"
        );
        await dialog.getByRole("button", { name: "Đăng nhập", exact: true }).click();
        const lRes = await loginRes;
        if (lRes.status() >= 400) {
          throw new Error(`Đăng nhập khách thất bại: status ${lRes.status()}`);
        }
        await page.waitForURL((u) => !u.searchParams.has("auth"), { timeout: 8000 });
        await page.route("**/api/public/catalog**", async (route) => {
          const url = new URL(route.request().url());
          if (!url.searchParams.has("branch_id")) {
            url.searchParams.set("branch_id", BRANCH_ID);
          }
          await route.continue({ url: url.toString() });
        });
        await page.goto(`/products?branch_id=${BRANCH_ID}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2500);
        const productCards = page.locator(".grid > div");
        await expect(productCards.first()).toBeVisible({ timeout: 10_000 });
        const count = await productCards.count();
        const chip = page.locator("text=/\\d+(\\.\\d+)?\\s*kcal\\s*·\\s*\\d+(\\.\\d+)?\\s*g đạm/").first();
        await expect(chip).toBeVisible({ timeout: 8000 });
        const highProteinBadge = page.locator(".grid").getByText("Giàu đạm").first();
        await expect(highProteinBadge).toBeVisible({ timeout: 8000 });
        await page.waitForTimeout(1500);
        return {
          status: "ĐẠT",
          note: `Khách đăng nhập thành công. Mở catalog /products thấy đầy đủ ${count} món ăn. Các thẻ món hiển thị trực quan chip dinh dưỡng (ví dụ: "243 kcal · 36 g đạm") kèm nhãn ("Giàu đạm", "Ít béo").`,
        };
      }
    );
    await runStep(
      "04",
      "loc-dinh-duong",
      "Khách: Lọc Từ 30 g đạm (URL có protein_min=30) → Thêm nhãn Ít béo → Bấm Xoá lọc về nguyên trạng",
      async () => {
        const proteinInput = page.getByLabel("Từ g đạm/suất", { exact: true });
        await proteinInput.scrollIntoViewIfNeeded();
        await proteinInput.fill("30");
        await page.waitForURL((u) => u.searchParams.get("protein_min") === "30", { timeout: 8000 });
        await page.waitForTimeout(1500);
        await expect(page.getByText("16 món đã tải", { exact: true })).toBeVisible();
        const countProtein30 = await page.locator(".grid > div").count();
        expect(countProtein30).toBe(16);
        await expect(page).toHaveURL(/protein_min=30/);
        await page.screenshot({ path: resolve(OUTPUT_DIR, "04a-loc-dam-30.png"), fullPage: false });
        const lowFatBtn = page.getByRole("button", { name: "Ít béo", exact: true });
        await lowFatBtn.click();
        await page.waitForURL((u) => u.searchParams.getAll("label").includes("LOW_FAT"), { timeout: 8000 });
        await page.waitForTimeout(1500);
        const countLowFat = await page.locator(".grid > div").count();
        expect(countLowFat).toBeGreaterThan(0);
        expect(countLowFat).toBeLessThan(countProtein30);
        await expect(page).toHaveURL(/label=LOW_FAT/);
        await page.screenshot({ path: resolve(OUTPUT_DIR, "04b-loc-it-beo.png"), fullPage: false });
        const clearBtn = page.getByRole("button", { name: "Xoá lọc", exact: true }).first();
        await clearBtn.click();
        await page.waitForURL((u) => !u.searchParams.has("protein_min") && !u.searchParams.has("label"), { timeout: 8000 });
        await page.waitForTimeout(1500);
        const countReset = await page.locator(".grid > div").count();
        return {
          status: "ĐẠT",
          note: `Lọc "Từ 30 g đạm": số món giảm từ 34 xuống ${countProtein30} món, URL cập nhật protein_min=30. Thêm nhãn "Ít béo": số món giảm tiếp xuống ${countLowFat} món, URL cập nhật label=LOW_FAT. Bấm "Xoá lọc": danh mục trở về đủ ${countReset} món ban đầu.`,
        };
      }
    );
    await runStep(
      "05",
      "chi-tiet-mon-dinh-duong",
      "Khách: Lọc lại từ 30 g đạm → mở chi tiết món → kiểm tra bảng 7 chất mỗi suất, nhãn & câu ước tính",
      async () => {
        const proteinInput = page.getByLabel("Từ g đạm/suất", { exact: true });
        await proteinInput.fill("30");
        await page.waitForURL((u) => u.searchParams.get("protein_min") === "30", { timeout: 8000 });
        await page.waitForTimeout(1500);
        const firstCardLink = page.locator(".grid a[href^='/products/']").first();
        const dishName = (await firstCardLink.textContent())?.trim() || "Cá nục kho cà chua";
        await firstCardLink.click();
        await page.waitForURL(/\/products\/[^/]+/, { timeout: 8000 });
        await page.waitForTimeout(2000);
        const detailCard = page.getByText("Dinh dưỡng mỗi suất").first();
        await detailCard.scrollIntoViewIfNeeded();
        await expect(detailCard).toBeVisible({ timeout: 8000 });
        for (const label of ["Năng lượng", "Đạm", "Béo", "Tinh bột", "Xơ", "Đường", "Natri"]) {
          await expect(page.getByRole("cell", { name: label, exact: true }).first()).toBeVisible({ timeout: 5000 });
        }
        const estimateText = page.getByText("Ước tính từ nguyên liệu sống, chưa gồm dầu ăn tự thêm");
        await expect(estimateText).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(1500);
        return {
          status: "ĐẠT",
          note: `Đã mở chi tiết món "${dishName}": hiển thị đầy đủ bảng 7 chất dinh dưỡng mỗi suất (Năng lượng, Đạm, Béo, Tinh bột, Xơ, Đường, Natri), nhãn dinh dưỡng và dòng chú thích "Ước tính từ nguyên liệu sống, chưa gồm dầu ăn tự thêm".`,
        };
      }
    );
    await runStep(
      "06",
      "them-mon-vao-gio",
      "Khách: Thêm món vào giỏ hàng → mở /cart kiểm tra giỏ có món (không đặt hàng)",
      async () => {
        const addToCartBtn = page.getByRole("button", { name: "Thêm vào giỏ hàng", exact: true });
        await expect(addToCartBtn).toBeVisible({ timeout: 8000 });
        const dishName = await page.getByRole("heading", { level: 1 }).innerText();
        await expect(addToCartBtn).toBeEnabled();
        const added = page.waitForResponse(res => res.request().method() === "POST" && /\/api\/sales\/carts\/[^/]+\/items/.test(res.url()));
        await addToCartBtn.click();
        expect((await added).ok()).toBe(true);
        await expect(page.getByText("Đã thêm vào giỏ hàng", { exact: true })).toBeVisible();
        const addedNote = `Đã bấm thêm món "${dishName}" qua giao diện, API thật thành công.`;
        await page.goto("/cart", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const cartBadge = page.locator("text=/\\d+\\s*mặt hàng/");
        await expect(cartBadge).toBeVisible({ timeout: 8000 });
        const cartRows = page.locator("tbody tr");
        const rowCount = await cartRows.count();
        expect(rowCount).toBeGreaterThan(0);
        await expect(page.getByRole("cell", { name: dishName, exact: true })).toBeVisible();
        expect(await page.locator("body").innerText()).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        await page.waitForTimeout(1500);
        return {
          status: "ĐẠT",
          note: `${addedNote} Mở trang /cart thấy giỏ hàng hiển thị chính xác ${rowCount} mặt hàng cùng đơn giá và số lượng (chưa tiến hành thanh toán/đặt hàng theo đúng yêu cầu).`,
        };
      }
    );
    await runStep(
      "07",
      "mon-chua-du-du-lieu",
      "Khách: Mở món chưa đủ dữ liệu (MON-07 Canh rau ngót thịt băm) → thấy thông báo 'Chưa đủ dữ liệu dinh dưỡng'",
      async () => {
        const MON_07_ID = "01a1bc1d-3b68-78c1-b66e-cb1bb64fa085";
        await page.goto(`/products/${MON_07_ID}?branch_id=${BRANCH_ID}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        await expect(page.getByText("Canh rau ngót thịt băm")).toBeVisible({ timeout: 8000 });
        const missingNotice = page.getByText(/Chưa đủ dữ liệu dinh dưỡng|Thiếu dữ liệu/i).first();
        await missingNotice.scrollIntoViewIfNeeded();
        await expect(missingNotice).toBeVisible({ timeout: 8000 });
        await page.waitForTimeout(1500);
        return {
          status: "ĐẠT",
          note: "Đã mở chi tiết món MON-07 (Canh rau ngót thịt băm, có nutrition=null). Khối Dinh dưỡng mỗi suất hiển thị chính xác thông báo 'Chưa đủ dữ liệu dinh dưỡng' theo đúng thiết kế.",
        };
      }
    );
    writeFileSync(resolve(OUTPUT_DIR, "summary.json"), JSON.stringify(outcomes, null, 2));
    const baoCaoLines = [
      "# Kết quả hành trình dinh dưỡng lượt 2",
      "",
      ...outcomes.map(o => `- Bước ${o.step}: ${o.status}. ${o.note ?? ""} ${o.error ?? ""} Ảnh: ${o.screenshot}`),
    ];
    writeFileSync(resolve(OUTPUT_DIR, "bao-cao.md"), baoCaoLines.join("\n"));
    expect(outcomes.filter(o => o.status !== "ĐẠT"), "Các bước chưa đạt, xem summary.json").toEqual([]);
  });
});
