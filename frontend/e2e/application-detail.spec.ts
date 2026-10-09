import { expect, test } from '@playwright/test'
import { application, gate, largeCatalog, mockApi, mockCatalog, row, search, unavailable } from './support/catalog.ts'

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
