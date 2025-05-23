import 'react'
import './icon.css'
import type { IconProps as ParentIconProps } from './index.js'
import type { JSX } from 'react'

interface IconProps extends ParentIconProps {
  src: string
  name: string
}

export const DEFAULT_HEIGHT = 16
export const DEFAULT_WIDTH = 16

export function Icon (props: IconProps): JSX.Element {
  return (
    <>
      <img
        {...props}
        height={props.height ?? DEFAULT_HEIGHT}
        width={props.width ?? DEFAULT_WIDTH}
        className={`Icon${props.onClick != null ? ' ClickableIcon' : ''} Libp2pIcon`}
      />
    </>
  )
}
