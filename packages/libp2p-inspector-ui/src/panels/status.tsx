import type { ReactElement } from 'react'
import './status.css'

export interface ErrorProps {
  error: Error | string
  className?: string
  errorPrefix?: string
}

export function SmallError ({ error, className, errorPrefix }: ErrorProps): ReactElement {
  return (
    <small className={`Error ${className ?? ''}`}>{errorPrefix != null ? `${errorPrefix}: ` : ''}{error instanceof Error ? error.message : error}</small>
  )
}

export interface SuccessProps {
  message: string
  className?: string
}

export function SmallSuccess ({ message, className }: SuccessProps): ReactElement {
  return (
    <small className={`Success ${className ?? ''}`}>{message}</small>
  )
}
