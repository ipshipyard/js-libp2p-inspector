import './footer.css'
import type { JSX } from 'react'

export interface FooterProps {
  children: any
}

export function Footer ({ children }: FooterProps): JSX.Element {
  return (
    <div className='Footer'>
      {children}
    </div>
  )
}
