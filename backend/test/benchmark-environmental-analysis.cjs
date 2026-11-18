const assert = require('node:assert/strict')
const { performance } = require('node:perf_hooks')
const { summarizePersistedEnvironmentalPeriod } = require('../dist/modules/calculations/persisted-environmental-period')
const { aggregateEnvironmentalScopeSeries } = require('../dist/modules/calculations/environmental-scope-series')

const from = '2026-10-01T00:00:00.000Z'
const to = '2026-10-08T00:00:00.000Z'
const start = Date.parse(from)
const observations = Array.from({ length: 10_080 }, (_, index) => ({
  id: `observation-${index}`,
  intervalStart: new Date(start + index * 60_000).toISOString(),
  intervalEnd: new Date(start + (index + 1) * 60_000).toISOString(),
  collectedAt: new Date(start + (index + 1) * 60_000).toISOString(),
  energyKwh: '0.001', carbonGrams: '0.085', calculationEvidence: null,
}))
const applications = Array.from({ length: 8 }, () => observations)
const begin = performance.now()
const summaries = applications.map(rows => summarizePersistedEnvironmentalPeriod(from, to, rows, { includeProvenance: false }))
const summarized = performance.now()
const series = aggregateEnvironmentalScopeSeries(from, to, 'day', applications)
const finished = performance.now()
assert.equal(series.length, 7)
assert(summaries.every(summary => summary.coverage.energy === 1 && summary.coverage.emissions === 1))
for (const metric of ['energy', 'emissions']) {
  const total = summaries.reduce((value, summary) => value + summary[metric].value, 0)
  const seriesTotal = series.reduce((value, point) => value + point[metric].value, 0)
  assert(Math.abs(total - seriesTotal) < 1e-8)
}
console.log(JSON.stringify({ observations: observations.length * applications.length, summaryMs: summarized - begin, seriesMs: finished - summarized, totalMs: finished - begin, points: series.length }))
