const environmental = {
  status: 'present', absenceReason: null,
  energy: { valueKwh: 12.5, calculatedValueKwh: 12.5, coverage: 1, durationSeconds: 1800, averagePowerW: 25,
    model: { key: 'simplified-energy', version: '1', configId: 'config-1', configVersion: '2026.1', parameters: { cpuWattsAt100Percent: 100 },
      formula: { status: 'available', expression: 'energia = cpu × duração', inputUnits: { cpuPercent: '%', durationSeconds: 's', cpuWattsAt100Percent: 'W' }, outputUnit: 'kWh', reason: null },
      powerContributionsW: { cpuPercent: 25, memoryGb: 0, diskGb: 0, networkGb: 0 }, reasons: [] } },
  carbon: { valueGramsCo2e: 4200, calculatedValueGramsCo2e: 4200, calculatedValueKilogramsCo2e: 4.2, factor: 336,
    factorSnapshot: { id: 'factor-1', version: 'v1', contractVersion: 'v1', regionCode: 'br-sudeste', country: 'Brasil', region: 'São Paulo', city: 'São Paulo',
      intensity: 336, unit: 'gCO2e/kWh', queriedAt: '2026-10-17T20:32:00.000Z', source: null, validFrom: null, validUntil: null },
    formula: { expression: 'kWh × gCO2e/kWh = gCO2e', energyUnit: 'kWh', factorUnit: 'gCO2e/kWh', gramsUnit: 'gCO2e', kilogramsUnit: 'kgCO2e' }, reasons: [] },
}

export function collectionResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'collection-methodology', applicationId: 'svc-0142', intervalStart: '2026-10-17T20:00:00.000Z',
    intervalEnd: '2026-10-17T20:30:00.000Z', collectedAt: '2026-10-17T20:32:00.000Z', collectionIntervalSeconds: 1800,
    isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID', lastCheckedAt: '2026-10-17T20:32:00.000Z',
    metrics: { cpu: { value: 38, unit: '%', status: 'available' }, memory: { value: null, unit: null, status: 'missing' },
      disk: { value: 0, unit: 'GB/s', status: 'available' }, network: { value: 1.2, unit: 'Mbps', status: 'available' } },
    environmental, ...overrides,
  }
}

