import 'react'
import './icon.css'
import src from '../../../public/img/icon-copy.svg'
import type { IconProps } from './index.js'
import { Icon } from './icon.js'

export function CopyIcon (props: IconProps) {
  return (
    <>
      <Icon
        {...props}
        src={src}
        name={'CopyIcon'}
        />
    </>
  )
}
