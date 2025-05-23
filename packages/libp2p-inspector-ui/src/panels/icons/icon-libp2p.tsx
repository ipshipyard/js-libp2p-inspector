import 'react'
import './icon.css'
import src from '../../../public/img/libp2p.svg'
import { Icon } from './icon.js'
import type { IconProps } from './index.js'
import type { JSX } from 'react'

export function Libp2pIcon (props: IconProps): JSX.Element {
  return (
    <>
      <Icon
        {...props}
        src={src}
        name='Libp2pIcon'
      />
    </>
  )
}
