import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";
import shared from "../../playwright.config";

export default defineConfig({
  ...shared,
  testDir: ".",
  testMatch: "account.spec.ts",
  workers: 1,
  retries: 0,
  use: {
    ...shared.use,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    video: process.env.E2E_RECORD === "1" ? { mode: "on", size: { width: 1280, height: 800 } } : "off",
    trace: process.env.E2E_RECORD === "1" ? "on" : "off",
  },
  outputDir: resolve(process.env.E2E_OUTPUT_DIR || "/home/dawn/work/ticket/.cache/video-nghiep-vu/07-tai-khoan/hoso"),
  reporter: [
    ["list"],
    ["html", { outputFolder: resolve(process.env.E2E_REPORT_DIR || "node_modules/.cache/account-report"), open: "never" }],
    ["./redact-reporter.ts"],
  ],
  projects: [{ name: "desktop", use: { viewport: { width: 1280, height: 800 } } }],
});
