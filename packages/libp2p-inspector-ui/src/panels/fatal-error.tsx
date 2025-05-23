import type { JSX } from 'react'
import './fatal-error.css'
import { FloatingPanel } from './floating-panel.tsx'
import { ErrorPanel } from './error.tsx'
import { Button } from './button.tsx'

interface FatalErrorPanelProps {
  error: Error
  onBack?(evt: React.UIEvent): void
}

export function FatalErrorPanel ({ error, onBack }: FatalErrorPanelProps): JSX.Element {
  return (
    <>
      <FloatingPanel className='FatalErrorPanel'>
        <h2>Error</h2>
        <ErrorPanel error={error} />
        {onBack != null ? <Button onClick={onBack}>Back</Button> : ''}
      </FloatingPanel>
    </>
  )
}
