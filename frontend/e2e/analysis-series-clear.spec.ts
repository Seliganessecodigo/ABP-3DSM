import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('limpar filtros da série preserva ordenação e preferência de página', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&seriesPage=2&seriesSize=5&seriesSort=energy&seriesDirection=desc&seriesSearch=5&seriesEnergyStatus=available&seriesFrom=2026-10-17T00%3A00%3A00.000Z&seriesTo=2026-10-18T00%3A00%3A00.000Z&seriesTimeZone=America%2FSao_Paulo&seriesEnergyUnit=kWh&seriesEnergyMin=1&seriesEnergyMax=9&fixture=series-filters')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões', exact: true })
  await expect(energy).toContainText(/120\s*kWh/)
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(3)

  await series.getByRole('button', { name: 'Limpar filtros', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(6)
  await expect(table.getByRole('row').nth(1)).toContainText('6 kWh')
  await expect(table.getByRole('row').nth(2)).toContainText('5 kWh')
  const energyHeader = series.getByRole('columnheader', { name: 'Energia', exact: true })
  await expect(energyHeader).toHaveAttribute('aria-sort', 'descending')

  const params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
  expect(params.get('seriesSize')).toBe('5')
  expect(params.get('seriesSort')).toBe('energy')
  expect(params.get('seriesDirection')).toBe('desc')
  expect(params.has('seriesPage')).toBe(false)
  for (const key of ['seriesSearch', 'seriesEnergyStatus', 'seriesFrom', 'seriesTo', 'seriesTimeZone', 'seriesEnergyUnit', 'seriesEnergyMin', 'seriesEnergyMax']) {
    expect(params.has(key)).toBe(false)
  }
})
