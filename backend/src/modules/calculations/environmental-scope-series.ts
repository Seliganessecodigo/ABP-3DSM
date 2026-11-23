import {
  aggregatePersistedEnvironmentalSeries,
  type EnvironmentalSeriesGranularity,
  type EnvironmentalSeriesPoint,
} from './persisted-environmental-series'
import type { PersistedEnvironmentalInterval } from './persisted-environmental-period'

export function aggregateEnvironmentalScopeSeries(
  from: string,
  to: string,
  granularity: EnvironmentalSeriesGranularity,
  applications: readonly (readonly PersistedEnvironmentalInterval[])[],
): readonly EnvironmentalSeriesPoint[] {
  const points = aggregatePersistedEnvironmentalSeries(
    from,
    to,
    granularity,
    [],
  ).points
  const series = applications.map(
    (observations) =>
      aggregatePersistedEnvironmentalSeries(from, to, granularity, observations)
        .points,
  )
  return points.map((point, index) => {
    const contributors = series.map((application) => application[index])
    function measure(metric: 'energy' | 'emissions') {
      const values = contributors.flatMap((entry) =>
        entry[metric].value === null ? [] : [entry[metric].value],
      )
      const reasons = new Map(
        contributors
          .flatMap((entry) => entry[metric].reasons)
          .map((reason) => [`${reason.code}:${reason.metric ?? ''}`, reason]),
      )
      return {
        value:
          values.length === 0
            ? null
            : values.reduce((total, value) => total + value, 0),
        unit: point[metric].unit,
        reasons: [...reasons.values()],
      }
    }
    return {
      ...point,
      energy: { ...measure('energy'), unit: 'kWh' },
      emissions: { ...measure('emissions'), unit: 'gCO2e' },
      coverage: {
        energy:
          contributors.length === 0
            ? 0
            : contributors.reduce(
                (total, entry) => total + entry.coverage.energy,
                0,
              ) / contributors.length,
        emissions:
          contributors.length === 0
            ? 0
            : contributors.reduce(
                (total, entry) => total + entry.coverage.emissions,
                0,
              ) / contributors.length,
      },
    }
  })
}
