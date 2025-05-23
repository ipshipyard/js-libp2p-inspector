import 'react'
import './floating-panel.css'

interface FloatingPanelProps {
  children?: any
  className?: string
}

export function FloatingPanel ({ children, className }: FloatingPanelProps) {
  return (
    <div className={`FloatingPanel ${className ?? ''}`}>
      {children}
    </div>
  )
}
