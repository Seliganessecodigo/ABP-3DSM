import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

const period = { kind: 'custom', from: '2026-10-01T00:00:00Z', to: '2026-10-02T00:00:00Z' }
test('mostra avisos somente para limites ultrapassados, incluindo leituras parciais', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const applications = [application({ id: 'below', name: 'Abaixo do limite' }), application({ id: 'missing', name: 'Sem leitura' }), application({ id: 'over', name: 'Acima do limite' })]
  await mockCatalog(page, applications)
  await page.route('**/api/auth/login', route => route.fulfill({ json: { accessToken: 'alerts-token', refreshToken: 'refresh', tokenType: 'Bearer', expiresIn: 900 } }))
  await page.route('**/api/auth/me', route => route.fulfill({ json: { id: 'analyst', organizationId: 'org', name: 'Ana', email: 'ana@example.test', role: 'ANALYST' } }))
  let includeExceeded = true
  await page.route('**/api/me/preferences/alerts', route => route.fulfill({ json: {
    configured: true, evaluatedAt: '2026-10-02T00:00:00Z', applications: applications.map((app, index) => ({ applicationId: app.id, name: app.name, evaluations: [{
      metric: 'energy', status: index === 2 && includeExceeded ? 'exceeded' : 'insufficient-data', value: index === 1 ? null : index === 2 && includeExceeded ? 12 : 5,
      threshold: 10, unit: 'kWh', coveragePercent: 50, period, from: period.from, to: period.to,
    }] })),
  } }))
  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('ana@example.test')
  await page.getByLabel('Senha', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByRole('link', { name: 'Aplicações', exact: true }).click()
  const alerts = page.getByRole('region', { name: 'Meus avisos ambientais', exact: true })
  await expect(alerts).toContainText('Acima do limite')
  await expect(alerts).not.toContainText('Abaixo do limite')
  await expect(alerts).not.toContainText('Sem leitura')
  await expect(page.locator('[data-catalog-row-id="below"]')).not.toContainText('Dados insuficientes')
  await expect(page.locator('[data-catalog-row-id="over"]')).toContainText('Limite ultrapassado')
  await page.screenshot({ path: test.info().outputPath('avisos-somente-limites-ultrapassados.png'), fullPage: true })
  includeExceeded = false
  await page.getByRole('link', { name: 'Metodologia', exact: true }).click()
  await page.getByRole('link', { name: 'Aplicações', exact: true }).click()
  await expect(alerts).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('sem-avisos-sem-violacoes.png'), fullPage: true })
})
