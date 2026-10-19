import { aggregatePersistedEnvironmentalSeries } from './persisted-environmental-series'
import type { PersistedEnvironmentalInterval } from './persisted-environmental-period'

describe('série ambiental persistida por calendário UTC', () => {
  it('separa a travessia da meia-noite do dia bissexto em buckets diários parciais', () => {
    const observation: PersistedEnvironmentalInterval = {
      id: 'leap-day-collection',
      intervalStart: '2024-02-29T23:00:00.000Z',
      intervalEnd: '2024-03-01T01:00:00.000Z',
      collectedAt: '2024-03-01T01:00:00.000Z',
      energyKwh: '2',
      carbonGrams: '20',
      calculationEvidence: {
        energy: {
          modelKey: 'saved-model',
          modelVersion: 'saved-model-v1',
          modelParameters: {},
          reasons: [],
        },
        carbon: { factorSnapshot: null, reasons: [] },
      },
    }

    const series = aggregatePersistedEnvironmentalSeries(
      '2024-02-29T20:30:00-03:00',
      '2024-02-29T21:30:00-03:00',
      'day',
      [observation],
    )

    expect(series.points).toMatchObject([
      {
        bucketStart: '2024-02-29T00:00:00.000Z',
        bucketEnd: '2024-03-01T00:00:00.000Z',
        period: { from: '2024-02-29T23:30:00.000Z', to: '2024-03-01T00:00:00.000Z' },
        energy: { value: 0.5 },
        emissions: { value: 5 },
        coverage: { energy: 1, emissions: 1 },
      },
      {
        bucketStart: '2024-03-01T00:00:00.000Z',
        bucketEnd: '2024-03-02T00:00:00.000Z',
        period: { from: '2024-03-01T00:00:00.000Z', to: '2024-03-01T00:30:00.000Z' },
        energy: { value: 0.5 },
        emissions: { value: 5 },
        coverage: { energy: 1, emissions: 1 },
      },
    ])
    expect(series.totals.energy.value).toBe(1)
    expect(series.totals.emissions.value).toBe(10)
  })

  it('mantém zero válido sem motivo e distingue medidas ausentes das lacunas', () => {
    const observations: PersistedEnvironmentalInterval[] = [
      {
        id: 'valid-zero',
        intervalStart: '2026-10-01T00:00:00.000Z',
        intervalEnd: '2026-10-01T01:00:00.000Z',
        collectedAt: '2026-10-01T01:00:00.000Z',
        energyKwh: '0',
        carbonGrams: '0',
        calculationEvidence: {
          energy: { modelKey: 'saved-model', modelVersion: 'v1', modelParameters: {}, reasons: [] },
          carbon: { factorSnapshot: null, reasons: [] },
        },
      },
      {
        id: 'missing-energy',
        intervalStart: '2026-10-01T01:00:00.000Z',
        intervalEnd: '2026-10-01T02:00:00.000Z',
        collectedAt: '2026-10-01T02:00:00.000Z',
        energyKwh: null,
        carbonGrams: '5',
        calculationEvidence: {
          energy: { modelKey: 'saved-model', modelVersion: 'v1', modelParameters: {}, reasons: [] },
          carbon: { factorSnapshot: null, reasons: [] },
        },
      },
      {
        id: 'missing-emissions',
        intervalStart: '2026-10-01T02:00:00.000Z',
        intervalEnd: '2026-10-01T03:00:00.000Z',
        collectedAt: '2026-10-01T03:00:00.000Z',
        energyKwh: '3',
        carbonGrams: null,
        calculationEvidence: {
          energy: { modelKey: 'saved-model', modelVersion: 'v1', modelParameters: {}, reasons: [] },
          carbon: { factorSnapshot: null, reasons: [{ code: 'NO_FACTOR' }] },
        },
      },
    ]

    const series = aggregatePersistedEnvironmentalSeries(
      '2026-10-01T00:00:00.000Z',
      '2026-10-01T04:00:00.000Z',
      'hour',
      observations,
    )

    expect(series.points.map((point) => ({ energy: point.energy, emissions: point.emissions }))).toMatchObject([
      {
        energy: { value: 0, reasons: [] },
        emissions: { value: 0, reasons: [] },
      },
      {
        energy: { value: null, reasons: [{ code: 'ENVIRONMENTAL_RESULT_NOT_PERSISTED', metric: 'energy' }] },
        emissions: { value: 5, reasons: [] },
      },
      {
        energy: { value: 3, reasons: [] },
        emissions: { value: null, reasons: [{ code: 'NO_FACTOR' }] },
      },
      {
        energy: { value: null, reasons: [{ code: 'NO_OBSERVATION' }] },
        emissions: { value: null, reasons: [{ code: 'NO_OBSERVATION' }] },
      },
    ])
    expect(series.points.map((point) => point.coverage)).toEqual([
      { energy: 1, emissions: 1 },
      { energy: 0, emissions: 1 },
      { energy: 1, emissions: 0 },
      { energy: 0, emissions: 0 },
    ])
  })

  it('usa a coleta de maior precedência no trecho sobreposto sem recorrer à medida antiga', () => {
    const missing = (id: string, intervalStart: string, intervalEnd: string, collectedAt: string, energy: string | null, emissions: string | null, carbonReason: string) => ({
      id,
      intervalStart,
      intervalEnd,
      collectedAt,
      energyKwh: energy,
      carbonGrams: emissions,
      calculationEvidence: {
        energy: { modelKey: 'saved-model', modelVersion: 'v1', modelParameters: {}, reasons: [{ code: 'ENERGY_NOT_SAVED' }] },
        carbon: { factorSnapshot: null, reasons: [{ code: carbonReason }] },
      },
    }) satisfies PersistedEnvironmentalInterval
    const series = aggregatePersistedEnvironmentalSeries(
      '2026-10-01T00:00:00.000Z',
      '2026-10-01T03:00:00.000Z',
      'hour',
      [
        missing('b-tie', '2026-10-01T00:00:00.000Z', '2026-10-01T02:00:00.000Z', '2026-10-01T04:00:00.000Z', '20', '200', 'B_CARBON'),
        missing('a-tie', '2026-10-01T00:00:00.000Z', '2026-10-01T02:00:00.000Z', '2026-10-01T04:00:00.000Z', null, '300', 'A_CARBON'),
        missing('newest-missing-energy', '2026-10-01T01:00:00.000Z', '2026-10-01T03:00:00.000Z', '2026-10-01T05:00:00.000Z', null, '40', 'NEWEST_CARBON'),
      ],
    )

    expect(series.points).toMatchObject([
      {
        energy: { value: null, reasons: [{ code: 'ENERGY_NOT_SAVED' }] },
        emissions: { value: 150, reasons: [] },
      },
      {
        energy: { value: null, reasons: [{ code: 'ENERGY_NOT_SAVED' }] },
        emissions: { value: 20, reasons: [] },
      },
      {
        energy: { value: null, reasons: [{ code: 'ENERGY_NOT_SAVED' }] },
        emissions: { value: 20, reasons: [] },
      },
    ])
    expect(series.totals).toMatchObject({
      energy: { value: null },
      emissions: { value: 190 },
    })
    expect(series.coverage).toEqual({ energy: 0, emissions: 1 })
  })
})
