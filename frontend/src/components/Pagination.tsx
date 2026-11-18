import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Pagination.module.css'

function pageNumbers(page: number, count: number): Array<number | 'start-gap' | 'end-gap'> {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)
  const first = page <= 3 ? 2 : page >= count - 2 ? count - 3 : page - 1
  const last = page <= 3 ? 4 : page >= count - 2 ? count - 1 : page + 1
  return [1, ...(first > 2 ? ['start-gap' as const] : []),
    ...Array.from({ length: last - first + 1 }, (_, index) => first + index),
    ...(last < count - 1 ? ['end-gap' as const] : []), count]
}

export function Pagination({ page, pageCount, onPageChange, summary, pageSize, disabled = false, label, hasNextPage }: Readonly<{
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  summary: ReactNode
  pageSize?: Readonly<{ value: number | 'all'; options: readonly (number | 'all')[]; onChange: (value: string) => void }>
  disabled?: boolean
  label?: string
  hasNextPage?: boolean
}>) {
  const { t, i18n } = useTranslation('common')
  const count = Math.max(1, pageCount)
  const number = new Intl.NumberFormat(i18n.resolvedLanguage)
  return <div className={styles.pagination}>
    <output className={styles.summary} aria-live="polite">{summary}</output>
    {pageSize && <label className={styles.size}>{t('pagination.size')}<select className="form-control form-control--compact"
      aria-label={t('pagination.size')} value={pageSize.value} disabled={disabled} onChange={event => pageSize.onChange(event.target.value)}>
      {pageSize.options.map(size => <option key={size} value={size}>{size === 'all' ? t('pagination.all') : number.format(size)}</option>)}
    </select></label>}
    <nav className={styles.controls} aria-label={label ?? t('pagination.label')}>
      <button type="button" className={styles.pageButton} aria-label={t('pagination.previous')} disabled={page <= 1} aria-disabled={disabled || undefined}
        onClick={() => { if (!disabled) onPageChange(page - 1) }}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.5 4.5-5.5 5.5 5.5 5.5" /></svg></button>
      {pageNumbers(page, count).map(item => typeof item === 'number'
        ? <button key={item} type="button" className={styles.pageButton} data-page-number="true" aria-current={item === page ? 'page' : undefined}
          aria-label={t('pagination.page', { page: item, count })} aria-disabled={disabled || undefined} onClick={() => { if (!disabled && item !== page) onPageChange(item) }}>{number.format(item)}</button>
        : <span className={styles.gap} key={item} aria-hidden="true">…</span>)}
      <button type="button" className={styles.pageButton} aria-label={t('pagination.next')} disabled={!(hasNextPage ?? page < count)} aria-disabled={disabled || undefined}
        onClick={() => { if (!disabled) onPageChange(page + 1) }}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4.5 5.5 5.5-5.5 5.5" /></svg></button>
    </nav>
  </div>
}
