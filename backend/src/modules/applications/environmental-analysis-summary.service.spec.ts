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

describe('environmental summary domain scope', () => {
  it('loads only requested IDs and preserves missing readings rather than fabricating zero', async () => {
    const app = { id: 'selected', name: 'Selected', state: ApplicationState.AVAILABLE }
    const applications = { findAll: jest.fn().mockResolvedValue([app]), findByIds: jest.fn().mockResolvedValue([app]) }
    const collections = { findEnvironmentalByApplicationsAndPeriod: jest.fn().mockResolvedValue([]) }
    const events = { findMetadataHistory: jest.fn().mockResolvedValue([]) }
    const service = new EnvironmentalAnalysisSummaryService(applications as unknown as ApplicationsRepository, collections as unknown as CollectionsRepository, events as unknown as ApplicationEventsRepository)
    const result = await service.getSummary({ from: '2026-10-01T00:00:00Z', to: '2026-10-02T00:00:00Z', applicationIds: [' selected ', 'selected'], includeProvenance: 'false' }, { includeMissingApplications: true })
    expect(applications.findAll).not.toHaveBeenCalled()
    expect(applications.findByIds).toHaveBeenCalledWith(['selected'])
    expect(result.applications).toHaveLength(1)
    expect(result.applications[0].energy.value).toBeNull()
    expect(result.totals.energy.value).toBeNull()
  })
})

describe('collection success in the environmental summary', () => {
  const from = '2026-10-01T00:00:00.000Z', to = '2026-10-02T00:00:00.000Z'
  function fixture() {
    const applications = { findAll: jest.fn().mockResolvedValue([{ id: 'app-1', state: ApplicationState.AVAILABLE }]) }
    const collections = { findEnvironmentalByApplicationsAndPeriod: jest.fn().mockResolvedValue([]) }
    const events = { findMetadataHistory: jest.fn().mockResolvedValue([]), collectionAttemptCounts: jest.fn().mockResolvedValue({
      counts: { successful: 3, total: 4, firstAttemptAt: from, lastAttemptAt: from },
      rates: new Map([['app-1', 0.75]]),
    }) }
    return { events, service: new EnvironmentalAnalysisSummaryService(applications as unknown as ApplicationsRepository, collections as unknown as CollectionsRepository, events as unknown as ApplicationEventsRepository) }
  }
  it('counts attempts in the selected period, state and recorded region independently of environmental coverage', async () => {
    const { events, service } = fixture()
    const result = await service.getSummary({ from, to, states: ['AVAILABLE'], regionCodes: ['br-sudeste'], includeCollectionSuccess: 'true' })
    expect(result.collectionSuccess).toEqual({ successful: 3, total: 4, rate: 0.75, firstAttemptAt: from, lastAttemptAt: from })
    expect(result.coverage).toEqual({ energy: 0, emissions: 0 })
    expect(events.collectionAttemptCounts).toHaveBeenCalledWith(['app-1'], BigInt(Date.parse(from)) * 1000000n, BigInt(Date.parse(to)) * 1000000n, ['br-sudeste'])
    const summary = await service.getSummary({ from, to, includeCollectionSuccess: 'true' }, { includeMissingApplications: true })
    expect(summary.applications).toMatchObject([{ applicationId: 'app-1', collectionSuccessRate: 0.75 }])
  })
  it('does not fabricate a rate without attempts, and does not query it unless requested', async () => {
    const { events, service } = fixture()
    await service.getSummary({ from, to })
    expect(events.collectionAttemptCounts).not.toHaveBeenCalled()
    events.collectionAttemptCounts.mockResolvedValueOnce({
      counts: { successful: 0, total: 0, firstAttemptAt: null, lastAttemptAt: null },
      rates: new Map(),
    })
    expect((await service.getSummary({ from, to, includeCollectionSuccess: 'true' })).collectionSuccess?.rate).toBeNull()
    await expect(service.getSummary({ from, to, includeCollectionSuccess: 'invalid' })).rejects.toThrow()
  })
  it('reports a query failure instead of presenting a zero or successful rate', async () => {
    const { events, service } = fixture()
    events.collectionAttemptCounts.mockRejectedValueOnce(new Error('database unavailable'))
    await expect(service.getSummary({ from, to, includeCollectionSuccess: 'true' })).rejects.toMatchObject({ status: 503 })
  })
})
