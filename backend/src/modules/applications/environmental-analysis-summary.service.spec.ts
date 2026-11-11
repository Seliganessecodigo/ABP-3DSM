import { EnvironmentalAnalysisSummaryService } from './environmental-analysis-summary.service'
import { ApplicationsRepository } from './applications.repository'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { ApplicationState } from '../../database/entities/application-state'

describe('environmental summary responsiveness', () => {
  it('lets other requests run between applications without changing totals', async () => {
    const from = '2026-10-01T00:00:00.000Z'
    const to = '2026-10-02T00:00:00.000Z'
    const start = Date.parse(from)
    const apps = Array.from({ length: 8 }, (_, index) => ({ id: `app-${index}`, name: `Application ${index}`, state: ApplicationState.AVAILABLE }))
    const observations = apps.flatMap(app => Array.from({ length: 500 }, (_, index) => ({
      applicationId: app.id, id: `${app.id}-${index}`,
      intervalStart: new Date(start + index * 60_000).toISOString(),
      intervalEnd: new Date(start + (index + 1) * 60_000).toISOString(),
      collectedAt: new Date(start + (index + 1) * 60_000).toISOString(),
      energyKwh: '1', carbonGrams: '85', calculationEvidence: null,
    })))
    const applications = { findAll: jest.fn().mockResolvedValue(apps) }
    const collections = { findEnvironmentalByApplicationsAndPeriod: jest.fn().mockResolvedValue(observations) }
    const events = { findMetadataHistory: jest.fn().mockResolvedValue([]) }
    const service = new EnvironmentalAnalysisSummaryService(applications as unknown as ApplicationsRepository, collections as unknown as CollectionsRepository, events as unknown as ApplicationEventsRepository)
    let ticks = 0
    let active = true
    function heartbeat() { if (active) { ticks += 1; setImmediate(heartbeat) } }
    setImmediate(heartbeat)
    try {
      const result = await service.getSummary({ from, to, includeProvenance: 'false' })
      expect(result.totals.energy.value).toBe(4000)
      expect(result.totals.emissions.value).toBe(340000)
      expect(result.coverage.energy).toBeCloseTo(500 / 1440, 12)
      expect(result.applications).toHaveLength(8)
      expect(ticks).toBeGreaterThan(1)
    } finally { active = false }
  })
})
