import { QueryRunner } from 'typeorm'
import { MonitoringPauseControl1793500000000 } from './1793500000000-MonitoringPauseControl'

describe('MonitoringPauseControl1793500000000', () => {
  it('creates a global unpaused setting for existing installations', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    await new MonitoringPauseControl1793500000000().up({ query } as unknown as QueryRunner)
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('CREATE TABLE "monitoring_settings"'))
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining("VALUES ('global', false)"))
  })

  it('drops only the monitoring settings table on rollback', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    await new MonitoringPauseControl1793500000000().down({ query } as unknown as QueryRunner)
    expect(query).toHaveBeenCalledWith('DROP TABLE "monitoring_settings"')
  })
})
