import { BadRequestException } from '@nestjs/common'
import { MonitoringOperationsController } from './monitoring-operations.controller'

describe('MonitoringOperationsController', () => {
  const operations = {
    health: jest.fn(), listCycles: jest.fn(), listAuditFromPrincipal: jest.fn(), setPaused: jest.fn(),
  }
  const controller = new MonitoringOperationsController(operations as never)

  beforeEach(() => jest.clearAllMocks())

  it('delegates health and validates cycle pagination before querying', async () => {
    operations.health.mockResolvedValue({ state: 'ACTIVE' })
    await expect(controller.health()).resolves.toEqual({ state: 'ACTIVE' })
    await controller.cycles(undefined, undefined)
    expect(operations.listCycles).toHaveBeenCalledWith(1, 20)
    await controller.cycles('3', '100')
    expect(operations.listCycles).toHaveBeenLastCalledWith(3, 100)

    expect(() => controller.cycles('0', '20')).toThrow(BadRequestException)
    expect(() => controller.cycles('1', '101')).toThrow(BadRequestException)
    expect(() => controller.cycles('9007199254740991', '100')).toThrow(BadRequestException)
  })

  it('parses audit filters and delegates pause controls to the service', async () => {
    const principal = { organizationId: 'org-1' } as never
    operations.listAuditFromPrincipal.mockResolvedValue({ items: [] })
    await expect(controller.audit(principal, { search: 'manutenção', pageSize: '5' })).resolves.toEqual({ items: [] })
    expect(operations.listAuditFromPrincipal).toHaveBeenCalledWith(principal, expect.objectContaining({ search: 'manutenção', pageSize: 5 }))
    expect(() => controller.audit(principal, { sortBy: 'unsafe' } as never)).toThrow(BadRequestException)

    operations.setPaused.mockResolvedValue({ paused: true, changed: true })
    await expect(controller.setControl({ userId: 'user-1' } as never, { paused: true, reason: 'Manutenção' })).resolves.toEqual({ paused: true, changed: true })
  })
})
