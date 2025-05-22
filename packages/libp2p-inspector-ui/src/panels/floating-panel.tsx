import 'react'
import './floating-panel.css'

interface FloatingPanelProps {
  children?: any
}

export function FloatingPanel ({ children }: FloatingPanelProps) {
  return (
    <div className={'FloatingPanel'}>
      {children}
    </div>
  )
}
