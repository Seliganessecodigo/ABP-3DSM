import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('rejeita instante de filtro sem offset explícito em vez de reinterpretar no fuso do navegador', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&seriesFrom=2026-10-17T13%3A00%3A00&seriesTimeZone=America%2FSao_Paulo&fixture=series-dates')

  const series = page.getByRole('region', { name: 'Evolução ambiental', exact: true })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  await expect(series.getByRole('alert')).toContainText('A faixa de datas é inválida ou está invertida.')
  const table = series.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table.getByRole('row').nth(1)).toContainText('Nenhum ponto corresponde aos filtros.')
  const params = new URL(page.url()).searchParams
  expect(params.get('seriesFrom')).toBe('2026-10-17T13:00:00')
  expect(params.get('seriesTimeZone')).toBe('America/Sao_Paulo')
})

test('mensagem de faixa numérica inválida não descreve erro de data', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=series-numeric')

  const series = page.getByRole('region', { name: 'Evolução ambiental', exact: true })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  await series.getByLabel('Energia mínima', { exact: true }).fill('10')
  await series.getByLabel('Energia máxima', { exact: true }).fill('2')
  const alert = series.getByRole('alert')
  await expect(alert).toContainText('A faixa mínima deve ser menor ou igual à máxima.')
  await expect(alert).not.toContainText(/data|date/i)
  await expect(series.getByRole('table').getByRole('row')).toHaveCount(2)
  await expect(series.getByRole('table').getByRole('row').nth(1)).toContainText('Nenhum ponto corresponde aos filtros.')
})

test('mantém pontos com CO₂e em unidades mistas até selecionar unidade comparável', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=series-mixed-emissions')

  const series = page.getByRole('region', { name: 'Evolução ambiental', exact: true })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  const unit = series.getByRole('combobox', { name: /Unidade.*CO₂e/ })
  const minimum = series.getByLabel('Mínimo de CO₂e', { exact: true })
  const maximum = series.getByLabel('Máximo de CO₂e', { exact: true })
  const emissionsHeader = series.getByRole('columnheader', { name: 'CO₂e', exact: true })
  const emissionsSort = emissionsHeader.getByRole('button', { name: 'CO₂e', exact: true })

  await expect(table.getByRole('row')).toHaveCount(3)
  await expect(table).toContainText('0,5 kg CO₂e')
  await expect(table).toContainText('500 g CO₂e')
  await expect(series).toContainText('Selecione uma unidade antes de filtrar ou ordenar.')
  await expect(minimum).toBeDisabled()
  await expect(maximum).toBeDisabled()
  await expect(emissionsSort).toBeDisabled()

  await unit.selectOption('kg CO₂e')
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table).toContainText('0,5 kg CO₂e')
  await expect(table).not.toContainText('500 g CO₂e')
  await expect(minimum).toBeEnabled()
  await expect(maximum).toBeEnabled()
  await expect(emissionsSort).toBeEnabled()
  await minimum.fill('0.5')
  await maximum.fill('0.5')
  await emissionsSort.click()
  await expect(emissionsHeader).toHaveAttribute('aria-sort', 'ascending')
  await expect(table).toContainText('0,5 kg CO₂e')
  await expect(table).not.toContainText('500 g CO₂e')
})
