import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const executablePath = process.env.PW_BROWSER_PATH || '/opt/brave.com/brave/brave';

export default defineConfig({
  testDir: fileURLToPath(new URL('.', import.meta.url)),
  testMatch: /.*\.spec\.mjs$/,
  outputDir: fileURLToPath(new URL('../../../../node_modules/.cache/playwright-motion', import.meta.url)),
  reporter: 'list',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    launchOptions: { executablePath },
  },
});
