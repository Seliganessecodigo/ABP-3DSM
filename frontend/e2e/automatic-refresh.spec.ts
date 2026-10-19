import { expect, test } from '@playwright/test'
import { application, gate, largeCatalog, mockApi, row, search } from './support/catalog.ts'

test('the catalog refreshes one minute after the previous response', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00.000Z') })
  let requests = 0
  let refreshed = false
  await mockApi(page, async (route) => {
    requests += 1
    const catalog = !refreshed
      ? [application()]
      : [application(), application({ id: 'svc-new', name: 'app-new' })]
    await route.fulfill({ json: catalog })
  })

  await page.goto('/')
  await expect(row(page, 'svc-0142')).toBeVisible()
  await expect.poll(() => requests).toBeGreaterThan(0)
  const initialRequests = requests
  await expect(page.getByText(/Frequência da interface: 60 s/i)).toBeVisible()
  await expect(page.getByText(/Última tentativa:/i)).toBeVisible()
  await expect(page.getByText(/Última resposta válida:/i)).toBeVisible()
  refreshed = true

  await page.clock.fastForward(60_000)

  await expect(row(page, 'svc-new')).toBeVisible()
  await expect.poll(() => requests).toBeGreaterThan(initialRequests)
})

test('the application detail refreshes automatically without changing the selected application', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00.000Z') })
  let requests = 0
  let refreshed = false
  await mockApi(page, async (route) => {
    requests += 1
    await route.fulfill({ json: application({ name: refreshed ? 'app-pagamentos-atualizada' : 'app-pagamentos' }) })
  })

  await page.goto('/services/svc-0142')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  const initialRequests = requests
  await expect(page.getByText(/Frequência da interface: 60 s/i)).toBeVisible()
  await expect(page.getByText(/Última tentativa:/i)).toBeVisible()
  await expect(page.getByText(/Última resposta válida:/i)).toBeVisible()
  refreshed = true
  await page.clock.fastForward(60_000)

  await expect(page.getByRole('heading', { name: 'app-pagamentos-atualizada', exact: true })).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/services/svc-0142')
  await expect.poll(() => requests).toBeGreaterThan(initialRequests)
})

test('a failed catalog refresh keeps the last valid rows until a later response succeeds', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00.000Z') })
  let failing = false
  let recovered = false
  await mockApi(page, async (route) => {
    if (failing) {
      await route.fulfill({ status: 503, json: { code: 'CATALOG_UNAVAILABLE' } })
      return
    }
    await route.fulfill({ json: recovered
      ? [application(), application({ id: 'svc-new', name: 'app-new' })]
      : [application()] })
  })

  await page.goto('/')
  await expect(row(page, 'svc-0142')).toBeVisible()
  failing = true
  await page.clock.fastForward(60_000)

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(row(page, 'svc-0142')).toBeVisible()
  failing = false
  recovered = true
  await page.clock.fastForward(60_000)

  await expect(row(page, 'svc-new')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a failed detail refresh keeps the last valid application until a later response succeeds', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00.000Z') })
  let failing = false
  let recovered = false
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/series')) {
      await route.fulfill({ json: {
        status: 'empty', applicationId: 'svc-0142',
        totals: { energy: { value: null, unit: 'kWh' }, emissions: { value: null, unit: 'kg CO₂e' } },
        points: [], events: [],
      } })
      return
    }
    await route.fulfill({ json: {
      status: 'empty', applicationId: 'svc-0142',
      energy: { value: null, unit: 'kWh' }, emissions: { value: null, unit: 'kg CO₂e' },
      coverage: { energy: 0, emissions: 0 }, provenance: { factors: [], methodologies: [] },
    } })
  })
  await mockApi(page, async (route) => {
    if (failing) {
      await route.fulfill({ status: 503, json: { code: 'APPLICATION_UNAVAILABLE' } })
      return
    }
    await route.fulfill({ json: application({ name: recovered ? 'app-pagamentos-atualizada' : 'app-pagamentos' }) })
  })

  await page.goto('/services/svc-0142')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  failing = true
  await page.clock.fastForward(60_000)

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  failing = false
  recovered = true
  await page.clock.fastForward(60_000)

  await expect(page.getByRole('heading', { name: 'app-pagamentos-atualizada', exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('automatic catalog updates preserve the current search, filter, and page', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00.000Z') })
  let requests = 0
  let updated = false
  await mockApi(page, async (route) => {
    requests += 1
    const catalog = largeCatalog()
    if (updated) catalog[10] = application({ id: 'svc-011', name: 'api-011-updated' })
    await route.fulfill({ json: catalog })
  })

  await page.goto('/')
  await search(page).fill('api-')
  await page.getByRole('button', { name: /^Disponível\b/i }).click()
  await page.getByRole('button', { name: /próxima página/i }).click()
  await expect(row(page, 'svc-011')).toBeVisible()
  await row(page, 'svc-011').scrollIntoViewIfNeeded()
  await search(page).focus()
  const requestsBeforeRefresh = requests
  updated = true

  await page.clock.fastForward(60_000)

  await expect(row(page, 'svc-011')).toContainText('api-011-updated')
  await expect(search(page)).toHaveValue('api-')
  await expect(search(page)).toBeFocused()
  await expect(row(page, 'svc-011')).toBeInViewport()
  await expect(page.getByRole('button', { name: /^Disponível\b/i })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/Página 2 de 3/i)).toBeVisible()
  expect(new URL(page.url()).searchParams.get('page')).toBe('2')
  await expect.poll(() => requests).toBeGreaterThan(requestsBeforeRefresh)
})

test('a slow automatic catalog refresh does not overlap another poll or manual refresh', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00.000Z') })
  let requests = 0
  let holdRefresh = false
  const refreshGate = gate()
  await mockApi(page, async (route) => {
    requests += 1
    if (holdRefresh) await refreshGate.wait
    await route.fulfill({ json: [application()] })
  })

  await page.goto('/')
  await expect(row(page, 'svc-0142')).toBeVisible()
  const refresh = page.getByRole('button', { name: /atualizar catálogo/i })
  await expect(refresh).toBeEnabled()
  const initialRequests = requests
  holdRefresh = true
  await page.clock.fastForward(60_000)
  await expect.poll(() => requests).toBeGreaterThan(initialRequests)
  await expect(refresh).toBeDisabled()
  const requestsWhileRefreshPending = requests

  await page.clock.fastForward(120_000)
  expect(requests).toBe(requestsWhileRefreshPending)

  holdRefresh = false
  refreshGate.release()
  await expect(refresh).toBeEnabled()
  await page.clock.fastForward(60_000)
  await expect.poll(() => requests).toBeGreaterThan(requestsWhileRefreshPending)
})

test('leaving an application during refresh prevents its late response from affecting the next detail', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00.000Z') })
  const pendingOldResponse = gate()
  const oldRequestStarted = gate()
  let holdOldResponse = false
  let oldDetailRequests = 0
  await mockApi(page, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/applications')) {
      await route.fulfill({ json: [application(), application({ id: 'svc-current', name: 'app-current' })] })
      return
    }
    if (pathname.endsWith('/svc-0142')) {
      oldDetailRequests += 1
      if (holdOldResponse) {
        oldRequestStarted.release()
        await pendingOldResponse.wait
      }
      try {
        await route.fulfill({ json: application() })
      } catch {
        // The request may have been aborted when its detail was unmounted.
      }
      return
    }
    await route.fulfill({ json: application({ id: 'svc-current', name: 'app-current' }) })
  })

  await page.goto('/services/svc-0142')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
  const initialOldRequests = oldDetailRequests
  holdOldResponse = true
  await page.clock.fastForward(60_000)
  await oldRequestStarted.wait

  await page.getByRole('link', { name: /voltar ao catálogo/i }).click()
  await row(page, 'svc-current').getByRole('link', { name: /ver detalhes/i }).click()
  await expect(page.getByRole('heading', { name: 'app-current', exact: true })).toBeVisible()
  pendingOldResponse.release()
  await page.clock.fastForward(60_000)

  await expect(page.getByRole('main')).toContainText('svc-current')
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toHaveCount(0)
  expect(oldDetailRequests).toBeGreaterThan(initialOldRequests)
  expect(new URL(page.url()).pathname).toBe('/services/svc-current')
})
