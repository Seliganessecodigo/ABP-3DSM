import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('S5 rejects malformed date parameters in a direct catalog URL', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/applications?from=not-a-date&sort=lastCheckedAt&direction=desc')

  const dialog = page.getByRole('dialog', { name: 'Filtros por coluna' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('alert')).toHaveText('Informe datas válidas e início anterior ou igual ao fim.')
  await page.screenshot({ path: 'test-evidence/ct006-1440x900-invalid-url-date-retested.png', fullPage: true })

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/sort=lastCheckedAt/)
  await expect(page).toHaveURL(/direction=desc/)

  await page.getByRole('button', { name: 'Filtros por coluna' }).click()
  const reopenedDialog = page.getByRole('dialog', { name: 'Filtros por coluna' })
  const dateInputs = reopenedDialog.locator('input[type="datetime-local"]')
  await dateInputs.nth(0).fill('2026-10-10T12:00')
  await dateInputs.nth(1).fill('2026-10-09T12:00')
  await expect(reopenedDialog.getByRole('alert')).toHaveText('Informe datas válidas e início anterior ou igual ao fim.')
  await page.screenshot({ path: 'test-evidence/ct006-1440x900-inverted-range-retested.png', fullPage: true })

  await page.keyboard.press('Escape')
  await expect(reopenedDialog).toBeHidden()
  await expect(page).toHaveURL(/sort=lastCheckedAt/)
  await expect(page).toHaveURL(/direction=desc/)

  await page.getByRole('button', { name: 'Filtros por coluna' }).click()
  const clearDialog = page.getByRole('dialog', { name: 'Filtros por coluna' })
  await clearDialog.getByRole('button', { name: 'Limpar filtros' }).click()
  await clearDialog.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(clearDialog).toBeHidden()
  await expect(page).toHaveURL(/sort=lastCheckedAt/)
  await expect(page).toHaveURL(/direction=desc/)
  await expect(page).not.toHaveURL(/(?:from|to)=/)
})
test('S5 rejects malformed date parameters on mobile and shows the validation message', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/applications?to=not-a-date&sort=lastCheckedAt&direction=desc')

  const dialog = page.getByRole('dialog', { name: 'Filtros por coluna' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('alert')).toHaveText('Informe datas válidas e início anterior ou igual ao fim.')
  await page.screenshot({ path: 'test-evidence/ct006-390x844-invalid-url-date-retested.png', fullPage: true })

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.getByRole('button', { name: 'Filtros por coluna' }).click()
  const reopenedDialog = page.getByRole('dialog', { name: 'Filtros por coluna' })
  const dateInputs = reopenedDialog.locator('input[type="datetime-local"]')
  await dateInputs.nth(0).fill('2026-10-10T12:00')
  await dateInputs.nth(1).fill('2026-10-09T12:00')
  await expect(reopenedDialog.getByRole('alert')).toHaveText('Informe datas válidas e início anterior ou igual ao fim.')
  await page.screenshot({ path: 'test-evidence/ct006-390x844-inverted-range-retested.png', fullPage: true })

  await page.keyboard.press('Escape')
  await expect(reopenedDialog).toBeHidden()
  await expect(page).toHaveURL(/sort=lastCheckedAt/)
  await expect(page).toHaveURL(/direction=desc/)

  await page.getByRole('button', { name: 'Filtros por coluna' }).click()
  const clearDialog = page.getByRole('dialog', { name: 'Filtros por coluna' })
  await clearDialog.getByRole('button', { name: 'Limpar filtros' }).click()
  await clearDialog.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(clearDialog).toBeHidden()
  await expect(page).toHaveURL(/sort=lastCheckedAt/)
  await expect(page).toHaveURL(/direction=desc/)
  await expect(page).not.toHaveURL(/(?:from|to)=/)
})
