import { expect, test } from '@playwright/test'
import { application, largeCatalog, mockCatalog, row, search } from './support/catalog.ts'

test('período escolhido no detalhe acompanha os filtros ao voltar e reabrir a aplicação', async ({ page }) => {
  await mockCatalog(page, largeCatalog())
  await page.goto('/?q=api-&state=AVAILABLE&page=2&size=5')

  await expect(search(page)).toHaveValue('api-')
  await row(page, 'svc-006').getByRole('link', { name: /ver detalhes/i }).click()
  await expect(page).toHaveURL(/\/services\/svc-006/)

  await page.getByRole('button', { name: '7 dias', exact: true }).click()

  let params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('q')).toBe('api-')
  expect(params.get('state')).toBe('AVAILABLE')
  expect(params.get('page')).toBe('2')
  expect(params.get('size')).toBe('5')

  await page.getByRole('link', { name: /voltar ao catálogo/i }).click()
  await expect(search(page)).toHaveValue('api-')
  await expect(row(page, 'svc-006')).toBeVisible()

  params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('state')).toBe('AVAILABLE')
  expect(params.get('page')).toBe('2')
  expect(params.get('size')).toBe('5')

  await row(page, 'svc-006').getByRole('link', { name: /ver detalhes/i }).click()
  expect(new URL(page.url()).searchParams.get('period')).toBe('7d')
})

test('período da URL do catálogo sobrevive à recarga e à navegação do navegador', async ({ page }) => {
  await mockCatalog(page, largeCatalog())
  await page.goto('/?q=api-&state=AVAILABLE&page=2&size=5&period=30d')
  await row(page, 'svc-006').getByRole('link', { name: /ver detalhes/i }).click()

  const thirtyDays = page.getByRole('button', { name: '30 dias', exact: true })
  await expect(thirtyDays).toHaveAttribute('aria-pressed', 'true')
  expect(new URL(page.url()).searchParams.get('period')).toBe('30d')

  await page.reload()
  await expect(thirtyDays).toHaveAttribute('aria-pressed', 'true')
  expect(new URL(page.url()).searchParams.get('period')).toBe('30d')

  await page.goBack()
  await expect(search(page)).toHaveValue('api-')
  expect(new URL(page.url()).searchParams.get('period')).toBe('30d')

  await page.goForward()
  await expect(page.getByRole('heading', { name: 'api-006', exact: true })).toBeVisible()
  await expect(thirtyDays).toHaveAttribute('aria-pressed', 'true')
  expect(new URL(page.url()).searchParams.get('period')).toBe('30d')
})

test('período não suportado pede correção acessível sem perder os demais parâmetros', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142?q=pagamentos&state=AVAILABLE&page=3&size=15&period=13d')

  const periodGroup = page.getByRole('group', { name: 'Período de análise' })
  const invalidMessage = page.getByRole('alert').or(page.getByRole('status'))
    .filter({ hasText: /selecione.*período válido|período não suportado/i })
  await expect(periodGroup).toBeVisible()
  await expect(invalidMessage).toBeVisible()
  expect(new URL(page.url()).searchParams.get('period')).toBe('13d')
  for (const label of ['24 horas', '7 dias', '30 dias', '90 dias']) {
    await expect(periodGroup.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'false')
  }

  const sevenDays = periodGroup.getByRole('button', { name: '7 dias', exact: true })
  await sevenDays.focus()
  await page.keyboard.press('Enter')

  const params = new URL(page.url()).searchParams
  expect(params.get('period')).toBe('7d')
  expect(params.get('q')).toBe('pagamentos')
  expect(params.get('state')).toBe('AVAILABLE')
  expect(params.get('page')).toBe('3')
  expect(params.get('size')).toBe('15')
  await expect(sevenDays).toHaveAttribute('aria-pressed', 'true')
  await expect(invalidMessage).toHaveCount(0)
})

test('seleção de período permanece operável em viewport móvel sem overflow horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142?period=24h')

  const periodGroup = page.getByRole('group', { name: 'Período de análise' })
  const sevenDays = periodGroup.getByRole('button', { name: '7 dias', exact: true })
  await expect(sevenDays).toBeVisible()
  await sevenDays.click()

  expect(new URL(page.url()).searchParams.get('period')).toBe('7d')
  await expect(sevenDays).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
