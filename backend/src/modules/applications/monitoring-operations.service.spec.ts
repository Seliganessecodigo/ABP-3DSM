import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { MonitoringIntegration } from '../../database/entities/monitoring-incident.entity'
import { MonitoringOperationsService } from './monitoring-operations.service'

describe('MonitoringOperationsService', () => {
  const settings = { get: jest.fn(), getForUpdate: jest.fn(), setPaused: jest.fn() }
  const scheduler = { isActive: true, interval: 60 }
  const cycles = { latest: jest.fn(), list: jest.fn() }
  const incidents = { healthByIntegration: jest.fn(), recentForHealth: jest.fn() }
  const auditLogs = { listChanges: jest.fn() }
  const auditWriter = { record: jest.fn() }
  const applications = { monitoringHealth: jest.fn() }
  const manager = {}
  const database = { transaction: jest.fn((callback: (manager: object) => unknown) => callback(manager)) }
  const service = new MonitoringOperationsService(
    database as never, settings as never, scheduler as never, cycles as never,
    incidents as never, auditLogs as never, auditWriter as never, applications as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    settings.get.mockResolvedValue({ paused: false, configurationVersion: 'version-1' })
    cycles.latest.mockResolvedValue(null)
    incidents.healthByIntegration.mockResolvedValue([])
    incidents.recentForHealth.mockResolvedValue([])
    applications.monitoringHealth.mockResolvedValue({ knownCount: 2, staleCount: 1, delayedCount: 0, lastObservationAt: null })
  })

  it('reports unavailable when pause state is absent and unknown source health without evidence', async () => {
    settings.get.mockResolvedValue(null)
    const health = await service.health()

    expect(health).toMatchObject({ state: 'UNAVAILABLE', paused: null, schedulerRunning: false })
    expect(health.sources).toHaveLength(3)
    expect(health.sources.every((source) => source.status === 'UNKNOWN')).toBe(true)
    expect(health.staleApplications).toBe(1)
  })

  it('derives active, paused, cycle duration and integration states from persisted records', async () => {
    cycles.latest.mockResolvedValue({
      id: 'cycle-1', status: 'completed', startedAt: new Date('2026-01-01T00:00:00Z'),
      finishedAt: new Date('2026-01-01T00:00:02Z'), durationMs: '62000',
      discoveredCount: 2, processedCount: 2, failedCount: 1, persistedCount: 1,
    })
    incidents.healthByIntegration.mockResolvedValue([
      { integration: MonitoringIntegration.METRICS, openCount: '1', recoveringCount: '0', resolvedCount: '0' },
      { integration: MonitoringIntegration.CARBON_FACTOR, openCount: '0', recoveringCount: '2', resolvedCount: '0' },
    ])
    incidents.recentForHealth.mockResolvedValue([{ id: 'incident-1', source: 'metrics-aggregator' }])

    const health = await service.health()
    expect(health.state).toBe('ACTIVE')
    expect(health.latestCycle).toMatchObject({ durationMs: 62000, overrunMs: 2000, failedCount: 1 })
    expect(health.sources.map((source) => source.status)).toEqual(['UNKNOWN', 'DEGRADED', 'RECOVERING'])
    expect(health.recentIncidents).toHaveLength(1)

    settings.get.mockResolvedValue({ paused: true })
    expect((await service.health()).state).toBe('PAUSED')
    scheduler.isActive = false
    expect((await service.health()).state).toBe('UNAVAILABLE')
    scheduler.isActive = true
  })

  it('maps paged cycles and organization audit records to response shapes', async () => {
    cycles.list.mockResolvedValue({ items: [{ id: 'cycle-2', durationMs: null }], total: 1, page: 1, limit: 20 })
    expect(await service.listCycles(1, 20)).toMatchObject({ items: [{ id: 'cycle-2', durationMs: null, overrunMs: null }] })

    auditLogs.listChanges.mockResolvedValue({ items: [{ id: 'audit-1', actor: 'admin', actorLabel: 'Admin', action: 'account.role.changed', entityType: 'user', entityId: '1', before: null, after: null, reason: null, outcome: 'success', createdAt: new Date() }], pagination: { totalItems: 1 } })
    const result = await service.listAuditFromPrincipal({ organizationId: 'org-1' } as never, { page: 1 } as never)
    expect(auditLogs.listChanges).toHaveBeenCalledWith('org-1', { page: 1 })
    expect(result.items[0]).toMatchObject({ id: 'audit-1', actorType: 'user', action: 'account.role.changed' })
  })

  it('validates, idempotently changes, and atomically audits pause state', async () => {
    const principal = { userId: 'user-1' } as never
    await expect(service.setPaused(principal, 'yes', 'maintenance')).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.setPaused(principal, true, ' ')).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.setPaused(principal, true, 'x'.repeat(513))).rejects.toBeInstanceOf(BadRequestException)

    settings.getForUpdate.mockResolvedValue({ paused: false, configurationVersion: 'version-1', updatedAt: new Date(0) })
    expect(await service.setPaused(principal, false, 'No change')).toMatchObject({ paused: false, changed: false })
    expect(settings.setPaused).not.toHaveBeenCalled()

    settings.getForUpdate.mockResolvedValue({ paused: false, configurationVersion: 'version-1' })
    settings.setPaused.mockResolvedValue({ paused: true, configurationVersion: 'version-2', updatedAt: new Date(1) })
    expect(await service.setPaused(principal, true, 'Maintenance')).toMatchObject({ paused: true, changed: true })
    expect(settings.setPaused).toHaveBeenCalledWith(true, { actor: 'user-1', reason: 'Maintenance' }, manager)
    expect(auditWriter.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'monitoring.paused', reason: 'Maintenance' }), manager)
    expect(auditWriter.record).toHaveBeenCalledWith(expect.objectContaining({
      before: { paused: false, configurationVersion: 'version-1' },
      after: { paused: true, configurationVersion: 'version-2' },
    }), manager)

    settings.getForUpdate.mockResolvedValue(null)
    await expect(service.setPaused(principal, true, 'Maintenance')).rejects.toBeInstanceOf(ServiceUnavailableException)
  })

  it('reports transaction failure through an audit event without snapshots outside the failed transaction', async () => {
    settings.getForUpdate.mockResolvedValue({ paused: true, configurationVersion: 'version-2' })
    settings.setPaused.mockRejectedValueOnce(new Error('storage unavailable'))
    await expect(service.setPaused({ userId: 'user-1' } as never, false, 'Return')).rejects.toThrow('storage unavailable')
    expect(auditWriter.record).toHaveBeenCalledWith({
      actor: { type: 'user', userId: 'user-1' }, action: 'monitoring.resumed',
      entityType: 'monitoring', entityId: 'global', outcome: 'failed', reason: 'Return',
    })
  })
})
