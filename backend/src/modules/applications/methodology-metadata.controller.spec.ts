import { Test } from '@nestjs/testing'
import { MethodologyMetadataService } from './methodology-metadata.service'
import { ApplicationsController } from './applications.controller'
import { ApplicationsService } from './applications.service'
import { CollectionEvidenceService } from './collection-evidence.service'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { ApplicationsRepository } from './applications.repository'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { configureOpenApi } from '../../openapi'

describe('metadados da metodologia da collection', () => {
  it('retorna o snapshot aplicado por uma rota pública', async () => {
    const collection = Object.assign(new CollectionEntity(), {
      id: '6f1c7e8a-5c4b-4d3e-9f2a-1b0c9d8e7f6a',
      applicationId: 'billing-api',
      energyKwh: '0.1',
      calculationConfigId: 'config-1',
      calculationConfigVersion: 'energy-v2',
      methodologySnapshot: {
        key: 'approved-energy',
        version: 'energy-v2',
        formula: 'energy [kWh] = power [W] × duration [h] / 1000',
        inputs: {},
        output: { unit: 'kWh' },
        parameters: {},
        assumptions: [],
        validity: { from: '2026-10-01T00:00:00.000Z', until: null },
        limitations: [],
        source: {
          reference: null,
          officialValidity: null,
          queriedAt: '2026-10-18T10:01:00.000Z',
        },
      },
    })
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        { provide: ApplicationsService, useValue: {} },
        { provide: CollectionEvidenceService, useValue: {} },
        MethodologyMetadataService,
        {
          provide: ApplicationsRepository,
          useValue: { findById: jest.fn().mockResolvedValue({ id: 'billing-api' }) },
        },
        {
          provide: CollectionsRepository,
          useValue: {
            findByApplicationAndIdForMethodology: jest.fn().mockResolvedValue(collection),
          },
        },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(
        new URL(
          '/applications/billing-api/collections/6f1c7e8a-5c4b-4d3e-9f2a-1b0c9d8e7f6a/methodology',
          await app.getUrl(),
        ),
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        collectionId: collection.id,
        applicationId: 'billing-api',
        status: 'AVAILABLE',
        methodology: { key: 'approved-energy', version: 'energy-v2' },
      })
    } finally {
      await app.close()
    }
  })

  it('publica o schema tipado da resposta no OpenAPI', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        { provide: ApplicationsService, useValue: {} },
        { provide: CollectionEvidenceService, useValue: {} },
        { provide: MethodologyMetadataService, useValue: {} },
      ],
    }).compile()
    const app = moduleRef.createNestApplication()
    configureOpenApi(app)
    await app.listen(0, '127.0.0.1')

    try {
      const response = await fetch(new URL('/openapi.json', await app.getUrl()))
      const document = (await response.json()) as {
        paths: Record<string, { get: { responses: Record<string, unknown> } }>
      }

      expect(document.paths['/applications/{id}/collections/{collectionId}/methodology'].get.responses['200'])
        .toMatchObject({
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MethodologyMetadataResponseDto' },
            },
          },
        })
    } finally {
      await app.close()
    }
  })
})
