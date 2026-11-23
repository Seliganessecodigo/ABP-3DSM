import { FontAwesomeIcon, type FontAwesomeIconProps } from '@fortawesome/react-fontawesome'
import styles from './CardIcon.module.css'

export function CardIcon({ icon, size = 'medium', inline = false }: Readonly<{
  icon: FontAwesomeIconProps['icon']
  size?: 'small' | 'medium'
  inline?: boolean
}>) {
  return <span className={`${styles.icon} ${size === 'small' ? styles.small : ''} ${inline ? styles.inline : ''}`} aria-hidden="true">
    <FontAwesomeIcon icon={icon} />
  </span>
}
