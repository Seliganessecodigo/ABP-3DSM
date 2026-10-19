import styles from './PeriodSelector.module.css'
import type { PeriodPreset } from '../../features/analysis/periodContext.ts'

type PeriodOption = Readonly<{ value: PeriodPreset; label: string }>

export function PeriodSelector({ title, options, selected, invalidMessage, onSelect }: Readonly<{
  title: string
  options: readonly PeriodOption[]
  selected: PeriodPreset | null
  invalidMessage: string
  onSelect: (period: PeriodPreset) => void
}>) {
  return <section className={styles.selector} aria-labelledby="period-selector-heading">
    <h2 id="period-selector-heading">{title}</h2>
    {selected === null && <p role="alert">{invalidMessage}</p>}
    <div className={styles.options} role="group" aria-label={title}>
      {options.map(({ value, label }) => <button key={value} type="button" className={styles.option}
        aria-pressed={selected === value} onClick={() => onSelect(value)}>{label}</button>)}
    </div>
  </section>
}
