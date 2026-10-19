import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('filtra e ordena CO₂e por valor sem misturar unidades e mantém ausências no fim', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=series-numeric')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  const series = page.getByRole('region', { name: 'Evolução ambiental', exact: true })
  await expect(energy).toContainText(/120\s*kWh/)
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()

  const table = series.getByRole('table')
  await series.getByLabel('Mínimo de CO₂e', { exact: true }).fill('0.5')
  await series.getByLabel('Máximo de CO₂e', { exact: true }).fill('2')
  await expect(table.getByRole('row')).toHaveCount(3)
  await expect(table).toContainText('0,5 kg CO₂e')
  await expect(table).not.toContainText('10 kg CO₂e')
  await expect(table).not.toContainText('0,00000004 kg CO₂e')
  await expect(energy).toContainText(/120\s*kWh/)

  const emissionsHeader = series.getByRole('columnheader', { name: 'CO₂e', exact: true })
  const emissionsSort = emissionsHeader.getByRole('button', { name: 'CO₂e', exact: true })
  await series.getByLabel('Mínimo de CO₂e', { exact: true }).fill('')
  await series.getByLabel('Máximo de CO₂e', { exact: true }).fill('')
  await emissionsSort.click()
  await expect(emissionsHeader).toHaveAttribute('aria-sort', 'ascending')
  await expect(table.getByRole('row')).toHaveCount(6)
  await expect(table.getByRole('row').nth(1)).toContainText('0,00000004 kg CO₂e')
  await expect(table.getByRole('row').nth(-1)).toContainText(/Indisponível|Ausente/)
  await emissionsSort.click()
  await expect(emissionsHeader).toHaveAttribute('aria-sort', 'descending')
  await expect(table.getByRole('row').nth(-1)).toContainText(/Indisponível|Ausente/)
})
