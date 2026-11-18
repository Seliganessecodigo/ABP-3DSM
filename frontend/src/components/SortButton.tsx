import type { ButtonHTMLAttributes } from 'react'
import type { TableSortState } from '../utils/tableSortPresentation.ts'
import styles from './SortButton.module.css'

const indicators: Record<TableSortState, string> = { ascending: '↑', descending: '↓', none: '↕' }

export function SortIndicator({ state = 'none' }: Readonly<{ state?: TableSortState }>) {
  return <span className={styles.indicator} data-sort-state={state} aria-hidden="true">{indicators[state]}</span>
}

export function SortButton({ state = 'none', children, className = '', ...props }: Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { state?: TableSortState }
>) {
  return <button {...props} type="button" className={`${styles.button} ${className}`}>
    {children}<SortIndicator state={state} />
  </button>
}
