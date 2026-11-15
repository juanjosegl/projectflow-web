import { defineConfig, devices } from '@playwright/test';

// Set BASE_URL to test a deployed site; otherwise the built app is started locally (API must be running).
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000, // the free Render API can take ~50 s to wake up
  retries: process.env.CI ? 1 : 0,
  use: { baseURL, trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'pnpm start', url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
