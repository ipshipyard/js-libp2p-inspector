import 'react'
import './icon.css'
import src from '../../../public/img/icon-delete.svg'
import { Icon } from './icon.js'
import type { IconProps } from './index.js'
import type { JSX } from 'react'

export function DeleteIcon (props: IconProps): JSX.Element {
  return (
    <>
      <Icon
        {...props}
        src={src}
        name='DeleteIcon'
      />
    </>
  )
}
