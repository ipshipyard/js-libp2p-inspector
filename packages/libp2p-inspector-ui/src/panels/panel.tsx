import 'react'
import './panel.css'
import type { JSX } from 'react'

interface PanelProps {
  children?: any[] | any
  className?: string
}

export function Panel ({ children, className }: PanelProps): JSX.Element {
  return (
    <div className={`Panel ${className ?? ''}`}>
      {children}
    </div>
  )
}
