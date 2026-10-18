import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { ApplicationsRepository } from './applications.repository'

export interface MethodologyMetadataSnapshot {
  readonly key: string
  readonly version: string
  readonly formula: string
  readonly inputs: Readonly<Record<string, unknown>>
  readonly output: Readonly<Record<string, unknown>>
  readonly parameters: Readonly<Record<string, unknown>>
  readonly assumptions: readonly string[]
  readonly validity: Readonly<Record<string, unknown>>
  readonly limitations: readonly string[]
  readonly source: Readonly<Record<string, unknown>>
}

type CollectionWithMethodology = CollectionEntity & {
  methodologySnapshot: MethodologyMetadataSnapshot | null
}

export type MethodologyMetadataReasonCode =
  | 'RESULT_NOT_AVAILABLE'
  | 'METHODOLOGY_NOT_AVAILABLE'
  | 'MISSING_CONFIGURATION'
  | 'INCOMPLETE_METADATA'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function hasUnitOnEveryEntry(value: Record<string, unknown>): boolean {
  return Object.values(value).every(
    (entry) => isRecord(entry) && isNonEmptyString(entry.unit),
  )
}

function hasParameterShape(value: Record<string, unknown>): boolean {
  return Object.values(value).every((entry) => {
    if (!isRecord(entry)) return false
    return hasOwn(entry, 'value') && isNonEmptyString(entry.unit)
  })
}

function hasCompleteMetadata(
  snapshot: MethodologyMetadataSnapshot,
): boolean {
  const candidate = snapshot as unknown as Record<string, unknown>
  return (
    isNonEmptyString(candidate.key) &&
    isNonEmptyString(candidate.version) &&
    isNonEmptyString(candidate.formula) &&
    isRecord(candidate.inputs) &&
    hasUnitOnEveryEntry(candidate.inputs) &&
    isRecord(candidate.output) &&
    isNonEmptyString(candidate.output.unit) &&
    isRecord(candidate.parameters) &&
    hasParameterShape(candidate.parameters) &&
    Array.isArray(candidate.assumptions) &&
    candidate.assumptions.every(isNonEmptyString) &&
    isRecord(candidate.validity) &&
    hasOwn(candidate.validity, 'from') &&
    hasOwn(candidate.validity, 'until') &&
    Array.isArray(candidate.limitations) &&
    candidate.limitations.every(isNonEmptyString) &&
    isRecord(candidate.source) &&
    isNonEmptyString(candidate.source.queriedAt)
  )
}

@Injectable()
export class MethodologyMetadataService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly collections: CollectionsRepository,
  ) {}

  async getById(applicationId: string, collectionId: string) {
    let collection: CollectionWithMethodology | null
    try {
      const application = await this.applications.findById(applicationId)
      if (!application) {
        throw new NotFoundException({
          code: 'APPLICATION_NOT_FOUND',
          message: 'Aplicação não encontrada',
        })
      }
      collection = (await this.collections.findByApplicationAndIdForMethodology(
        applicationId,
        collectionId,
      )) as CollectionWithMethodology | null
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new ServiceUnavailableException({
        code: 'METHODOLOGY_UNAVAILABLE',
        message: 'Metadados da metodologia temporariamente indisponíveis',
      })
    }

    if (!collection) {
      throw new NotFoundException({
        code: 'RESULT_NOT_FOUND',
        message: 'Resultado não encontrado',
      })
    }

    const snapshot = collection.methodologySnapshot ?? null
    const methodology = snapshot && hasCompleteMetadata(snapshot) ? snapshot : null
    const energy = collection.energyKwh === null ? null : Number(collection.energyKwh)
    const hasEnergy = energy !== null && Number.isFinite(energy)
    const hasConfiguration =
      isNonEmptyString(collection.calculationConfigId) &&
      isNonEmptyString(collection.calculationConfigVersion)
    let reason: MethodologyMetadataReasonCode | null = null
    if (!hasEnergy) {
      reason = 'RESULT_NOT_AVAILABLE'
    } else if (!hasConfiguration) {
      reason = 'MISSING_CONFIGURATION'
    } else if (snapshot === null) {
      reason = 'METHODOLOGY_NOT_AVAILABLE'
    } else if (methodology === null) {
      reason = 'INCOMPLETE_METADATA'
    }

    return {
      collectionId: collection.id,
      applicationId: collection.applicationId,
      indicator: {
        value: hasEnergy ? energy : null,
        unit: 'kWh',
      },
      status: methodology ? 'AVAILABLE' : 'UNAVAILABLE',
      reason,
      methodology,
      configuration:
        collection.calculationConfigId && collection.calculationConfigVersion
          ? {
              id: collection.calculationConfigId,
              version: collection.calculationConfigVersion,
            }
          : null,
    }
  }
}
