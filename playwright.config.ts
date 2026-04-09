import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  /** Явный tsconfig для e2e (алиас `@/` → `src/`). */
  tsconfig: './e2e/tsconfig.json',
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: Object.fromEntries(
      Object.entries(process.env).filter(
        (e): e is [string, string] => e[1] !== undefined
      )
    ),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
