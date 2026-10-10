import { defineConfig } from "@playwright/test";

// Brave binary, not the ~/.local/bin wrapper (it only cleans profile locks + sets FONTCONFIG_FILE).
const executablePath = process.env.PW_BROWSER_PATH || "/opt/brave.com/brave/brave";
// VISUAL_BASELINE=1: shoot file:// previews and rewrite the baseline; otherwise baseline is read-only.
const baseline = process.env.VISUAL_BASELINE === "1";

export default defineConfig({
  testDir: "e2e",
  // ponytail: results under node_modules (git-ignored) until .gitignore lists test-results/.
  outputDir: "node_modules/.cache/playwright-results",
  reporter: "list",
  fullyParallel: false,
  workers: 1,
  updateSnapshots: baseline ? "all" : "none",
  snapshotPathTemplate: "e2e/visual/baseline/{arg}-{projectName}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" } },
  use: { baseURL: "http://localhost:3000", launchOptions: { executablePath } },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
  ],
  webServer: baseline ? undefined : {
    command: "npm run dev -- --port 3000",
    url: "http://localhost:3000/staff/login",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
