import { expect, test } from '@playwright/test'
import { application, gate, largeCatalog, mixedCatalog, mockApi, mockCatalog, row, search, unavailable } from './support/catalog.ts'

test('gestor consulta uma aplicação reconhecida pelo nome e ID sem login', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toHaveCount(1)
  await expect(row(page, 'svc-0142')).toContainText('app-pagamentos')
})

test('nomes iguais permanecem em linhas distintas por identidade', async ({ page }) => {
  await mockCatalog(page, [application(), application({ id: 'svc-outro' })])
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toContainText('app-pagamentos')
  await expect(row(page, 'svc-outro')).toContainText('app-pagamentos')
})

test('aguarda resposta com carregamento sem mostrar vazio prematuramente', async ({ page }) => {
  const pending = gate()
  await mockApi(page, async (route) => {
    await pending.wait
    await route.fulfill({ json: [application()] })
  })
  await page.goto('/')
  try {
    await expect(page.getByRole('status')).toContainText(/carregando.*(aplica|catálogo)/i)
    await expect(page.getByText(/nenhuma aplicação reconhecida/i)).toHaveCount(0)
  } finally {
    pending.release()
  }
  await expect(row(page, 'svc-0142')).toBeVisible()
})

test('resposta vazia representa catálogo vazio e não erro', async ({ page }) => {
  await mockCatalog(page, [])
  await page.goto('/')
  await expect(page.getByText(/nenhuma aplicação reconhecida/i)).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('falha HTTP mostra erro sem afirmar vazio ou remoção', async ({ page }) => {
  await mockApi(page, unavailable)
  await page.goto('/')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText(/não foi possível consultar o catálogo/i)
  await expect(alert).toContainText(/não significa.*removidas/i)
  await expect(page.getByRole('button', { name: /tentar novamente/i })).toBeVisible()
  await expect(page.getByText(/nenhuma aplicação reconhecida/i)).toHaveCount(0)
})

test('falha de rede não é convertida em catálogo vazio', async ({ page }) => {
  await mockApi(page, async (route) => { await route.abort('failed') })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText(/não foi possível consultar o catálogo/i)
  await expect(page.getByText(/nenhuma aplicação reconhecida/i)).toHaveCount(0)
})

test('JSON inválido aparece como erro de consulta', async ({ page }) => {
  await mockApi(page, async (route) => { await route.fulfill({ contentType: 'application/json', body: '{invalid' }) })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText(/não foi possível consultar o catálogo/i)
})

test('registro incompatível com o DTO não se torna sucesso ou vazio', async ({ page }) => {
  await mockApi(page, async (route) => { await route.fulfill({ json: [{ id: 'svc-invalido' }] }) })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText(/não foi possível consultar o catálogo/i)
  await expect(page.getByText(/nenhuma aplicação reconhecida/i)).toHaveCount(0)
})

test('objeto recebido no lugar da coleção é tratado como falha de contrato', async ({ page }) => {
  await mockApi(page, async (route) => { await route.fulfill({ json: { items: [application()] } }) })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText(/não foi possível consultar o catálogo/i)
  await expect(page.getByText(/nenhuma aplicação reconhecida/i)).toHaveCount(0)
})

test('nova tentativa recupera o catálogo sem reload da página', async ({ page }) => {
  let documentRequests = 0
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests += 1
  })
  let failing = true
  await mockApi(page, async (route) => {
    if (failing) await unavailable(route)
    else await route.fulfill({ json: [application()] })
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: /tentar novamente/i }).click()
  await expect(row(page, 'svc-0142')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(documentRequests).toBe(1)
})

test('consulta bem-sucedida não exibe o alerta ilustrativo da referência', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('filtros apresentam contagens reais de cada estado', async ({ page }) => {
  await mockCatalog(page, mixedCatalog)
  await page.goto('/')
  await expect(page.getByRole('button', { name: /^Todas\s*\(5\)/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Disponível\s*\(2\)/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Indisponível\s*\(1\)/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Sem métricas\s*\(1\)/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Removida\s*\(1\)/i })).toBeVisible()
})

for (const [label, id, excluded] of [
  ['Disponível', 'svc-0142', 'svc-0487'],
  ['Indisponível', 'svc-0487', 'svc-0142'],
  ['Sem métricas', 'svc-0900', 'svc-0142'],
  ['Removida', 'svc-0065', 'svc-0142'],
]) {
  test(`filtro ${label} mostra apenas aplicações desse estado`, async ({ page }) => {
    await mockCatalog(page, mixedCatalog)
    await page.goto('/')
    await page.getByRole('button', { name: new RegExp(`^${label}\\b`, 'i') }).click()
    await expect(row(page, id)).toBeVisible()
    await expect(row(page, excluded)).toHaveCount(0)
  })
}

for (const value of ['pagamentos', 'svc-0142', 'BR-SP']) {
  test(`busca por ${value} encontra a aplicação e permite limpar a busca`, async ({ page }) => {
    await mockCatalog(page, mixedCatalog)
    await page.goto('/')
    await search(page).fill(value)
    await expect(row(page, 'svc-0142')).toBeVisible()
    await expect(row(page, 'svc-0121')).toHaveCount(0)
    await search(page).fill('')
    await expect(row(page, 'svc-0065')).toBeVisible()
  })
}

test('busca e estado são combinados na tabela', async ({ page }) => {
  await mockCatalog(page, [
    application(),
    application({ id: 'svc-outra-situacao', name: 'app-pagamentos-batch', state: 'UNAVAILABLE' }),
    application({ id: 'svc-outro-nome', name: 'app-outro', state: 'AVAILABLE' }),
  ])
  await page.goto('/')
  await search(page).fill('pagamentos')
  await page.getByRole('button', { name: /^Disponível\b/i }).click()
  await expect(row(page, 'svc-0142')).toBeVisible()
  await expect(row(page, 'svc-outra-situacao')).toHaveCount(0)
  await expect(row(page, 'svc-outro-nome')).toHaveCount(0)
})

test('filtro regional combina com o catálogo e permanece na URL e no retorno', async ({ page }) => {
  await mockCatalog(page, [application(), application({ id: 'svc-outro', location: { regionCode: 'US-VA', country: 'Estados Unidos', region: 'Virginia', city: null, latitude: 38.9, longitude: -77.04 } })])
  await page.goto('/')
  const regionFilter = page.getByRole('combobox', { name: /filtrar por região/i })
  await regionFilter.selectOption('BR-SP')
  await expect(row(page, 'svc-0142')).toBeVisible()
  await expect(row(page, 'svc-outro')).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get('region')).toBe('BR-SP')
  await row(page, 'svc-0142').getByRole('link', { name: /ver detalhes/i }).click()
  await page.getByRole('link', { name: /voltar ao catálogo/i }).click()
  await expect(regionFilter).toHaveValue('BR-SP')
  await expect(row(page, 'svc-0142')).toBeVisible()
})

test('busca sem resultado é distinta de catálogo vazio e pode ser corrigida', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/')
  await search(page).fill('inexistente')
  await expect(page.getByText(/nenhuma aplicação corresponde|nenhum resultado/i)).toBeVisible()
  await expect(page.getByText(/nenhuma aplicação reconhecida/i)).toHaveCount(0)
  await search(page).fill('pagamentos')
  await expect(row(page, 'svc-0142')).toBeVisible()
})

test('paginação permite avançar e voltar sem repetir itens entre páginas', async ({ page }) => {
  await mockCatalog(page, largeCatalog())
  await page.goto('/')
  await expect(row(page, 'svc-001')).toBeVisible()
  await expect(row(page, 'svc-011')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /página anterior/i })).toBeDisabled()
  await page.getByRole('button', { name: /próxima página/i }).click()
  await expect(row(page, 'svc-011')).toBeVisible()
  await expect(row(page, 'svc-001')).toHaveCount(0)
  await page.getByRole('button', { name: /próxima página/i }).click()
  await expect(row(page, 'svc-021')).toBeVisible()
  await expect(page.getByRole('button', { name: /próxima página/i })).toBeDisabled()
  await page.getByRole('button', { name: /página anterior/i }).click()
  await expect(row(page, 'svc-011')).toBeVisible()
})

test('filtro reduzido a um resultado não deixa a paginação fora do catálogo', async ({ page }) => {
  await mockCatalog(page, largeCatalog())
  await page.goto('/')
  await page.getByRole('button', { name: /próxima página/i }).click()
  await search(page).fill('api-001')
  await expect(row(page, 'svc-001')).toBeVisible()
  await expect(row(page, 'svc-011')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /próxima página/i })).toBeDisabled()
})

test('cidade nula fica explícita sem ocultar a aplicação ou outros campos', async ({ page }) => {
  await mockCatalog(page, [application({ location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null, latitude: -23.55, longitude: -46.63 } })])
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toContainText(/não informada/i)
  await expect(row(page, 'svc-0142')).toContainText('Brasil')
  await expect(row(page, 'svc-0142')).toContainText('São Paulo')
})

test('localização nula continua visível com ausência explícita', async ({ page }) => {
  await mockCatalog(page, [application({ location: null })])
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toContainText(/não informad[ao]|indisponível/i)
})

test('estado é reconhecível por texto além de cor', async ({ page }) => {
  await mockCatalog(page, mixedCatalog)
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toContainText('Disponível')
  await expect(row(page, 'svc-0487')).toContainText('Indisponível')
  await expect(row(page, 'svc-0900')).toContainText('Sem métricas')
  await expect(row(page, 'svc-0065')).toContainText('Removida')
})

test('catálogo mostra motivo e frescor de uma observação válida', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/')
  const applicationRow = row(page, 'svc-0142')
  await expect(applicationRow).toContainText(/métricas válidas/i)
  await expect(applicationRow).toContainText(/observação válida/i)
  await expect(applicationRow).toContainText(/14:30/)
})

test('última verificação usa o horário fornecido no fuso da pessoa', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toContainText(/14:32/)
})

test('última verificação nula mostra sem observação e não usa updatedAt', async ({ page }) => {
  await mockCatalog(page, [application({ lastCheckedAt: null })])
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toContainText(/sem observação/i)
  await expect(row(page, 'svc-0142')).not.toContainText(/14:32/)
})

test('falha de atualização preserva último catálogo e identifica dado anterior', async ({ page }) => {
  let failing = false
  await mockApi(page, async (route) => {
    if (failing) await unavailable(route)
    else await route.fulfill({ json: [application()] })
  })
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toBeVisible()
  failing = true
  await page.getByRole('button', { name: /atualizar catálogo/i }).click()
  await expect(page.getByRole('alert')).toContainText(/não foi possível.*(consultar|atualizar).*catálogo/i)
  await expect(page.getByRole('alert')).toContainText(/anterior|desatualizad|últim[ao].*válid/i)
  await expect(row(page, 'svc-0142')).toBeVisible()
})

test('atualização bem-sucedida incorpora novos registros sem reload e preserva busca', async ({ page }) => {
  let documentRequests = 0
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests += 1
  })
  let catalog = [application()]
  await mockApi(page, async (route) => { await route.fulfill({ json: catalog }) })
  await page.goto('/')
  await search(page).fill('app-')
  await expect(row(page, 'svc-0142')).toBeVisible()
  catalog = [application(), application({ id: 'svc-nova', name: 'app-nova' })]
  await page.getByRole('button', { name: /atualizar catálogo/i }).click()
  await expect(row(page, 'svc-nova')).toBeVisible()
  await expect(search(page)).toHaveValue('app-')
  expect(documentRequests).toBe(1)
})

test('nova tentativa após falha de atualização conserva busca, estado e página', async ({ page }) => {
  let failing = false
  await mockApi(page, async (route) => {
    if (failing) await unavailable(route)
    else await route.fulfill({ json: largeCatalog() })
  })
  await page.goto('/')
  await search(page).fill('api-')
  await page.getByRole('button', { name: /^Disponível\b/i }).click()
  await page.getByRole('button', { name: /próxima página/i }).click()
  await expect(row(page, 'svc-011')).toBeVisible()
  failing = true
  await page.getByRole('button', { name: /atualizar catálogo/i }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: /tentar novamente/i }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(search(page)).toHaveValue('api-')
  await expect(page.getByRole('button', { name: /^Disponível\b/i })).toHaveAttribute('aria-pressed', 'true')
  await expect(row(page, 'svc-011')).toBeVisible()
  await expect(row(page, 'svc-001')).toHaveCount(0)
})

test('atualização em andamento impede uma nova consulta sobreposta', async ({ page }) => {
  const pending = gate()
  let refreshing = false
  await mockApi(page, async (route) => {
    if (refreshing) await pending.wait
    await route.fulfill({ json: [application()] })
  })
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toBeVisible()
  refreshing = true
  const refresh = page.getByRole('button', { name: /atualizar catálogo/i })
  try {
    await refresh.click()
    await expect(refresh).toBeDisabled()
    await expect(row(page, 'svc-0142')).toBeVisible()
  } finally {
    pending.release()
  }
  await expect(refresh).toBeEnabled()
})

test('dados inválidos durante atualização não substituem o último catálogo válido', async ({ page }) => {
  let invalid = false
  await mockApi(page, async (route) => { await route.fulfill({ json: invalid ? [{ id: 'invalido' }] : [application()] }) })
  await page.goto('/')
  await expect(row(page, 'svc-0142')).toBeVisible()
  invalid = true
  await page.getByRole('button', { name: /atualizar catálogo/i }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(row(page, 'svc-0142')).toBeVisible()
  await expect(row(page, 'invalido')).toHaveCount(0)
})

test('busca e abertura de detalhe funcionam pelo teclado', async ({ page }) => {
  await mockCatalog(page, mixedCatalog)
  await page.goto('/')
  await search(page).focus()
  await page.keyboard.type('pagamentos')
  const details = row(page, 'svc-0142').getByRole('link', { name: /ver detalhes/i })
  await details.focus()
  await expect(details).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/services\/svc-0142(?:\?|$)/)
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
})

test('tela mobile mantém busca e acesso ao detalhe sem overflow da página', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockCatalog(page, [application()])
  await page.goto('/')
  await expect(search(page)).toBeInViewport()
  const details = row(page, 'svc-0142').getByRole('link', { name: /ver detalhes/i })
  await details.scrollIntoViewIfNeeded()
  await expect(details).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('menu destaca Aplicações e mantém funcionalidades adiadas desabilitadas', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/')
  const navigation = page.getByRole('navigation')
  await expect(navigation.getByRole('link', { name: 'Aplicações', exact: true })).toHaveAttribute('aria-current', 'page')
  for (const name of ['Dashboard', 'Histórico', 'Ranking', 'Comparação', 'Simulação regional', 'Metodologia', 'Configurações']) {
    await expect(navigation.getByRole('button', { name, exact: true })).toBeDisabled()
  }
  await expect(page.getByRole('button', { name: /nova aplicação/i })).toHaveCount(0)
})

test('menu móvel abre, fecha por X, Escape e clique fora, e restaura o foco', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockCatalog(page, [application()])
  await page.goto('/')

  const opener = page.getByRole('button', { name: 'Abrir menu' })
  await expect(opener).toHaveAttribute('aria-expanded', 'false')
  await expect(opener).toHaveAttribute('aria-controls', 'shared-sidebar')
  await expect(page.getByRole('navigation')).toBeHidden()

  await opener.click()
  await expect(opener).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('navigation')).toBeVisible()
  await expect.poll(() => page.getByRole('dialog').evaluate((element) => element.getBoundingClientRect().width)).toBe(320)
  for (const name of ['Dashboard', 'Histórico', 'Ranking', 'Comparação', 'Simulação regional', 'Metodologia', 'Configurações']) {
    const destination = page.getByRole('navigation').getByRole('button', { name, exact: true })
    await expect(destination).toBeVisible()
    await expect(destination).toBeDisabled()
  }

  const navigation = page.getByRole('navigation')
  for (const close of ['X', 'Escape', 'clique fora'] as const) {
    if (close !== 'X') await opener.click()
    if (close === 'X') await page.getByRole('dialog').getByRole('button', { name: 'Fechar menu' }).click()
    if (close === 'Escape') await page.keyboard.press('Escape')
    if (close === 'clique fora') await page.getByRole('button', { name: 'Fechar menu' }).last().click({ position: { x: 330, y: 300 } })

    await expect(opener).toHaveAttribute('aria-expanded', 'false')
    await expect(navigation).toBeHidden()
    await expect(opener).toBeFocused()
  }
})

test('redimensionar para desktop encerra a abertura temporária do menu móvel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockCatalog(page, [application()])
  await page.goto('/')

  const opener = page.getByRole('button', { name: 'Abrir menu' })
  await opener.click()
  await expect(opener).toHaveAttribute('aria-expanded', 'true')
  await page.setViewportSize({ width: 1024, height: 844 })
  await expect(opener).toBeHidden()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(opener).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('navigation')).toBeHidden()
})

test('sidebar desktop recolhe, expande e reinicia expandida após recarga', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await mockCatalog(page, [application()])
  await page.goto('/')

  const collapse = page.getByRole('button', { name: 'Recolher navegação' })
  await expect(collapse).toHaveAttribute('aria-expanded', 'true')
  const sidebar = page.getByRole('complementary')
  await expect.poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().width)).toBe(222)
  await collapse.click()
  const expand = page.getByRole('button', { name: 'Expandir navegação' })
  await expect(expand).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().width)).toBe(72)
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Aplicações', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Aplicações', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('combobox', { name: 'Idioma' })).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(expand).toHaveAttribute('aria-expanded', 'false')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Recolher navegação' })).toHaveAttribute('aria-expanded', 'true')
})

test('controle desktop acompanha a marca e anima a transição entre larguras', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await mockCatalog(page, [application()])
  await page.goto('/')

  const sidebar = page.getByRole('complementary')
  const collapse = page.getByRole('button', { name: 'Recolher navegação' })
  const topRowPosition = await collapse.evaluate((element) => element.getBoundingClientRect().top)
  expect(topRowPosition).toBeLessThan(80)
  expect(await page.locator('.app-layout').evaluate((element) => getComputedStyle(element).transitionProperty)).toContain('grid-template-columns')

  await collapse.click()
  const expand = page.getByRole('button', { name: 'Expandir navegação' })
  await expect.poll(() => expand.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(80)
  const alignment = await expand.evaluate((element) => {
    const sidebarRect = element.closest('aside')!.getBoundingClientRect()
    const buttonRect = element.getBoundingClientRect()
    return Math.abs((sidebarRect.left + sidebarRect.width / 2) - (buttonRect.left + buttonRect.width / 2))
  })
  expect(alignment).toBeLessThan(2)
  await expect.poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().width)).toBe(72)
})

test('foco do menu móvel entra no drawer e permanece contido por Tab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockCatalog(page, [application()])
  await page.goto('/')

  await page.getByRole('button', { name: 'Abrir menu' }).click()
  const closeButton = page.getByRole('dialog').getByRole('button', { name: 'Fechar menu' })
  const languageSelector = page.getByRole('dialog').getByRole('combobox', { name: 'Idioma' })
  await expect(closeButton).toBeFocused()

  await page.keyboard.press('Shift+Tab')
  await expect(languageSelector).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(closeButton).toBeFocused()
})

test('drawer aberto impede a rolagem do conteúdo ao fundo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 })
  await mockCatalog(page, largeCatalog())
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true)
  await page.getByRole('button', { name: 'Abrir menu' }).click()

  await page.mouse.move(100, 500)
  await page.mouse.wheel(0, 500)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
