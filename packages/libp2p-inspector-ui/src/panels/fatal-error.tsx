import './fatal-error.css'
import { Button } from './button.tsx'
import { ErrorPanel } from './error.tsx'
import { FloatingPanel } from './floating-panel.tsx'
import type { JSX } from 'react'

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
