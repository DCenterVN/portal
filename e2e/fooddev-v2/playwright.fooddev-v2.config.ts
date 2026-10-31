import { defineConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const record = process.env.E2E_RECORD === '1';

export default defineConfig({
  testDir: directory,
  testMatch: '*.spec.ts',
  outputDir: process.env.FOODDEV_EVIDENCE || resolve(directory, '../../../node_modules/.cache/fooddev-v2'),
  reporter: 'list',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.PORTAL_BASE_URL || 'http://127.0.0.1:3003',
    browserName: 'chromium', headless: true, locale: 'vi-VN',
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 15000, navigationTimeout: 20000,
    trace: record ? 'on' : 'off', video: record ? 'on' : 'off', screenshot: record ? 'on' : 'off',
    launchOptions: { executablePath: '/opt/brave.com/brave/brave' },
  },
  projects: [{ name: 'desktop' }],
});
