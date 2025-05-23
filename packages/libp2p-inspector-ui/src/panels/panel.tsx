import 'react'
import './panel.css'

interface PanelProps {
  children?: any[] | any
  className?: string
}

export function Panel ({ children, className }: PanelProps) {
  return (
    <div className={`Panel ${className ?? ''}`}>
      {children}
    </div>
  )
}
