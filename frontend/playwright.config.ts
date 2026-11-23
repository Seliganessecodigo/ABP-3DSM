import { defineConfig, devices } from '@playwright/test'
const testOrigin = `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? '4173'}`

export default defineConfig({
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  use: {
    actionTimeout: 5_000,
    navigationTimeout: 15_000,
    baseURL: testOrigin,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    {
      name: 'unit',
      testDir: './tests/unit',
    },
    {
      name: 'chromium',
      testDir: './e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${process.env.PLAYWRIGHT_PORT ?? '4173'} --strictPort`,
    url: testOrigin,
    reuseExistingServer: false,
    env: { VITE_GOOGLE_SSO_ENABLED: 'true' },
  },
})
