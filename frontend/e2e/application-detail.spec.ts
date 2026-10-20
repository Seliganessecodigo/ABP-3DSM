import { expect, test } from '@playwright/test'
import { application, gate, largeCatalog, mockApi, mockCatalog, row, search, unavailable } from './support/catalog.ts'

test('detail reference viewport keeps the sidebar fixed and free of scrollbars', async ({ page }) => {
  const to = '2026-10-17T20:00:00.000Z'
  const from = '2026-10-10T20:00:00.000Z'
  await page.clock.install({ time: new Date(to) })
  await page.clock.pauseAt(new Date(to))
  await page.setViewportSize({ width: 996, height: 619 })
  await mockCatalog(page, [application()])
  await page.route(/(?:\/api)?\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path.endsWith('/series')) {
      const seriesFrom = url.searchParams.get('from') ?? from
      const isPreviousPeriod = seriesFrom !== from
      const points = Array.from({ length: 7 }, (_, index) => {
        const start = Date.parse(seriesFrom) + index * 24 * 60 * 60 * 1000
        const end = start + 24 * 60 * 60 * 1000
        return { id: `point-${index}`, bucketStart: new Date(start).toISOString(), bucketEnd: new Date(end).toISOString(),
          period: { from: new Date(start).toISOString(), to: new Date(end).toISOString() },
          energy: { value: (isPreviousPeriod ? 4 : 5) + index * (isPreviousPeriod ? 0.3 : 0.4), unit: 'kWh', reasons: [] },
          emissions: { value: (isPreviousPeriod ? 1400 : 1700) + index * (isPreviousPeriod ? 100 : 136), unit: 'gCO2e', reasons: [] },
          coverage: { energy: 0.96, emissions: 0.96 } }
      })
      await route.fulfill({ json: { status: 'available', applicationId: 'svc-0142', period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') }, granularity: 'day',
        totals: { energy: { value: 42.1, unit: 'kWh' }, emissions: { value: 4.2, unit: 'kgCO2e' } },
        coverage: { energy: 0.96, emissions: 0.96 }, points, events: Array.from({ length: 14 }, (_, index) => ({
          id: `event-${index}`, at: new Date(Date.parse(from) + (index + 1) * 12 * 60 * 60 * 1000).toISOString(),
          type: 'status_changed', details: { before: { state: 'AVAILABLE' }, after: { state: 'UNAVAILABLE' } },
        })) } })
      return
    }
    await route.fulfill({ json: { status: 'available', applicationId: 'svc-0142', period: { from, to },
      energy: { value: 42.1, unit: 'kWh', reasons: [] }, emissions: { value: 4.2, unit: 'kgCO2e', reasons: [] },
      coverage: { energy: 0.96, emissions: 0.96 },
      provenance: { methodologies: [{ key: 'estimate', version: '2.1', parameters: {} }], factors: [{
        contractVersion: '1', regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: 'São Paulo',
        intensity: 100, unit: 'gCO2e/kWh', version: '2026.1', source: 'fixture', validFrom: from,
        validUntil: null, queriedAt: { from, to },
      }], reasons: [] } } })
  })
  await page.route('**/collections/latest*', async (route) => {
    await route.fulfill({ json: { id: 'collection-layout', applicationId: 'svc-0142', intervalStart: '2026-10-19T14:25:00.000Z',
      intervalEnd: '2026-10-19T14:30:00.000Z', collectedAt: '2026-10-19T14:30:00.000Z', collectionIntervalSeconds: 300,
      isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID', lastCheckedAt: '2026-10-19T14:30:00.000Z', isCalculable: true,
      metrics: { cpu: { value: 38, unit: '%', status: 'available' }, memory: { value: null, unit: null, status: 'missing' },
        disk: { value: 0, unit: 'GB/s', status: 'available' }, network: { value: null, unit: 'Mbps', status: 'invalid' } } } })
  })
  await page.goto('/services/svc-0142')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  await expect(page.getByRole('group', { name: /Evolução de CO₂e/ })).toBeVisible()
  await expect(page.getByRole('table')).toContainText('38 %')

  const before = await page.evaluate(() => {
    const sidebar = document.querySelector<HTMLElement>('.sidebar')!
    return {
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      workspaceHeight: document.querySelector<HTMLElement>('.workspace')!.clientHeight,
      workspaceContentHeight: document.querySelector<HTMLElement>('.workspace')!.scrollHeight,
      sidebarHeight: sidebar.clientHeight,
      sidebarContentHeight: sidebar.scrollHeight,
      sidebarWidth: sidebar.clientWidth,
      sidebarContentWidth: sidebar.scrollWidth,
      sidebarTop: sidebar.getBoundingClientRect().top,
      sidebarLeft: sidebar.getBoundingClientRect().left,
      sidebarRight: sidebar.getBoundingClientRect().right,
      regions: (() => {
        const main = document.querySelector<HTMLElement>('main')!
        const analysis = main.children[2] as HTMLElement
        const metricCards = analysis.children[0].querySelector<HTMLElement>('div')!
        return [main.children[0], main.children[1], metricCards, analysis.children[1], analysis.children[2]].map(element => {
          const rect = element.getBoundingClientRect()
          return { className: (element as HTMLElement).className, x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        })
      })(),
    }
  })
  expect.soft(before.documentHeight).toBeLessThanOrEqual(before.viewportHeight + 1)
  expect.soft(before.workspaceContentHeight).toBeLessThanOrEqual(before.workspaceHeight + 1)
  expect.soft(before.sidebarContentHeight).toBeLessThanOrEqual(before.sidebarHeight + 1)
  expect.soft(before.sidebarContentWidth).toBeLessThanOrEqual(before.sidebarWidth + 1)
  expect.soft(before.sidebarLeft).toBe(0)
  expect.soft(before.sidebarTop).toBe(0)
  expect.soft(before.sidebarRight).toBeGreaterThan(160)
  expect.soft(before.regions[2]).toMatchObject({ x: 192, y: 95, width: 760, height: 116 })
  expect.soft(before.regions[3]).toMatchObject({ x: 192, y: 219, width: 760, height: 88 })
  expect.soft(before.regions[4]).toMatchObject({ x: 192, y: 319, width: 760, height: 276 })
  const headingAlignment = await page.evaluate(() => {
    const title = document.querySelector('main h1')!
    const titleText = document.createRange()
    titleText.selectNodeContents(title)
    const titleTextRect = titleText.getBoundingClientRect()
    const badge = document.querySelector('main .state-badge')!.getBoundingClientRect()
    return { gap: badge.left - titleTextRect.right, verticalOffset: badge.top - title.getBoundingClientRect().top }
  })
  expect(headingAlignment.gap).toBeGreaterThanOrEqual(0)
  expect(headingAlignment.gap).toBeLessThanOrEqual(8)
  expect(Math.abs(headingAlignment.verticalOffset)).toBeLessThanOrEqual(4)
  await expect(page.locator('.events')).toHaveCount(0)
  await expect(page.locator('[data-series-event-marker]')).toHaveCount(7)
  expect(await page.locator('[data-series-event-marker]').evaluateAll(markers => markers.reduce((total, marker) => total + Number(marker.getAttribute('data-event-count')), 0))).toBe(12)
  await expect(page.getByRole('group', { name: 'Métrica' }).getByRole('button', { name: 'CO₂e' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.eventSummary')).toHaveCount(0)
  await expect(page.getByText(/12 · Eventos do período/)).toBeVisible()
  await expect.poll(() => page.getByRole('group', { name: /Evolução de CO₂e/ }).evaluate(chart => chart.getBoundingClientRect().height)).toBe(176)
  await expect(page.locator('[data-metric-sparkline]')).toHaveCount(2)
  await expect(page.locator('[data-coverage-ring]')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Evolução do consumo e emissões • 7 dias' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hora', exact: true })).toBeVisible()
  await expect(page.getByRole('group', { name: /Evolução de CO₂e \(kgCO2e\)/ })).toBeVisible()
  const chartPoint = page.getByRole('button', { name: /16\/10\/2026/ })
  await chartPoint.hover()
  await expect(page.getByRole('status')).toContainText('Atual:')
  await expect(page.getByRole('status')).toContainText('Anterior:')
  await chartPoint.focus()
  await expect(page.getByRole('status')).toBeVisible()

  const afterScroll = await page.evaluate(() => {
    const sidebar = document.querySelector<HTMLElement>('.sidebar')!
    const layout = document.querySelector<HTMLElement>('.detail-layout')!
    window.scrollTo(0, 1000)
    return { sidebarTop: sidebar.getBoundingClientRect().top, windowScrollY: window.scrollY,
      layoutPosition: getComputedStyle(layout).position }
  })
  expect(afterScroll.windowScrollY).toBe(0)
  expect(afterScroll.layoutPosition).toBe('fixed')
  expect(afterScroll.sidebarTop).toBe(before.sidebarTop)
  await page.screenshot({ path: '../.github/evidencias/65-integracao-ambiental/detail-desktop-light-figma-alinhado.png' })
  await page.getByRole('button', { name: 'Ver detalhes' }).click()
  await expect(page.locator('#analysis-details')).toHaveAttribute('open', '')
  await expect(page.locator('#analysis-details')).toContainText('2026.1')

  await page.setViewportSize({ width: 1888, height: 1000 })
  const wideViewport = await page.evaluate(() => {
    const workspace = document.querySelector<HTMLElement>('.workspace')!
    const sidebar = document.querySelector<HTMLElement>('.sidebar')!
    return { workspaceHeight: workspace.clientHeight, workspaceContentHeight: workspace.scrollHeight,
      sidebarHeight: sidebar.clientHeight, sidebarContentHeight: sidebar.scrollHeight }
  })
  expect.soft(wideViewport.workspaceContentHeight).toBeLessThanOrEqual(wideViewport.workspaceHeight + 1)
  expect.soft(wideViewport.sidebarContentHeight).toBeLessThanOrEqual(wideViewport.sidebarHeight + 1)
  await page.screenshot({ path: '../.github/evidencias/65-integracao-ambiental/detail-desktop-wide-diagnostic.png' })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.sidebar')).not.toHaveClass(/sidebar-open/)
  await expect.poll(() => page.locator('.sidebar').evaluate((sidebar) => sidebar.getBoundingClientRect().right)).toBeLessThanOrEqual(0)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.screenshot({ path: '../.github/evidencias/65-integracao-ambiental/detail-mobile-light-figma-alinhado.png' })
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  const mobileSidebar = page.locator('.sidebar')
  await expect.poll(() => mobileSidebar.evaluate((sidebar) => sidebar.scrollHeight <= sidebar.clientHeight)).toBe(true)
})

test('navegação mantém Aplicações ativa no detalhe', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142')

  const navigation = page.getByRole('navigation')
  await expect(navigation.getByRole('link', { name: 'Aplicações', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('selecionar Aplicações no drawer móvel fecha o menu e foca a nova página', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142')

  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Aplicações', exact: true }).click()

  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
  await expect(page.getByRole('navigation')).toBeHidden()
  await expect(page.getByRole('main')).toBeFocused()
})

test('seleção abre somente o ID escolhido mesmo com nomes iguais', async ({ page }) => {
  await mockCatalog(page, [application(), application({ id: 'svc-outro' })])
  await page.goto('/')
  await row(page, 'svc-outro').getByRole('link', { name: /ver detalhes/i }).click()
  await expect(page).toHaveURL(/\/services\/svc-outro(?:\?|$)/)
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('svc-outro')
  await expect(page.getByRole('main')).not.toContainText('svc-0142')
})

test('URL direta e recarga conservam identidade e detalhe', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/\/services\/svc-0142(?:\?|$)/)
  await expect(page.getByRole('main')).toContainText('svc-0142')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
})

test('ID com caracteres reservados é codificado na navegação e conserva identidade', async ({ page }) => {
  const id = 'svc/financeiro?origem=teste'
  await mockCatalog(page, [application({ id })])
  await page.goto('/')
  await row(page, id).getByRole('link', { name: /ver detalhes/i }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe(`/services/${encodeURIComponent(id)}`)
  await expect(page.getByRole('main')).toContainText(id)
})

test('detalhe exibe localização completa, estado e timestamps com fuso', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142')
  const main = page.getByRole('main')
  await expect(main).toContainText('BR-SP')
  await expect(main).toContainText('Brasil')
  await expect(main).toContainText('São Paulo')
  await expect(main).toContainText(/[-−]23[,.]55/)
  await expect(main).toContainText(/[-−]46[,.]63/)
  await expect(main).toContainText('Disponível')
  await expect(main).toContainText('09/10/2026')
  await expect(main).toContainText('09:00')
  await expect(main).toContainText('14:32')
  await expect(main).toContainText(/(?:UTC|GMT)[−-]0?3|America\/Sao_Paulo|BRT|Brasília/i)
})

test('detalhe com localização e verificação ausentes não fabrica informações', async ({ page }) => {
  await mockCatalog(page, [application({ location: null, lastCheckedAt: null })])
  await page.goto('/services/svc-0142')
  const main = page.getByRole('main')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  await expect(main).toContainText(/localização[\s\S]*(não informada|indisponível)/i)
  await expect(main).toContainText(/sem observação/i)
  await expect(main).not.toContainText('BR-SP')
})

test('aplicação removida continua consultável com horário de remoção', async ({ page }) => {
  await mockCatalog(page, [application({ state: 'REMOVED', removedAt: '2026-10-09T18:00:00.000Z', updatedAt: '2026-10-09T18:00:00.000Z' })])
  await page.goto('/services/svc-0142')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('Removida')
  await expect(page.getByRole('main')).toContainText('15:00')
  await page.locator('#analysis-details summary').click()
  await expect(page.getByText(/não se aplica.*observação|observação.*não se aplica/i)).toBeVisible()
  await expect(page.getByRole('main')).not.toContainText(/observação atual/i)
})

test('carregamento do detalhe identifica a espera e mantém retorno acessível', async ({ page }) => {
  const pending = gate()
  await mockApi(page, async (route) => {
    await pending.wait
    await route.fulfill({ json: application() })
  })
  await page.goto('/services/svc-0142')
  try {
    await expect(page.getByRole('status')).toContainText(/carregando/i)
    await expect(page.getByRole('link', { name: /voltar ao catálogo/i })).toBeVisible()
  } finally {
    pending.release()
  }
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
})

test('ID inexistente mostra não encontrada e permite retornar ao catálogo', async ({ page }) => {
  await mockCatalog(page, [])
  await page.goto('/services/inexistente')
  await expect(page.getByRole('main')).toContainText(/aplicação não encontrada/i)
  await page.getByRole('link', { name: /voltar ao catálogo/i }).click()
  await expect(page.getByText(/nenhuma aplicação reconhecida/i)).toBeVisible()
})

test('falha no detalhe é distinta de não encontrada e permite nova tentativa', async ({ page }) => {
  let failing = true
  await mockApi(page, async (route) => {
    if (failing) await unavailable(route)
    else await route.fulfill({ json: application() })
  })
  await page.goto('/services/svc-0142')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('main')).not.toContainText(/aplicação não encontrada/i)
  await expect(page.getByRole('link', { name: /voltar ao catálogo/i })).toBeVisible()
  failing = false
  await page.getByRole('button', { name: /tentar novamente/i }).click()
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
})

test('retorno conserva busca, estado, página e contexto de período', async ({ page }) => {
  await mockCatalog(page, largeCatalog())
  // period é contexto de navegação; não é um parâmetro da API de catálogo.
  await page.goto('/?period=2026-10')
  await search(page).fill('api-')
  await page.getByRole('button', { name: /^Disponível\b/i }).click()
  await page.getByRole('button', { name: /próxima página/i }).click()
  await row(page, 'svc-011').getByRole('link', { name: /ver detalhes/i }).click()
  await expect(page).toHaveURL(/\/services\/svc-011(?:\?|$)/)
  expect(new URL(page.url()).searchParams.get('period')).toBe('2026-10')
  await page.getByRole('link', { name: /voltar ao catálogo/i }).click()
  await expect(search(page)).toHaveValue('api-')
  await expect(page.getByRole('button', { name: /^Disponível\b/i })).toHaveAttribute('aria-pressed', 'true')
  await expect(row(page, 'svc-011')).toBeVisible()
  await expect(row(page, 'svc-001')).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get('period')).toBe('2026-10')
})

test('retorno do detalhe restaura posição e foco no serviço selecionado', async ({ page }) => {
  await mockCatalog(page, largeCatalog())
  await page.goto('/')
  await search(page).fill('api-')
  await page.getByRole('button', { name: /próxima página/i }).click()
  const detailLink = row(page, 'svc-011').getByRole('link', { name: /ver detalhes/i })
  await detailLink.focus()
  await detailLink.click()
  const returnState = await page.evaluate(() => window.sessionStorage.getItem('greener:catalog-return'))
  expect(returnState).not.toBeNull()
  await page.getByRole('link', { name: /voltar ao catálogo/i }).click()
  await expect(row(page, 'svc-011').getByRole('link', { name: /ver detalhes/i })).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})

test('detalhe exibe evidência atual, valores parciais e intervalo selecionado', async ({ page }) => {
  const current = {
    id: 'collection-current', applicationId: 'svc-0142', intervalStart: '2026-10-09T17:00:00.000Z',
    intervalEnd: '2026-10-09T17:30:00.000Z', collectedAt: '2026-10-09T17:32:00.000Z',
    collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID',
    lastCheckedAt: '2026-10-09T17:32:00.000Z', isCalculable: true,
    metrics: {
      cpu: { value: 38, unit: '%', status: 'available' },
      memory: { value: null, unit: null, status: 'missing' },
      disk: { value: 0, unit: 'GB/s', status: 'available' },
      network: { value: 1.2, unit: 'Mbps', status: 'available' },
    },
  }
  await page.route(/\/applications(?:\/[^/?]+)?(?:\/collections(?:\/[^/?]+)?)?$/, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/collections/latest')) return route.fulfill({ json: current })
    if (pathname.endsWith('/collections/collection-history')) return route.fulfill({ json: { ...current, id: 'collection-history', isStale: true } })
    if (pathname.endsWith('/svc-0142')) return route.fulfill({ json: application() })
    await route.continue()
  })
  await page.goto('/services/svc-0142?collectionId=collection-history')
  const evidence = page.getByRole('region', { name: /evidências operacionais/i })
  await expect(evidence).toContainText(/CPU/i)
  await expect(evidence).toContainText('38 %')
  await expect(evidence).toContainText(/Memória/i)
  await expect(evidence).toContainText(/ausente|não disponível/i)
  await expect(evidence).toContainText(/0 GB\/s/)
  await expect(evidence).toContainText(/intervalo representado/i)
  await expect(evidence).toContainText(/recebido pelo GreenER/i)
  await expect(evidence).toContainText(/desatualizada|antiga/i)
  await expect(evidence).toContainText('14:32')
})

test('busca operacional encontra métricas e valores sem depender de acento ou caixa', async ({ page }) => {
  const evidence = {
    id: 'collection-current', applicationId: 'svc-0142', intervalStart: '2026-10-09T17:00:00.000Z',
    intervalEnd: '2026-10-09T17:30:00.000Z', collectedAt: '2026-10-09T17:32:00.000Z',
    collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID',
    lastCheckedAt: '2026-10-09T17:32:00.000Z',
    metrics: {
      cpu: { value: 38, unit: '%', status: 'available' },
      memory: { value: null, unit: null, status: 'missing' },
      disk: { value: 0, unit: 'GB/s', status: 'available' },
      network: { value: 1.2, unit: 'Mbps', status: 'available' },
    },
  }
  await page.route(/\/applications(?:\/[^/?]+)?(?:\/collections(?:\/[^/?]+)?)?$/, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/collections/collection-current') || pathname.endsWith('/collections/latest')) return route.fulfill({ json: evidence })
    if (pathname.endsWith('/svc-0142')) return route.fulfill({ json: application() })
    await route.continue()
  })
  await page.goto('/services/svc-0142?collectionId=collection-current&period=7d')

  const region = page.getByRole('region', { name: /evidências operacionais/i })
  const table = region.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(5)
  await region.locator('details summary').click()
  const searchField = region.getByRole('searchbox', { name: 'Buscar evidências', exact: true })

  await searchField.fill('MEMORIA')
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table.getByRole('row').nth(1)).toContainText(/Memória/i)
  await expect(table.getByRole('row').nth(1)).toContainText(/ausente|não disponível/i)

  await searchField.fill('0 GB/S')
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table.getByRole('row').nth(1)).toContainText('Disco')
  await expect(table.getByRole('row').nth(1)).toContainText(/0 GB\/s/i)
  await expect(page).toHaveURL(/collectionId=collection-current/)
  await expect(page).toHaveURL(/period=7d/)
})

test('combina busca, métrica e situação e limpa os filtros sem indexar o placeholder', async ({ page }) => {
  const evidence = {
    id: 'collection-current', applicationId: 'svc-0142', intervalStart: '2026-10-09T17:00:00.000Z',
    intervalEnd: '2026-10-09T17:30:00.000Z', collectedAt: '2026-10-09T17:32:00.000Z',
    collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID',
    lastCheckedAt: '2026-10-09T17:32:00.000Z',
    metrics: {
      cpu: { value: 38, unit: '%', status: 'available' },
      memory: { value: null, unit: null, status: 'missing' },
      disk: { value: 0, unit: 'GB/s', status: 'available' },
      network: { value: 1.2, unit: 'Mbps', status: 'available' },
    },
  }
  await page.route(/\/applications(?:\/[^/?]+)?(?:\/collections(?:\/[^/?]+)?)?$/, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/collections/collection-current') || pathname.endsWith('/collections/latest')) return route.fulfill({ json: evidence })
    if (pathname.endsWith('/svc-0142')) return route.fulfill({ json: application() })
    await route.continue()
  })
  await page.goto('/services/svc-0142?collectionId=collection-current&period=7d')

  const region = page.getByRole('region', { name: /evidências operacionais/i })
  const table = region.getByRole('table')
  await region.locator('details summary').click()
  const searchField = region.getByRole('searchbox', { name: 'Buscar evidências', exact: true })
  await expect(table.getByRole('row')).toHaveCount(5)
  await expect(region.getByText('4 de 4 métricas', { exact: true })).toBeVisible()

  await searchField.fill('Sem valor')
  await expect(table.getByRole('row')).toHaveCount(1)
  await expect(region.getByText('Nenhuma evidência corresponde aos filtros.', { exact: true })).toBeVisible()

  await searchField.fill('MEMORIA')
  await region.getByRole('combobox', { name: 'Métrica', exact: true }).selectOption({ label: 'Memória' })
  await region.getByRole('combobox', { name: 'Situação', exact: true }).selectOption({ label: 'Ausente' })
  await expect(table.getByRole('row')).toHaveCount(2)
  await expect(table.getByRole('row').nth(1)).toContainText('Memória')
  await expect(table.getByRole('row').nth(1)).toContainText('Ausente')
  await expect(region.getByText('1 de 4 métricas', { exact: true })).toBeVisible()

  await searchField.fill('CPU')
  await expect(table.getByRole('row')).toHaveCount(1)
  await expect(region.getByText('Nenhuma evidência corresponde aos filtros.', { exact: true })).toBeVisible()
  await expect(region.getByText('0 de 4 métricas', { exact: true })).toBeVisible()

  await region.getByRole('button', { name: 'Limpar filtros', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(5)
  await expect(region.getByText('4 de 4 métricas', { exact: true })).toBeVisible()
  await expect(searchField).toHaveValue('')
  await expect(page).toHaveURL(/collectionId=collection-current/)
  await expect(page).toHaveURL(/period=7d/)
})

test('ordena os rótulos de métrica e situação sem comparar unidades numéricas', async ({ page }) => {
  const evidence = {
    id: 'collection-current', applicationId: 'svc-0142', intervalStart: '2026-10-09T17:00:00.000Z',
    intervalEnd: '2026-10-09T17:30:00.000Z', collectedAt: '2026-10-09T17:32:00.000Z',
    collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID',
    lastCheckedAt: '2026-10-09T17:32:00.000Z',
    metrics: {
      cpu: { value: 38, unit: '%', status: 'available' },
      memory: { value: null, unit: null, status: 'missing' },
      disk: { value: 0, unit: 'GB/s', status: 'available' },
      network: { value: 1.2, unit: 'Mbps', status: 'available' },
    },
  }
  await page.route(/\/applications(?:\/[^/?]+)?(?:\/collections(?:\/[^/?]+)?)?$/, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/collections/collection-current') || pathname.endsWith('/collections/latest')) return route.fulfill({ json: evidence })
    if (pathname.endsWith('/svc-0142')) return route.fulfill({ json: application() })
    await route.continue()
  })
  await page.goto('/services/svc-0142?collectionId=collection-current&period=7d')

  const region = page.getByRole('region', { name: /evidências operacionais/i })
  const table = region.getByRole('table')
  const metricHeader = table.getByRole('columnheader', { name: 'Métrica', exact: true })
  const situationHeader = table.getByRole('columnheader', { name: 'Situação', exact: true })
  await expect(metricHeader).toHaveAttribute('aria-sort', 'ascending')
  await expect(table.getByRole('rowheader')).toHaveText(['CPU', 'Disco', 'Memória', 'Rede de saída'])

  await metricHeader.getByRole('button', { name: 'Métrica', exact: true }).click()
  await expect(metricHeader).toHaveAttribute('aria-sort', 'descending')
  await expect(table.getByRole('rowheader')).toHaveText(['Rede de saída', 'Memória', 'Disco', 'CPU'])

  await metricHeader.getByRole('button', { name: 'Métrica', exact: true }).click()
  await expect(metricHeader).toHaveAttribute('aria-sort', 'ascending')
  await expect(table.getByRole('rowheader')).toHaveText(['CPU', 'Disco', 'Memória', 'Rede de saída'])

  await situationHeader.getByRole('button', { name: 'Situação', exact: true }).click()
  await expect(situationHeader).toHaveAttribute('aria-sort', 'ascending')
  await expect(table.getByRole('rowheader')).toHaveText(['Memória', 'CPU', 'Rede de saída', 'Disco'])
  await expect(page).toHaveURL(/collectionId=collection-current/)
  await expect(page).toHaveURL(/period=7d/)
})

test('volta do navegador conserva o contexto da lista', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/')
  await search(page).fill('pagamentos')
  await row(page, 'svc-0142').getByRole('link', { name: /ver detalhes/i }).click()
  await expect(page).toHaveURL(/\/services\/svc-0142(?:\?|$)/)
  await page.goBack()
  await expect(search(page)).toHaveValue('pagamentos')
  await expect(row(page, 'svc-0142')).toBeVisible()
})

test('falha ao atualizar preserva evidência e permite nova tentativa', async ({ page }) => {
  const evidence = {
    id: 'collection-current', applicationId: 'svc-0142', intervalStart: '2026-10-09T17:00:00.000Z',
    intervalEnd: '2026-10-09T17:30:00.000Z', collectedAt: '2026-10-09T17:32:00.000Z',
    collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID',
    lastCheckedAt: '2026-10-09T17:32:00.000Z',
    metrics: { cpu: { value: 38, unit: '%', status: 'available' }, memory: { value: null, unit: 'GB', status: 'missing' },
      disk: { value: 0, unit: 'GB', status: 'available' }, network: { value: 1.2, unit: 'Mbps', status: 'available' } },
  }
  let failedOnce = false
  await page.route(/\/applications(?:\/[^/?]+)?(?:\/collections(?:\/[^/?]+)?)?$/, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/collections/latest')) {
      if (!failedOnce) { failedOnce = true; return route.fulfill({ json: evidence }) }
      if (failedOnce) { failedOnce = false; return route.fulfill({ status: 503, json: { code: 'APPLICATION_EVIDENCE_UNAVAILABLE' } }) }
    }
    if (pathname.endsWith('/svc-0142')) return route.fulfill({ json: application() })
    await route.continue()
  })
  await page.goto('/services/svc-0142')
  const evidenceRegion = page.getByRole('region', { name: /evidências operacionais/i })
  await expect(evidenceRegion).toContainText('38 %')
  await evidenceRegion.getByRole('button', { name: /atualizar dados/i }).click()
  await expect(evidenceRegion.getByRole('alert')).toBeVisible()
  await expect(evidenceRegion).toContainText('38 %')
  await evidenceRegion.getByRole('button', { name: /tentar novamente/i }).click()
  await expect(evidenceRegion.getByRole('alert')).toHaveCount(0)
  await expect(evidenceRegion).toContainText('38 %')
})

test('evidência inexistente e intervalo selecionado indisponível não usam fallback', async ({ page }) => {
  await page.route(/\/applications(?:\/[^/?]+)?(?:\/collections(?:\/[^/?]+)?)?$/, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/collections/latest')) return route.fulfill({ status: 404, json: { code: 'COLLECTION_NOT_FOUND' } })
    if (pathname.includes('/collections/')) return route.fulfill({ status: 404, json: { code: 'COLLECTION_NOT_FOUND' } })
    if (pathname.endsWith('/svc-0142')) return route.fulfill({ json: application() })
    await route.continue()
  })
  await page.goto('/services/svc-0142')
  const evidence = page.getByRole('region', { name: /evidências operacionais/i })
  await expect(evidence).toContainText(/nenhuma evidência disponível/i)
  await page.goto('/services/svc-0142?collectionId=collection-missing')
  await expect(evidence).toContainText(/evidência selecionada não está disponível/i)
  await expect(evidence.getByRole('table')).toHaveCount(0)
})

test('resposta atrasada de uma seleção anterior não substitui a aplicação atual', async ({ page }) => {
  const pending = gate()
  const settled = gate()
  const started = gate()
  const first = application()
  const second = application({ id: 'svc-atual', name: 'app-atual' })
  await mockApi(page, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/applications')) {
      await route.fulfill({ json: [first, second] })
    } else if (pathname.endsWith('/svc-0142')) {
      started.release()
      await pending.wait
      try {
        await route.fulfill({ json: first })
      } catch (error) {
        // Cancelar a requisição antiga também atende ao requisito.
        if (!route.request().failure()) throw error
      } finally {
        settled.release()
      }
    } else {
      await route.fulfill({ json: second })
    }
  })
  await page.goto('/services/svc-0142')
  try {
    await expect(page.getByRole('status')).toContainText(/carregando/i)
    await started.wait
    await page.getByRole('link', { name: /voltar ao catálogo/i }).click()
    await row(page, 'svc-atual').getByRole('link', { name: /ver detalhes/i }).click()
    await expect(page.getByRole('heading', { name: 'app-atual', exact: true })).toBeVisible()
  } finally {
    pending.release()
  }
  await settled.wait
  // Aguarda a oportunidade de renderizar a resposta antiga antes de conferir a seleção.
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  await expect(page.getByRole('main')).toContainText('svc-atual')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toHaveCount(0)
})
