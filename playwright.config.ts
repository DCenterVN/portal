import { defineConfig } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";

const e2eDir = `${homedir()}/work/ticket/.cache/e2e`;
const accountsPath = `${e2eDir}/accounts.env`;
const accounts: Record<string, string> = {};
if (existsSync(accountsPath)) {
  for (const line of readFileSync(accountsPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (match) accounts[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}
for (const role of ["WAREHOUSE", "ADMIN", "CUSTOMER"]) {
  process.env[`PORTAL_${role}_STATE`] ??= `${e2eDir}/state/${role.toLowerCase()}.json`;
}
for (const field of ["EMAIL", "PASSWORD"]) {
  const value = accounts[`E2E_FOODDEV_${field}`];
  if (value !== undefined) process.env[`FOODDEV_${field}`] ??= value;
}

// Brave binary, not the ~/.local/bin wrapper (it only cleans profile locks + sets FONTCONFIG_FILE).
const executablePath = process.env.PW_BROWSER_PATH || "/opt/brave.com/brave/brave";
// VISUAL_BASELINE=1: shoot file:// previews and rewrite the baseline; otherwise baseline is read-only.
const baseline = process.env.VISUAL_BASELINE === "1";
const record = process.env.E2E_RECORD === "1";
const narratedVideo = { mode: "on" as const, size: { width: 1440, height: 900 }, show: { actions: { duration: 1500, position: "top" as const, fontSize: 22, cursor: "pointer" as const }, test: { level: "step" as const, position: "bottom" as const, fontSize: 22 } } };
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  // ponytail: results under node_modules (git-ignored) until .gitignore lists test-results/.
  outputDir: "node_modules/.cache/playwright-results",
  reporter: record ? [["list"], ["html", { outputFolder: "e2e-report", open: "never" }]] : "list",
  fullyParallel: false,
  workers: 1,
  updateSnapshots: baseline ? "all" : "none",
  snapshotPathTemplate: "e2e/visual/baseline/{arg}-{projectName}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" } },
  use: {
    baseURL,
    launchOptions: { executablePath, ...(record && { slowMo: 700 }) },
    ...(record && { video: narratedVideo, trace: "on", screenshot: "on" }),
  },
  projects: [
    { name: "setup", testMatch: "**/e2e/setup/*.setup.ts", use: { trace: "off", video: "off", screenshot: "off" } },
    { name: "desktop", testIgnore: "**/setup/**", ...(record && { dependencies: ["setup"] }), use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", testIgnore: ["**/rbac/**", "**/setup/**"], use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
  ],
  webServer: baseline || process.env.E2E_BASE_URL ? undefined : {
    command: "npm run dev -- --port 3000",
    url: "http://localhost:3000/staff/login",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
