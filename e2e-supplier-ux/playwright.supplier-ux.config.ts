import { defineConfig } from '@playwright/test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: directory,
  testMatch: 'supplier-ux-002.spec.ts',
  outputDir: resolve(directory, '../node_modules/.cache/supplier-ux-fixrev'),
  reporter: 'list',
  workers: 1,
  fullyParallel: false,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.PORTAL_BASE_URL || 'http://127.0.0.1:3003',
    browserName: 'chromium',
    headless: true,
    locale: 'vi-VN',
    actionTimeout: 15000,
    navigationTimeout: 20000,
    viewport: { width: 1440, height: 1000 },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    launchOptions: { executablePath: process.env.PW_BROWSER_PATH || '/opt/brave.com/brave/brave' },
  },
  projects: [{ name: 'desktop' }],
});
