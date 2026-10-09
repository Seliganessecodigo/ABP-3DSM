import { expect, test } from '@playwright/test'

test('gestor consulta uma aplicação reconhecida pelo nome e ID sem login', async ({ page }) => {
  await page.route('**/applications', async (route) => {
    if (route.request().isNavigationRequest()) {
      await route.continue()
      return
    }

    await route.fulfill({
      json: [
        {
          id: 'svc-0142',
          name: 'app-pagamentos',
          location: {
            regionCode: 'BR-SP',
            country: 'Brasil',
            region: 'São Paulo',
            city: 'São Paulo',
            latitude: -23.55,
            longitude: -46.63,
          },
          state: 'AVAILABLE',
          firstSeenAt: '2026-10-09T12:00:00.000Z',
          lastCheckedAt: '2026-10-09T17:32:00.000Z',
          removedAt: null,
          updatedAt: '2026-10-09T17:32:00.000Z',
        },
      ],
    })
  })

  await page.goto('/')

  const application = page.getByRole('row').filter({ hasText: 'svc-0142' })
  await expect(application).toHaveCount(1)
  await expect(application).toContainText('app-pagamentos')
})
