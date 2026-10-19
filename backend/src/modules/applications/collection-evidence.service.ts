import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  CollectionEntity,
  type CollectionCalculationEvidenceV1,
} from '../../database/entities/collection.entity'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { ApplicationsRepository } from './applications.repository'
import {
  CollectionEvidenceDto,
  EnvironmentalEvidenceDto,
  MetricEvidenceDto,
} from './collection.dto'

const METRIC_FIELDS = {
  cpu: { key: 'cpuPercent', unit: '%' },
  memory: { key: 'memoryGb', unit: 'GB' },
  disk: { key: 'diskGb', unit: 'GB' },
  network: { key: 'networkGb', unit: 'GB' },
} as const

const SIMPLIFIED_ENERGY_FORMULA = {
  expression:
    'averagePowerW = cpuPercent / 100 × cpuWattsAt100Percent + memoryGb × memoryWattsPerGb + diskGb × diskWattsPerGb + networkGb × networkWattsPerGb; energyKwh = averagePowerW × durationSeconds / 3600000',
  inputUnits: {
    cpuPercent: '%',
    memoryGb: 'GB',
    diskGb: 'GB',
    networkGb: 'GB',
    cpuWattsAt100Percent: 'W',
    memoryWattsPerGb: 'W/GB',
    diskWattsPerGb: 'W/GB',
    networkWattsPerGb: 'W/GB',
    durationSeconds: 's',
  },
  outputUnit: 'kWh',
} as const

const CARBON_FORMULA = {
  expression:
    'emissionsGramsCo2e = energyKwh × intensity; emissionsKilogramsCo2e = emissionsGramsCo2e / 1000',
  energyUnit: 'kWh' as const,
  factorUnit: 'gCO2e/kWh' as const,
  gramsUnit: 'gCO2e' as const,
  kilogramsUnit: 'kgCO2e' as const,
}

function persistedNumber(value: string | null): number | null {
  if (value === null) return null
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function environmentalEvidence(
  collection: CollectionEntity,
): EnvironmentalEvidenceDto {
  const evidence = collection.calculationEvidence
  if (!evidence || evidence.version !== 1) {
    return {
      status: 'absent',
      absenceReason: 'ENVIRONMENTAL_EVIDENCE_UNAVAILABLE',
      energy: null,
      carbon: null,
    }
  }

  const bundle: CollectionCalculationEvidenceV1 = evidence
  const energy = bundle.energy
  const knownEnergyFormula =
    energy.modelKey === 'simplified-energy' && energy.modelVersion === '1'

  return {
    status: 'present',
    absenceReason: null,
    energy: {
      valueKwh: persistedNumber(collection.energyKwh),
      calculatedValueKwh: energy.energyKwh,
      coverage: persistedNumber(collection.coverage),
      durationSeconds: energy.durationSeconds,
      averagePowerW: energy.averagePowerW,
      model: {
        key: energy.modelKey,
        version: energy.modelVersion,
        configId: collection.calculationConfigId,
        configVersion: collection.calculationConfigVersion,
        parameters: energy.modelParameters,
        formula: {
          status: knownEnergyFormula ? 'available' : 'unavailable',
          expression: knownEnergyFormula
            ? SIMPLIFIED_ENERGY_FORMULA.expression
            : null,
          inputUnits: knownEnergyFormula
            ? SIMPLIFIED_ENERGY_FORMULA.inputUnits
            : null,
          outputUnit: knownEnergyFormula
            ? SIMPLIFIED_ENERGY_FORMULA.outputUnit
            : null,
          reason: knownEnergyFormula ? null : 'FORMULA_UNAVAILABLE',
        },
        powerContributionsW: energy.powerContributionsW,
        reasons: energy.reasons,
      },
    },
    carbon: {
      valueGramsCo2e: persistedNumber(collection.carbonGrams),
      calculatedValueGramsCo2e: bundle.carbon.emissionsGramsCo2e,
      calculatedValueKilogramsCo2e: bundle.carbon.emissionsKilogramsCo2e,
      factor: persistedNumber(collection.carbonFactor),
      factorSnapshot: bundle.carbon.factorSnapshot,
      formula: CARBON_FORMULA,
      reasons: bundle.carbon.reasons,
    },
  }
}

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
    environmental: environmentalEvidence(collection),
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
