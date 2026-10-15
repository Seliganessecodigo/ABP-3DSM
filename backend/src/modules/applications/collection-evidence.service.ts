import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { ApplicationsRepository } from './applications.repository'
import { CollectionEvidenceDto, MetricEvidenceDto } from './collection.dto'

const METRIC_FIELDS = {
  cpu: { key: 'cpuPercent', unit: '%' },
  memory: { key: 'memoryGb', unit: 'GB' },
  disk: { key: 'diskGb', unit: 'GB' },
  network: { key: 'networkGb', unit: 'GB' },
} as const

function metricEvidence(
  metrics: Record<string, unknown>,
  units: Record<string, string>,
  key: string,
  fallbackUnit: string,
): MetricEvidenceDto {
  const value = metrics[key]
  const valid = typeof value === 'number' && Number.isFinite(value)
  return {
    value: valid ? value : null,
    unit: units[key] ?? fallbackUnit,
    status: valid ? 'available' : value === undefined ? 'missing' : 'invalid',
  }
}

function toEvidence(
  applicationId: string,
  collection: CollectionEntity,
  application: ApplicationEntity,
): CollectionEvidenceDto {
  const metrics = {
    cpu: metricEvidence(
      collection.metrics,
      collection.metricUnits,
      METRIC_FIELDS.cpu.key,
      METRIC_FIELDS.cpu.unit,
    ),
    memory: metricEvidence(
      collection.metrics,
      collection.metricUnits,
      METRIC_FIELDS.memory.key,
      METRIC_FIELDS.memory.unit,
    ),
    disk: metricEvidence(
      collection.metrics,
      collection.metricUnits,
      METRIC_FIELDS.disk.key,
      METRIC_FIELDS.disk.unit,
    ),
    network: metricEvidence(
      collection.metrics,
      collection.metricUnits,
      METRIC_FIELDS.network.key,
      METRIC_FIELDS.network.unit,
    ),
  }

  return {
    id: collection.id,
    applicationId,
    intervalStart: collection.intervalStart,
    intervalEnd: collection.intervalEnd,
    collectedAt: collection.collectedAt,
    collectionIntervalSeconds:
      typeof collection.metrics.collectionIntervalSeconds === 'number' &&
      Number.isFinite(collection.metrics.collectionIntervalSeconds)
        ? collection.metrics.collectionIntervalSeconds
        : null,
    isStale: application.isStale,
    state: application.state,
    reason:
      application.stateReason ??
      (application.lastObservationAt
        ? ApplicationStateReason.METRICS_VALID
        : ApplicationStateReason.NO_OBSERVATION),
    lastCheckedAt: application.lastCheckedAt,
    metrics,
  }
}

@Injectable()
export class CollectionEvidenceService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly collections: CollectionsRepository,
  ) {}

  async getLatest(applicationId: string): Promise<CollectionEvidenceDto> {
    let application: ApplicationEntity | null
    let collection: CollectionEntity | null
    try {
      application = await this.applications.findById(applicationId)
      if (!application) {
        throw new NotFoundException({
          code: 'APPLICATION_NOT_FOUND',
          message: 'Aplicação não encontrada',
        })
      }
      collection = await this.collections.findLatestByApplication(applicationId)
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new ServiceUnavailableException({
        code: 'APPLICATION_EVIDENCE_UNAVAILABLE',
        message: 'Evidências da aplicação temporariamente indisponíveis',
      })
    }

    if (!collection) {
      throw new NotFoundException({
        code: 'COLLECTION_NOT_FOUND',
        message: 'Nenhuma observação encontrada para a aplicação',
      })
    }
    return toEvidence(applicationId, collection, application)
  }

  async getById(applicationId: string, collectionId: string) {
    try {
      const application = await this.applications.findById(applicationId)
      if (!application) {
        throw new NotFoundException({
          code: 'APPLICATION_NOT_FOUND',
          message: 'Aplicação não encontrada',
        })
      }
      const collection = await this.collections.findByApplicationAndId(
        applicationId,
        collectionId,
      )
      if (!collection) {
        throw new NotFoundException({
          code: 'COLLECTION_NOT_FOUND',
          message: 'Observação não encontrada para a aplicação',
        })
      }
      return toEvidence(applicationId, collection, application)
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new ServiceUnavailableException({
        code: 'APPLICATION_EVIDENCE_UNAVAILABLE',
        message: 'Evidências da aplicação temporariamente indisponíveis',
      })
    }
  }
}
