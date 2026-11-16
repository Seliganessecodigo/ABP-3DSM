import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './PageHelp.module.css'

export type HelpStep = Readonly<{ title: string; description: string; target?: string }>

export function PageHelp({ steps }: Readonly<{ steps: readonly [HelpStep, ...HelpStep[]] }>) {
  const { t } = useTranslation('common')
  const [step, setStep] = useState<number | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const current = step === null ? null : steps[step]
  const target = current?.target

  useEffect(() => {
    if (step === null) return
    const element = target ? [...document.querySelectorAll<HTMLElement>(target)].find(item => item.getClientRects().length > 0) : null
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    element?.classList.add(styles.highlight)
    if (dialog.current) dialog.current.dataset.placement = element && element.getBoundingClientRect().top > window.innerHeight / 2 ? 'top' : 'bottom'
    dialog.current?.showModal()
    return () => element?.classList.remove(styles.highlight)
  }, [step, target])

  function close() {
    dialog.current?.close()
    setStep(null)
    trigger.current?.focus({ preventScroll: true })
  }

  return <>
    <button ref={trigger} type="button" className={styles.trigger} aria-label={t('help.open')} title={t('help.open')}
      aria-haspopup="dialog" onClick={() => setStep(0)}>?</button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); close() }} onClose={() => setStep(null)}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
        const first = buttons[0]
        const last = buttons.at(-1)
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      }}>
      {current && <>
        <header><span>{t('help.step', { current: (step ?? 0) + 1, total: steps.length })}</span>
          <button type="button" className={styles.close} aria-label={t('help.close')} onClick={close}>×</button></header>
        <div aria-live="polite" aria-atomic="true"><h2 id={titleId}>{current.title}</h2><p id={descriptionId}>{current.description}</p></div>
        <footer><button type="button" className="button secondary" disabled={step === 0} onClick={() => setStep(index => index === null ? null : index - 1)}>{t('help.previous')}</button>
          <button type="button" className="button" onClick={() => step === steps.length - 1 ? close() : setStep(index => index === null ? null : index + 1)}>{t(step === steps.length - 1 ? 'help.finish' : 'help.next')}</button></footer>
      </>}
    </dialog>
  </>
}
