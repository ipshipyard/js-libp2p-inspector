import './heading.css'
import type { JSX } from 'react'

export interface HeadingProps {
  children: any
  help?: string
}

export function Heading ({ children, help }: HeadingProps): JSX.Element {
  const sub = help == null ? undefined : <small>{help}</small>

  return (
    <div className='Heading'>
      {children}
      {sub}
    </div>
  )
}
