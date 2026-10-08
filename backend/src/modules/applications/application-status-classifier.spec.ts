import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { classifyStatus } from './application-status-classifier'

describe('classifyStatus', () => {
  const observedAt = new Date('2026-10-07T12:00:00.000Z')
  const previousObservation = new Date('2026-10-07T11:00:00.000Z')

  it('classifies valid metrics separately from carbon calculability', () => {
    expect(
      classifyStatus(
        { kind: 'metrics', result: 'valid', observedAt, carbonFactorAvailable: true },
        previousObservation,
      ),
    ).toEqual({
      state: ApplicationState.AVAILABLE,
      reason: null,
      isStale: false,
      isCalculable: true,
      lastCheckedAt: observedAt,
      lastObservationAt: observedAt,
    })

    expect(
      classifyStatus(
        { kind: 'metrics', result: 'valid', observedAt, carbonFactorAvailable: false },
        previousObservation,
      ),
    ).toMatchObject({
      state: ApplicationState.AVAILABLE,
      reason: ApplicationStateReason.CARBON_FACTOR_UNAVAILABLE,
      isCalculable: false,
      lastObservationAt: observedAt,
    })
  })

  it('does not fabricate metrics or replace the last valid observation', () => {
    expect(
      classifyStatus(
        { kind: 'metrics', result: 'missing', observedAt, carbonFactorAvailable: true },
        previousObservation,
      ),
    ).toMatchObject({
      state: ApplicationState.NO_METRICS,
      reason: ApplicationStateReason.METRICS_MISSING,
      isCalculable: false,
      lastObservationAt: previousObservation,
    })

    expect(
      classifyStatus(
        { kind: 'metrics', result: 'required_field_missing', observedAt, carbonFactorAvailable: true },
        previousObservation,
      ),
    ).toMatchObject({
      state: ApplicationState.UNAVAILABLE,
      reason: ApplicationStateReason.REQUIRED_FIELD_MISSING,
      lastObservationAt: previousObservation,
    })

    expect(
      classifyStatus(
        { kind: 'metrics', result: 'invalid', observedAt, carbonFactorAvailable: true },
        previousObservation,
      ),
    ).toMatchObject({
      state: ApplicationState.UNAVAILABLE,
      reason: ApplicationStateReason.INVALID_FIELD,
      lastObservationAt: previousObservation,
    })
  })

  it.each([
    ApplicationStateReason.SOURCE_TIMEOUT,
    ApplicationStateReason.SOURCE_ERROR,
    ApplicationStateReason.MONITORING_CYCLE_DELAYED,
  ] as const)('marks a failed observation stale and preserves the last valid one (%s)', (reason) => {
    expect(
      classifyStatus({ kind: 'source_failure', reason, observedAt }, previousObservation),
    ).toMatchObject({
      state: ApplicationState.UNAVAILABLE,
      reason,
      isStale: true,
      lastCheckedAt: observedAt,
      lastObservationAt: previousObservation,
    })
  })

  it('clears stale status and resumes valid observations after recovery', () => {
    const failed = classifyStatus(
      {
        kind: 'source_failure',
        reason: ApplicationStateReason.SOURCE_TIMEOUT,
        observedAt,
      },
      previousObservation,
    )
    const recoveredAt = new Date('2026-10-07T12:05:00.000Z')
    expect(
      classifyStatus(
        {
          kind: 'metrics',
          result: 'valid',
          observedAt: recoveredAt,
          carbonFactorAvailable: true,
        },
        failed.lastObservationAt,
      ),
    ).toMatchObject({
      state: ApplicationState.AVAILABLE,
      reason: null,
      isStale: false,
      isCalculable: true,
      lastObservationAt: recoveredAt,
    })
  })

  it('marks removal only for confirmed absence', () => {
    expect(
      classifyStatus({ kind: 'removal_confirmed', observedAt }, previousObservation),
    ).toMatchObject({
      state: ApplicationState.REMOVED,
      reason: null,
      isCalculable: false,
      lastObservationAt: previousObservation,
    })
  })
})
