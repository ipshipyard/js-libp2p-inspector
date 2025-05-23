import 'react'
import './floating-panel.css'
import type { JSX } from 'react'

interface FloatingPanelProps {
  children?: any
  className?: string
}

export function FloatingPanel ({ children, className }: FloatingPanelProps): JSX.Element {
  return (
    <div className={`FloatingPanel ${className ?? ''}`}>
      {children}
    </div>
  )
}
