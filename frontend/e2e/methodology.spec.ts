import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

import { collectionResponse } from './support/collection.ts'

test('mostra a metodologia e os resultados ambientais retornados pela coleta', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.route('**/applications/svc-0142/collections/latest', (route) => route.fulfill({ json: collectionResponse() }))

  await page.goto('/services/svc-0142/methodology')
  const methodology = page.getByRole('main')
  await expect(methodology).toContainText('energia = cpu × duração')
  await expect(methodology).toContainText('12,5 kWh')
  await expect(methodology).toContainText('4.200 gCO₂e')
  await expect(methodology).toContainText('336 gCO2e/kWh')
})

test('mantém a ausência de evidência ambiental diferente de zero', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.route('**/applications/svc-0142/collections/latest', (route) => route.fulfill({ json: collectionResponse({
    environmental: { status: 'absent', absenceReason: 'ENVIRONMENTAL_EVIDENCE_UNAVAILABLE', energy: null, carbon: null },
  }) }))

  await page.goto('/services/svc-0142/methodology')
  await expect(page.getByRole('main')).toContainText('Metodologia indisponível')
})
