import 'react'
import './icon.css'
import src from '../../../public/img/icon-spinner.svg'
import type { IconProps } from './index.js'
import { Icon } from './icon.js'

export function SpinnerIcon (props: IconProps) {
  return (
    <>
      <Icon
        {...props}
        src={src}
        name={'SpinnerIcon'}
        />
    </>
  )
}
