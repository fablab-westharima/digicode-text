import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1100, height: 850 },
    screenshot: 'only-on-failure',
  },
});
