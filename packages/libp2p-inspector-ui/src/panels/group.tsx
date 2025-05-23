import './group.css'
import type { JSX } from 'react'

export interface GroupProps {
  children: any
}

export function Group ({ children }: GroupProps): JSX.Element {
  return (
    <div className='Group'>
      {children}
    </div>
  )
}
