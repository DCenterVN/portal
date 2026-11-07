import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";
import shared from "../../playwright.config";

export default defineConfig({
  ...shared,
  testDir: ".",
  testMatch: process.env.E2E_SPEC || "memberships.spec.ts",
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3003",
    launchOptions: { slowMo: 500 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    video: { mode: "on", size: { width: 1280, height: 800 }, show: { actions: { duration: 1200, position: "top", fontSize: 20 }, test: { level: "step", position: "bottom", fontSize: 22 } } },
  },
  outputDir: resolve(process.env.E2E_OUTPUT_DIR || "/home/dawn/work/ticket/.cache/e2e/branch-5c/run"),
  projects: [{ name: "desktop", use: { viewport: { width: 1280, height: 800 } } }],
  webServer: undefined,
});
