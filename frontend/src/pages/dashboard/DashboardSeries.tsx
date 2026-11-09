import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EnvironmentalSummary } from '../../features/analysis/environmentalSummary.ts'
import { formatNumber } from '../../utils/formatNumber.ts'
import styles from './DashboardSeries.module.css'

export function DashboardSeries({ series, locale }: Readonly<{ series: EnvironmentalSummary['series']; locale: string }>) {
  const { t } = useTranslation('dashboard')
  const [mode, setMode] = useState<'graph' | 'table'>('graph')
  const [metric, setMetric] = useState<'energy' | 'emissions'>('emissions')
  if (!series) return <p>{t('trendUnavailable')}</p>
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))
  const measure = (point: (typeof series.points)[number], key: typeof metric) => point[key].value === null
    ? t('notAvailable') : `${formatNumber(point[key].value, locale)} ${point[key].unit}`
  const available = series.points.filter((point) => point[metric].value !== null)
  const maximum = Math.max(...available.map((point) => point[metric].value ?? 0), 0)
  const width = 640
  const step = width / Math.max(series.points.length, 1)
  return <section className={styles.series} aria-label={t('trendTitle')}>
    <div className={styles.controls}>
      <div>
        {(['emissions', 'energy'] as const).map((value) => <button type="button" key={value} aria-pressed={metric === value} onClick={() => setMetric(value)}>{t(value)}</button>)}
      </div>
      <div>
        {(['graph', 'table'] as const).map((value) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{t(`trend.${value}`)}</button>)}
      </div>
    </div>
    <p className={styles.note}>{t('trend.note')}</p>
    {mode === 'table' ? <div className={styles.tableWrap}><table>
      <caption>{t('trendTitle')} · UTC</caption>
      <thead><tr><th>{t('trend.interval')}</th><th>{t('energy')}</th><th>{t('emissions')}</th></tr></thead>
      <tbody>{series.points.map((point) => <tr key={point.bucketStart}>
        <th scope="row">{date(point.period.from)} → {date(point.period.to)}</th>
        <td>{measure(point, 'energy')}</td><td>{measure(point, 'emissions')}</td>
      </tr>)}</tbody>
    </table></div> : available.length === 0 ? <p>{t('empty')}</p> : <>
      <svg className={styles.chart} viewBox="0 0 680 220" role="img" aria-label={`${t('trendTitle')}: ${t(metric)} (${series.points[0]?.[metric].unit ?? ''})`}>
        <line x1="30" y1="180" x2="670" y2="180" className={styles.axis} />
        {series.points.map((point, index) => {
          const value = point[metric].value
          const x = 30 + index * step
          if (value === null) return <line key={point.bucketStart} x1={x + step / 2} x2={x + step / 2} y1="178" y2="184" className={styles.gap}><title>{date(point.period.from)}: {t('notAvailable')}</title></line>
          const height = maximum === 0 ? 0 : value / maximum * 150
          return <rect key={point.bucketStart} x={x + step * 0.15} y={180 - Math.max(height, 2)} width={Math.max(step * 0.7, 0.5)} height={Math.max(height, 2)} className={styles.bar}>
            <title>{date(point.period.from)} → {date(point.period.to)}: {measure(point, metric)}</title>
          </rect>
        })}
        <text x="30" y="16">{formatNumber(maximum, locale)} {series.points[0]?.[metric].unit}</text>
        <text x="30" y="208">{series.points[0] ? date(series.points[0].period.from) : ''}</text>
        <text x="670" y="208" textAnchor="end">{series.points.at(-1) ? date(series.points.at(-1)!.period.to) : ''}</text>
      </svg>
    </>}
  </section>
}
