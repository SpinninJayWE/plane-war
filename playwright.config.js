import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: 'http://localhost:5179',
    viewport: { width: 480, height: 700 },
    video: 'on',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5179',
    url: 'http://localhost:5179',
    reuseExistingServer: true,
    timeout: 30000,
  },
})
