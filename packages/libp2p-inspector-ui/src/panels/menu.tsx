import 'react'
import './menu.css'
import type { ReactElement, JSX } from 'react'

export interface MenuProps {
  onClick(arg: string): void
  panel: string
  options: string[]
  logo?: JSX.Element
}

export function Menu ({ onClick, panel, options, logo }: MenuProps): ReactElement {
  return (
    <div className='Menu'>
      {logo}
      {
        options.map(option => (
          <button key={option} onClick={() => { onClick(option) }} className={panel === option ? 'selected' : ''}>{option}</button>
        ))
      }
    </div>
  )
}
