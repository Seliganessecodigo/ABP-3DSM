import type { ButtonHTMLAttributes } from 'react'
import './ActionButton.css'

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & Readonly<{
  appearance?: 'primary' | 'secondary'
}>

export function ActionButton({ appearance = 'primary', type = 'button', ...props }: ActionButtonProps) {
  return <button {...props} type={type} className={`button action-button${appearance === 'secondary' ? ' secondary' : ''}`} />
}
