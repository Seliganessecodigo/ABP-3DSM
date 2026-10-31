import styles from './PeriodSelector.module.css'
import type { PeriodPreset } from '../../features/analysis/periodContext.ts'

type PeriodOption = Readonly<{ value: PeriodPreset; label: string }>

export function PeriodSelector({ title, options, selected, invalidMessage, onSelect, className, compact = false, busy = false, select = false }: Readonly<{
  title: string
  options: readonly PeriodOption[]
  selected: PeriodPreset | null
  invalidMessage: string
  onSelect: (period: PeriodPreset) => void
  className?: string
  compact?: boolean
  busy?: boolean
  select?: boolean
}>) {
  return <section className={`${styles.selector}${compact ? ` ${styles.compact}` : ''} ${className ?? ''}`} aria-labelledby="period-selector-heading">
    <h2 id="period-selector-heading">{title}</h2>
    {selected === null && <p role="alert">{invalidMessage}</p>}
    {select ? <label className={styles.selectLabel}><span>{title}</span><select aria-label={title} disabled={busy}
      value={selected ?? ''} onChange={(event) => {
        const option = options.find(({ value }) => value === event.target.value)
        if (option) onSelect(option.value)
      }}>
      {options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
    </select></label> : <div className={styles.options} role="group" aria-label={title}>
      {options.map(({ value, label }) => <button key={value} type="button" className={styles.option}
        aria-pressed={selected === value} aria-disabled={busy && selected === value}
        onClick={() => { if (!busy || selected !== value) onSelect(value) }}>{label}</button>)}
    </div>}
  </section>
}
