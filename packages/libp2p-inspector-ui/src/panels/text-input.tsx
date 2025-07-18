import 'react'
import './text-input.css'
import type { ChangeEvent, JSX } from 'react'

interface TextInputProps {
  type?: string
  value?: string
  placeholder?: string
  onChange(evt: ChangeEvent<HTMLInputElement>): void
}

export function TextInput (props: TextInputProps): JSX.Element {
  return (
    <input className='TextInput' {...props} />
  )
}
