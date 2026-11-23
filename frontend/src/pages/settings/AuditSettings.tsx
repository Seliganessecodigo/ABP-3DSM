import { CardIcon } from '../../components/CardIcon.tsx'
import { faClipboardList, faFileLines } from '@fortawesome/free-solid-svg-icons'
import { SortButton } from '../../components/SortButton.tsx'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { ActionButton } from '../../components/ActionButton.tsx'
import { Pagination } from '../../components/Pagination.tsx'
import { getMonitoringAudit, type AuditPage } from '../../features/monitoring/api.ts'
import { tableSortPresentation } from '../../utils/tableSortPresentation.ts'
import { formatDate } from '../../utils/formatDate.ts'
import { monitoringError } from './useMonitoring.ts'
import styles from './SettingsPage.module.css'

const columns = ['createdAt', 'actorLabel', 'action', 'outcome']
export function AuditSettings({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { authenticatedFetch } = useAuthentication()
  const { t, i18n } = useTranslation('settings')
  const params = new URLSearchParams(window.location.search)
  const query = new URLSearchParams()
  for (const key of ['search', 'outcome', 'page', 'pageSize', 'sortBy', 'sortDirection', 'actorLabel', 'action', 'reason', 'createdAtFrom', 'createdAtTo']) {
    const value = params.get(`audit.${key}`)
    if (value) query.set(key, value)
  }
  if (!/^[1-9]\d*$/.test(query.get('page') ?? '') || !Number.isSafeInteger(Number(query.get('page')))) query.set('page', '1')
  if (!['5', '10', '15', '20', 'all'].includes(query.get('pageSize') ?? '')) query.set('pageSize', '10')
  if (query.get('pageSize') === 'all') query.set('page', '1')
  if (!columns.includes(query.get('sortBy') ?? '')) query.set('sortBy', 'createdAt')
  if (!['asc', 'desc'].includes(query.get('sortDirection') ?? '')) query.set('sortDirection', 'desc')
  const queryString = query.toString()
  const [result, setResult] = useState<AuditPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void getMonitoringAudit(authenticatedFetch, new URLSearchParams(queryString), controller.signal).then(value => {
      if (!controller.signal.aborted) setResult(value)
    }).catch(e => { if (!controller.signal.aborted) { setResult(null); setError(monitoringError(e)) } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [authenticatedFetch, queryString, revision])
  function update(key: string, value: string) {
    if (value) params.set(`audit.${key}`, value); else params.delete(`audit.${key}`)
    if (key !== 'page') params.set('audit.page', '1')
    setLoading(true); setError(''); setResult(null); setSelected(null)
    navigate(`/settings?${params}`)
  }
  const date = (value: string) => formatDate(value, i18n.resolvedLanguage ?? 'en-US', t('unknown'))
  const event = result?.items.find(item => item.id === selected)
  function dateInput(value: string | null) { return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().slice(0, 16) : '' }
  return <>
    <div className={styles.row}><div><h2><CardIcon icon={faClipboardList} size="small" inline />{t('tabs.audit')}</h2><p className={styles.description}>{t('auditDescription')}</p></div><ActionButton appearance="secondary" pending={loading} onClick={() => { setLoading(true); setError(''); setRevision(v => v + 1) }}>{t('refresh')}</ActionButton></div>
    <div className={styles.filters}><label>{t('search')}<input placeholder={t('search')} className="form-control" type="search" maxLength={320} value={query.get('search') ?? ''} onChange={e => update('search', e.target.value)} /></label><label>{t('result')}<select className="form-control" value={query.get('outcome') ?? ''} onChange={e => update('outcome', e.target.value)}><option value="">{t('all')}</option>{(['success', 'denied', 'failed'] as const).map(value => <option key={value} value={value}>{t(`outcome.${value}`)}</option>)}</select></label></div>
    <details><summary>{t('filters')}</summary><div className={styles.filters}>{(['actorLabel', 'action', 'reason'] as const).map(key => <label key={key}>{t(`audit.${key}`)}<input placeholder={t(`audit.${key}`)} className="form-control" maxLength={320} value={query.get(key) ?? ''} onChange={e => update(key, e.target.value)} /></label>)}
      <label>{t('after')} · UTC<input className="form-control" type="datetime-local" value={dateInput(query.get('createdAtFrom'))} onChange={e => update('createdAtFrom', e.target.value ? new Date(`${e.target.value}Z`).toISOString() : '')} /></label><label>{t('before')} · UTC<input className="form-control" type="datetime-local" value={dateInput(query.get('createdAtTo'))} onChange={e => update('createdAtTo', e.target.value ? new Date(`${e.target.value}Z`).toISOString() : '')} /></label>
    </div><button className="button secondary" type="button" onClick={() => { for (const key of ['search', 'outcome', 'actorLabel', 'action', 'reason', 'createdAtFrom', 'createdAtTo']) { params.delete(`audit.${key}`) } params.set('audit.page', '1'); setLoading(true); setError(''); setResult(null); setSelected(null); navigate(`/settings?${params}`) }}>{t('clearFilters')}</button></details>
    {loading && <output>{t('loading')}</output>}{error && <p role="alert" className={styles.error}>{t(error)}</p>}
    {result && <><div className={styles.tableScroll}><table className={styles.table}><caption>{t('auditDescription')}</caption><thead><tr>{columns.map(column => { const sort = tableSortPresentation(column, query.get('sortBy'), query.get('sortDirection')); return <th key={column} scope="col" aria-sort={sort.ariaSort}><SortButton state={sort.ariaSort} onClick={() => { params.set('audit.sortBy', column); update('sortDirection', query.get('sortBy') === column && query.get('sortDirection') === 'asc' ? 'desc' : 'asc') }}>{t(`audit.${column}`)}</SortButton></th> })}<th scope="col">{t('details')}</th></tr></thead><tbody>{result.items.map(item => <tr key={item.id}><td>{date(item.createdAt)}</td><td>{item.actorLabel ?? item.actor}</td><td>{item.action}</td><td>{t(`outcome.${item.outcome}`)}</td><td><button type="button" className="button secondary" aria-expanded={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)}>{t('details')}</button></td></tr>)}</tbody></table></div>
      {!result.items.length && <p>{t('noEvents')}</p>}
      <Pagination page={result.pagination.page} pageCount={result.pagination.totalPages} hasNextPage={result.pagination.hasNextPage} disabled={loading} onPageChange={page => update('page', String(page))} pageSize={{ value: result.pagination.pageSize, options: [5, 10, 15, 20, 'all'], onChange: value => update('pageSize', value) }} summary={t('total', { count: result.pagination.totalItems })} />
    </>}
    {event && <section className={styles.section}><h3><CardIcon icon={faFileLines} size="small" inline />{t('eventDetails')}</h3><p>{event.id} · {event.entityType} · {event.entityId}</p><p>{t('reason')}: {event.reason ?? t('unknown')}</p><dl className={styles.fields}><div><dt>{t('before')}</dt><dd><pre className={styles.snapshot}>{event.before === null ? t('unknown') : JSON.stringify(event.before, null, 2)}</pre></dd></div><div><dt>{t('after')}</dt><dd><pre className={styles.snapshot}>{event.after === null ? t('unknown') : JSON.stringify(event.after, null, 2)}</pre></dd></div></dl></section>}
  </>
}
