import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { DataSource } from 'typeorm'
import { CarbonRegionEntity } from '../database/entities/carbon-region.entity'
import { InitialSchema1791240000000 } from '../database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../database/migrations/1791340000000-CarbonFactorSnapshots'
import { CarbonRegionsRepository } from '../database/repositories/carbon-regions.repository'
import { CarbonIntensityAdapter } from './carbon-intensity.adapter'
import { CarbonFactorService } from './carbon-factor.service'

const databaseUrl = process.env.TEST_DATABASE_URL
const describeDatabase = databaseUrl ? describe : describe.skip

describeDatabase('snapshot de fator em PostgreSQL isolado', () => {
  let dataSource: DataSource
  let server: Server
  let valid = true

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: [CarbonRegionEntity],
      migrations: [
        InitialSchema1791240000000,
        CompleteMonitoringPersistence1791250000000,
        AddApplicationLocation1791260000000,
        CarbonFactorSnapshots1791340000000,
      ],
      synchronize: false,
    })
    await dataSource.initialize()
    await dataSource.runMigrations()
  })
  beforeEach(async () => {
    valid = true
    await dataSource
      .getRepository(CarbonRegionEntity)
      .delete({ code: 'br-sudeste' })
  })
  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy()
  })
  afterEach(async () => {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      )
  })

  it('anexa snapshots imutáveis e preserva o último após payload inválido', async () => {
    server = createServer((_request, response) =>
      response.writeHead(200).end(
        JSON.stringify(
          valid
            ? {
                region_code: 'br-sudeste',
                country: 'Brazil',
                region: 'Sudeste',
                city: null,
                carbon_intensity_gco2e_per_kwh: 85,
                renewable_share_percent: 83,
              }
            : { region_code: 'br-sudeste' },
        ),
      ),
    )
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const adapter = new CarbonIntensityAdapter(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    )
    const repository = new CarbonRegionsRepository(
      dataSource.getRepository(CarbonRegionEntity),
    )
    const service = new CarbonFactorService(adapter, repository)

    const first = await service.capture('br-sudeste')
    const second = await service.capture('br-sudeste')
    expect(first.id).not.toBe(second.id)
    expect(first.version).not.toBe(second.version)
    expect(first).toMatchObject({
      code: 'br-sudeste',
      intensity: '85',
      unit: 'gCO2e/kWh',
      contractVersion: '0.1.0',
      source: null,
      validFrom: null,
    })
    expect(first.queriedAt).toBeInstanceOf(Date)
    valid = false
    await expect(service.capture('br-sudeste')).rejects.toMatchObject({
      code: 'INVALID_UPSTREAM_RESPONSE',
    })
    const saved = await dataSource
      .getRepository(CarbonRegionEntity)
      .find({ where: { code: 'br-sudeste' } })
    expect(saved).toHaveLength(2)
    expect(saved.every((item) => Number(item.intensity) === 85)).toBe(true)
  })
})
