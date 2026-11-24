import { defineConfig } from '@playwright/test'
import base from './playwright.config.ts'

export default defineConfig({
  ...base,
  testDir: './e2e', testMatch: /qa-energy-emissions\.spec\.ts/,
  workers: 1, timeout: 60_000,
  reporter: [['list'], ['json', { outputFile: 'test-results/qa-energy.json' }]],
  use: { ...base.use, video: 'on', screenshot: 'on' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
