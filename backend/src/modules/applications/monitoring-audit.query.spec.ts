import { BadRequestException } from '@nestjs/common'
import { parseMonitoringAuditQuery } from './monitoring-audit.query'

describe('parseMonitoringAuditQuery', () => {
  it('uses the documented page size and accepts all rows', () => {
    expect(parseMonitoringAuditQuery({}).pageSize).toBe(10)
    expect(parseMonitoringAuditQuery({ pageSize: 'all' })).toMatchObject({
      page: 1,
      pageSize: 'all',
    })
  })

  it('rejects unsupported page sizes, sort columns, and date ranges', () => {
    expect(() => parseMonitoringAuditQuery({ pageSize: '100' })).toThrow(
      BadRequestException,
    )
    expect(() => parseMonitoringAuditQuery({ sortBy: 'before' })).toThrow(
      BadRequestException,
    )
    expect(() =>
      parseMonitoringAuditQuery({ createdAtFrom: '2026-11-10T00:00:00Z', createdAtTo: '2026-11-09T00:00:00Z' }),
    ).toThrow(BadRequestException)
    expect(() => parseMonitoringAuditQuery({ page: '2', pageSize: 'all' })).toThrow(BadRequestException)
    expect(() => parseMonitoringAuditQuery({ createdAtFrom: '2026-02-30T00:00:00Z' })).toThrow(BadRequestException)
  })
})
