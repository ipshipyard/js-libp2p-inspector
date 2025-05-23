import 'react'
import type { JSX, MouseEventHandler } from 'react'
import './button.css'

interface ButtonProps {
  children?: any[] | string
  onClick: MouseEventHandler
  primary?: boolean
  secondary?: boolean
  danger?: boolean
  disabled?: boolean
}

export function Button ({ children, onClick, primary, secondary, danger, disabled }: ButtonProps): JSX.Element {
  return (
    <button disabled={disabled} type='button' onClick={onClick} className={`Button ${primary === true ? 'primary' : ''} ${secondary === true ? 'secondary' : ''} ${danger === true ? 'danger' : ''}`}>
      {children}
    </button>
  )
}
