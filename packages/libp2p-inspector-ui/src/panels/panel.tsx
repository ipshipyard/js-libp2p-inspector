import 'react'
import './panel.css'

interface PanelProps {
  children?: any[] | any
}

export function Panel ({ children }: PanelProps) {
  return (
    <div className={'Panel'}>
      {children}
    </div>
  )
}
