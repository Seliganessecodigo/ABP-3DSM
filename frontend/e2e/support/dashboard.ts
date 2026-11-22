import { expect, type Page } from '@playwright/test'

export async function openDashboardApplications(page: Page) {
  const details = page.locator('#dashboard-applications')
  await expect(details).toBeVisible()
  if (!await details.evaluate(element => (element as HTMLDetailsElement).open)) {
    await details.locator('> summary').click()
  }
  await expect(details).toHaveAttribute('open', '')
}
