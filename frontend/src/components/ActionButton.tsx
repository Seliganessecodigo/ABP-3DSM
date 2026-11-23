import type { ButtonHTMLAttributes } from 'react'
import './ActionButton.css'

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & Readonly<{
  appearance?: 'primary' | 'secondary'
  pending?: boolean
}>

export function ActionButton({ appearance = 'primary', type = 'button', pending = false, onClick, ...props }: ActionButtonProps) {
  return <button {...props} type={type} aria-disabled={pending || props['aria-disabled']} aria-busy={pending || undefined}
    onClick={(event) => { if (!pending) onClick?.(event) }} className={`button action-button${appearance === 'secondary' ? ' secondary' : ''}`} />
}
