import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('seleciona uma granularidade da fonte e reconsulta sem alterar período ou coleção', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&fixture=granularity-controlled')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  const granularity = page.getByRole('region', { name: 'Granularidade', exact: true })
  await expect(energy).toContainText(/10\s*kWh/)
  await expect(granularity.getByRole('button', { name: 'Janela A da fonte', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(granularity.getByRole('button', { name: 'Janela B da fonte', exact: true })).toHaveAttribute('aria-pressed', 'false')

  await granularity.getByRole('button', { name: 'Janela B da fonte', exact: true }).click()
  await expect(page).toHaveURL(/granularity=source-window-b/)
  await expect(energy).toContainText(/20\s*kWh/)
  const params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
})

test('token de granularidade sem suporte não apresenta dados e pode ser corrigido', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=30d&granularity=legacy-token&collectionId=collection-history&fixture=granularity-unsupported')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(energy).not.toContainText(/99\s*kWh/)
  await page.getByRole('button', { name: 'Usar granularidade disponível', exact: true }).click()
  await expect(page).toHaveURL(/granularity=source-window-a/)
  await expect(energy).toContainText(/10\s*kWh/)
  const params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('30d')
  expect(params.get('collectionId')).toBe('collection-history')
})

test('capacidade de granularidade ausente é comunicada sem criar opções', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=granularity-unavailable')

  const granularity = page.getByRole('region', { name: 'Granularidade', exact: true })
  await expect(granularity).toContainText('Granularidade indisponível')
  await expect(granularity.getByRole('button')).toHaveCount(0)
})
