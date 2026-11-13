import { expect, test } from '@playwright/test'
import { application, gate, mockCatalog } from './support/catalog.ts'
import { collectionResponse } from './support/collection.ts'

test.beforeEach(async ({ page }) => {
  await mockCatalog(page, [application(), application({ id: 'svc-other', name: 'app-outro' })])
  await page.route('**/collections/latest*', route => route.fulfill({ json: collectionResponse() }))
  await page.route(/\/applications\/[^/]+\/analysis(?:\/series)?(?:\?.*)?$/, route => route.fulfill({ status: 503, json: {} }))
})

test('history landing guides selection and carries the chosen period into investigation', async ({ page }) => {
  await page.goto('/history')
  await expect(page.getByRole('heading', { name: 'Qual aplicação você quer analisar?' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Período de análise', exact: true }).selectOption('30d')
  await page.getByRole('button', { name: /app-pagamentos.*Ver histórico/ }).click()
  await expect(page.getByRole('combobox', { name: 'Aplicação', exact: true })).toHaveValue('svc-0142')
  await expect(page.getByRole('combobox', { name: 'Período de análise', exact: true })).toHaveValue('30d')
  await expect(page.getByRole('region', { name: /evidências operacionais/i })).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('history-selected.png') })
})

test('detail and history link both ways preserving analysis context and clearing record selection', async ({ page }) => {
  await page.goto('/services/svc-0142?period=30d&granularity=day&seriesTimeZone=UTC&collectionId=old&inspectionBucket=old')
  await expect(page.getByRole('heading', { name: 'Situação da aplicação', exact: true })).toBeVisible()
  await expect(page.getByRole('figure')).toHaveCount(0)
  await page.getByRole('link', { name: 'Explorar histórico' }).click()
  await expect(page).toHaveURL(/\/history\?/)
  for (const [key, value] of Object.entries({ applicationId: 'svc-0142', period: '30d', granularity: 'day', seriesTimeZone: 'UTC' })) {
    expect(new URL(page.url()).searchParams.get(key)).toBe(value)
  }
  expect(new URL(page.url()).searchParams.has('collectionId')).toBe(false)
  expect(new URL(page.url()).searchParams.has('inspectionBucket')).toBe(false)
  await page.getByRole('link', { name: 'Ver detalhes da aplicação', exact: true }).click()
  await expect(page).toHaveURL(/\/services\/svc-0142\?/)
  expect(new URL(page.url()).searchParams.get('period')).toBe('30d')
  expect(new URL(page.url()).searchParams.get('granularity')).toBe('day')
  expect(new URL(page.url()).searchParams.get('seriesTimeZone')).toBe('UTC')
  expect(new URL(page.url()).searchParams.has('applicationId')).toBe(false)
  await page.goBack()
  await expect(page.getByRole('combobox', { name: 'Aplicação', exact: true })).toHaveValue('svc-0142')
  await page.getByRole('combobox', { name: 'Aplicação', exact: true }).selectOption('svc-other')
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Aplicação', exact: true })).toHaveValue('svc-other')
  await expect(page.getByRole('combobox', { name: 'Período de análise', exact: true })).toHaveValue('30d')
})

test('operational context stays available while environmental analysis is pending', async ({ page }) => {
  const pending = gate()
  await page.route(/\/analysis(?:\/series)?(?:\?.*)?$/, async route => {
    await pending.wait
    await route.fulfill({ status: 503, json: {} })
  })
  await page.goto('/services/svc-0142')
  try {
    await expect(page.getByRole('heading', { name: 'Localização', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: /evidências operacionais/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar histórico' })).toBeVisible()
  } finally {
    pending.release()
  }
  await expect(page.getByText('Não foi possível consultar os dados ambientais para este período.', { exact: true })).toBeVisible()
})

test('history selection and detail links preserve a custom interval', async ({ page }) => {
  const from = '2026-10-10T00:00:00.000Z'
  const to = '2026-10-12T00:00:00.000Z'
  await page.goto(`/history?period=custom&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
  await expect(page.getByRole('combobox', { name: 'Período de análise', exact: true })).toHaveValue('custom')
  await page.getByRole('button', { name: /app-pagamentos.*Ver histórico/ }).click()
  await page.getByRole('link', { name: 'Ver detalhes da aplicação', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Explorar histórico' })).toBeVisible()
  const params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('custom')
  expect(params.get('from')).toBe(from)
  expect(params.get('to')).toBe(to)
})

for (const width of [390, 1366]) {
  test(`history landing is usable at ${width}px with keyboard and no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/history')
    const card = page.getByRole('button', { name: /app-pagamentos.*Ver histórico/ })
    await card.focus()
    await expect(card).toBeFocused()
    await page.screenshot({ path: test.info().outputPath(`history-start-${width}.png`), fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.keyboard.press('Enter')
    await expect(page.getByRole('combobox', { name: 'Aplicação', exact: true })).toHaveValue('svc-0142')
  })
}
