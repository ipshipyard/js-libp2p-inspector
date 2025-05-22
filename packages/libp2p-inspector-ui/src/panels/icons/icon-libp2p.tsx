import 'react'
import './icon.css'
import src from '../../../public/img/libp2p.svg'
import { Icon } from './icon.js'
import type { IconProps } from './index.js'

export function Libp2pIcon (props: IconProps) {
  return (
    <>
      <Icon
        {...props}
        src={src}
        name={'Libp2pIcon'}
        />
    </>
  )
}
