import { DiscoveryService } from './discovery.service'
import { MetadataSyncService } from './metadata-sync.service'
import { RemovalService } from './removal.service'
import { ReturnService } from './return.service'
import { ServiceSummary } from '../../integrations/metrics-aggregator.adapter'

const snapshot: ServiceSummary[] = [
  {
    id: 'app-1',
    name: 'App 1',
    location: {
      regionCode: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      city: null,
      latitude: -23.5,
      longitude: -46.6,
    },
    metricsPath: '/metrics/app-1',
  },
]

describe.each([true, false])(
  'catalog reconciliation with snapshot supplied=%s',
  (supplySnapshot) => {
    it('uses one snapshot and avoids an additional upstream request', async () => {
      const adapter = { fetchServices: jest.fn().mockResolvedValue(snapshot) }
      const manager = {}
      const dataSource = {
        transaction: jest.fn((work: (manager: object) => unknown) =>
          work(manager),
        ),
      }
      const applications = {
        insertIfAbsent: jest.fn().mockResolvedValue(false),
        findByIdsForUpdate: jest.fn().mockResolvedValue([]),
        findMissingForUpdate: jest.fn().mockResolvedValue([]),
        findReturnedForUpdate: jest.fn().mockResolvedValue([]),
      }
      const events = { appendInTransaction: jest.fn() }
      const argument = supplySnapshot ? snapshot : undefined

      const discovery = new DiscoveryService(
        adapter as never,
        dataSource as never,
        applications as never,
        events as never,
      )
      const metadata = new MetadataSyncService(
        adapter as never,
        dataSource as never,
        applications as never,
        events as never,
      )
      const removal = new RemovalService(
        adapter as never,
        dataSource as never,
        applications as never,
        events as never,
      )
      const returns = new ReturnService(
        adapter as never,
        dataSource as never,
        applications as never,
        events as never,
      )

      await discovery.discover('cycle-1', argument)
      await metadata.reconcile('cycle-1', argument)
      await removal.reconcile('cycle-1', argument)
      await returns.reconcile('cycle-1', argument)

      expect(adapter.fetchServices).toHaveBeenCalledTimes(
        supplySnapshot ? 0 : 4,
      )
      if (supplySnapshot) {
        expect(applications.findByIdsForUpdate).toHaveBeenCalledWith(manager, [
          'app-1',
        ])
        expect(applications.findMissingForUpdate).toHaveBeenCalledWith(
          manager,
          ['app-1'],
        )
        expect(applications.findReturnedForUpdate).toHaveBeenCalledWith(
          manager,
          ['app-1'],
        )
      }
    })
  },
)
