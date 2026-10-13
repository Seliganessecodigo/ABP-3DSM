import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationsController } from './applications.controller'
import { ApplicationsRepository } from './applications.repository'
import { ApplicationsService } from './applications.service'
import { configureOpenApi } from '../../openapi'

describe('catálogo de aplicações', () => {
  const firstSeenAt = new Date('2026-10-06T10:00:00.000Z')
  const lastCheckedAt = new Date('2026-10-06T10:05:00.000Z')
  const updatedAt = new Date('2026-10-06T10:05:00.000Z')

  it('documenta estado operacional, razão, timestamps e calculabilidade no OpenAPI', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: { find: async () => [] },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    configureOpenApi(app)
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(new URL('/openapi.json', await app.getUrl()))
      const document = (await response.json()) as {
        components: { schemas: { ApplicationDto: { properties: Record<string, unknown> } } }
      }
      expect(response.status).toBe(200)
      expect(document.components.schemas.ApplicationDto.properties).toMatchObject({
        state: expect.anything(),
        reason: expect.objectContaining({ nullable: true }),
        lastObservationAt: expect.objectContaining({ nullable: true }),
        isStale: expect.objectContaining({ type: 'boolean' }),
        isCalculable: expect.objectContaining({ nullable: true }),
      })
    } finally {
      await app.close()
    }
  })

  it('responde com uma coleção vazia quando nenhuma aplicação foi cadastrada', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: { find: async () => [] },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(new URL('/applications', await app.getUrl()))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([])
    } finally {
      await app.close()
    }
  })

  it('lista uma aplicação com localização normalizada e cidade nula', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: {
            find: async () => [
              Object.assign(new ApplicationEntity(), {
                id: 'billing-api',
                name: 'Billing API',
                regionCode: 'br-sudeste',
                country: 'Brazil',
                region: 'Sudeste',
                city: null,
                latitude: -23.5505,
                longitude: -46.6333,
                state: 'AVAILABLE',
                firstSeenAt,
                lastCheckedAt,
                removedAt: null,
                updatedAt,
                location: 'legacy field must not leak',
              }),
            ],
          },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(new URL('/applications', await app.getUrl()))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([
        {
          id: 'billing-api',
          name: 'Billing API',
          location: {
            regionCode: 'br-sudeste',
            country: 'Brazil',
            region: 'Sudeste',
            city: null,
            latitude: -23.5505,
            longitude: -46.6333,
          },
          state: 'AVAILABLE',
          reason: null,
          lastObservationAt: null,
          isStale: false,
          isCalculable: null,
          firstSeenAt: '2026-10-06T10:00:00.000Z',
          lastCheckedAt: '2026-10-06T10:05:00.000Z',
          removedAt: null,
          updatedAt: '2026-10-06T10:05:00.000Z',
        },
      ])
    } finally {
      await app.close()
    }
  })

  it('preserva no catálogo uma aplicação histórica sem localização completa', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: {
            find: async () => [
              Object.assign(new ApplicationEntity(), {
                id: 'legacy-api',
                name: 'Legacy API',
                location: 'unknown legacy location',
                regionCode: null,
                country: null,
                region: null,
                city: null,
                latitude: null,
                longitude: null,
                state: 'AVAILABLE',
                firstSeenAt,
                lastCheckedAt: null,
                removedAt: null,
                updatedAt,
              }),
            ],
          },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(new URL('/applications', await app.getUrl()))
      const body = (await response.json()) as Array<Record<string, unknown>>

      expect(response.status).toBe(200)
      expect(body[0].location).toBeNull()
      expect(body[0].id).toBe('legacy-api')
    } finally {
      await app.close()
    }
  })

  it('distingue falha de consulta ao banco de catálogo vazio', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: {
            find: async () => Promise.reject(new Error('private db detail')),
          },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(new URL('/applications', await app.getUrl()))
      const body = (await response.json()) as Record<string, unknown>

      expect(response.status).toBe(503)
      expect(body).toMatchObject({ code: 'CATALOG_UNAVAILABLE' })
      expect(JSON.stringify(body)).not.toContain('private db detail')
    } finally {
      await app.close()
    }
  })

  it('consulta uma aplicação existente pelo ID estável', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: {
            findOneBy: async () =>
              Object.assign(new ApplicationEntity(), {
                id: 'billing-api',
                name: 'Billing API',
                regionCode: 'br-sudeste',
                country: 'Brazil',
                region: 'Sudeste',
                city: null,
                latitude: -23.5505,
                longitude: -46.6333,
                state: 'AVAILABLE',
                stateReason: 'SOURCE_TIMEOUT',
                lastObservationAt: new Date('2026-10-07T10:00:00.000Z'),
                isStale: true,
                isCalculable: false,
                firstSeenAt,
                lastCheckedAt,
                removedAt: null,
                updatedAt,
              }),
          },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(
        new URL('/applications/billing-api', await app.getUrl()),
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: 'billing-api',
        location: { regionCode: 'br-sudeste', city: null },
        state: 'AVAILABLE',
        reason: 'SOURCE_TIMEOUT',
        lastObservationAt: '2026-10-07T10:00:00.000Z',
        isStale: true,
        isCalculable: false,
      })
    } finally {
      await app.close()
    }
  })

  it('responde not-found para ID válido não cadastrado', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: { findOneBy: async () => null },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(
        new URL('/applications/missing-api', await app.getUrl()),
      )

      expect(response.status).toBe(404)
    } finally {
      await app.close()
    }
  })

  it('rejeita ID vazio após decodificação antes de consultar o catálogo', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: { findOneBy: async () => null },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(
        new URL('/applications/%20', await app.getUrl()),
      )

      expect(response.status).toBe(400)
    } finally {
      await app.close()
    }
  })

  it('consulta IDs longos sem impor limite ausente do contrato da origem', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        ApplicationsRepository,
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: { findOneBy: async () => null },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(
        new URL(`/applications/${'x'.repeat(129)}`, await app.getUrl()),
      )

      expect(response.status).toBe(404)
    } finally {
      await app.close()
    }
  })
})
