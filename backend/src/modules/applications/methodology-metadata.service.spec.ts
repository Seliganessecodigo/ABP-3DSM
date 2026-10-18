import { NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { ApplicationsRepository } from './applications.repository'
import { MethodologyMetadataService } from './methodology-metadata.service'

describe('MethodologyMetadataService', () => {
  const application = { id: 'billing-api' }

  function serviceWith(collection: CollectionEntity | null) {
    const applications = {
      findById: jest.fn().mockResolvedValue(application),
    } as unknown as ApplicationsRepository
    const collections = {
      findByApplicationAndIdForMethodology: jest
        .fn()
        .mockResolvedValue(collection),
    } as unknown as CollectionsRepository
    return new MethodologyMetadataService(applications, collections)
  }

  it('returns the immutable methodology snapshot used by a collection result', async () => {
    const collection = Object.assign(new CollectionEntity(), {
      id: 'collection-1',
      applicationId: 'billing-api',
      state: 'AVAILABLE',
      energyKwh: '0.1',
      calculationConfigId: 'config-1',
      calculationConfigVersion: 'energy-v2',
      methodologySnapshot: {
        key: 'approved-energy',
        version: 'energy-v2',
        formula: 'energy [kWh] = power [W] × duration [h] / 1000',
        inputs: {
          cpuPercent: { unit: '%', role: 'input' },
        },
        output: { unit: 'kWh' },
        parameters: {
          cpuWattsAt100Percent: { value: 100, unit: 'W' },
        },
        assumptions: ['CPU contribution is linear'],
        validity: { from: '2026-10-01T00:00:00.000Z', until: null },
        limitations: ['The source does not publish measurement timestamps'],
        source: {
          reference: null,
          officialValidity: null,
          queriedAt: '2026-10-18T10:01:00.000Z',
        },
      },
    })
    const service = serviceWith(collection)

    await expect(
      service.getById('billing-api', 'collection-1'),
    ).resolves.toEqual({
      collectionId: 'collection-1',
      applicationId: 'billing-api',
      indicator: { value: 0.1, unit: 'kWh' },
      status: 'AVAILABLE',
      reason: null,
      methodology: collection.methodologySnapshot,
      configuration: {
        id: 'config-1',
        version: 'energy-v2',
      },
    })
  })

  it('returns a structured reason when the collection has no methodology snapshot', async () => {
    const collection = Object.assign(new CollectionEntity(), {
      id: 'collection-2',
      applicationId: 'billing-api',
      state: 'AVAILABLE',
      energyKwh: '0.1',
      calculationConfigId: 'config-2',
      calculationConfigVersion: 'energy-v2',
      methodologySnapshot: null,
    })
    const service = serviceWith(collection)

    await expect(
      service.getById('billing-api', 'collection-2'),
    ).resolves.toEqual({
      collectionId: 'collection-2',
      applicationId: 'billing-api',
      indicator: { value: 0.1, unit: 'kWh' },
      status: 'UNAVAILABLE',
      reason: 'METHODOLOGY_NOT_AVAILABLE',
      methodology: null,
      configuration: { id: 'config-2', version: 'energy-v2' },
    })
  })

  it('distinguishes an unknown collection from unavailable methodology metadata', async () => {
    const service = serviceWith(null)

    await expect(
      service.getById('billing-api', 'missing-collection'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns an incomplete metadata reason instead of exposing an unapproved snapshot', async () => {
    const collection = Object.assign(new CollectionEntity(), {
      id: 'collection-3',
      applicationId: 'billing-api',
      energyKwh: '0.1',
      calculationConfigId: 'config-3',
      calculationConfigVersion: 'energy-v3',
      methodologySnapshot: {
        key: 'approved-energy',
        version: 'energy-v3',
        formula: '',
        inputs: {},
        output: { unit: 'kWh' },
        parameters: {},
        assumptions: [],
        validity: { from: null, until: null },
        limitations: [],
        source: { queriedAt: '2026-10-18T10:01:00.000Z' },
      },
    })
    const service = serviceWith(collection)

    await expect(
      service.getById('billing-api', 'collection-3'),
    ).resolves.toMatchObject({
      status: 'UNAVAILABLE',
      reason: 'INCOMPLETE_METADATA',
      methodology: null,
      indicator: { value: 0.1, unit: 'kWh' },
    })
  })

  it('returns a structured service error when persistence is unavailable', async () => {
    const applications = {
      findById: jest.fn().mockResolvedValue(application),
    } as unknown as ApplicationsRepository
    const collections = {
      findByApplicationAndIdForMethodology: jest
        .fn()
        .mockRejectedValue(new Error('private database detail')),
    } as unknown as CollectionsRepository
    const service = new MethodologyMetadataService(applications, collections)

    await expect(
      service.getById('billing-api', 'collection-4'),
    ).rejects.toMatchObject({
      constructor: ServiceUnavailableException,
      response: { code: 'METHODOLOGY_UNAVAILABLE' },
    })
  })

  it('treats malformed persisted metadata as incomplete instead of throwing', async () => {
    const collection = Object.assign(new CollectionEntity(), {
      id: 'collection-5',
      applicationId: 'billing-api',
      energyKwh: '0.1',
      calculationConfigId: 'config-5',
      calculationConfigVersion: 'energy-v5',
      methodologySnapshot: {
        key: null,
        version: 'energy-v5',
        formula: 'energy [kWh] = power [W] × duration [h] / 1000',
        inputs: {},
        output: { unit: 'kWh' },
        parameters: {},
        assumptions: [],
        validity: { from: null, until: null },
        limitations: [],
        source: { queriedAt: '2026-10-18T10:01:00.000Z' },
      },
    })
    const service = serviceWith(collection)

    await expect(
      service.getById('billing-api', 'collection-5'),
    ).resolves.toMatchObject({
      status: 'UNAVAILABLE',
      reason: 'INCOMPLETE_METADATA',
      methodology: null,
    })
  })

  it('distinguishes an unknown application from an unknown result', async () => {
    const applications = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as ApplicationsRepository
    const collections = {
      findByApplicationAndIdForMethodology: jest.fn(),
    } as unknown as CollectionsRepository
    const service = new MethodologyMetadataService(applications, collections)

    await expect(
      service.getById('missing-app', 'collection-1'),
    ).rejects.toMatchObject({
      constructor: NotFoundException,
      response: { code: 'APPLICATION_NOT_FOUND' },
    })
    expect(collections.findByApplicationAndIdForMethodology).not.toHaveBeenCalled()
  })

  it('returns a result-unavailable reason without turning absence into zero', async () => {
    const collection = Object.assign(new CollectionEntity(), {
      id: 'collection-6',
      applicationId: 'billing-api',
      energyKwh: null,
      calculationConfigId: 'config-6',
      calculationConfigVersion: 'energy-v6',
      methodologySnapshot: null,
    })
    const service = serviceWith(collection)

    await expect(service.getById('billing-api', 'collection-6')).resolves.toMatchObject({
      indicator: { value: null, unit: 'kWh' },
      status: 'UNAVAILABLE',
      reason: 'RESULT_NOT_AVAILABLE',
    })
  })

  it('returns a missing-configuration reason when a result has no configuration link', async () => {
    const collection = Object.assign(new CollectionEntity(), {
      id: 'collection-7',
      applicationId: 'billing-api',
      energyKwh: '0',
      calculationConfigId: null,
      calculationConfigVersion: null,
      methodologySnapshot: null,
    })
    const service = serviceWith(collection)

    await expect(service.getById('billing-api', 'collection-7')).resolves.toMatchObject({
      indicator: { value: 0, unit: 'kWh' },
      status: 'UNAVAILABLE',
      reason: 'MISSING_CONFIGURATION',
    })
  })

  it('preserves methodology snapshots from two historical results independently', async () => {
    const first = Object.assign(new CollectionEntity(), {
      id: 'collection-old',
      applicationId: 'billing-api',
      energyKwh: '0.1',
      calculationConfigId: 'config-old',
      calculationConfigVersion: 'energy-v1',
      methodologySnapshot: {
        key: 'approved-energy',
        version: 'energy-v1',
        formula: 'old formula',
        inputs: {},
        output: { unit: 'kWh' },
        parameters: { cpu: { value: 10, unit: 'W' } },
        assumptions: [],
        validity: { from: null, until: null },
        limitations: [],
        source: { queriedAt: '2026-10-18T10:01:00.000Z' },
      },
    })
    const second = Object.assign(new CollectionEntity(), {
      id: 'collection-new',
      applicationId: 'billing-api',
      energyKwh: '0.2',
      calculationConfigId: 'config-new',
      calculationConfigVersion: 'energy-v2',
      methodologySnapshot: {
        key: 'approved-energy',
        version: 'energy-v2',
        formula: 'new formula',
        inputs: {},
        output: { unit: 'kWh' },
        parameters: { cpu: { value: 20, unit: 'W' } },
        assumptions: [],
        validity: { from: null, until: null },
        limitations: [],
        source: { queriedAt: '2026-10-18T10:01:00.000Z' },
      },
    })
    const applications = {
      findById: jest.fn().mockResolvedValue(application),
    } as unknown as ApplicationsRepository
    const collections = {
      findByApplicationAndIdForMethodology: jest
        .fn()
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(second),
    } as unknown as CollectionsRepository
    const service = new MethodologyMetadataService(applications, collections)

    await expect(service.getById('billing-api', 'collection-old')).resolves.toMatchObject({
      methodology: { version: 'energy-v1', formula: 'old formula' },
      configuration: { id: 'config-old', version: 'energy-v1' },
    })
    await expect(service.getById('billing-api', 'collection-new')).resolves.toMatchObject({
      methodology: { version: 'energy-v2', formula: 'new formula' },
      configuration: { id: 'config-new', version: 'energy-v2' },
    })
  })
})
