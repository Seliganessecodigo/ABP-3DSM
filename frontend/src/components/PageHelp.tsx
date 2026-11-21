import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons'
import styles from './PageHelp.module.css'

export type HelpStep = Readonly<{ title: string; description: string; target?: string }>

export function PageHelp({ steps, onOpen }: Readonly<{ steps: readonly [HelpStep, ...HelpStep[]]; onOpen?: () => void }>) {
  const { t } = useTranslation('common')
  const [step, setStep] = useState<number | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const activeStep = step === null ? null : Math.min(step, steps.length - 1)
  const current = activeStep === null ? null : steps[activeStep]
  const target = current?.target

  useEffect(() => {
    if (activeStep === null) return
    const scope = trigger.current?.closest('main')
    let highlighted: HTMLElement | null = null
    const updateHighlight = () => {
      highlighted?.classList.remove(styles.highlight)
      highlighted = target ? [...(scope?.querySelectorAll<HTMLElement>(target) ?? [])].find(item => {
        const bounds = item.getBoundingClientRect()
        return bounds.width > 0 && bounds.height > 0 && getComputedStyle(item).visibility !== 'hidden' && !item.closest('[hidden], [aria-hidden="true"]')
      }) ?? null : null
      highlighted?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      highlighted?.classList.add(styles.highlight)
      if (dialog.current) dialog.current.dataset.placement = highlighted && highlighted.getBoundingClientRect().top > window.innerHeight / 2 ? 'top' : 'bottom'
    }
    updateHighlight()
    dialog.current?.showModal()
    window.addEventListener('resize', updateHighlight)
    return () => { highlighted?.classList.remove(styles.highlight); window.removeEventListener('resize', updateHighlight) }
  }, [activeStep, target, steps])

  function close() {
    dialog.current?.close()
    setStep(null)
    trigger.current?.focus({ preventScroll: true })
  }

  function next() {
    if (activeStep === steps.length - 1) {
      close()
      return
    }
    setStep(index => index === null ? null : Math.min(index + 1, steps.length - 1))
  }

  return <>
    <button ref={trigger} type="button" className={styles.trigger} aria-label={t('help.open')} title={t('help.open')}
      aria-haspopup="dialog" onClick={() => { onOpen?.(); setStep(0) }}><FontAwesomeIcon icon={faCircleQuestion} aria-hidden="true" /></button>
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
        <header><span>{t('help.step', { current: (activeStep ?? 0) + 1, total: steps.length })}</span>
          <button type="button" className={styles.close} aria-label={t('help.close')} onClick={close}>×</button></header>
        <div aria-live="polite" aria-atomic="true"><h2 id={titleId}>{current.title}</h2><p id={descriptionId}>{current.description}</p></div>
        <footer><button type="button" className="button secondary" disabled={activeStep === 0} onClick={() => setStep(index => index === null ? null : Math.max(0, Math.min(index, steps.length - 1) - 1))}>{t('help.previous')}</button>
          <button type="button" className="button" onClick={next}>{t(activeStep === steps.length - 1 ? 'help.finish' : 'help.next')}</button></footer>
      </>}
    </dialog>
  </>
}
