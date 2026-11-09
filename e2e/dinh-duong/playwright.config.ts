import { defineConfig } from "@playwright/test";
import shared from "../../playwright.config";

const outputDir = "/home/dawn/work/ticket/.cache/video-nghiep-vu/10-dinh-duong/lan-1";

export default defineConfig({
  ...shared,
  testDir: ".",
  testMatch: "dinh-duong.spec.ts",
  workers: 1,
  retries: 0,
  webServer: undefined,
  outputDir,
  reporter: [
    ["list"],
    ["./reporter.ts"],
  ],
  use: {
    ...shared.use,
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3002",
    actionTimeout: 15_000,
    navigationTimeout: 25_000,
    video: { mode: "on", size: { width: 1280, height: 800 } },
    trace: "on",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
