import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EnvironmentalSummary, EnvironmentalSummaryPoint } from '../features/analysis/environmentalSummary.ts'
import { formatNumber } from '../utils/formatNumber.ts'
import styles from './EnvironmentalSeries.module.css'

type Metric = 'energy' | 'emissions'
type Filter = Metric | 'both'

export function EnvironmentalSeries({ series, locale }: Readonly<{ series: EnvironmentalSummary['series']; locale: string }>) {
  const { t } = useTranslation('dashboard')
  const [mode, setMode] = useState<'graph' | 'table'>('graph')
  const [filter, setFilter] = useState<Filter>('emissions')
  const [hovered, setHovered] = useState<{ index: number; metric: Metric } | null>(null)
  if (!series) return <p>{t('trendUnavailable')}</p>

  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))
  const measure = (point: EnvironmentalSummaryPoint, key: Metric) => point[key].value === null
    ? t('notAvailable') : `${formatNumber(point[key].value, locale)} ${point[key].unit}`
  const metrics: readonly Metric[] = filter === 'both' ? ['emissions', 'energy'] : [filter]
  const maxima = {
    emissions: Math.max(0, ...series.points.map((point) => point.emissions.value ?? 0)),
    energy: Math.max(0, ...series.points.map((point) => point.energy.value ?? 0)),
  }
  const hasData = series.points.some((point) => metrics.some((metric) => point[metric].value !== null))
  const chartWidth = Math.max(680, series.points.length * (filter === 'both' ? 48 : 42))
  const plot = { left: 65, right: chartWidth - 65, top: 30, bottom: 140 }
  const step = (plot.right - plot.left) / Math.max(series.points.length, 1)
  const barWidth = Math.max(4, Math.min(step * (filter === 'both' ? 0.43 : 0.72), filter === 'both' ? 34 : 44))
  const tickEvery = Math.max(1, Math.ceil(series.points.length / Math.max(5, Math.floor(chartWidth / 120))))
  const barHeight = (point: EnvironmentalSummaryPoint, metric: Metric) => {
    const value = point[metric].value
    return value === null ? 0 : Math.max(2, maxima[metric] === 0 ? 2 : value / maxima[metric] * (plot.bottom - plot.top))
  }

  return <section className={styles.series} aria-label={t('trendTitle')}>
    <div className={styles.controls}>
      <div className={styles.filter} role="group" aria-label={t('trend.metricFilter')}>
        {(['emissions', 'energy', 'both'] as const).map((value) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setHovered(null) }}>{value === 'both' ? t('trend.both') : t(value)}</button>)}
      </div>
      <div className={styles.view} role="group" aria-label={t('trend.view')}>
        {(['graph', 'table'] as const).map((value) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{t(`trend.${value}`)}</button>)}
      </div>
    </div>
    <p className={styles.note}>{t('trend.note')}</p>
    {mode === 'table' ? <div className={styles.tableWrap}><table>
      <caption>{t('trendTitle')} · UTC</caption>
      <thead><tr><th scope="col">{t('trend.interval')}</th>{metrics.map((metric) => <th scope="col" key={metric}><span className={styles.columnHeading} data-metric={metric}><i className={styles.swatch} aria-hidden="true" /><span>{t(metric)} <small>{series.points[0]?.[metric].unit}</small></span></span></th>)}</tr></thead>
      <tbody>{series.points.map((point) => <tr key={point.bucketStart}>
        <th scope="row"><span className={styles.interval}>{date(point.period.from)}<span>→</span>{date(point.period.to)}</span></th>
        {metrics.map((metric) => <td key={metric} data-metric={metric} data-missing={point[metric].value === null}><span className={styles.tableValue}>{measure(point, metric)}</span></td>)}
      </tr>)}</tbody>
    </table></div> : !hasData ? <p>{t('empty')}</p> : <>
      <div className={styles.legend} aria-label={t('trend.metricFilter')}>
        {metrics.map((metric) => <span key={metric} className={styles.legendItem} data-metric={metric}><span className={styles.swatch} />{t(metric)} <small>{series.points[0]?.[metric].unit}</small></span>)}
      </div>
      <div className={styles.plotWrap}><div className={styles.plot} style={{ minWidth: chartWidth > 680 ? chartWidth : undefined }}>
        <svg className={styles.chart} viewBox={`0 0 ${chartWidth} 200`} role="img" aria-label={`${t('trendTitle')}: ${metrics.map((metric) => `${t(metric)} (${series.points[0]?.[metric].unit ?? ''})`).join(', ')}`}>
          <text x={plot.left} y="18" className={styles.axisTitle}>{t('trend.yAxis')} · {t(filter === 'energy' ? 'energy' : 'emissions')} ({series.points[0]?.[filter === 'energy' ? 'energy' : 'emissions'].unit})</text>
          {filter === 'both' && <text x={plot.right} y="18" textAnchor="end" className={styles.axisTitle}>{t('energy')} ({series.points[0]?.energy.unit})</text>}
          {[0, 0.5, 1].map((fraction) => {
            const y = plot.bottom - fraction * (plot.bottom - plot.top)
            const leftMetric = filter === 'energy' ? 'energy' : 'emissions'
            return <g key={fraction}>
              <line x1={plot.left} x2={plot.right} y1={y} y2={y} className={styles.gridLine} />
              <text x={plot.left - 9} y={y + 4} textAnchor="end">{formatNumber(maxima[leftMetric] * fraction, locale)}</text>
              {filter === 'both' && <text x={plot.right + 9} y={y + 4}>{formatNumber(maxima.energy * fraction, locale)}</text>}
            </g>
          })}
          {series.points.map((point, index) => {
            const center = plot.left + (index + 0.5) * step
            return <g key={point.bucketStart}>
              {metrics.map((metric, metricIndex) => {
                if (point[metric].value === null) return null
                const height = barHeight(point, metric)
                const x = center + (metricIndex - (metrics.length - 1) / 2) * (barWidth + 2) - barWidth / 2
                return <rect key={metric} x={x} y={plot.bottom - height} width={barWidth} height={height} rx={Math.min(4, barWidth / 2)} className={styles.bar} data-metric={metric} data-active={hovered?.index === index && hovered.metric === metric} tabIndex={0} role="button" aria-label={`${date(point.period.from)} → ${date(point.period.to)}: ${t(metric)} ${measure(point, metric)}`} onMouseEnter={() => setHovered({ index, metric })} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered({ index, metric })} onBlur={() => setHovered(null)} />
              })}
              {index % tickEvery === 0 && <text x={center} y="162" textAnchor="middle">{date(point.period.from)}</text>}
            </g>
          })}
          <text x={chartWidth / 2} y="190" textAnchor="middle" className={styles.axisTitle}>{t('trend.xAxis')}</text>
        </svg>
        {hovered && <div className={styles.tooltip} style={{ left: `${Math.min(80, Math.max(20, (plot.left + (hovered.index + 0.5) * step) / chartWidth * 100))}%` }} role="status">
          <strong>{date(series.points[hovered.index].period.from)} → {date(series.points[hovered.index].period.to)}</strong>
          {metrics.map((metric) => <span key={metric} data-metric={metric}><i className={styles.swatch} />{t(metric)}: {measure(series.points[hovered.index], metric)}</span>)}
        </div>}
      </div></div>
    </>}
  </section>
}
