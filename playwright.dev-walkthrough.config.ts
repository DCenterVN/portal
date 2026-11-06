import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/dev-walkthrough',
  testMatch: 'dev-walkthrough.spec.ts',
  outputDir: '../.cache/tmp/dev-walkthrough-playwright',
  reporter: 'list', workers: 1, fullyParallel: false, retries: 0,
  timeout: 240000, expect: { timeout: 10000 },
  use: {
    baseURL: 'http://127.0.0.1:3005', browserName: 'chromium', headless: true,
    locale: 'vi-VN', viewport: { width: 1440, height: 1000 },
    actionTimeout: 10000, navigationTimeout: 20000,
    trace: 'off', video: 'off', screenshot: 'off',
    launchOptions: { executablePath: process.env.PW_BROWSER_PATH || '/opt/brave.com/brave/brave' },
  },
});
