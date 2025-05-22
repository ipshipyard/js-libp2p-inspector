import 'react'
import './icon.css'

export interface IconProps {
  height?: number
  width?: number
  onClick?: React.MouseEventHandler<HTMLImageElement>
  style?: React.CSSProperties
}
