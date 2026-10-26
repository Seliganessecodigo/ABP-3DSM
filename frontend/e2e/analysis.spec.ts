import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('mostra energia e cobertura zero separadas de CO₂e e cobertura indisponíveis', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=zero-without-factor')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  const emissions = analysis.getByRole('group', { name: 'CO₂e', exact: true })
  const energyCoverage = page.getByRole('group', { name: 'Cobertura de energia', exact: true })
  const emissionsCoverage = page.getByRole('group', { name: 'Cobertura de emissões', exact: true })

  await expect(analysis).toBeVisible()
  await expect(energy).toContainText(/0\s*kWh/)
  await expect(energyCoverage).toContainText(/0\s*%/)
  await expect(emissions).toContainText('Não calculável')
  await expect(emissions).toContainText('Fator de carbono indisponível')
  await expect(emissionsCoverage).toContainText('Cobertura de emissões indisponível')
  await expect(energy).not.toContainText(/indisponível|não calculável/i)
  await expect(emissionsCoverage).not.toContainText(/0\s*%/)
})

test('não apresenta resultados para período inválido até a seleção de um período válido', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=13d&fixture=zero-without-factor')

  await expect(page.getByRole('alert')).toContainText('Selecione um período válido')
  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis).toBeVisible()
  await expect(analysis).not.toContainText(/0\s*kWh/)
  await page.getByRole('button', { name: '7 dias', exact: true }).click()
  await expect(page).toHaveURL(/period=7d/)
  await expect(analysis).toContainText(/0\s*kWh/)
})

test('mantém a indisponibilidade ambiental no runtime quando a consulta do resumo falha', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.route('**/applications/svc-0142/analysis?*', async (route) => {
    await route.fulfill({ status: 503, json: { code: 'ANALYSIS_UNAVAILABLE' } })
  })
  await page.goto('/services/svc-0142')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis.getByRole('alert')).toContainText('Não foi possível consultar os dados ambientais para este período')
  for (const name of ['Energia', 'CO₂e', 'Cobertura de energia', 'Cobertura de emissões']) {
    const metric = name.startsWith('Cobertura') ? page.getByRole('group', { name, exact: true }) : analysis.getByRole('group', { name, exact: true })
    await expect(metric).toContainText('Indispon\u00edvel')
  }
  await expect(analysis).not.toContainText(/0\s*kWh|0\s*%/)
})

test('não deixa uma resposta atrasada do período anterior substituir o recorte atual', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=stale-period-response')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis.getByRole('status')).toContainText('Carregando dados ambientais')
  await page.getByRole('button', { name: '30 dias', exact: true }).click()
  await expect(page).toHaveURL(/period=30d/)
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  await expect(energy).toContainText(/30\s*kWh/)
  await page.waitForTimeout(50)
  await expect(energy).toContainText(/30\s*kWh/)
  await expect(energy).not.toContainText(/7\s*kWh/)
})

test('atualizar evidências também atualiza o ambiente e preserva o último valor em falha', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=refresh-error')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  await expect(energy).toContainText(/42\s*kWh/)

  await page.getByRole('region', { name: 'Evidências operacionais' })
    .getByRole('button', { name: 'Atualizar dados', exact: true }).click()

  await expect(analysis.getByRole('alert')).toContainText('Não foi possível consultar os dados ambientais para este período')
  await expect(energy).toContainText(/42\s*kWh/)
})

test('empty confirmado substitui dados antigos e indisponibilidade não os ressuscita', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=empty-then-unavailable')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  await expect(energy).toContainText(/42\s*kWh/)
  const refresh = page.getByRole('region', { name: 'Evidências operacionais' }).getByRole('button', { name: 'Atualizar dados', exact: true })
  await refresh.click()
  await expect(analysis.getByRole('status')).toContainText(/nenhum dado ambiental|sem dados ambientais/i)
  await expect(energy).not.toContainText(/42\s*kWh/)

  await refresh.click()
  await expect(analysis.getByText('Dados ambientais indisponíveis para este período.', { exact: true })).toBeVisible()
  await expect(energy).not.toContainText(/42\s*kWh/)
})

test('mostra tentativa ambiental recente e conserva a última consulta bem-sucedida após falha', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-17T20:00:00.000Z') })
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=refresh-error')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const freshness = page.getByRole('region', { name: 'Qualidade da coleta', exact: true })
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/42\s*kWh/)
  const timestamps = () => freshness.getByRole('definition').allTextContents()
  const [firstAttempt, lastSuccess] = await timestamps()
  expect(firstAttempt).not.toBe('Sem consulta')
  expect(lastSuccess).not.toBe('Sem consulta')

  await page.clock.setFixedTime(new Date('2026-10-17T20:01:00.000Z'))
  await page.getByRole('region', { name: 'Evidências operacionais' }).getByRole('button', { name: 'Atualizar dados', exact: true }).click()
  await expect(analysis.getByRole('alert')).toContainText('Não foi possível consultar os dados ambientais para este período')
  await expect.poll(async () => (await timestamps())[0]).not.toBe(firstAttempt)
  await expect.poll(async () => (await timestamps())[1]).toBe(lastSuccess)
})

test('preserva fatores originais separados com proveniência da fonte', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=provenance')
  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const factorCard = analysis.getByRole('group', { name: 'Fator regional', exact: true })
  await expect(factorCard).toContainText('Múltiplos fatores')
  await expect(factorCard).not.toContainText('v-alpha-original')
  await expect(factorCard).not.toContainText('v-beta-original')
  await page.locator('#analysis-details summary').click()
  const factors = page.getByRole('region', { name: 'Fatores aplicados' })
  const alpha = factors.getByRole('group', { name: 'BR-SP', exact: true })
  const beta = factors.getByRole('group', { name: 'BR-RJ', exact: true })

  await expect(alpha).toContainText('BR-SP')
  await expect(alpha).toContainText('0.42 kg CO₂e/kWh')
  await expect(alpha).toContainText('v-alpha-original')
  await expect(alpha).toContainText('17/10/2026')
  await expect(alpha).toContainText('14:32')
  await expect(alpha).toContainText('Descrição integral recebida para Modelo Alpha')
  await expect(alpha).toContainText('snapshot-alpha-raw-91')
  await expect(beta).toContainText('BR-RJ')
  await expect(beta).toContainText('0.18 kg CO₂e/kWh')
  await expect(beta).toContainText('v-beta-original')
  await expect(beta).toContainText('16/10/2026')
  await expect(beta).toContainText('08:15')
  await expect(beta).toContainText('Descrição integral recebida para Modelo Beta')
  await expect(beta).toContainText('snapshot-beta-raw-27')
  await page.getByRole('button', { name: 'Fechar detalhes' }).click()
  await expect(page.locator('#analysis-details')).not.toHaveAttribute('open', '')
})

test('trocar idioma atualiza o fuso nas datas operacional, ambiental e da série', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.route(/\/applications\/svc-0142\/collections\/collection-history$/, async (route) => {
    await route.fulfill({ json: {
      id: 'collection-history', applicationId: 'svc-0142', intervalStart: '2026-10-17T17:00:00.000Z',
      intervalEnd: '2026-10-17T17:30:00.000Z', collectedAt: '2026-10-17T17:32:00.000Z',
      collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID',
      lastCheckedAt: '2026-10-17T17:32:00.000Z', isCalculable: true,
      metrics: {
        cpu: { value: 38, unit: '%', status: 'available' },
        memory: { value: null, unit: null, status: 'missing' },
        disk: { value: 0, unit: 'GB/s', status: 'available' },
        network: { value: 1.2, unit: 'Mbps', status: 'available' },
      },
      environmental: { status: 'absent', absenceReason: 'ENVIRONMENTAL_EVIDENCE_UNAVAILABLE', energy: null, carbon: null },
    } })
  })
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&seriesTimeZone=America%2FSao_Paulo&fixture=provenance')
  await page.locator('#analysis-details summary').click()

  const factors = page.getByRole('region', { name: 'Fatores aplicados' })
  const alpha = factors.getByRole('group', { name: 'BR-SP', exact: true })
  await expect(alpha).toContainText('14:32')
  await expect(page.getByRole('region', { name: /evidências operacionais/i })).toContainText('14:32')
  await page.getByLabel('Idioma').selectOption('en-US')
  await expect(page.locator('[data-language-flag="en-US"]')).toBeVisible()

  await expect(page.getByRole('group', { name: 'BR-SP', exact: true })).toContainText('5:32 PM')
  await expect(page.getByRole('region', { name: /operational evidence/i })).toContainText('5:32 PM')
  await page.locator('#analysis-details summary').click()
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Energy and emissions trend', exact: true }).getByRole('table')).toContainText('5:00 PM')
  const params = new URL(page.url()).searchParams
  expect(params.get('seriesTimeZone')).toBe('Etc/GMT+0')
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
})

test('preserva metodologia de energia mesmo sem fator de carbono calculável', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=energy-without-carbon-factor')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/0\s*kWh/)
  await expect(analysis.getByRole('group', { name: 'CO₂e', exact: true })).toContainText('Não calculável')
  await expect(analysis.getByRole('group', { name: 'Fator regional', exact: true })).toContainText('Fator de carbono indisponível')

  await page.locator('#analysis-details summary').click()
  const methodology = page.getByRole('region', { name: 'Metodologia aplicada' })
  const model = methodology.getByRole('group', { name: 'Modelo de estimativa energética', exact: true })
  await expect(model).toContainText('v-energy-original-7')
  await expect(model).toContainText('Método original fornecido pela fonte de energia')
  await expect(model).toContainText('energy-source-snapshot-raw-12')
})

test('indisponibilidade após sucesso mantém o último valor no mesmo período', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=refresh-unavailable')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const energy = analysis.getByRole('group', { name: 'Energia', exact: true })
  await expect(energy).toContainText(/35\s*kWh/)

  await page.getByRole('region', { name: 'Evidências operacionais' })
    .getByRole('button', { name: 'Atualizar dados', exact: true }).click()

  await expect(analysis.getByText('Dados ambientais indisponíveis para este período.', { exact: true })).toBeVisible()
  await expect(energy).toContainText(/35\s*kWh/)
})

test('tabela apresenta os pontos fornecidos sem recomputar os KPIs', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=series-table')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/84\s*kWh/)
  await expect(analysis.getByRole('group', { name: 'CO₂e', exact: true })).toContainText('Não calculável')

  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const seriesTable = series.getByRole('table')
  await expect(seriesTable.getByRole('columnheader', { name: 'Energia', exact: true })).toBeVisible()
  await expect(seriesTable.getByRole('columnheader', { name: 'CO₂e', exact: true })).toBeVisible()
  await expect(seriesTable.getByRole('row')).toHaveCount(3)
  const firstPoint = seriesTable.getByRole('row').nth(1)
  const secondPoint = seriesTable.getByRole('row').nth(2)
  await expect(firstPoint).toContainText('17/10/2026')
  await expect(firstPoint).toContainText('14:00')
  await expect(firstPoint).toContainText(/12\s*kWh/)
  await expect(firstPoint).toContainText(/2\s*kg CO₂e/)
  await expect(secondPoint).toContainText('15:00')
  await expect(secondPoint).toContainText(/30\s*kWh/)
  await expect(secondPoint).toContainText(/5\s*kg CO₂e/)
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/84\s*kWh/)
})

test('alternar gráfico e tabela mantém os pontos acessíveis e os KPIs', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=series-table')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  const graphButton = series.getByRole('button', { name: 'Gráfico', exact: true })
  const tableButton = series.getByRole('button', { name: 'Tabela', exact: true })
  const metricToggle = series.getByRole('group', { name: 'Métrica do gráfico', exact: true })
  await expect(metricToggle.locator('button[aria-pressed="true"]')).toHaveCount(1)

  await graphButton.click()
  const energyChart = series.getByRole('figure', { name: /Evolução de energia/ })
  const emissionsChart = series.getByRole('figure', { name: /Evolução de CO₂e/ })
  await expect(emissionsChart).toBeVisible()
  await expect(emissionsChart).toHaveAccessibleName(/2\s*kg CO₂e/)
  await expect(emissionsChart).toHaveAccessibleName(/5\s*kg CO₂e/)
  await expect(energyChart).toBeHidden()
  await metricToggle.getByRole('button').nth(0).click()
  await expect(energyChart).toBeVisible()
  await expect(energyChart).toHaveAccessibleName(/12\s*kWh/)
  await expect(energyChart).toHaveAccessibleName(/30\s*kWh/)
  await expect(emissionsChart).toBeHidden()
  await metricToggle.getByRole('button').nth(1).click()
  await expect(emissionsChart).toBeVisible()
  await expect(emissionsChart).toHaveAccessibleName(/2\s*kg CO₂e/)
  await expect(emissionsChart).toHaveAccessibleName(/5\s*kg CO₂e/)
  await expect(graphButton).toHaveAttribute('aria-pressed', 'true')
  await expect(tableButton).toHaveAttribute('aria-pressed', 'false')

  await tableButton.click()
  await expect(series.getByRole('table')).toBeVisible()
  await expect(tableButton).toHaveAttribute('aria-pressed', 'true')
  await expect(graphButton).toHaveAttribute('aria-pressed', 'false')
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/84\s*kWh/)
})

test('página a série em dez pontos por padrão e preserva o contexto da aplicação', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&fixture=series-pagination')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/120\s*kWh/)
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()

  const pageSize = series.getByRole('combobox', { name: 'Itens por página', exact: true })
  const table = series.getByRole('table')
  await expect(pageSize).toHaveValue('10')
  await expect(table.getByRole('row')).toHaveCount(11)
  await expect(series.getByText('Página 1 de 2', { exact: true })).toBeVisible()
  await expect(series.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled()

  await series.getByRole('button', { name: 'Próxima', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(3)
  await expect(series.getByText('Página 2 de 2', { exact: true })).toBeVisible()
  let params = new URL(page.url()).searchParams
  expect(params.get('seriesPage')).toBe('2')
  expect(params.get('seriesSize')).toBe('10')
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')

  await series.getByRole('button', { name: 'Anterior', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(11)
  await expect(series.getByText('Página 1 de 2', { exact: true })).toBeVisible()
  params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/120\s*kWh/)
})

test('mostra a faixa e permite ir diretamente para uma página da série', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&fixture=series-pagination')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  await expect(series.getByText('Exibindo 1–10 de 12', { exact: true })).toBeVisible()

  const pageSelection = series.getByRole('combobox', { name: 'Página', exact: true })
  await expect(pageSelection).toHaveValue('1')
  await pageSelection.selectOption('2')
  await expect(table.getByRole('row')).toHaveCount(3)
  await expect(series.getByText('Exibindo 11–12 de 12', { exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('seriesPage')).toBe('2')
  expect(new URL(page.url()).searchParams.get('period')).toBe('7d')
  expect(new URL(page.url()).searchParams.get('collectionId')).toBe('collection-history')
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/120\s*kWh/)
})

test('busca a série nos valores exibidos e combina estados dos dois indicadores antes da página', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&seriesPage=2&seriesSize=5&fixture=series-filters')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const search = series.getByRole('searchbox', { name: 'Buscar série', exact: true })
  const energyStatus = series.getByRole('combobox', { name: 'Status da energia', exact: true })
  const emissionsStatus = series.getByRole('combobox', { name: 'Status de CO₂e', exact: true })
  const table = series.getByRole('table')

  await expect(search).toBeVisible()
  await expect(energyStatus).toBeVisible()
  await expect(emissionsStatus).toBeVisible()
  await expect(table.getByRole('row')).toHaveCount(2)
  await energyStatus.selectOption('available')
  await emissionsStatus.selectOption('available')
  await expect(table.getByRole('row')).toHaveCount(4)
  await expect(table).toContainText('1 kWh')
  await expect(table).toContainText('0,1 kg CO₂e')
  await expect(table).not.toContainText('3 kWh')
  await expect(table.getByRole('row')).toHaveCount(4)
  expect(new URL(page.url()).searchParams.has('seriesPage')).toBe(false)

  await search.fill('0,5 KG CO₂E')
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table).toContainText('5 kWh')
  await expect(table).not.toContainText('6 kWh')
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/120\s*kWh/)
  const params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
  expect(params.has('seriesPage')).toBe(false)
  expect(params.get('seriesSize')).toBe('5')
  expect(params.get('seriesSearch')).toBe('0,5 KG CO₂E')
  expect(params.get('seriesEnergyStatus')).toBe('available')
  expect(params.get('seriesEmissionsStatus')).toBe('available')
})

test('mantém valores ambientais positivos pequenos em vez de exibi-los como zero', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=series-precision')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/0,000001\s*kWh/)
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  await expect(table).toContainText(/0,000001\s*kWh/)
  await expect(table).toContainText(/0,00000004\s*kg CO₂e/)
  await expect(table).not.toContainText(/0\s*kWh/)
})

test('filtra pontos por instante local em AND com status e reinicia a paginação', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&seriesPage=2&seriesSize=5&fixture=series-dates')

  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(2)

  const from = series.getByLabel('Data inicial da série', { exact: true })
  const to = series.getByLabel('Data final da série', { exact: true })
  await expect(series.getByText('Fuso horário: America/Sao_Paulo', { exact: true })).toBeVisible()
  await from.fill('2026-10-17T10:00')
  await to.fill('2026-10-17T12:00')
  await series.getByRole('combobox', { name: 'Status de CO₂e', exact: true }).selectOption('available')

  await expect(table.getByRole('row')).toHaveCount(4)
  await expect(table).toContainText('2 kWh')
  await expect(table).toContainText('4 kWh')
  await expect(table).not.toContainText('3 kWh')
  await expect(table).not.toContainText('1 kWh')
  await expect(table).not.toContainText('6 kWh')
  await expect(series.getByText('Exibindo 1–3 de 3', { exact: true })).toBeVisible()

  const params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
  expect(params.get('seriesSize')).toBe('5')
  expect(params.has('seriesPage')).toBe(false)
  expect(params.get('seriesFrom')).toBe('2026-10-17T13:00:00.000Z')
  expect(params.get('seriesTo')).toBe('2026-10-17T15:00:00.000Z')
  expect(params.get('seriesTimeZone')).toBe('America/Sao_Paulo')
  expect(params.get('seriesEmissionsStatus')).toBe('available')
})

test('filtra e ordena valores numéricos por unidade e mantém ausências no fim', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&fixture=series-numeric')

  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const unit = series.getByRole('combobox', { name: 'Unidade da energia', exact: true })
  const minimum = series.getByRole('spinbutton', { name: 'Energia mínima', exact: true })
  const maximum = series.getByRole('spinbutton', { name: 'Energia máxima', exact: true })
  const table = series.getByRole('table')

  await unit.selectOption('kWh')
  await minimum.fill('0.000001')
  await maximum.fill('2')
  await expect(table.getByRole('row')).toHaveCount(4)
  await expect(table).toContainText('0,000001 kWh')
  await expect(table).toContainText('2 kWh')
  await expect(table).not.toContainText('10 kWh')
  await expect(table).not.toContainText('Sem valor')

  await minimum.fill('')
  await maximum.fill('')
  const energyHeader = series.getByRole('columnheader', { name: 'Energia', exact: true })
  const energySort = energyHeader.getByRole('button', { name: 'Energia', exact: true })
  await energySort.click()
  await expect(energyHeader).toHaveAttribute('aria-sort', 'ascending')
  await expect(table.getByRole('row')).toHaveCount(6)
  await expect(table.getByRole('row').nth(1)).toContainText('0,000001 kWh')
  await expect(table.getByRole('row').nth(2)).toContainText('10:00')
  await expect(table.getByRole('row').nth(3)).toContainText('08:00')
  await expect(table.getByRole('row').nth(4)).toContainText('10 kWh')
  await expect(table.getByRole('row').nth(5)).toContainText('Indisponível')

  await energySort.click()
  await expect(energyHeader).toHaveAttribute('aria-sort', 'descending')
  await expect(table.getByRole('row').nth(1)).toContainText('10 kWh')
  await expect(table.getByRole('row').nth(2)).toContainText('10:00')
  await expect(table.getByRole('row').nth(3)).toContainText('08:00')
  await expect(table.getByRole('row').nth(4)).toContainText('0,000001 kWh')
  await expect(table.getByRole('row').nth(5)).toContainText('Indisponível')

  const params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
  expect(params.get('seriesEnergyUnit')).toBe('kWh')
  expect(params.has('seriesEnergyMin')).toBe(false)
  expect(params.has('seriesEnergyMax')).toBe(false)
})

test('mantém pontos com unidades mistas e libera a faixa numérica após escolher a unidade', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&fixture=series-mixed-units')

  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  const unit = series.getByRole('combobox', { name: 'Unidade da energia', exact: true })
  const minimum = series.getByRole('spinbutton', { name: 'Energia mínima', exact: true })
  const maximum = series.getByRole('spinbutton', { name: 'Energia máxima', exact: true })
  const energyHeader = series.getByRole('columnheader', { name: 'Energia', exact: true })
  const energySort = energyHeader.getByRole('button', { name: 'Energia', exact: true })

  await expect(table.getByRole('row')).toHaveCount(3)
  await expect(table).toContainText('1 kWh')
  await expect(table).toContainText(/1[.\u00a0]?000\s*Wh/)
  await expect(series.getByText('Selecione uma unidade antes de filtrar ou ordenar.', { exact: true })).toBeVisible()
  await expect(minimum).toBeDisabled()
  await expect(maximum).toBeDisabled()
  await expect(energySort).toBeDisabled()

  await unit.selectOption('kWh')
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table).toContainText('1 kWh')
  await expect(table).not.toContainText('1000 Wh')
  await expect(minimum).toBeEnabled()
  await expect(maximum).toBeEnabled()
  await expect(energySort).toBeEnabled()
  await energySort.click()
  await expect(energyHeader).toHaveAttribute('aria-sort', 'ascending')

  await unit.selectOption('Wh')
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table).toContainText(/1[.\u00a0]?000\s*Wh/)
  await expect(table).not.toContainText('1 kWh')
  const params = new URL(page.url()).searchParams
  expect(params.get('seriesEnergyUnit')).toBe('Wh')
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
})

test('restaura instantes ISO no fuso salvo ao reabrir em outro fuso e exclui o ponto após o limite', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', locale: 'pt-BR', timezoneId: 'UTC' })
  const page = await context.newPage()
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&seriesFrom=2026-10-17T13%3A00%3A00.000Z&seriesTo=2026-10-17T15%3A00%3A00.000Z&seriesTimeZone=America%2FSao_Paulo&fixture=series-dates')

  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  await expect(series.getByText('Fuso horário: America/Sao_Paulo', { exact: true })).toBeVisible()
  await expect(series.getByLabel('Data inicial da série', { exact: true })).toHaveValue('2026-10-17T10:00')
  await expect(series.getByLabel('Data final da série', { exact: true })).toHaveValue('2026-10-17T12:00')

  const table = series.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(5)
  await expect(table.getByRole('row').nth(1)).toContainText('10:00')
  await expect(table.getByRole('row').nth(2)).toContainText('10:30')
  await expect(table.getByRole('row').nth(3)).toContainText('11:00')
  await expect(table.getByRole('row').nth(4)).toContainText('12:00')
  await expect(table).toContainText('5 kWh')
  await expect(table).not.toContainText('1 kWh')
  await expect(table).not.toContainText('6 kWh')

  const params = new URL(page.url()).searchParams
  expect(params.get('seriesFrom')).toBe('2026-10-17T13:00:00.000Z')
  expect(params.get('seriesTo')).toBe('2026-10-17T15:00:00.000Z')
  expect(params.get('seriesTimeZone')).toBe('America/Sao_Paulo')
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
  await context.close()
})

test('apresenta contribuições e exclusões da fonte sem recalcular o total ambiental', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=composition-data')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await page.locator('#analysis-details summary').click()
  const composition = page.getByRole('region', { name: /Composição/ })
  const totals = composition.getByRole('region', { name: 'Totais do período', exact: true })
  await expect(totals.getByRole('group', { name: 'Energia', exact: true })).toContainText(/0\s*kWh/)
  await expect(composition.getByRole('heading', { name: 'Contribuições válidas', exact: true })).toBeVisible()
  await expect(composition.getByRole('heading', { name: 'Exclusões', exact: true })).toBeVisible()

  const contribution = composition.getByRole('group', { name: 'Contribuição do centro de dados SP', exact: true })
  await expect(contribution).toContainText('0,000001 kWh')
  await expect(contribution).toContainText('Origem')
  await expect(contribution).toContainText('Snapshot original do agregador SP')
  await expect(contribution).toContainText('Intervalo')
  await expect(contribution).toContainText('17/10/2026')
  await expect(contribution).toContainText('Não calculável')

  const exclusion = composition.getByRole('group', { name: 'Segmento sem observação', exact: true })
  await expect(exclusion).toContainText('Intervalo')
  await expect(exclusion).toContainText('17/10/2026')
  await expect(exclusion).toContainText('Motivo')
  await expect(exclusion).toContainText('A origem não confirmou uma observação neste intervalo')
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true }).first()).not.toContainText('0,000001 kWh')
})

test('distingue composição vazia de indisponibilidade da fonte', async ({ page }) => {
  await mockCatalog(page, [application()])
  const base = '/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture='
  await page.goto(`${base}composition-empty`)

  await page.locator('#analysis-details summary').click()
  let composition = page.getByRole('region', { name: /Composição/ })
  await expect(composition.getByRole('status')).toContainText('Nenhuma contribuição válida ou exclusão no período selecionado.')
  await expect(composition.getByRole('status')).not.toContainText('indisponível')
  await expect(composition.getByRole('region', { name: 'Totais do período' }).getByRole('group', { name: 'Energia', exact: true })).toContainText(/0\s*kWh/)

  await page.goto(`${base}composition-unavailable`)
  await page.locator('#analysis-details summary').click()
  composition = page.getByRole('region', { name: /Composição/ })
  await expect(composition.getByRole('status')).toContainText('Composição ambiental indisponível')
  await expect(composition.getByRole('status')).toContainText('A fonte de composição não respondeu para este período')
  await expect(composition.getByRole('status')).not.toContainText('Nenhuma contribuição válida')
  await expect(composition.getByRole('region', { name: 'Totais do período' }).getByRole('group', { name: 'Energia', exact: true })).toContainText(/0\s*kWh/)
})

test('fixture de revisão apresenta estados originais, zero, lacuna e granularidade da fonte', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture=design-review')
  await page.locator('#analysis-details summary').click()

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/3,5\s*kWh/)
  await expect(analysis.getByRole('group', { name: 'CO\u2082e', exact: true })).toContainText('N\u00e3o calcul\u00e1vel')
  await expect(page.getByRole('region', { name: 'Fatores aplicados' }).getByRole('group', { name: 'BR-SP', exact: true })).toContainText('snapshot-alpha-raw-91')
  await expect(page.getByRole('region', { name: 'Metodologia aplicada' }).getByRole('group', { name: 'Modelo de estimativa energ\u00e9tica', exact: true })).toContainText('energy-source-snapshot-raw-12')

  const composition = page.getByRole('region', { name: /Composi\u00e7\u00e3o do impacto ambiental/ })
  await expect(composition.getByRole('group', { name: 'Contribui\u00e7\u00e3o sem consumo', exact: true })).toContainText(/0\s*kWh/)
  await expect(composition.getByRole('group', { name: 'Intervalo sem observa\u00e7\u00e3o', exact: true })).toContainText('A fonte n\u00e3o confirmou observa\u00e7\u00f5es neste intervalo')

  const granularity = page.getByRole('region', { name: 'Granularidade', exact: true })
  await expect(granularity.getByRole('button', { name: 'Janela A da fonte', exact: true })).toBeVisible()
  await page.locator('#analysis-details summary').click()
  const series = page.getByRole('region', { name: 'Evolu\u00e7\u00e3o do consumo e emiss\u00f5es', exact: true })
  await series.getByRole('group', { name: 'M\u00e9trica do gr\u00e1fico', exact: true }).getByRole('button', { name: 'Energia', exact: true }).click()
  await expect(series.getByRole('figure', { name: /Evolu\u00e7\u00e3o de energia.*0\s*kWh/ })).toBeVisible()
  await expect(series).toContainText('Lacunas n\u00e3o representam zero; consulte a tabela para ver os pontos sem valor.')
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(4)
  await expect(table).toContainText(/0\s*kWh/)
  await expect(table).toContainText('Indispon\u00edvel')
})
