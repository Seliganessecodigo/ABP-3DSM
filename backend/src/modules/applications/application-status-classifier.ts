import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'

export type StatusEvidence =
  | {
      kind: 'metrics'
      result: 'valid' | 'missing' | 'invalid' | 'required_field_missing'
      observedAt: Date
      carbonFactorAvailable: boolean
    }
  | {
      kind: 'source_failure'
      reason:
        | ApplicationStateReason.SOURCE_TIMEOUT
        | ApplicationStateReason.SOURCE_ERROR
        | ApplicationStateReason.MONITORING_CYCLE_DELAYED
      observedAt: Date
    }
  | { kind: 'removal_confirmed'; observedAt: Date }

export interface ClassifiedStatus {
  state: ApplicationState
  reason: ApplicationStateReason
  isStale: boolean
  isCalculable: boolean
  lastCheckedAt: Date
  lastObservationAt: Date | null
}

export function classifyStatus(
  evidence: StatusEvidence,
  previousLastObservationAt: Date | null,
): ClassifiedStatus {
  const base = {
    lastCheckedAt: evidence.observedAt,
    lastObservationAt: previousLastObservationAt,
    isStale: false,
    isCalculable: false,
  }

  if (evidence.kind === 'removal_confirmed') {
    return {
      ...base,
      state: ApplicationState.REMOVED,
      reason: ApplicationStateReason.REMOVAL_CONFIRMED,
    }
  }

  if (evidence.kind === 'source_failure') {
    return {
      ...base,
      state: ApplicationState.UNAVAILABLE,
      reason: evidence.reason,
      isStale: true,
    }
  }

  if (evidence.result === 'missing') {
    return {
      ...base,
      state: ApplicationState.NO_METRICS,
      reason: ApplicationStateReason.METRICS_MISSING,
    }
  }

  if (evidence.result === 'required_field_missing') {
    return {
      ...base,
      state: ApplicationState.UNAVAILABLE,
      reason: ApplicationStateReason.REQUIRED_FIELD_MISSING,
    }
  }

  if (evidence.result === 'invalid') {
    return {
      ...base,
      state: ApplicationState.UNAVAILABLE,
      reason: ApplicationStateReason.INVALID_FIELD,
    }
  }

  return {
    ...base,
    state: ApplicationState.AVAILABLE,
    reason: evidence.carbonFactorAvailable
      ? ApplicationStateReason.METRICS_VALID
      : ApplicationStateReason.CARBON_FACTOR_UNAVAILABLE,
    isCalculable: evidence.carbonFactorAvailable,
    lastObservationAt: evidence.observedAt,
  }
}
