import { defineConfig } from '@playwright/test'
import base from './playwright.config.ts'

export default defineConfig({
  ...base,
  testDir: './e2e',
  testMatch: /qa-comparison-simulation\.qa\.ts/,
  timeout: 60_000,
  workers: 1,
  outputDir: process.env.QA_OUTPUT_DIR ?? 'test-results/qa-comparison-simulation',
  reporter: [['list'], ['json', { outputFile: process.env.QA_REPORT ?? 'test-results/qa-comparison-simulation.json' }]],
  use: { ...base.use, video: 'on', screenshot: 'on', trace: 'retain-on-failure' },
  projects: [
    { name: 'qa-desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'qa-mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    ...base.webServer,
    command: `npm ${process.env.QA_SOURCE_DIR ? `--prefix "${process.env.QA_SOURCE_DIR}" ` : ''}run dev -- --host 127.0.0.1 --port ${process.env.PLAYWRIGHT_PORT ?? '4173'} --strictPort`,
  },
})
