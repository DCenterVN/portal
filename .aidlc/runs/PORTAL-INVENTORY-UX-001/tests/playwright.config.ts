import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const baseURL = process.env.PORTAL_IT_BASE ?? "http://127.0.0.1:3003";
if (new URL(baseURL).port !== "3003") throw new Error("Runtime UX phải dùng cổng 3003");

export default defineConfig({
  testDir: `${root}e2e`, outputDir: `${root}.aidlc/runs/PORTAL-INVENTORY-UX-001/artifacts/e2e-web/results`,
  reporter: "list", fullyParallel: false, workers: 1, retries: 0, repeatEach: 1, updateSnapshots: "none",
  snapshotPathTemplate: "{testDir}/visual/baseline/{arg}-{projectName}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" } },
  use: { baseURL, browserName: "chromium", headless: true, trace: "off", video: "off", screenshot: "off",
    launchOptions: { executablePath: process.env.PW_BROWSER_PATH ?? "/opt/brave.com/brave/brave" } },
  projects: [
    { name: "chromium", testMatch: ["**/inventory-ux/*.spec.ts", "**/supplier-contract/*.spec.ts"],
      use: { viewport: { width: 1440, height: 900 }, storageState: process.env.PORTAL_WAREHOUSE_STATE ?? "/home/dawn/work/ticket/.cache/tmp/supplier-bf3-storage.json" } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
