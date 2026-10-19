import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'
import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { CarbonRegionEntity } from '../../database/entities/carbon-region.entity'
import { CarbonFactorService } from '../../integrations/carbon-factor.service'
import { configureOpenApi } from '../../openapi'
import { InitialSchema1791240000000 } from '../../database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../../database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../../database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../../database/migrations/1791340000000-CarbonFactorSnapshots'
import { CarbonModule } from './carbon.module'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeDatabase = testDatabaseUrl ? describe : describe.skip

describeDatabase('API pública de intensidade de carbono', () => {
  let upstream: Server
  let app: INestApplication
  let migrationDataSource: DataSource
  const originalDatabaseUrl = process.env.DATABASE_URL
  const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL
  const originalCarbonUrl = process.env.CARBON_INTENSITY_URL

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL must point to an isolated PostgreSQL database')
    }
    process.env.DATABASE_URL = testDatabaseUrl
    migrationDataSource = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      entities: [CarbonRegionEntity],
      migrations: [
        InitialSchema1791240000000,
        CompleteMonitoringPersistence1791250000000,
        AddApplicationLocation1791260000000,
        CarbonFactorSnapshots1791340000000,
      ],
      synchronize: false,
    })
    await migrationDataSource.initialize()
    await migrationDataSource.runMigrations()
  })

  afterAll(async () => {
    if (migrationDataSource?.isInitialized) await migrationDataSource.destroy()
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = originalDatabaseUrl
    if (originalTestDatabaseUrl === undefined) delete process.env.TEST_DATABASE_URL
    else process.env.TEST_DATABASE_URL = originalTestDatabaseUrl
    if (originalCarbonUrl === undefined) delete process.env.CARBON_INTENSITY_URL
    else process.env.CARBON_INTENSITY_URL = originalCarbonUrl
  })

  beforeEach(async () => {
    await migrationDataSource
      .getRepository(CarbonRegionEntity)
      .delete({ code: 'br-sudeste' })
  })

  afterEach(async () => {
    if (app) await app.close()
    if (upstream?.listening) {
      await new Promise<void>((resolve, reject) =>
        upstream.close((error) => (error ? reject(error) : resolve())),
      )
    }
  })

  async function startApi(
    handler: (request: IncomingMessage, response: ServerResponse) => void,
  ) {
    upstream = createServer(handler)
    await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve))
    const { port } = upstream.address() as AddressInfo
    process.env.CARBON_INTENSITY_URL = `http://127.0.0.1:${port}`

    const moduleRef = await Test.createTestingModule({
      imports: [CarbonModule],
    }).compile()
    app = moduleRef.createNestApplication()
    configureOpenApi(app)
    await app.listen(0, '127.0.0.1')
  }

  it('lista regiões válidas normalizadas sem expor o schema da origem', async () => {
    await startApi((request, response) => {
      if (request.url !== '/regions') {
        response.writeHead(404).end()
        return
      }
      response.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          regions: [
            {
              code: 'br-sudeste',
              country: 'Brazil',
              region: 'Sudeste',
              city: null,
              latitude: -23.5505,
              longitude: -46.6333,
              carbon_intensity_gco2e_per_kwh: 85,
              renewable_share_percent: 83,
            },
          ],
          total: 1,
        }),
      )
    })

    const response = await fetch(new URL('/carbon/regions', await app.getUrl()))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      regions: [
        {
          code: 'br-sudeste',
          country: 'Brazil',
          region: 'Sudeste',
          city: null,
          latitude: -23.5505,
          longitude: -46.6333,
          intensity: 85,
          unit: 'gCO2e/kWh',
          renewableSharePercent: 83,
        },
      ],
      total: 1,
    })

    const dataSource = app.get(DataSource)
    expect(await dataSource.getRepository(CarbonRegionEntity).count()).toBe(0)
  }, 30000)

  it('preserva total quando a origem retorna uma lista parcial válida', async () => {
    await startApi((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          regions: [
            {
              code: 'br-sudeste',
              country: 'Brazil',
              region: 'Sudeste',
              city: null,
              latitude: -23.5505,
              longitude: -46.6333,
              carbon_intensity_gco2e_per_kwh: 85,
              renewable_share_percent: 83,
            },
          ],
          total: 5,
        }),
      )
    })

    const response = await fetch(new URL('/carbon/regions', await app.getUrl()))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      regions: [{ code: 'br-sudeste', intensity: 85 }],
      total: 5,
    })
  }, 30000)

  it('retorna lista vazia válida como resposta de sucesso', async () => {
    await startApi((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({ regions: [], total: 0 }),
      )
    })

    const response = await fetch(new URL('/carbon/regions', await app.getUrl()))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ regions: [], total: 0 })
    expect(await app.get(DataSource).getRepository(CarbonRegionEntity).count()).toBe(0)
  }, 30000)

  it('falha a listagem inteira quando há região inválida sem retornar itens parciais', async () => {
    await startApi((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          regions: [
            {
              code: 'br-sudeste',
              country: 'Brazil',
              region: 'Sudeste',
              city: null,
              latitude: -23.5505,
              longitude: -46.6333,
              carbon_intensity_gco2e_per_kwh: 85,
              renewable_share_percent: 83,
            },
            {
              code: 'eu-west',
              country: 'Ireland',
              region: 'West',
              latitude: 53.3498,
              longitude: null,
              carbon_intensity_gco2e_per_kwh: 120,
              renewable_share_percent: 40,
            },
          ],
          total: 2,
        }),
      )
    })

    const response = await fetch(new URL('/carbon/regions', await app.getUrl()))
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toMatchObject({
      code: 'INVALID_UPSTREAM_RESPONSE',
      message: expect.any(String),
    })
    expect(body).not.toHaveProperty('regions')
    expect(await app.get(DataSource).getRepository(CarbonRegionEntity).count()).toBe(0)
  }, 30000)

  it('consulta o fator público sem declarar queriedAt como vigência nem gravar snapshot', async () => {
    await startApi((request, response) => {
      if (request.url !== '/regions/br-sudeste/carbon-intensity') {
        response.writeHead(404).end()
        return
      }
      response.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          region_code: 'br-sudeste',
          country: 'Brazil',
          region: 'Sudeste',
          city: null,
          carbon_intensity_gco2e_per_kwh: 85,
          renewable_share_percent: 83,
        }),
      )
    })

    const before = Date.now()
    const response = await fetch(
      new URL('/carbon/regions/br-sudeste/intensity', await app.getUrl()),
    )
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body).toEqual({
      regionCode: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      city: null,
      intensity: 85,
      unit: 'gCO2e/kWh',
      renewableSharePercent: 83,
      queriedAt: expect.any(String),
    })
    expect(Date.parse(body.queriedAt as string)).toBeGreaterThanOrEqual(before)
    expect(Date.parse(body.queriedAt as string)).toBeLessThanOrEqual(Date.now())

    const dataSource = app.get(DataSource)
    expect(await dataSource.getRepository(CarbonRegionEntity).count()).toBe(0)
  }, 30000)

  it('preserva região inexistente como 404 estruturado sem fator substituto', async () => {
    await startApi((_request, response) => {
      response.writeHead(404, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          error: 'region_not_found',
          message: "region 'unknown' is not registered",
        }),
      )
    })

    const response = await fetch(
      new URL('/carbon/regions/unknown/intensity', await app.getUrl()),
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({
      code: 'REGION_NOT_FOUND',
      message: 'Região não encontrada',
    })
    expect(body).not.toHaveProperty('intensity')

    const dataSource = app.get(DataSource)
    expect(await dataSource.getRepository(CarbonRegionEntity).count()).toBe(0)
  }, 30000)

  it('rejeita fator inválido sem expor valor parcial nem gravar snapshot', async () => {
    await startApi((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          region_code: 'br-sudeste',
          country: 'Brazil',
          region: 'Sudeste',
          city: null,
          carbon_intensity_gco2e_per_kwh: 85,
        }),
      )
    })

    const response = await fetch(
      new URL('/carbon/regions/br-sudeste/intensity', await app.getUrl()),
    )
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toMatchObject({
      code: 'INVALID_UPSTREAM_RESPONSE',
      message: expect.any(String),
    })
    expect(body).not.toHaveProperty('intensity')
    expect(await app.get(DataSource).getRepository(CarbonRegionEntity).count()).toBe(0)
  }, 30000)

  it('preserva o snapshot existente durante leituras públicas de lista e detalhe', async () => {
    await startApi((request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' })
      if (request.url === '/regions') {
        response.end(
          JSON.stringify({
            regions: [
              {
                code: 'br-sudeste',
                country: 'Brazil',
                region: 'Sudeste',
                city: null,
                latitude: -23.5505,
                longitude: -46.6333,
                carbon_intensity_gco2e_per_kwh: 85,
                renewable_share_percent: 83,
              },
            ],
            total: 1,
          }),
        )
        return
      }
      response.end(
        JSON.stringify({
          region_code: 'br-sudeste',
          country: 'Brazil',
          region: 'Sudeste',
          city: null,
          carbon_intensity_gco2e_per_kwh: 85,
          renewable_share_percent: 83,
        }),
      )
    })

    const snapshots = app.get(DataSource).getRepository(CarbonRegionEntity)
    const written = await app.get(CarbonFactorService).capture('br-sudeste')
    const listResponse = await fetch(new URL('/carbon/regions', await app.getUrl()))
    const detailResponse = await fetch(
      new URL('/carbon/regions/br-sudeste/intensity', await app.getUrl()),
    )
    const afterRead = await snapshots.findBy({ code: 'br-sudeste' })

    expect(listResponse.status).toBe(200)
    expect(detailResponse.status).toBe(200)
    expect(afterRead).toHaveLength(1)
    expect(afterRead[0]).toMatchObject({
      id: written.id,
      version: written.version,
      unit: 'gCO2e/kWh',
      queriedAt: written.queriedAt,
      source: null,
      validFrom: null,
    })
    expect(Number(afterRead[0].intensity)).toBe(Number(written.intensity))
  }, 30000)

  it('responde com falha estruturada quando a origem da lista está indisponível', async () => {
    await startApi((_request, response) => {
      response.writeHead(503, { 'content-type': 'application/json' }).end(
        JSON.stringify({ error: 'unavailable', message: 'private upstream detail' }),
      )
    })

    const response = await fetch(new URL('/carbon/regions', await app.getUrl()))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'Serviço de intensidade de carbono indisponível',
    })
    expect(body).not.toHaveProperty('regions')
    expect(body).not.toHaveProperty('intensity')
    expect(JSON.stringify(body)).not.toContain('private upstream detail')
    expect(await app.get(DataSource).getRepository(CarbonRegionEntity).count()).toBe(0)
  }, 30000)

  it('representa timeout da origem como indisponibilidade sem fator substituto', async () => {
    await startApi(() => undefined)

    const response = await fetch(new URL('/carbon/regions', await app.getUrl()))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      code: 'UPSTREAM_TIMEOUT',
      message: 'Serviço de intensidade de carbono indisponível',
    })
    expect(body).not.toHaveProperty('regions')
    expect(body).not.toHaveProperty('intensity')
    expect(await app.get(DataSource).getRepository(CarbonRegionEntity).count()).toBe(0)
  }, 40000)

  it('documenta as rotas públicas e os estados distintos de falha no OpenAPI', async () => {
    await startApi(() => undefined)

    const response = await fetch(new URL('/openapi.json', await app.getUrl()))
    const document = (await response.json()) as {
      paths: Record<string, { get: { responses: Record<string, unknown> } }>
      components: { schemas: Record<string, { properties: Record<string, unknown> }> }
    }

    expect(response.status).toBe(200)
    expect(document.paths['/carbon/regions'].get.responses).toMatchObject({
      '200': expect.anything(),
      '502': expect.anything(),
      '503': expect.anything(),
    })
    expect(
      document.paths['/carbon/regions/{code}/intensity'].get.responses,
    ).toMatchObject({
      '200': expect.anything(),
      '404': expect.anything(),
      '502': expect.anything(),
      '503': expect.anything(),
    })
    expect(
      document.components.schemas.CarbonIntensityDto.properties,
    ).toMatchObject({
      intensity: expect.anything(),
      unit: expect.anything(),
      queriedAt: expect.anything(),
    })
  }, 30000)
})
