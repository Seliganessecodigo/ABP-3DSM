import type { PersistedEnvironmentalInterval } from './persisted-environmental-period'
import { buildEnvironmentalAnalysisSeriesEvents } from './persisted-environmental-series-events'

function observation(
  id: string,
  collectedAt: string,
  factorVersion: string | null,
): PersistedEnvironmentalInterval {
  const factorSnapshot = {
    id: `snapshot-${id}`,
    version: factorVersion,
    contractVersion: 'contract-v1',
    regionCode: 'br-sudeste',
    country: 'Brazil',
    region: 'Southeast',
    city: null,
    intensity: 10,
    unit: 'gCO2e/kWh',
    queriedAt: collectedAt,
    source: 'persisted-factor-source',
    validFrom: null,
    validUntil: null,
  }

  return {
    id,
    intervalStart: collectedAt,
    intervalEnd: collectedAt.replace('00:00:00', '01:00:00'),
    collectedAt,
    energyKwh: '1',
    carbonGrams: '10',
    calculationEvidence: {
      energy: {
        modelKey: 'saved-model',
        modelVersion: 'model-v1',
        modelParameters: {},
        reasons: [],
      },
      carbon: {
        factorSnapshot: factorSnapshot as unknown as NonNullable<PersistedEnvironmentalInterval['calculationEvidence']>['carbon']['factorSnapshot'],
        reasons: [],
      },
    },
  }
}

describe('eventos públicos da série ambiental persistida', () => {
  it('não trata snapshot com versão nula como substituição por uma versão salva', () => {
    const events = buildEnvironmentalAnalysisSeriesEvents(
      '2026-10-01T01:00:00.000Z',
      '2026-10-01T02:00:00.000Z',
      [
        observation('versionless-factor', '2026-10-01T00:00:00.000Z', null),
        observation('versioned-factor', '2026-10-01T01:00:00.000Z', 'factor-v2'),
      ],
      [],
    )

    expect(events.map(({ type }) => type)).not.toContain('factor_version_changed')
  })

  it('expõe somente os campos públicos de estado, sem vazar detalhes internos', () => {
    const events = buildEnvironmentalAnalysisSeriesEvents(
      '2026-10-01T00:00:00.000Z',
      '2026-10-01T01:00:00.000Z',
      [],
      [{
        id: 'status-event',
        occurredAt: '2026-10-01T00:30:00.000Z',
        kind: 'status_changed',
        details: {
          before: {
            state: 'AVAILABLE',
            reason: 'metrics_missing',
            isStale: false,
            isCalculable: true,
            internalObservationId: 'private-before',
          },
          after: {
            state: 'UNAVAILABLE',
            reason: 'source_failure',
            isStale: true,
            isCalculable: false,
            internalObservationId: 'private-after',
          },
        },
      }],
    )

    expect(events).toEqual([{
      id: 'status-event',
      at: '2026-10-01T00:30:00.000Z',
      type: 'status_changed',
      details: {
        before: {
          state: 'AVAILABLE',
          reason: 'metrics_missing',
          isStale: false,
          isCalculable: true,
        },
        after: {
          state: 'UNAVAILABLE',
          reason: 'source_failure',
          isStale: true,
          isCalculable: false,
        },
      },
    }])
  })
})
