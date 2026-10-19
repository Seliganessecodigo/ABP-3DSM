import { calculateCarbonEmission } from './carbon-emission'

describe('calculateCarbonEmission', () => {
  it('converts valid energy and an explicit factor snapshot to grams and kilograms', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      emissionsGramsCo2e: 200,
      emissionsKilogramsCo2e: 0.2,
      reasons: [],
    })
  })

  it('keeps unavailable energy and explains why emissions cannot be calculated', () => {
    const result = calculateCarbonEmission(
      { energyKwh: null },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: null,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'ENERGY_UNAVAILABLE' }],
    })
  })

  it('treats an explicit zero carbon intensity as a valid zero emission', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'zero-factor',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 0,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      emissionsGramsCo2e: 0,
      emissionsKilogramsCo2e: 0,
      reasons: [],
    })
  })

  it('keeps zero energy as valid when a factor snapshot is present', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 0 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 0,
      emissionsGramsCo2e: 0,
      emissionsKilogramsCo2e: 0,
      reasons: [],
    })
  })

  it('keeps valid zero energy while reporting that the factor is unavailable', () => {
    const result = calculateCarbonEmission({ energyKwh: 0 }, null)

    expect(result).toMatchObject({
      energyKwh: 0,
      factorSnapshot: null,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
    })
  })

  it('rejects negative energy without rewriting it as zero', () => {
    const result = calculateCarbonEmission(
      { energyKwh: -1 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: -1,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'INVALID_ENERGY' }],
    })
  })

  it('preserves nonzero valid energy when the carbon factor is unavailable', () => {
    const result = calculateCarbonEmission({ energyKwh: 2 }, null)

    expect(result).toMatchObject({
      energyKwh: 2,
      factorSnapshot: null,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
    })
  })

  it('rejects negative intensity without changing valid energy', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'negative-factor',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: -10,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'INVALID_FACTOR' }],
    })
  })

  it('distinguishes a snapshot with missing intensity from a missing factor snapshot', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'missing-intensity-factor',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: null,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      factorSnapshot: { intensity: null },
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'INVALID_FACTOR' }],
    })
  })

  it('rejects non-finite carbon intensity', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'non-finite-factor',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: Number.POSITIVE_INFINITY,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'INVALID_FACTOR' }],
    })
  })

  it('rejects a factor with an incompatible unit', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'wrong-unit-factor',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'kgCO2e/MWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'UNSUPPORTED_UNIT' }],
    })
  })

  it('rejects a snapshot whose unit is absent', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'missing-unit-factor',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: null,
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      factorSnapshot: { unit: null },
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'INVALID_SNAPSHOT' }],
    })
  })

  it('preserves an immutable copy of the factor snapshot used for the result', () => {
    const factor = {
      id: 'factor-1',
      version: 'factor-v1',
      contractVersion: '0.1.0',
      regionCode: 'US-CAL-CISO',
      country: null,
      region: null,
      city: null,
      intensity: 100,
      unit: 'gCO2e/kWh',
      queriedAt: '2026-10-18T12:00:00.000Z',
      source: null,
      validFrom: null,
      validUntil: null,
    }
    const result = calculateCarbonEmission({ energyKwh: 2 }, factor)

    factor.intensity = 250
    factor.regionCode = 'changed-region'

    expect(result.factorSnapshot).toMatchObject({
      intensity: 100,
      regionCode: 'US-CAL-CISO',
    })
    expect(Object.isFrozen(result.factorSnapshot)).toBe(true)
    expect(result).toMatchObject({
      energyKwh: 2,
      emissionsGramsCo2e: 200,
      emissionsKilogramsCo2e: 0.2,
    })
  })

  it('rejects a snapshot missing its regional identity without requiring nullable location labels', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: null,
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      factorSnapshot: { regionCode: null },
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'INVALID_SNAPSHOT' }],
    })
  })

  it('rejects a snapshot with no query timestamp', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: null,
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      factorSnapshot: { queriedAt: null },
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'INVALID_SNAPSHOT' }],
    })
  })

  it('accepts a query timestamp with an explicit numeric timezone offset', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000-07:00',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result.reasons).toEqual([])
    expect(result.emissionsGramsCo2e).toBe(200)
  })

  it.each([
    ['a leap day in a regular leap year', '2024-02-29T12:00:00Z', true],
    ['a leap day in a century leap year', '2000-02-29T12:00:00Z', true],
    ['a leap day in a non-leap century year', '2100-02-29T12:00:00Z', false],
    ['the last day of a 30-day month', '2026-04-30T12:00:00Z', true],
  ])('validates calendar boundaries for %s', (_case, queriedAt, isValid) => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt,
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result.reasons).toEqual(
      isValid ? [] : [{ code: 'INVALID_SNAPSHOT' }],
    )
    expect(result.emissionsGramsCo2e).toBe(isValid ? 200 : null)
  })

  it('rejects a snapshot with a query timestamp that is not a real timestamp', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: 'not-a-date',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'INVALID_SNAPSHOT' }],
    })
  })

  it.each([
    ['invalid calendar date', '2026-02-30T12:00:00.000Z'],
    ['timestamp without a timezone', '2026-10-18T12:00:00.000'],
  ])('rejects a snapshot with %s', (_description, queriedAt) => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt,
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result.reasons).toContainEqual({ code: 'INVALID_SNAPSHOT' })
    expect(result.emissionsGramsCo2e).toBeNull()
  })

  it('rejects non-finite energy instead of manufacturing an emission', () => {
    const result = calculateCarbonEmission(
      { energyKwh: Number.NaN },
      {
        id: 'factor-1',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result.energyKwh).toBeNaN()
    expect(result.emissionsGramsCo2e).toBeNull()
    expect(result.emissionsKilogramsCo2e).toBeNull()
    expect(result.reasons).toContainEqual({ code: 'INVALID_ENERGY' })
  })

  it('reports an unrepresentable emission while preserving valid energy and factor', () => {
    const result = calculateCarbonEmission(
      { energyKwh: 2 },
      {
        id: 'overflow-factor',
        version: 'factor-v1',
        contractVersion: '0.1.0',
        regionCode: 'US-CAL-CISO',
        country: null,
        region: null,
        city: null,
        intensity: Number.MAX_VALUE,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-18T12:00:00.000Z',
        source: null,
        validFrom: null,
        validUntil: null,
      },
    )

    expect(result).toMatchObject({
      energyKwh: 2,
      factorSnapshot: { intensity: Number.MAX_VALUE },
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'NON_FINITE_RESULT' }],
    })
  })
})
